import { Collection, Message } from 'discord.js';
import playCommand from './play';
import pauseCommand from './pause';
import resumeCommand from './resume';
import spotifyCommand from './spotify';
import skipCommand from './skip';
import queueCommand from './queue';
import leaveCommand from './leave';
import shuffleCommand from './shuffle';
import nukeCommand from './nuke';
import popCommand from './pop';

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  execute: (message: Message, messageArgs: string) => void;
}
const commands: Collection<string, Command> = new Collection([
  [playCommand.name, playCommand],
  [spotifyCommand.name, spotifyCommand],
  [pauseCommand.name, pauseCommand],
  [resumeCommand.name, resumeCommand],
  [skipCommand.name, skipCommand],
  [popCommand.name, popCommand],
  [shuffleCommand.name, shuffleCommand],
  [queueCommand.name, queueCommand],
  [nukeCommand.name, nukeCommand],
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
