import { createApiClient } from "../client";
import type { ApiResponse } from "../types";

export type ScoreListResModel = {
  id: string;
  testDateAt: string;
  averageScore: number;
  status: string;
};

export type ScoreDetailStudentResModel = {
  studentClassId: string;
  id: string; // studentId (Mã học sinh)
  name: string;
  score: number;
  note: string | null;
};

export type ScoreDetailResModel = {
  id: string;
  testDateAt: string;
  className: string;
  createdAt: string;
  modifiedAt: string | null;
  scoreDetails: ScoreDetailStudentResModel[];
};

export type ScoreDetailStudentReqModel = {
  studentClassId: string;
  score: number;
  note: string | null;
};

export type ScoreCreateReqModel = {
  testDateAt: string;
  classId: string;
  shift?: string | null;
  scoreReqList: ScoreDetailStudentReqModel[];
};

export type ScoreDetailUpdateReqModel = {
  id: string; // scoreId
  scoreReqList: ScoreDetailStudentReqModel[];
};

export type StudentClassResModelForSheet = {
  studentClassId: string;
  id: string; // Student code
  name: string;
  score: number;
  note: string | null;
};

const api = createApiClient("root");

export async function getStudentsInClassForScore(classId: string): Promise<StudentClassResModelForSheet[]> {
  if (!classId) {
    throw new Error("Class id is required.");
  }
  const response = await api.get<StudentClassResModelForSheet[]>(`/student-class/all`, {
    params: { classId },
  });
  return response.data ?? [];
}

export async function getClassScores(classId: string): Promise<ScoreListResModel[]> {
  if (!classId) {
    throw new Error("Class id is required.");
  }

  const response = await api.get<ApiResponse<ScoreListResModel[]>>(`/score/all`, {
    params: { ClassId: classId },
  });

  return response.data.data ?? [];
}

export async function getScoreDetail(scoreId: string): Promise<ScoreDetailResModel | null> {
  if (!scoreId) {
    throw new Error("Score id is required.");
  }

  const response = await api.get<ApiResponse<ScoreDetailResModel>>(`/score/get`, {
    params: { Id: scoreId },
  });

  return response.data.data ?? null;
}

export async function createScore(payload: ScoreCreateReqModel): Promise<void> {
  await api.post(`/score/create`, payload);
}

export async function updateScoreDetail(payload: ScoreDetailUpdateReqModel): Promise<void> {
  await api.put(`/score-detail/update`, payload);
}

export async function deleteScore(scoreId: string): Promise<void> {
  if (!scoreId) {
    throw new Error("Score id is required.");
  }
  await api.delete(`/score/delete/${encodeURIComponent(scoreId)}`);
}
