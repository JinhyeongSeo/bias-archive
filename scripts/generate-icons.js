// Simple script to generate PWA icons
// Run with: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG heart icon
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <path d="M256 448l-30.164-27.211C118.718 322.442 48 258.61 48 179.095 48 114.221 97.918 64 162.4 64c36.399 0 70.717 16.742 93.6 43.947C278.882 80.742 313.199 64 349.6 64 414.082 64 464 114.221 464 179.095c0 79.516-70.719 143.348-177.836 241.694L256 448z" fill="#ffffff"/>
</svg>
`;

// Create a simple PNG using canvas (requires canvas package) or use placeholder
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save SVG for reference
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon.trim());

console.log('SVG icon created at public/icons/icon.svg');
console.log('');
console.log('To create PNG icons, you can:');
console.log('1. Use an online converter like https://svgtopng.com/');
console.log('2. Or use ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png');
console.log('3. Or use sharp: npx sharp-cli icon.svg -o icon-192x192.png resize 192');
