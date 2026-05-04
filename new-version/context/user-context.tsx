"use client";

import * as React from "react";

export type UserProfile = {
    id: string;
    username: string;
    email?: string;
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
    const [user, setUser] = React.useState<UserProfile | null>(initialUser);

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
