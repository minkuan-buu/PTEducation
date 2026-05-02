export const API_VERSIONS = {
  v1: "v1",
  v2: "v2",
} as const;

export type ApiVersion = keyof typeof API_VERSIONS;

export function getApiBaseUrl() {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
}

export function buildApiBasePath(version: ApiVersion) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/api/${version}` : `/api/${version}`;
}
