import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';
import express from 'express';
import http from 'http';
import socketio from 'socket.io';

// DiscordJS below
let userIDs: string[] = [];

const client = new Discord.Client({
  presence: {
    activity: {
      name: "Mike sucks!"
    }
  }
});

client.once('ready', () => {
  console.log('Ready!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.channel != null) {
    const message = `User ${newState?.member?.user.username} joined channel ${newState.channel.name} at ${new Date().toString()}`
    console.log(message);
   if (newState?.member?.id && !userIDs.includes(newState.member.id)) {
      userIDs.push(newState.member.id)
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
  socket.emit('chat message', userIDs);
});
httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});
