import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { playNextSong } from '../index';

export default {
  name: 'skip',
  description: 'Skip to the next song in the queue.',
  execute: async (message: Message, messageArgs: string) => {
    await playNextSong(musicControllerMap, message);
  }
} as Command;
