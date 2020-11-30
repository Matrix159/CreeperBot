import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { toggleShuffleMode } from '../discord';

export default {
  name: 'shuffle',
  description: 'Turns shuffle mode on.',
  execute: async (message: Message, messageArgs: string) => {
    if (message.guild?.id) {
      toggleShuffleMode(musicControllerMap, message);
    }
  }
} as Command;
