// Tokens are managed by backend httpOnly cookies; client does not store them.
export function getAccessToken() {
  return null;
}

export function setAccessToken(_token: string) {}

export function clearAccessToken() {}
