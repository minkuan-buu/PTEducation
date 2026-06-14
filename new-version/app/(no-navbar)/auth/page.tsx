
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { buildApiBasePath } from "@/services/api";

import AuthClient from "./auth-client";



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

    const safeNext = getSafeNextPath(resolvedSearchParams?.next);

    return <AuthClient nextPath={safeNext} />;
}