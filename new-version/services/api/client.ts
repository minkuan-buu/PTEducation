import axios, { type AxiosInstance } from "axios";

import { buildApiBasePath, type ApiVersion } from "./config";
import { clearAccessToken, getAccessToken } from "./token";

export function createApiClient(version: ApiVersion): AxiosInstance {
  const client = axios.create({
    baseURL: buildApiBasePath(version),
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        clearAccessToken();
      }

      return Promise.reject(error);
    },
  );

  return client;
}
