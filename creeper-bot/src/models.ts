import { Socket } from 'socket.io';

export interface User {
  avatarURL: string;
  username: string;
  snowflake: string;
}

export interface CreeperInfo {
  users: User[];
  totalOnline: number;
  messages: string[];
}

export interface DiscordAuth {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface UserInfo {
  discordAuth: DiscordAuth;
  expiresBy: Date;
  username: string;
  snowflake: string;
  socket?: Socket;
}