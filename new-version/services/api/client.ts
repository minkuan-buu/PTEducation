import axios, { type AxiosInstance } from "axios";

import { buildApiBasePath, type ApiVersion, getApiBaseUrl } from "./config";

export type UnauthorizedHandler = (error: unknown) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function createApiClient(version: ApiVersion | "root"): AxiosInstance {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const baseURL =
    version === "root"
      ? baseUrl
        ? `${baseUrl}/api`
        : "/api"
      : buildApiBasePath(version);

  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        if (unauthorizedHandler) {
          unauthorizedHandler(error);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}
