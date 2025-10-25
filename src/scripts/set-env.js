require('dotenv').config();
const fs = require('fs');
const path = require('path');

const envFile = path.resolve(__dirname, '../src/environments/environment.template.ts');
const targetFile = path.resolve(__dirname, '../src/environments/environment.ts');

const vercelUrl = process.env.VITE_VERCEL_URL || '';

let content = fs.readFileSync(envFile, 'utf-8');
content = content.replace('${VITE_VERCEL_URL}', vercelUrl);

fs.writeFileSync(targetFile, content);
console.log(`✅ environment.ts generado con VITE_VERCEL_URL=${vercelUrl}`);
