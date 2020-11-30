import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';

export default {
  name: 'nuke',
  description: 'Nukes everything from the queue.',
  execute: async (message: Message, messageArgs: string) => {
    if (message.guild?.id) {
      const controller = musicControllerMap.get(message.guild.id);
      if (controller?.queue && controller.queue?.length) {
        controller.queue = [];
        message.channel.send('Nuking this muthafuckin\' queue');
      }
    }
  }
} as Command;
