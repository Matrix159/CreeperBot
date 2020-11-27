import { Socket } from 'socket.io';

export interface User {
  avatarURL: string;
  username: string;
  snowflake: string;
  watched: boolean;
}

export interface Guild {
  id: string;
  users: User[];
  totalOnline: number;
  guildImage?: string;
}

export interface CreeperInfo {
  messages: string[];
  guilds: Guild[];
}

export interface DiscordAuth {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface UserInfo {
  // discordAuth: DiscordAuth;
  // expiresBy: Date;
  username: string;
  snowflake: string;
  socket: Socket;
}

export interface QueueObject {
  url: string;
  songName: string;
}

export interface DiscordSocket extends Socket {
  decoded_token: {
    snowflake: string,
    username: string,
  }
}
