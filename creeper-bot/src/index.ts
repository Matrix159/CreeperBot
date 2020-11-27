import Dotenv from 'dotenv';
Dotenv.config();
import Discord, { Message } from 'discord.js';
import { DiscordSocket, Guild, QueueObject, UserInfo } from './models';
import { creeperInfo } from './state';
import { io, setupHttpServer } from './http';
import ytdl from 'ytdl-core';
import { watchUser, unwatchUser, getUsersWatching, getWatchedUsers} from './database';
import socketioJwt from 'socketio-jwt';
import youtube from 'scrape-youtube';
import { getSpotifyAccessCode, getSpotifyTracksByPlaylist } from './spotify';

let client: Discord.Client;

/** User snowflake -> UserInfo */
const socketMap: Map<string, UserInfo> = new Map();
/** Guild ID -> Discord.StreamDispatcher */
type MusicControllerMap = Map<string, {
  dispatcher?: Discord.StreamDispatcher;
  voiceConnection?: Discord.VoiceConnection;
  queue?: QueueObject[];
  shuffleMode: boolean;
}>;
const musicControllerMap: MusicControllerMap = new Map();

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
    try {
      if (message.content.startsWith('$play') && message.member?.voice.channel && message.guild?.id) {
        const song = message.content.split(" ").slice(1).join(" ");
        const musicController = musicControllerMap.get(message.guild.id);
        if (musicController) {
          musicController.voiceConnection = await message.member.voice.channel.join();
        } else {
          musicControllerMap.set(message.guild.id, { voiceConnection: await message.member.voice.channel.join(), shuffleMode: false });
        }
        await playSong(musicControllerMap, message, song);
        socketMap.get(message.member.user.id)?.socket.emit('music-start', message.guild.id);

        /*let timeout: Timeout|undefined;
        dispatcher.on('speaking', speaking =>  {
          if (!speaking) {
            console.log('Speaking false');
            timeout = setTimeout(() => {
              connection.disconnect();
              musicControllerMap.delete(message.guild!.id);
              console.log('Left voice channel');
            }, 5* 60 * 1000)
          } else {
            if (timeout) {
              console.log('Clearing timeout');
              clearTimeout(timeout);
              timeout = undefined;
            }
          }
        });*/
      }
      if (message.content.startsWith('$next')) {
        await playNextSong(musicControllerMap, message);
      }

      if (message.content.startsWith('$pause')) {
        pauseSong(musicControllerMap, message);
      }

      if (message.content.startsWith('$resume')) {
        resumeSong(musicControllerMap, message);
      }

      if (message.content.startsWith('$spotify') && message.member?.voice.channel && message.guild?.id) {
        const messageArgArray = message.content.split(' ');
        if (messageArgArray.length > 2) {
          message.channel.send(`Please enter the command as \`$spotify [spotifyPlaylistId]\``);
        }
        const musicController = musicControllerMap.get(message.guild.id);
        if (musicController) {
          musicController.voiceConnection = await message.member.voice.channel.join();
        } else {
          musicControllerMap.set(message.guild.id, { voiceConnection: await message.member.voice.channel.join(), shuffleMode: false });
        }
        const playlistId = messageArgArray.slice(1).join(" ");
        const spotifyAccessCode = await getSpotifyAccessCode();
        console.log(spotifyAccessCode);
        const songList = await getSpotifyTracksByPlaylist(playlistId, spotifyAccessCode);
        console.log(songList);

        for (let songName of songList) {
          await playSong(musicControllerMap, message, songName);
        }
      }

      if ((message.content.startsWith('$queue') || message.content.startsWith('$q')) && message.guild?.id) {
        const queue = musicControllerMap.get(message.guild.id)?.queue ?? [];
        const queueMessage = queue.map((queueItem, index) => `${index + 1}: ${queueItem.songName} ${queueItem.songName}`).join('\n').toString().slice(0, 2000);
        if (queueMessage) {
          message.channel.send(queueMessage);
        } else {
          message.channel.send('There is no music currently queued.');
        }
      }

      if (message.content.startsWith('$shuffle') && message.guild?.id) {
        toggleShuffleMode(musicControllerMap, message);
      }

      if (message.content.startsWith('$nuke') && message.guild?.id) {
        const controller = musicControllerMap.get(message.guild.id);
        if (controller?.queue && controller.queue?.length) {
          controller.queue = [];
          message.channel.send('Nuking this muthafuckin\' queue');
        }
      }
      /* EXPERIMENTAL if (message.content.startsWith('$listen')) {
        if (message.member?.voice.channel && message.guild?.id) {
          try {
            console.log('Listening');
            const connection = await message.member.voice.channel.join();
            const audio = connection.receiver.createStream('userID', { mode: 'pcm' });
            audio.
            connection.play(audio);
          } catch(error) {
            console.error(error);
          }
        }
      } */
    } catch (error) {
      console.error(error);
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
    } else if(newUserChannel == undefined){
      console.log("User left")
      // User leaves a voice channel
      const message = `User ${newState?.member?.user.username} left channel ${oldUserChannel?.name} at ${new Date().toString()}`;
      creeperInfo.messages.push(message);
    }
  });

  client.on('debug', (event) => {
   //console.log(event);
  });
  await client.login(process.env.TOKEN);
  return client;
}

