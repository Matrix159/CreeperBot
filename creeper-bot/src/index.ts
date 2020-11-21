import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';
import { Guild, UserInfo } from './models';
import { creeperInfo } from './state';
import { io, setupHttpServer } from './http';
import { Socket } from 'socket.io';
import ytdl from 'ytdl-core';
import { watchUser, unwatchUser, getUsersWatching, getWatchedUsers} from './database';
import socketioJwt from 'socketio-jwt';
import Timeout = NodeJS.Timeout;

let client: Discord.Client;

/** User snowflake -> UserInfo */
const socketMap: Map<string, UserInfo> = new Map();
/** Guild ID -> Discord.StreamDispatcher */
const dispatcherMap: Map<string, Discord.StreamDispatcher> = new Map();

interface DiscordSocket extends Socket {
  decoded_token: {
    snowflake: string,
    username: string,
  }
}

// Socket server
(async () => {
  // Setup the http server for /login and handling SQL queries
  await setupHttpServer();

  // Initial discord bot setup
  client = await setupDiscord();

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
      const dispatcher = dispatcherMap.get(event.guildId);
      if (dispatcher) {
        if (!event.playing) {
          dispatcher.resume();
        } else {
          dispatcher.pause();
        }
      }
    });

    socket.on('volume-change', (event) => {
      const dispatcher = dispatcherMap.get(event.guildId);
      if (dispatcher) {
        console.log(event.volume / 100);
        dispatcher.setVolume(event.volume / 100);
      }
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

/**
 * Set up discord event listeners and login
 */
async function setupDiscord(): Promise<Discord.Client> {
  const client = new Discord.Client({
    presence: {
      activity: {
        type: 'WATCHING',
        name: 'you always'
      }
    }
  });
  client.once('ready', async () => {
    console.log('Ready!');
  });

  client.on('message', async message => {
    // Voice only works in guilds, if the message does not come from a guild,
    // we ignore it
    if (!message.guild) return;

    if (message.content.startsWith('/join')) {
      // Only try to join the sender's voice channel if they are in one themselves
      if (message.member?.voice.channel && message.guild?.id) {
        try {
          const connection = await message.member.voice.channel.join();
          const dispatcher = connection.play(ytdl(message.content.split(" ")[1], { filter: 'audioonly' }));

          let timeout: Timeout|undefined;
          dispatcher.on('speaking', speaking =>  {
            if (!speaking) {
              console.log('Speaking false');
              timeout = setTimeout(() => {
                connection.disconnect();
                dispatcherMap.delete(message.guild!.id);
                console.log('Left voice channel');
              }, 5* 60 * 1000)
            } else {
              if (timeout) {
                console.log('Clearing timeout');
                clearTimeout(timeout);
                timeout = undefined;
              }
            }
          });
          dispatcherMap.set(message.guild.id, dispatcher);
          socketMap.get(message.member.user.id)?.socket.emit('music-start', message.guild.id);
        } catch (error) {
          console.log(error);
        }
      }
    }
  });

  client.on('voiceStateUpdate', async (oldState, newState) => {
    const newUserChannel = newState.channel;
    const oldUserChannel = oldState.channel;

    if(oldUserChannel == undefined && newUserChannel != undefined) {
      console.log("User joined");
      // User Joins a voice channel
      const message = `User ${newState?.member?.user.username} joined channel ${newUserChannel.name} at ${new Date().toString()}`;
      creeperInfo.messages.push(message);

      const usersWatching = await getUsersWatching(newState?.member?.user?.id || '');
      for (const userWatching of usersWatching) {
        console.log('Sending message to user that is watching');
        const user = await client.users.fetch(userWatching);
        await user.send(message);
      }
      //if (newState?.member?.id != '98992981045964800') {
      /*client.users.fetch('98992981045964800').then((user) => {
        user.send(message);
      });*/
      //}
      // await gatherAndSendInfo(clientSocket);
    } else if(newUserChannel == undefined){
      console.log("User left")
      // User leaves a voice channel
      const message = `User ${newState?.member?.user.username} left channel ${oldUserChannel?.name} at ${new Date().toString()}`;
      creeperInfo.messages.push(message);
      /*client.users.fetch('98992981045964800').then((user) => {
        user.send(message);
      });*/
      // await gatherAndSendInfo(clientSocket);
    }

    /*if (newState.channel != null) {
      const message = `User ${newState?.member?.user.username} joined channel ${newState.channel.name} at ${new Date().toString()}`
      console.log(message);
      console.log( {
        avatarURL: newState?.member?.user.displayAvatarURL(),
        username: newState?.member?.user.username
      } as User);
     if (newState?.member?.id && !userIDs.includes(newState.member.id)) {
        userIDs.push(newState.member.id);
     }
    }*/
  });

  await client.login(process.env.TOKEN);
  return client;
}
