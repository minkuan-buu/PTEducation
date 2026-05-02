export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type ApiListResponse<T> = {
  data: T[];
  message?: string;
  success: boolean;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
};
