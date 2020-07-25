export interface User {
  avatarURL: string;
  username: string;
}

export interface CreeperInfo {
  users: User[];
  totalOnline: number;
  messages: string[];
}