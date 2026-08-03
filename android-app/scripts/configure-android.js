'use strict';
const fs = require('fs');
const path = require('path');
const manifest = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifest)) throw new Error(`No existe ${manifest}`);
let xml = fs.readFileSync(manifest, 'utf8');
// La edición es deliberadamente offline: quita el permiso de Internet.
xml = xml.replace(/\s*<uses-permission\s+android:name="android\.permission\.INTERNET"\s*\/>\s*/g, '\n');
// El juego está diseñado para una pantalla horizontal.
xml = xml.replace(/<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/, (full, attrs) => {
  if (!/android:screenOrientation=/.test(attrs)) attrs += '\n            android:screenOrientation="sensorLandscape"';
  return `<activity${attrs}>`;
});
// Mantener aceleración de la WebView para Canvas/WebGL.
xml = xml.replace(/<application\b([^>]*)>/, (full, attrs) => {
  if (!/android:hardwareAccelerated=/.test(attrs)) attrs += '\n        android:hardwareAccelerated="true"';
  return `<application${attrs}>`;
});
fs.writeFileSync(manifest, xml);
console.log('Android configurado: offline, horizontal y con aceleración gráfica.');
