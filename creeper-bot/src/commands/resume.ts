import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { resumeSong } from '../discord';

export default {
  name: 'resume',
  description: 'Resume the song currently playing.',
  execute: async (message: Message, messageArgs: string) => {
    if (message.guild?.id) {
      resumeSong(musicControllerMap, message);
    }
  }
} as Command;
