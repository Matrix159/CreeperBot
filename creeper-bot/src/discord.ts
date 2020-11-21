import ytdl from 'ytdl-core';
import { getUsersWatching } from './database';
import Discord from 'discord.js';
import SocketIO from 'socket.io';
import { creeperInfo } from './state';

const state = {};

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
  }
});

async function playSong(message: Discord.Message, clientSocket: SocketIO.Socket): Promise<Discord.StreamDispatcher|undefined> {
  if (message.member?.voice.channel) {
    const connection = await message.member.voice.channel.join();
    const dispatcher = connection.play(ytdl(message.content.split(" ")[1], { filter: 'audioonly' }));
    clientSocket.emit('music-start');

    return dispatcher;
  }
}

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
 });

/**
 * Login to discord
 * @return client The Discord.Client instance
 */
export async function discordLogin(): Promise<Discord.Client> {
  await client.login(process.env.TOKEN);

  return client;
}
