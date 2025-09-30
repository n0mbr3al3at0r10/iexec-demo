#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('iexec-demo')
  .description('A TypeScript CLI demo project')
  .version('1.0.0');

program
  .command('greet')
  .description('Ask for your name and greet you')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is your name?',
          validate: (input: string) => {
            if (input.trim().length === 0) {
              return 'Please enter a valid name';
            }
            return true;
          }
        }
      ]);

      console.log(`\nHello, ${answers.name}! 👋`);
      console.log('Welcome to the iexec-demo CLI!');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();