async function playSong(musicControllerMap: MusicControllerMap, message: Message, songName: string) {

  if (!message.guild?.id) return;

  let controller = musicControllerMap.get(message.guild.id);

  if (controller && controller.voiceConnection) {
    try {
      // If the queue exists we will just add it instead
      if (controller?.queue) {
        await queueSong(musicControllerMap, message, songName);
        return;
      }

      const results = await youtube.search(songName) as any;
      const videoResult = results.videos[0];
      if (!videoResult) {
        console.log(`Couldn't find ${songName} on youtube`);
        return;
      }
      const videoURL = videoResult.link;
      const videoTitle = videoResult.title;
      console.log(`Playing youtube video: URL (${videoURL}) Title (${videoTitle})`);

      const dispatcher = controller.voiceConnection.play(ytdl(videoURL), { highWaterMark: 200, volume: 0.75 });
      controller.dispatcher = dispatcher;
      controller.queue = [];
      dispatcher.on('finish', async function () {
        console.log(`Song ${videoTitle} finished`);
        await playNextSong(musicControllerMap, message);
      });
      await message.channel.send(`Playing: ${videoTitle}`);
    } catch (error) {
      console.log(error);
    }
  }
}

async function queueSong(musicControllerMap: MusicControllerMap, message: Message, songName: string) {
  if (!message.guild?.id) return;

  const controller = musicControllerMap.get(message.guild.id);
  if (controller)
  {
    const results = await youtube.search(songName) as any;
    const videoResult = results.videos[0];

    if (!videoResult) {
      console.log(`Couldn't find ${songName} on youtube`);
      return;
    }
    const videoURL = videoResult.link;
    const videoTitle = videoResult.title;

    console.log(`Queueing youtube video: URL (${videoURL}) Title (${videoTitle})`);

    controller.queue = controller.queue ?? [];
    controller.queue.push({songName: videoTitle, url: videoURL});
    // await message.channel.send(`Queueing up: ${videoResult.title}`);
  }
}

async function playNextSong(musicControllerMap: MusicControllerMap, message: Message) {
  if (!message.guild?.id) return;

  const controller = musicControllerMap.get(message.guild.id);

  if (controller && controller.voiceConnection) {
    const queue = musicControllerMap.get(message.guild!.id)?.queue ?? [];
    let songObject: QueueObject | undefined;
    if (controller.shuffleMode && queue.length) {
      const index = Math.floor(Math.random() * queue.length);
      songObject = queue.splice(index, 1)[0];
    } else {
      songObject = queue.shift(); //shift the queue
    }

    if (songObject) {
      console.log(`Searching for song ${songObject.songName}`);

      const dispatcher = controller.voiceConnection.play(await ytdl(songObject.url), { highWaterMark: 200, volume: 0.75 });
      dispatcher.on('finish', async function () {
        console.log(`Song ${songObject!.songName} finished`);
        await playNextSong(musicControllerMap, message);
      });
      controller.dispatcher = dispatcher;
      controller.queue = queue;
      await message.channel.send(`Playing next in queue: ${songObject.songName}`);
    } else {
      // Nothing in queue, clear out dispatcher and queue array
      controller.dispatcher = undefined;
      controller.queue = undefined;
      await message.channel.send(`There is nothing in the queue.`);
    }
  }
}

function pauseSong(musicControllerMap: MusicControllerMap, message: Message) {
  const controller = musicControllerMap.get(message.guild?.id ?? '');
  if (controller?.dispatcher) {
    console.log(`Pausing song at guild: ${message.guild?.id}`);
    controller.dispatcher.pause();
  }
}

function resumeSong(musicControllerMap: MusicControllerMap, message: Message) {
  const controller = musicControllerMap.get(message.guild?.id ?? '');
  if (controller?.dispatcher) {
    console.log(`Resuming song at guild: ${message.guild?.id}`);
    controller.dispatcher.resume();
  }
}

function toggleShuffleMode(musicControllerMap: MusicControllerMap, message: Message) {
  if (!message.guild?.id) return;

  const controller = musicControllerMap.get(message.guild.id);
  if (controller) {
    controller.shuffleMode = !controller.shuffleMode;
    message.channel?.send(`Turning shuffle mode ${controller.shuffleMode ? 'on' : 'off'}`);
  }
}
