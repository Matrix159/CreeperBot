import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { playNextSong } from '../discord';

export default {
  name: 'skip',
  description: 'Skip to the next song in the queue.',
  aliases: ['next'],
  execute: async (message: Message, messageArgs: string) => {
    if (message.guild?.id) {
      await playNextSong(musicControllerMap, message);
    }
  }
} as Command;
