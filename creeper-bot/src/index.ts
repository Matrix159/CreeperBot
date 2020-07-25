import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';
import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import { User, CreeperInfo } from './models';

// DiscordJS below
let userIDs: string[] = [];
let clientSocket: socketio.Socket;

let creeperInfo: CreeperInfo = {
  users: [],
  totalOnline: 0
};

const client = new Discord.Client({
  presence: {
    activity: {
      name: "Mike sucks!"
    }
  }
});

client.once('ready', async () => {
  console.log('Ready!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.channel != null) {
    const message = `User ${newState?.member?.user.username} joined channel ${newState.channel.name} at ${new Date().toString()}`
    console.log(message);
    console.log( {
      avatarURL: newState?.member?.user.displayAvatarURL(),
      username: newState?.member?.user.username
    } as User);
   if (newState?.member?.id && !userIDs.includes(newState.member.id)) {
      userIDs.push(newState.member.id);
   }
    if (newState?.member?.id != '98992981045964800') {
      client.users.fetch('98992981045964800').then((user) => {
        user.send(message);
      });
    }
  }
});

client.login(process.env.TOKEN);

// Socket server
const httpServer = http.createServer(express());
const io = socketio(httpServer);

io.on('connection', (socket) => {
  console.log('a user connected');
  clientSocket = socket;
  gatherAndSendInfo(clientSocket);
});
httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});


async function gatherAndSendInfo(socket: socketio.Socket) {
  try { 
    const guild = client.guilds.cache.first()!;
    const fetchedMembers = await guild.members.fetch();
    const membersInVoiceChat = guild.voiceStates.cache.map(voiceState => voiceState.member!.user);
    creeperInfo.users = membersInVoiceChat.map(member => ({
      username: member.username,
      avatarURL: member.displayAvatarURL()
    }));
    console.log(creeperInfo.users);
    const onlineArray = fetchedMembers?.filter(member => member.presence.status === 'online');
    // We now have a collection with all online member objects in the totalOnline variable
    creeperInfo.totalOnline = onlineArray?.size ?? 0;
    socket.emit('message', creeperInfo);
  } catch(error) {
    console.log(error);
  }
}