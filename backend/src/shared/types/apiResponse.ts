export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}
