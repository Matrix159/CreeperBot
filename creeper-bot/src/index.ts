import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';
import { CreeperInfo, UserInfo } from './models';
import { io, setupHttpServer, sessionMap } from './http';
import socketio from 'socket.io';
import ytdl from 'ytdl-core';

import { watchUser, unwatchUser, getUsersWatching, getWatchedUsers} from './database';

// DiscordJS below
// let userIDs: string[] = [];
let clientSocket: socketio.Socket;

let creeperInfo: CreeperInfo = {
  users: [],
  messages: [],
  totalOnline: 0
};

let dispatcher: Discord.StreamDispatcher;
// small change to test webhookk
// const watchedUserMap: Map<string, string> = new Map<string, string>();

let client: Discord.Client;

// Socket server
(async () => {
  // Setup the http server for /login and handling SQL queries
  await setupHttpServer();

  // Initial discord bot setup
  client = await setupDiscord();
  io.on('connection', async (socket) => {
    console.log('a user connected');
    clientSocket = socket;

    clientSocket.on('watch', async (snowflakeToWatch: string) => {
      console.log('watch received');
      const userInfo = await getSession(clientSocket);
      if (userInfo) {
        await watchUser(userInfo.snowflake, snowflakeToWatch);
      }
    });

    clientSocket.on('unwatch', async (snowflakeToUnwatch: string) => {
      console.log('unwatch received');
      const userInfo = await getSession(clientSocket);
      if (userInfo) {
        await unwatchUser(userInfo.snowflake, snowflakeToUnwatch);
      }
    });

    clientSocket.on('play-pause',  (event) => {
      if (dispatcher) {
        if (!event.playing) {
          dispatcher.resume();
        } else {
          dispatcher.pause();
        }
      }
    });

    await gatherAndSendInfo(clientSocket);
  });
})();

/**
 * Gather the full info object for the Creeper UI
 * @param socket Socket connected to UI
 */
async function gatherAndSendInfo(socket: socketio.Socket) {
  if (socket) {
    let userInfo = await getSession(socket);
    console.log('Gather function userInfo ' + userInfo);
    // if (userInfo) {
      try {
        const guild = client.guilds.cache.first();
        const fetchedMembers = await guild?.members.fetch();
        /*const membersInVoiceChat = guild?.voiceStates.cache.filter(voiceState => !!voiceState.channel).map(voiceState => {
          return voiceState.member!.user;
        });*/
        const watchedUsers = await getWatchedUsers();
        creeperInfo.users = fetchedMembers?.map(member => ({
          username: member.user.username,
          avatarURL: member.user.displayAvatarURL(),
          snowflake: member.user.id,
          watched: watchedUsers.includes(member.user.id)
        })) ?? [];
        console.log(creeperInfo.users);
        const onlineArray = fetchedMembers?.filter(member => member.presence.status === 'online');
        // We now have a collection with all online member objects in the totalOnline variable
        creeperInfo.totalOnline = onlineArray?.size ?? 0;
        socket.emit('message', creeperInfo);
      } catch(error) {
        console.log(error);
      }
    // }
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
      if (message.member?.voice.channel) {
        const connection = await message.member.voice.channel.join();
        dispatcher = connection.play(ytdl(message.content.split(" ")[1], { filter: 'audioonly' }));
        clientSocket.emit('music-start');
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
      await gatherAndSendInfo(clientSocket);
    } else if(newUserChannel == undefined){
      console.log("User left")
      // User leaves a voice channel
      const message = `User ${newState?.member?.user.username} left channel ${oldUserChannel?.name} at ${new Date().toString()}`;
      creeperInfo.messages.push(message);
      /*client.users.fetch('98992981045964800').then((user) => {
        user.send(message);
      });*/
      await gatherAndSendInfo(clientSocket);
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

async function getSession(socket: SocketIO.Socket): Promise<UserInfo | undefined> {
  let sessionID;
  console.log(socket.handshake.headers);
  socket.handshake.headers.cookie.split('; ').forEach((cookie: string) => {
    if (cookie.startsWith('sessionID')) {
      sessionID = decodeURIComponent(cookie.split('=')[1]);
    }
  });
  console.log(`Get session ${sessionID}`)
  if (sessionID) {
    return await sessionMap.getRenewAsync(sessionID);
  }
  return undefined;
}
