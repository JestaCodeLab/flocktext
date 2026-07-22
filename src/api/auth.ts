import { api } from '@/api/client';
import type { Session } from '@/types';

export interface SignupPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function signup(payload: SignupPayload) {
  const { data } = await api.post<{ phone: string; message: string }>('/auth/signup', payload);
  return data;
}

export async function verifyOtp(phone: string, code: string) {
  const { data } = await api.post<Session & AuthTokens>('/auth/verify-otp', { phone, code });
  return data;
}

export async function resendOtp(phone: string) {
  const { data } = await api.post<{ message: string }>('/auth/resend-otp', { phone });
  return data;
}

export async function login(phone: string, password: string) {
  const { data } = await api.post<Session & AuthTokens>('/auth/login', { phone, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<Session>('/auth/me');
  return data;
}

export async function refreshSession(refreshToken: string) {
  const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
  return data;
}

// For the "stay signed in" button only - unlike refreshSession (also called
// silently in the background on any 401), this resets the session's absolute
// expiry, so it must only ever be triggered by an explicit user action.
export async function extendSession(refreshToken: string) {
  const { data } = await api.post<AuthTokens>('/auth/extend-session', { refreshToken });
  return data;
}

export async function logout(refreshToken: string | null) {
  const { data } = await api.post<{ message: string }>('/auth/logout', refreshToken ? { refreshToken } : {});
  return data;
}

export async function updateMe(payload: { name: string; email: string }) {
  const { data } = await api.patch<Session>('/auth/me', payload);
  return data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  const { data } = await api.post<{ message: string }>('/auth/change-password', payload);
  return data;
}

export async function forgotPasswordRequest(phone: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password/request', { phone });
  return data;
}

export async function forgotPasswordVerify(phone: string, code: string) {
  const { data } = await api.post<{ resetToken: string }>('/auth/forgot-password/verify', { phone, code });
  return data;
}

export async function forgotPasswordReset(resetToken: string, newPassword: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password/reset', { resetToken, newPassword });
  return data;
}
