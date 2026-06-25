import { createApiClient } from "./client";
import type { ApiResponse } from "./types";

const rootApi = createApiClient("root");

export async function sendOtp(email: string) {
  const response = await rootApi.post<ApiResponse<null>>("/otp/send", email);
  return response.data;
}

export async function verifyOtp(payload: { email: string | null; otpCode: string }) {
  const response = await rootApi.post<ApiResponse<{ tempToken: string }>>("/otp/verify", payload);
  return response.data;
}
