import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';
import { User, CreeperInfo } from './models';
import { io, setupHttpServer } from './http';
import socketio from 'socket.io';

// DiscordJS below
let userIDs: string[] = [];
let clientSocket: socketio.Socket;

let creeperInfo: CreeperInfo = {
  users: [],
  messages: [],
  totalOnline: 0
};

const client = new Discord.Client({
  presence: {
    activity: {
      name: "always watching you"
    }
  }
});

// Socket server
setupHttpServer(() => {
  setupDiscord();
  io.on('connection', (socket) => {
    console.log('a user connected');
    clientSocket = socket;
    gatherAndSendInfo(clientSocket);
  });
});

async function gatherAndSendInfo(socket: socketio.Socket) {
  if (socket) {
    try { 
      const guild = client.guilds.cache.first()!;
      const fetchedMembers = await guild.members.fetch();
      const membersInVoiceChat = guild.voiceStates.cache.filter(voiceState => !!voiceState.channel).map(voiceState => {
        return voiceState.member!.user;
      });
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
}

function setupDiscord() {
  client.once('ready', async () => {
    console.log('Ready!');
  });
  
  client.on('voiceStateUpdate', (oldState, newState) => {
    const newUserChannel = newState.channel;
    const oldUserChannel = oldState.channel;
  
    if(oldUserChannel == undefined && newUserChannel != undefined) {
      console.log("User joined");
      // User Joins a voice channel
      const message = `User ${newState?.member?.user.username} joined channel ${newUserChannel.name} at ${new Date().toString()}`;
      creeperInfo.messages.push(message);
      //if (newState?.member?.id != '98992981045964800') {
        /*client.users.fetch('98992981045964800').then((user) => {
          user.send(message);
        });*/
      //}
      gatherAndSendInfo(clientSocket);
    } else if(newUserChannel == undefined){
      console.log("User left")
      // User leaves a voice channel
      const message = `User ${newState?.member?.user.username} left channel ${oldUserChannel?.name} at ${new Date().toString()}`;
      creeperInfo.messages.push(message);
      /*client.users.fetch('98992981045964800').then((user) => {
        user.send(message);
      });*/
      gatherAndSendInfo(clientSocket);
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
  
  client.login(process.env.TOKEN);
}