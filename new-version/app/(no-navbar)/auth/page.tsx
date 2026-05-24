
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { buildApiBasePath } from "@/services/api";

import AuthClient from "./auth-client";

type ClassOption = {
    id: string;
    name: string;
};

async function fetchClassOptions(): Promise<ClassOption[]> {
    try {
        const response = await fetch(`${buildApiBasePath("v2")}/classes/select`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            return [];
        }

        const payload = (await response.json()) as { data?: ClassOption[] };
        const options = Array.isArray(payload?.data) ? payload.data : [];
        return options.sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" }));
    } catch {
        return [];
    }
}

function getSafeNextPath(nextParam?: string | string[]) {
    const nextValue = Array.isArray(nextParam) ? nextParam[0] : nextParam;

    if (nextValue && nextValue.startsWith("/") && !nextValue.startsWith("//")) {
        return nextValue;
    }

    if (nextValue) {
        try {
            const decoded = decodeURIComponent(nextValue);
            if (decoded.startsWith("/") && !decoded.startsWith("//")) {
                return decoded;
            }
        } catch {
            // ignore decode errors
        }
    }

    return "/";
}

export default async function Home({ searchParams }: { searchParams?: any }) {
    const resolvedSearchParams = await searchParams;
    const cookieStore = await cookies();
    const token = cookieStore.get("at")?.value;

    if (token) {
        redirect(getSafeNextPath(resolvedSearchParams?.next));
    }

    const classOptions = await fetchClassOptions();
    const safeNext = getSafeNextPath(resolvedSearchParams?.next);

    return <AuthClient classOptions={classOptions} nextPath={safeNext} />;
}