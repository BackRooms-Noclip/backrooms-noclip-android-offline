'use strict';
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const src = path.join(repoRoot, 'game');
const dest = path.join(appRoot, 'www');
if (!fs.existsSync(src)) throw new Error(`No existe ${src}`);
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Juego offline copiado a ${dest}`);
