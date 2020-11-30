import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';

export default {
  name: 'leave',
  description: 'Kick the bot out of its current voice channel.',
  aliases: ['disconnect'],
  execute: async (message: Message, messageArgs: string) => {
    if (!message.guild?.id) return;
    const controller = musicControllerMap.get(message.guild.id);
    if (controller) {
      controller.voiceConnection?.disconnect();
      controller.voiceConnection = undefined;
    }
  }
} as Command;
