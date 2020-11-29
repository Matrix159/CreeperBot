import { Message } from 'discord.js';
import playCommand from './play';
import spotifyCommand from './spotify';
import skipCommand from './skip';
import leaveCommand from './leave';

export interface Command {
  name: string;
  description: string;
  execute: (message: Message, messageArgs: string) => void;
}
const commands: Map<string, Command> = new Map([
  [playCommand.name, playCommand],
  [spotifyCommand.name, spotifyCommand],
  [skipCommand.name, skipCommand],
  [leaveCommand.name, leaveCommand],
]);

commands.set('help', {
  name: 'help',
  description: 'A guide to the commands available.',
  execute: (message, messageArgs) => {
    let messageContent = '';
    for (let command of commands.values()) {
      if (command.name === 'help') continue;
      messageContent += `${process.env.COMMAND_PREFIX}${command.name} - ${command.description}\n`;
    }
    message.channel?.send(messageContent);
  }
});
export { commands };
