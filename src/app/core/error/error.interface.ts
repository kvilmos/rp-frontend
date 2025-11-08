export interface ApiError {
  success: boolean;
  status: number;
  message: any;
}

export interface ValidationError {
  key: string;
  condition: string;
  param?: { [key: string]: any };
}

export interface ErrorDisplay {
  key: string;
  param?: { [key: string]: any };
}
