import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';

export default {
  name: 'queue',
  description: 'List the current song queue.',
  aliases: ['q'],
  execute: async (message: Message, messageArgs: string) => {
    if (message.guild?.id) {
      const queue = musicControllerMap.get(message.guild.id)?.queue ?? [];
      const queueMessage = queue.map((queueItem, index) => `${index + 1}: ${queueItem.songName} ${queueItem.songName}`).join('\n').toString().slice(0, 2000);
      if (queueMessage) {
        message.channel.send(queueMessage);
      } else {
        message.channel.send('There is no music currently queued.');
      }
    }
  }
} as Command;
