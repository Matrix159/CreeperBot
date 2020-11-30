import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { pauseSong } from '../discord';

export default {
  name: 'pause',
  description: 'Pause the song currently playing.',
  execute: async (message: Message, messageArgs: string) => {
    if (message.guild?.id) {
      pauseSong(musicControllerMap, message);
    }
  }
} as Command;
