import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { playNextSong } from '../discord';

export default {
  name: 'pop',
  description: `Pops a song to the front of the queue by queue position. \`${process.env.COMMAND_PREFIX}pop 5\``,
  execute: async (message: Message, messageArgs: string) => {
    try {
      if(message.guild?.id) {
        const index = Math.floor(parseInt(messageArgs));
        const controller = musicControllerMap.get(message.guild.id);
        if (controller?.queue?.length && index >= 1 && index <= controller.queue.length) {
          controller.queue.unshift(controller.queue.splice(index - 1, 1)[0]);
          await playNextSong(musicControllerMap, message, true);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
} as Command;
