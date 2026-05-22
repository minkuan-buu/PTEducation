import axios, { type AxiosInstance } from "axios";

import { buildApiBasePath, type ApiVersion } from "./config";

export type UnauthorizedHandler = (error: unknown) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function createApiClient(version: ApiVersion): AxiosInstance {
  const client = axios.create({
    baseURL: buildApiBasePath(version),
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
