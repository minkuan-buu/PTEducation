// import { createApiClient } from "../client";
// import type { ApiResponse } from "../types";
// import { clearAccessToken, setAccessToken } from "../token";

import { createApiClient } from "../client";
import { ApiResponse } from "../types";

// export type LoginPayload = {
//   username: string;
//   password: string;
// };

// export type LoginUser = {
//   id: string;
//   username: string;
//   email?: string;
//   accessToken: string;
// };

const api = createApiClient("v1");

// export async function login(payload: LoginPayload) {
//   const response = await api.post<ApiResponse<LoginUser>>(
//     "/authentication/login",
//     payload,
//   );

//   const result = response.data;
//   console.log(result);

//   if (result.data.accessToken) {
//     setAccessToken(result.data.accessToken);
//   }

//   return result;
// }

// export async function logout() {
//   const response = await api.post<ApiResponse<null>>("/auth/logout");

//   clearAccessToken();

//   return response.data;
// }

export async function resetPassword(tempToken: string, payload: { newPassword: string; confirmPassword: string }) {
  const response = await api.post<ApiResponse<null>>("/authentication/reset-password", payload, {
    headers: {
      Authorization: `Bearer ${tempToken}`,
    },
  });
  return response.data;
}
