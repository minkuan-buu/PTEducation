"use client";

import * as React from "react";

export type UserProfile = {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    role?: "admin" | "student" | "guardian" | "manager";
};

type UserContextValue = {
    user: UserProfile | null;
    isAuthenticated: boolean;
    setUser: (user: UserProfile | null) => void;
    clearUser: () => void;
};

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
    children: React.ReactNode;
    initialUser?: UserProfile | null;
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
    const storageKey = "pteducation.user";
    const [user, setUser] = React.useState<UserProfile | null>(() => initialUser);

    React.useEffect(() => {
        if (initialUser) {
            return;
        }

        const raw = window.localStorage.getItem(storageKey);

        if (!raw) {
            return;
        }

        try {
            const parsed = JSON.parse(raw) as UserProfile;
            setUser(parsed);
        } catch {
            window.localStorage.removeItem(storageKey);
        }
    }, [initialUser, storageKey]);

    React.useEffect(() => {
        if (user) {
            window.localStorage.setItem(storageKey, JSON.stringify(user));
        } else {
            window.localStorage.removeItem(storageKey);
        }
    }, [user, storageKey]);

    const value = React.useMemo<UserContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            setUser,
            clearUser: () => setUser(null),
        }),
        [user],
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
    const context = React.useContext(UserContext);

    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }

    return context;
}
