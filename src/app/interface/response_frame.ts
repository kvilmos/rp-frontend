export interface ResponseFrame<T> {
  success: boolean;
  message: string;
  data: T;
}
