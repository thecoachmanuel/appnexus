import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const targetDirs = ['src/components', 'src/hooks', 'src/contexts', 'src/app'];
let files = [];
for (const d of targetDirs) {
  files = files.concat(walk(path.join(process.cwd(), d)));
}

for (const file of files) {
  // Skip API routes and layout
  if (file.includes('/api/') || file.endsWith('layout.tsx')) continue;

  let content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
    content = '"use client";\n\n' + content;
    fs.writeFileSync(file, content);
  }
}

console.log('Added "use client" to client components.');
