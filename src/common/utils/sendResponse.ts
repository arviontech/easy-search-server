export interface TResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data?: T;
}

export const sendResponse = <T>(data: TResponse<T>) => {
  return {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message,
    meta: data.meta,
    data: data.data,
  };
};
