const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let newContent = content
    .replace(/bg-\[#151722\]/g, 'bg-[var(--card-light)]')
    .replace(/bg-\[#1b1d24\]/g, 'bg-[var(--card-lighter)]')
    .replace(/hover:bg-\[#222533\]/g, 'hover:bg-[var(--card-hover)]')
    .replace(/text-zinc-200/g, 'text-[var(--ink)]')
    .replace(/bg-black\/20/g, 'bg-[var(--card-lighter)]');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
