"use client";

import * as React from "react";

export type UserProfile = {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    role?: "admin" | "student" | "guardian" | "manager";
    isNeedChangePassword?: boolean;
};

type UserContextValue = {
    user: UserProfile | null;
    isAuthenticated: boolean;
    setUser: (user: UserProfile | null) => void;
    clearUser: () => void;
    isLoading: boolean;
};

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

// ─── External Store (localStorage) ──────────────────────────────────────────
//
// useSyncExternalStore needs three things:
//   subscribe     – React calls this to know when to re-render
//   getSnapshot   – returns current value on the CLIENT  (reads localStorage)
//   getServerSnapshot – returns value on the SERVER      (always null)
//
// React knows server ≠ client is intentional → no hydration error.
// After hydration React syncs to the client snapshot before paint → no flash.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "pteducation.user";

/** In-memory cache – avoids repeated JSON.parse and keeps a stable reference. */
let _cache: UserProfile | null = null;
let _cacheInitialized = false;

/** Listeners that React registers via subscribe(). */
const _listeners = new Set<() => void>();

function _initCache() {
    if (_cacheInitialized) return;
    _cacheInitialized = true;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) _cache = JSON.parse(raw) as UserProfile;
    } catch {
        window.localStorage.removeItem(STORAGE_KEY);
    }
}

function _emitChange() {
    for (const fn of _listeners) fn();
}

/** Subscribe to store changes — required by useSyncExternalStore. */
function subscribe(onStoreChange: () => void) {
    _listeners.add(onStoreChange);
    return () => {
        _listeners.delete(onStoreChange);
    };
}

/** Client snapshot — read from in-memory cache (fast, stable reference). */
function getSnapshot(): UserProfile | null {
    _initCache();
    return _cache;
}

/** Server snapshot — no localStorage available, always null. */
function getServerSnapshot(): UserProfile | null {
    return null;
}

/** Write to both cache and localStorage, then notify React to re-render. */
function writeUser(newUser: UserProfile | null) {
    _cache = newUser;
    if (newUser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        try {
            document.cookie = `user_role=${newUser.role}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        } catch {}
    } else {
        window.localStorage.removeItem(STORAGE_KEY);
        try {
            document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        } catch {}
    }
    _emitChange();
}

// ─── Provider & Hook ────────────────────────────────────────────────────────

export interface UserProviderProps {
    children: React.ReactNode;
    initialUser?: UserProfile | null;
    initialRole?: string | null;
}

export function UserProvider({ children, initialUser = null, initialRole = null }: UserProviderProps) {
    const user = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [isHydrated, setIsHydrated] = React.useState(false);

    React.useEffect(() => {
        setIsHydrated(true);
    }, []);

    // If an initialUser is provided externally (e.g. from the server), persist it once.
    React.useEffect(() => {
        if (initialUser && !_cache) writeUser(initialUser);
    }, [initialUser]);

    // Use server role as fallback before client hydration completes
    const activeUser = user || (initialRole ? { id: "", name: "User", role: initialRole as any } as UserProfile : null);

    const value = React.useMemo<UserContextValue>(
        () => ({
            user: activeUser,
            isAuthenticated: Boolean(activeUser),
            setUser: writeUser,
            clearUser: () => writeUser(null),
            // While hydrating, we don't know the local user yet, so we are loading.
            isLoading: !isHydrated && !initialUser && !initialRole,
        }),
        [activeUser, isHydrated, initialUser, initialRole],
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
