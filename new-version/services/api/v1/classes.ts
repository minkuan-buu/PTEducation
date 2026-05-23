import { createApiClient } from "../client";
import type { ApiListResponse, ApiResponse } from "../types";
import { ClassData } from "../v2";

const api = createApiClient("v1");

export type ClassesPage = {
  data: ClassData[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

type ClassesResponse =
  | ClassesPage
  | ApiListResponse<ClassData>
  | ApiResponse<ClassData[]>
  | ClassData[];

function normalizeClassesPage(payload: ClassesResponse): ClassesPage {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      pageNumber: 1,
      pageSize: payload.length,
      totalPages: 1,
    };
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = Array.isArray(payload.data) ? payload.data : [];
    const meta = "meta" in payload ? payload.meta : undefined;
    const pageNumber =
      "pageNumber" in payload && typeof payload.pageNumber === "number"
        ? payload.pageNumber
        : (meta?.page ?? 1);
    const pageSize =
      "pageSize" in payload && typeof payload.pageSize === "number"
        ? payload.pageSize
        : (meta?.pageSize ?? data.length);
    const totalPages =
      "totalPages" in payload && typeof payload.totalPages === "number"
        ? payload.totalPages
        : meta?.total && pageSize > 0
          ? Math.max(1, Math.ceil(meta.total / pageSize))
          : 1;

    return { data, pageNumber, pageSize, totalPages };
  }

  return { data: [], pageNumber: 1, pageSize: 10, totalPages: 1 };
}

export async function getAdminClasses(params?: {
  pageIndex?: number;
  keyword?: string;
}) {
  const response = await api.get<ClassesResponse>("/classes", {
    params: {
      pageIndex: params?.pageIndex,
      Keyword: params?.keyword || undefined,
    },
  });

  return normalizeClassesPage(response.data);
}
