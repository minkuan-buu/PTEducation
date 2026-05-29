"use client";

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import * as React from "react";

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
};

const AttendanceContext = React.createContext<AttendanceContextValue | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [windowsByClassId, setWindowsByClassId] = React.useState<Record<string, AttendanceWindowStatePayload>>({});
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>("idle");
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [serverTime, setServerTime] = React.useState<Date | null>(null);
    const [serverTimeSyncedAt, setServerTimeSyncedAt] = React.useState<Date | null>(null);

    React.useEffect(() => {
        if (!user) {
            setWindowsByClassId({});
            setConnectionStatus("idle");
            setErrorMessage(null);
            setServerTime(null);
            setServerTimeSyncedAt(null);
            return;
        }

        const connection = new HubConnectionBuilder()
            .withUrl(buildAttendanceHubUrl(), { withCredentials: true })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        setConnectionStatus("connecting");
        setErrorMessage(null);

        const applyWindowState = (payload: AttendanceWindowStatePayload) => {
            if (!payload?.classId) {
                return;
            }

            setWindowsByClassId((prev) => ({
                ...prev,
                [payload.classId]: payload,
            }));
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
        connection.onreconnecting(() => setConnectionStatus("reconnecting"));
        connection.onreconnected(() => setConnectionStatus("connected"));
        connection.onclose((connectionError) => {
            setConnectionStatus("disconnected");
            if (connectionError) {
                setErrorMessage(connectionError.message);
            }
        });

        connection
            .start()
            .then(() => {
                setConnectionStatus("connected");
            })
            .catch((connectionError: unknown) => {
                const message = connectionError instanceof Error ? connectionError.message : "Không thể kết nối SignalR";
                setConnectionStatus("error");
                setErrorMessage(message);
            });

        return () => {
            connection.off(ATTENDANCE_SIGNALR_EVENTS.serverTimeSynced, applyServerTime);
            connection.off(ATTENDANCE_SIGNALR_EVENTS.windowStateChanged, applyWindowState);
            connection.off(ATTENDANCE_SIGNALR_EVENTS.attendanceUpdated, applyWindowState);
            void connection.stop();
        };
    }, [user]);

    const value = React.useMemo<AttendanceContextValue>(
        () => ({
            windowsByClassId,
            connectionStatus,
            errorMessage,
            serverTime,
            serverTimeSyncedAt,
        }),
        [windowsByClassId, connectionStatus, errorMessage, serverTime, serverTimeSyncedAt],
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
