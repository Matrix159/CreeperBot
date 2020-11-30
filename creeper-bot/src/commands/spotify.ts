import { Command } from './index';
import { Message } from 'discord.js';
import { musicControllerMap } from '../state';
import { getSpotifyAccessCode, getSpotifyTracksByPlaylist } from '../spotify';
import { playSong } from '../discord';

export default {
  name: 'spotify',
  description: `Play a spotify playlist \`${process.env.COMMAND_PREFIX}spotify [spotify URI: spotify:playlist:6B1RZ4ZHJeDOuw66V8Lkwx or ID: 6B1RZ4ZHJeDOuw66V8Lkwx]\` 
  *NOTE: This will look up the songs on youtube and may not be 100% accurate*`,
  execute: async (message: Message, messageArgs: string) => {
    if (message.member?.voice.channel && message.guild?.id) {
      const messageArgArray = messageArgs.split(' ');
      if (messageArgArray.length > 1) {
        message.channel.send(`Please enter the command as \`$spotify [spotify URI or ID]\``);
      }
      let playlistId = undefined;
      if (messageArgs.startsWith('spotify:playlist:')) {
        let spotifySplit = messageArgs.split(':')
        if (spotifySplit.length === 3) {
          playlistId = spotifySplit[2];
        } else {
          playlistId = messageArgs;
        }
      }
      const musicController = musicControllerMap.get(message.guild.id);
      if (musicController) {
        musicController.voiceConnection = await message.member.voice.channel.join();
      } else {
        musicControllerMap.set(message.guild.id, { voiceConnection: await message.member.voice.channel.join(), shuffleMode: false });
      }
      const spotifyAccessCode = await getSpotifyAccessCode();
      console.log(spotifyAccessCode);
      const songList = await getSpotifyTracksByPlaylist(playlistId ?? '', spotifyAccessCode);
      console.log(songList);

      for (let songName of songList) {
        await playSong(musicControllerMap, message, songName, false);
      }
    }
  }
} as Command;
