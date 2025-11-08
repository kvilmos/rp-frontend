import { UserData } from './user-data.interface';

export interface LoginResponse {
  accessToken: string;
  user: UserData;
}
