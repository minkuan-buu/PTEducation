import { createApiClient } from "../client";
import type { ApiResponse } from "../types";
import type { ClassSchedule } from "./classes";

export type ScoreStudentDetailResModel = {
  testDateAt: string;
  shift: string | null;
  score: number;
  note: string | null;
};

export type ScoreStudentResModel = {
  id: string;
  name: string;
  scores: ScoreStudentDetailResModel[];
};

export type ScoreMonthResModel = {
  id: string;
  month: number;
  year: number;
};

export type AttendanceStudentDetailResModel = {
  date: string;
  startTime: string;
  endTime: string;
  attendanceStatus: string;
};

export type AttendanceStudentResModel = {
  id: string;
  name: string;
  attendances: AttendanceStudentDetailResModel[];
};

export type AttendanceMetadataResModel = {
  classId: string;
  className:string;
  studentName: string;
  attendanceRate: number;
  presentAttendance: string;
  absentAttendance: string;
  totalSession: string;
  months: AttendanceMonthResModel[];
  weeklySchedules: ClassSchedule[];
}


export type AttendanceMonthResModel = {
  id: string;
  month: number;
  year: number;
};

export type AttendanceSessionResModel = {
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  note: string;
  attendanceStatus: string;
  status: string;
};

export type ScoreSessionResModel = {
  testDateAt: string;
  shift: string;
  score: string;
  note: string;
};

export type StudentOverviewResModel = {
  studentName: string;
  className: string;
  averageScore: number;
  attendanceRate: number;
  nextSession: string | null;
  recentAttendances: AttendanceSessionResModel[] | null;
  recentScores: ScoreSessionResModel[] | null;
};

const api = createApiClient("root");
const apiV2 = createApiClient("v2");

export async function getStudentScoresByMonth(month: number, year: number): Promise<ScoreStudentResModel | null> {
  const response = await api.get<ApiResponse<ScoreStudentResModel>>("/score-detail", {
    params: { Month: month, Year: year },
  });
  return response.data?.data ?? null;
}

export async function getStudentScoreMonths(): Promise<ScoreMonthResModel[]> {
  const response = await api.get<ApiResponse<ScoreMonthResModel[]>>("/score-detail/month");
  return response.data?.data ?? [];
}

export async function getStudentAttendanceByMonth(month: number, year: number): Promise<AttendanceStudentResModel | null> {
  const response = await api.get<ApiResponse<AttendanceStudentResModel>>("/attendance-detail", {
    params: { Month: month, Year: year },
  });
  return response.data?.data ?? null;
}

export async function getStudentAttendanceMetadata(): Promise<AttendanceMetadataResModel | null> {
  const response = await apiV2.get<ApiResponse<AttendanceMetadataResModel>>("/overview/attendance");
  return response.data?.data ?? null;
}

export async function getStudentOverview(): Promise<StudentOverviewResModel | null> {
  const response = await apiV2.get<ApiResponse<StudentOverviewResModel>>("/overview/student");
  return response.data?.data ?? null;
}
