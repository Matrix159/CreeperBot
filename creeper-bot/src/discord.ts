import { getUsersWatching } from './database';
import Discord, { Message } from 'discord.js';
import { creeperInfo, MusicControllerMap } from './state';
import { commands } from './commands';
import youtube from 'scrape-youtube';
import ytdl from "ytdl-core";
import { QueueObject } from './models';

const client = new Discord.Client({
  presence: {
    activity: {
      type: 'PLAYING',
      name: 'Butter Passer'
    }
  }
});

const clientReady = new Promise((resolve) => {
  client.once('ready', () => {
    console.log('Ready!');
    resolve();
  });
});


client.on('message', async message => {
  try {
    if (!message.content.startsWith(process.env.COMMAND_PREFIX!) || message.author.bot) return;
    const args = message.content.slice(process.env.COMMAND_PREFIX!.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase() ?? '';
    const command = commands.get(commandName) ?? commands.find(cmd => !!cmd.aliases?.includes(commandName));
    command?.execute(message, args.join(' '));
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

/**
 * Login to discord
 * @return client The Discord.Client instance
 */
export async function discordLogin(): Promise<Discord.Client> {
  await client.login(process.env.TOKEN);
  await clientReady;

  return client;
}

export async function playSong(musicControllerMap: MusicControllerMap, message: Message, songName: string, logQueueMessage: boolean = true) {

  if (!message.guild?.id) return;

  let controller = musicControllerMap.get(message.guild.id);

  if (controller && controller.voiceConnection) {
    try {
      // If the queue exists we will just add it instead
      if (controller?.queue) {
        await queueSong(musicControllerMap, message, songName, logQueueMessage);
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
      await message.channel.send(`Playing: ${videoTitle} ${videoURL}`);
    } catch (error) {
      console.log(error);
    }
  }
}

async function queueSong(musicControllerMap: MusicControllerMap, message: Message, songName: string, logQueueMessage: boolean) {
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

    console.log(`Queueing youtube video: ${videoTitle} ${videoURL}`);

    controller.queue = controller.queue ?? [];
    controller.queue.push({songName: videoTitle, url: videoURL});
    if (logQueueMessage) {
      await message.channel.send(`Queueing up: ${videoTitle} ${videoURL}`);
    }
  }
}

export async function playNextSong(musicControllerMap: MusicControllerMap, message: Message, ignoreShuffle: boolean = false) {
  if (!message.guild?.id) return;

  const controller = musicControllerMap.get(message.guild.id);

  if (controller && controller.voiceConnection) {
    const queue = musicControllerMap.get(message.guild!.id)?.queue ?? [];
    let songObject: QueueObject | undefined;
    if (!ignoreShuffle && controller.shuffleMode && queue.length) {
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
      await message.channel.send(`Playing next in queue: ${songObject.songName} ${songObject.url}`);
    } else {
      // Nothing in queue, clear out dispatcher and queue array
      controller.dispatcher = undefined;
      controller.queue = undefined;
      await message.channel.send(`There is nothing in the queue.`);
    }
  }
}

export function pauseSong(musicControllerMap: MusicControllerMap, message: Message) {
  const controller = musicControllerMap.get(message.guild?.id ?? '');
  if (controller?.dispatcher) {
    console.log(`Pausing song at guild: ${message.guild?.id}`);
    controller.dispatcher.pause();
  }
}

export function resumeSong(musicControllerMap: MusicControllerMap, message: Message) {
  const controller = musicControllerMap.get(message.guild?.id ?? '');
  if (controller?.dispatcher) {
    console.log(`Resuming song at guild: ${message.guild?.id}`);
    controller.dispatcher.resume();
  }
}

export function toggleShuffleMode(musicControllerMap: MusicControllerMap, message: Message) {
  if (!message.guild?.id) return;

  const controller = musicControllerMap.get(message.guild.id);
  if (controller) {
    controller.shuffleMode = !controller.shuffleMode;
    message.channel?.send(`Turning shuffle mode ${controller.shuffleMode ? 'on' : 'off'}`);
  }
}
