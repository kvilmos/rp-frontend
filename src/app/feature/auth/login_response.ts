import { UserData } from './user_data';

export interface LoginResponse {
  accessToken: string;
  user: UserData;
}
