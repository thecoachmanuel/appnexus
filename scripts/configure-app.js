import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { analyzeWebsite } from './ai-analyzer.js';
import { generateAssets } from './generate-assets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env locally if possible
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  }
} catch (e) {}

async function configureApp() {
  console.log(chalk.cyan.bold('\nWelcome to the AI-Assisted Appnexus Configuration Wizard!\n'));

  let apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const { key } = await prompts({
      type: 'text',
      name: 'key',
      message: 'GEMINI_API_KEY not found in environment. Please enter it here (or press Enter to skip AI features):'
    });
    apiKey = key;
  }

  const { websiteUrl } = await prompts({
    type: 'text',
    name: 'websiteUrl',
    message: 'What is the base URL of your web application?',
    initial: 'https://example.com'
  });

  if (!websiteUrl) {
    console.log(chalk.red('Configuration cancelled.'));
    process.exit(1);
  }

  let aiConfig = { customCSS: '', customJS: '', template: 'Custom', navigationItems: null };
  let defaultPrimary = '#22d3ee';
  let defaultAccent = '#a855f7';

  if (apiKey) {
    console.log(chalk.yellow(`\nAnalyzing ${websiteUrl} with AI to determine the best app template...`));
    try {
      const aiResponse = await analyzeWebsite(websiteUrl, apiKey);
      console.log(chalk.green(`\n✅ AI Classification Complete!`));
      console.log(chalk.white.bold(`Recommended Template: `) + chalk.cyan(aiResponse.recommendedTemplate));
      console.log(chalk.white.bold(`Reasoning: `) + chalk.italic(aiResponse.reasoning));
      
      if (aiResponse.extractedColors) {
        console.log(chalk.white.bold(`Extracted Theme Colors:`));
        console.log(`- Primary: ${chalk.hex(aiResponse.extractedColors.primary)(aiResponse.extractedColors.primary)}`);
        console.log(`- Accent: ${chalk.hex(aiResponse.extractedColors.accent)(aiResponse.extractedColors.accent)}`);
      }

      if (aiResponse.extractedNavigation && aiResponse.extractedNavigation.length > 0) {
        console.log(chalk.white.bold(`Extracted Navigation Items:`));
        aiResponse.extractedNavigation.forEach(nav => {
          console.log(`- ${nav.label} (${nav.url}) [Icon: ${nav.icon}]`);
        });
      }

      const { acceptAi } = await prompts({
        type: 'confirm',
        name: 'acceptAi',
        message: 'Do you want to accept this template and its structural AI injections?',
        initial: true
      });

      if (acceptAi) {
        aiConfig.customCSS = aiResponse.customCSS || '';
        aiConfig.customJS = aiResponse.customJS || '';
        aiConfig.template = aiResponse.recommendedTemplate;
        if (aiResponse.extractedNavigation) {
          aiConfig.navigationItems = aiResponse.extractedNavigation;
        }
        if (aiResponse.extractedColors) {
          defaultPrimary = aiResponse.extractedColors.primary || defaultPrimary;
          defaultAccent = aiResponse.extractedColors.accent || defaultAccent;
        }
      }
    } catch (error) {
      console.log(chalk.red(`\n❌ AI Analysis failed: ${error.message}`));
      console.log(chalk.yellow(`Proceeding with manual configuration.\n`));
    }
  }

  const questions = [
    {
      type: 'text',
      name: 'primaryColor',
      message: 'Enter your Primary Color (Hex):',
      initial: defaultPrimary
    },
    {
      type: 'text',
      name: 'accentColor',
      message: 'Enter your Accent Color (Hex):',
      initial: defaultAccent
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

  const finalConfig = {
    websiteUrl,
    ...response,
    ...aiConfig
  };

  const configPath = path.join(__dirname, '..', 'appnexus.config.json');
  
  if (finalConfig.hideSelectors) {
    finalConfig.hideSelectors = finalConfig.hideSelectors
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .join(', ');
  }

  fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf8');
  console.log(chalk.green.bold(`\nSuccess! Configuration for the '${finalConfig.template}' template saved to appnexus.config.json\n`));

  const { generateIcons } = await prompts({
    type: 'confirm',
    name: 'generateIcons',
    message: 'Would you like to auto-generate native app icons and splash screens from this website?',
    initial: true
  });

  if (generateIcons) {
    await generateAssets(websiteUrl);
  }
}

configureApp().catch(console.error);
