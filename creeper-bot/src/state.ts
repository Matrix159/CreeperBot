import { CreeperInfo, QueueObject, UserInfo } from './models';
import Discord from "discord.js";

export const creeperInfo: CreeperInfo = {
  messages: [],
  guilds: []
}

/** Guild ID -> Discord.StreamDispatcher */
export type MusicControllerMap = Map<string, {
  dispatcher?: Discord.StreamDispatcher;
  voiceConnection?: Discord.VoiceConnection;
  queue?: QueueObject[];
  shuffleMode: boolean;
}>;
export const musicControllerMap: MusicControllerMap = new Map();

/** User snowflake -> UserInfo */
export const socketMap: Map<string, UserInfo> = new Map();
