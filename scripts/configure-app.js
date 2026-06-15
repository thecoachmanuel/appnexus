import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function configureApp() {
  console.log(chalk.cyan.bold('\nWelcome to the Appnexus Configuration Wizard!\n'));

  const questions = [
    {
      type: 'text',
      name: 'websiteUrl',
      message: 'What is the base URL of your web application?',
      initial: 'https://example.com'
    },
    {
      type: 'text',
      name: 'primaryColor',
      message: 'Enter your Primary Color (Hex):',
      initial: '#22d3ee'
    },
    {
      type: 'text',
      name: 'accentColor',
      message: 'Enter your Accent Color (Hex):',
      initial: '#a855f7'
    },
    {
      type: 'select',
      name: 'navigationStyle',
      message: 'Choose your preferred native navigation style:',
      choices: [
        { title: 'Bottom Navigation Bar (Native)', value: 'bottom-nav' },
        { title: 'None (Full Screen Webview)', value: 'none' }
      ]
    },
    {
      type: 'text',
      name: 'hideSelectors',
      message: 'CSS Selectors to hide in the mobile app (comma-separated):',
      initial: 'header, footer, nav, .cookie-banner'
    }
  ];

  const response = await prompts(questions);

  if (!response.websiteUrl) {
    console.log(chalk.red('Configuration cancelled.'));
    process.exit(1);
  }

  const configPath = path.join(__dirname, '..', 'appnexus.config.json');
  
  response.hideSelectors = response.hideSelectors
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .join(', ');

  fs.writeFileSync(configPath, JSON.stringify(response, null, 2), 'utf8');
  console.log(chalk.green.bold('\nSuccess! Configuration saved to appnexus.config.json\n'));
}

configureApp().catch(console.error);
