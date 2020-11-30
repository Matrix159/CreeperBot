import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';
import { DiscordSocket, Guild } from './models';
import { creeperInfo, musicControllerMap, socketMap } from './state';
import { io, setupHttpServer } from './http';
import { watchUser, unwatchUser, getWatchedUsers} from './database';
import socketioJwt from 'socketio-jwt';
import youtube from 'scrape-youtube';
import { discordLogin } from './discord';

let client: Discord.Client;

// Socket server
(async () => {
  // Setup the http server for /login and handling SQL queries
  await setupHttpServer();

  // Initial discord bot setup
  client = await discordLogin();

  // set authorization for socket.io
  io.use(socketioJwt.authorize({
    secret: process.env.JWT_SECRET as string,
    handshake: true
  }));
  io.on('connection', async (socket: DiscordSocket) => {
    // @ts-ignore
    socketMap.set(socket.decoded_token.snowflake, {
      snowflake: socket.decoded_token.snowflake,
      username: socket.decoded_token.username,
      socket: socket
    });
    console.log(socketMap.keys());

    const user = socketMap.get(socket.decoded_token.snowflake);

    socket.on('watch', async (snowflakeToWatch: string) => {
      console.log('watch received');
      if (user) {
        await watchUser(user.snowflake, snowflakeToWatch);
      }
    });

    socket.on('unwatch', async (snowflakeToUnwatch: string) => {
      console.log('unwatch received');
      if (user) {
        await unwatchUser(user.snowflake, snowflakeToUnwatch);
      }
    });

    socket.on('play-pause',  (event) => {
      const dispatcher = musicControllerMap.get(event.guildId)?.dispatcher;
      if (dispatcher) {
        if (!event.playing) {
          dispatcher.resume();
        } else {
          dispatcher.pause(true);
        }
      }
    });

    socket.on('volume-change', (event) => {
      const dispatcher = musicControllerMap.get(event.guildId)?.dispatcher;
      if (dispatcher) {
        console.log(event.volume / 100);
        dispatcher.setVolume(event.volume / 100);
      }
    });

    socket.on('queue', (event) => {
      console.log('Queue event received');
      const queue = musicControllerMap.get(event.guildId)?.queue;
      if (queue) {
        queue.push({ songName: event.songName, url: event.url});
        console.log(`Queued song: ${event.songName}`);
      }
    });

    socket.on('search-youtube', async (searchValue, callback) => {
      console.log(searchValue);
      callback(await youtube.search(searchValue));
    });

    await gatherAndSendInfo(socket.decoded_token.snowflake);
  });
})();

/**
 * Gather the full info object for the Creeper UI
 * @param snowflake Unique ID of discord user
 */
async function gatherAndSendInfo(snowflake: string) {
  let userInfo = socketMap.get(snowflake);
  console.log('Gather function userInfo ' + userInfo);
  if (userInfo) {
    try {
      creeperInfo.guilds = [];
      for (const [id, guild] of client.guilds.cache) {
        const fetchedMembers = await guild?.members.fetch();
        /*const membersInVoiceChat = guild?.voiceStates.cache.filter(voiceState => !!voiceState.channel).map(voiceState => {
          return voiceState.member!.user;
        });*/
        const watchedUsers = await getWatchedUsers();

        creeperInfo.guilds.push({
          id,
          users: fetchedMembers?.map(member => ({
            username: member.user.username,
            avatarURL: member.user.displayAvatarURL(),
            snowflake: member.user.id,
            watched: watchedUsers.includes(member.user.id)
          })) ?? [],
          totalOnline: fetchedMembers?.filter(member => member.presence.status === 'online')?.size ?? 0,
          guildImage: guild.iconURL({ size: 128, dynamic: true }) ?? undefined
        } as Guild);
        userInfo.socket.emit('message', creeperInfo);
      }
    } catch(error) {
      console.log(error);
    }
  }
}
