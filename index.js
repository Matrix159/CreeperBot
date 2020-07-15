import Dotenv from 'dotenv';
Dotenv.config();
import Discord from 'discord.js';

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
    const message = `User ${newState.member.user.username} joined channel ${newState.channel.name} at ${new Date().toString()}`
    console.log(message);
    if (newState.member.id != '98992981045964800') {
      client.users.fetch('98992981045964800').then((user) => {
        user.send(message);
      });
    }
  }
});

client.login(process.env.TOKEN);
