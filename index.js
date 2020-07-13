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
  console.log(newState.member.user.username);
});

client.login(process.env.TOKEN);
