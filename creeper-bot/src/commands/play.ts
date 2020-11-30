import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap, socketMap } from '../state';
import { playSong } from '../discord';

export default {
  name: 'play',
  description: 'Play a song from youtube: `$play [song name]`',
  execute: async (message: Message, messageArgs: string) => {
    console.log(`Play executed - Message: [${message}] Args: [${messageArgs}]`);
    if (message.member?.voice.channel && message.guild?.id) {
      const song = messageArgs;
      if (song.length == 0) {
        message.channel.send('Please provide a song name for the play command.');
        return;
      }
      const musicController = musicControllerMap.get(message.guild.id);
      if (musicController) {
        musicController.voiceConnection = await message.member.voice.channel.join();
      } else {
        musicControllerMap.set(message.guild.id, { voiceConnection: await message.member.voice.channel.join(), shuffleMode: false });
      }
      await playSong(musicControllerMap, message, song);
      socketMap.get(message.member.user.id)?.socket.emit('music-start', message.guild.id);
    }
  }
} as Command;
