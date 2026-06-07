"use client";

import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useUser } from "@/context/user-context";
import {
    ATTENDANCE_SIGNALR_EVENTS,
    buildAttendanceHubUrl,
    type AttendanceWindowStatePayload,
    type ServerTimeSyncedPayload,
} from "@/services/realtime/attendance";

type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

type AttendanceContextValue = {
    windowsByClassId: Record<string, AttendanceWindowStatePayload>;
    connectionStatus: ConnectionStatus;
    errorMessage: string | null;
    serverTime: Date | null;
    serverTimeSyncedAt: Date | null;
    joinClassGroup: (classId: string) => Promise<void>;
    leaveClassGroup: (classId: string) => Promise<void>;
};

const AttendanceContext = React.createContext<AttendanceContextValue | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const connectionRef = React.useRef<ReturnType<HubConnectionBuilder["build"]> | null>(null);
    const subscribedClassIdsRef = React.useRef(new Set<string>());
    const [windowsByClassId, setWindowsByClassId] = React.useState<Record<string, AttendanceWindowStatePayload>>({});
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>("idle");
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [serverTime, setServerTime] = React.useState<Date | null>(null);
    const [serverTimeSyncedAt, setServerTimeSyncedAt] = React.useState<Date | null>(null);

    const joinClassGroup = React.useCallback(async (classId: string) => {
        if (!classId) {
            return;
        }

        subscribedClassIdsRef.current.add(classId);

        const connection = connectionRef.current;

        if (!connection || connection.state !== HubConnectionState.Connected) {
            return;
        }

        await connection.invoke("JoinClassGroup", classId);

        const initialWindow = (await connection.invoke("GetClassWindowState", classId)) as
            | AttendanceWindowStatePayload
            | null;

        if (initialWindow?.classId) {
            setWindowsByClassId((prev) => ({
                ...prev,
                [initialWindow.classId]: initialWindow,
            }));
        }
    }, []);

    const leaveClassGroup = React.useCallback(async (classId: string) => {
        if (!classId) {
            return;
        }

        subscribedClassIdsRef.current.delete(classId);

        const connection = connectionRef.current;

        if (!connection || connection.state !== HubConnectionState.Connected) {
            return;
        }

        await connection.invoke("LeaveClassGroup", classId);
    }, []);

    const resubscribeClassGroups = React.useCallback(async () => {
        const connection = connectionRef.current;

        if (!connection || connection.state !== HubConnectionState.Connected) {
            return;
        }

        await Promise.all(Array.from(subscribedClassIdsRef.current).map((classId) => joinClassGroup(classId)));
    }, [joinClassGroup]);

    React.useEffect(() => {
        if (!user) {
            setWindowsByClassId({});
            setConnectionStatus("idle");
            setErrorMessage(null);
            setServerTime(null);
            setServerTimeSyncedAt(null);
            subscribedClassIdsRef.current.clear();
            connectionRef.current = null;
            return;
        }

        const connection = new HubConnectionBuilder()
            .withUrl(buildAttendanceHubUrl(), { withCredentials: true })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        connectionRef.current = connection;

        setConnectionStatus("connecting");
        setErrorMessage(null);

        const applyWindowState = (payload: AttendanceWindowStatePayload) => {
            if (!payload?.classId) {
                return;
            }

            // Debug log: capture incoming window state updates
            // (temporary - remove after debugging)
            try {
                // eslint-disable-next-line no-console
                console.debug("[Attendance] windowStateChanged", payload);
            } catch { }

            setWindowsByClassId((prev) => ({
                ...prev,
                [payload.classId]: payload,
            }));

            // Invalidate attendance sessions and calendar indicators for this class so UI refetches
            try {
                queryClient.invalidateQueries({ queryKey: ["class-attendance-sessions", payload.classId] });
                queryClient.invalidateQueries({ queryKey: ["classes", payload.classId] });
                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const key = query.queryKey;
                        return Array.isArray(key) && key[0] === "attendance-session-detail";
                    },
                });
                // Invalidate any calendar indicators queries that match this classId (they include start/end in key)
                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const key = query.queryKey;
                        return (
                            Array.isArray(key) &&
                            key[0] === "class-calendar-indicators" &&
                            key[1] === payload.classId
                        );
                    },
                });

                // eslint-disable-next-line no-console
                console.debug("[Attendance] invalidated class metadata, attendance sessions and calendar indicators for class", payload.classId);
            } catch { }
        };

        const applyServerTime = (payload: ServerTimeSyncedPayload) => {
            if (!payload?.serverTime) {
                return;
            }

            const parsedServerTime = new Date(payload.serverTime);

            if (Number.isNaN(parsedServerTime.getTime())) {
                return;
            }

            setServerTime(parsedServerTime);
            setServerTimeSyncedAt(new Date());
        };

        connection.on(ATTENDANCE_SIGNALR_EVENTS.serverTimeSynced, applyServerTime);
        connection.on(ATTENDANCE_SIGNALR_EVENTS.windowStateChanged, applyWindowState);
        connection.on(ATTENDANCE_SIGNALR_EVENTS.attendanceUpdated, applyWindowState);
        // Debug lifecycle logging
        try {
            // eslint-disable-next-line no-console
            console.debug("[Attendance] starting SignalR connection to", buildAttendanceHubUrl());
        } catch { }
        connection.onreconnecting(() => setConnectionStatus("reconnecting"));
        connection.onreconnected(() => {
            setConnectionStatus("connected");

            void resubscribeClassGroups();
        });
        connection.onclose((connectionError) => {
            setConnectionStatus("disconnected");
            if (connectionError) {
                setErrorMessage(connectionError.message);
            }
            try {
                // eslint-disable-next-line no-console
                console.debug("[Attendance] connection closed", connectionError);
            } catch { }
        });

        connection
            .start()
            .then(() => {
                setConnectionStatus("connected");
                void resubscribeClassGroups();

                try {
                    // eslint-disable-next-line no-console
                    console.debug("[Attendance] connected");
                } catch { }
            })
            .catch((connectionError: unknown) => {
                const message = connectionError instanceof Error ? connectionError.message : "Không thể kết nối SignalR";
                setConnectionStatus("error");
                setErrorMessage(message);
                try {
                    // eslint-disable-next-line no-console
                    console.debug("[Attendance] connect error", connectionError);
                } catch { }
            });

        return () => {
            connection.off(ATTENDANCE_SIGNALR_EVENTS.serverTimeSynced, applyServerTime);
            connection.off(ATTENDANCE_SIGNALR_EVENTS.windowStateChanged, applyWindowState);
            connection.off(ATTENDANCE_SIGNALR_EVENTS.attendanceUpdated, applyWindowState);
            connectionRef.current = null;
            void connection.stop();
        };
    }, [resubscribeClassGroups, user]);

    const value = React.useMemo<AttendanceContextValue>(
        () => ({
            windowsByClassId,
            connectionStatus,
            errorMessage,
            serverTime,
            serverTimeSyncedAt,
            joinClassGroup,
            leaveClassGroup,
        }),
        [
            windowsByClassId,
            connectionStatus,
            errorMessage,
            serverTime,
            serverTimeSyncedAt,
            joinClassGroup,
            leaveClassGroup,
        ],
    );

    return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendanceRealtime() {
    const context = React.useContext(AttendanceContext);

    if (!context) {
        throw new Error("useAttendanceRealtime must be used within an AttendanceProvider");
    }

    return context;
}
