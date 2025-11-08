import { UserData } from './user_data.interface';

export interface LoginResponse {
  accessToken: string;
  user: UserData;
}
