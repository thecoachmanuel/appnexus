import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateAssets(websiteUrl) {
  console.log(chalk.yellow(`\nFetching assets from ${websiteUrl}...`));
  try {
    const response = await fetch(websiteUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    let iconUrl = '';

    // Check high priority tags first
    const ogImage = $('meta[property="og:image"]').attr('content');
    const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href');
    const shortcutIcon = $('link[rel="shortcut icon"]').attr('href');
    const icon = $('link[rel="icon"]').attr('href');

    // Prefer highest res normally
    if (appleTouchIcon) iconUrl = appleTouchIcon;
    else if (ogImage) iconUrl = ogImage;
    else if (shortcutIcon) iconUrl = shortcutIcon;
    else if (icon) iconUrl = icon;

    if (!iconUrl) {
      console.log(chalk.red('Could not find any suitable icon on the website.'));
      return false;
    }

    // Handle relative URLs
    if (iconUrl.startsWith('/')) {
      const urlObj = new URL(websiteUrl);
      iconUrl = `${urlObj.origin}${iconUrl}`;
    } else if (!iconUrl.startsWith('http')) {
      iconUrl = `${websiteUrl}/${iconUrl}`;
    }

    console.log(chalk.cyan(`Found icon: ${iconUrl}`));
    const imgResponse = await fetch(iconUrl);
    const buffer = await imgResponse.arrayBuffer();

    const assetsDir = path.join(__dirname, '..', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // capacitor-assets expects icon.png and splash.png
    // if the downloaded image is not PNG, capacitor-assets might still handle it if we rename it, but it's safer to just save as .png and let it try.
    fs.writeFileSync(path.join(assetsDir, 'icon.png'), Buffer.from(buffer));
    fs.writeFileSync(path.join(assetsDir, 'splash.png'), Buffer.from(buffer));
    
    console.log(chalk.yellow('Generating native app icons and splash screens (this may take a moment)...'));
    // run @capacitor/assets
    execSync('npx @capacitor/assets generate --iconBackgroundColor #0f172a --splashBackgroundColor #0f172a --splashBackgroundColorDark #0f172a', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    console.log(chalk.green('✅ Native assets generated successfully!'));
    return true;

  } catch (err) {
    console.log(chalk.red(`Error generating assets: ${err.message}`));
    return false;
  }
}
