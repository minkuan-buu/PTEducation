import { createApiClient } from "../client";
import { ApiListResponse, ApiResponse } from "../types";

const api = createApiClient("v1");

export type CreateNewUserPayload = {
    email: string;
    phone: string;
    name: string;
};

export type AdminManager = {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
};

export type ManagersPage = {
    data: AdminManager[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
};

function normalizeManagers(
    payload:
        | AdminManager[]
        | ApiListResponse<AdminManager>
        | ApiResponse<AdminManager[]>
        | ManagersPage,
): ManagersPage {
    if (Array.isArray(payload)) {
        return {
            data: payload,
            pageNumber: 1,
            pageSize: payload.length,
            totalPages: 1,
        };
    }

    if (
        "pageNumber" in payload &&
        "pageSize" in payload &&
        "totalPages" in payload
    ) {
        return payload;
    }
}

export async function getManagers({
    params
}: {
    params: {
        pageIndex: number;
        keyword: string;
    }
}) {
    const response = await api.get<
        | AdminManager[]
        | ApiListResponse<AdminManager>
        | ApiResponse<AdminManager[]>
        | ManagersPage
    >("/admin/managers", { params });
    return normalizeManagers(response.data);
}

export async function createNewUser(payload: CreateNewUserPayload[]) {
    const response = await api.post("/admin/managers", payload);
    return response.data;
}
