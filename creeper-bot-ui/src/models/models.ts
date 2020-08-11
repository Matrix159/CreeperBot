export interface User {
  avatarURL: string;
  username: string;
  snowflake: string;
  watched: boolean;
}

export interface CreeperInfo {
  users: User[];
  totalOnline: number;
  messages: string[];
}
