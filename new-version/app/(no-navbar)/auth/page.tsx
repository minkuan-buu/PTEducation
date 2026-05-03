
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

export default async function Home() {
    const classOptions = await fetchClassOptions();

    return <AuthClient classOptions={classOptions} />;
}