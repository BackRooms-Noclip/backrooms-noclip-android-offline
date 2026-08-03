'use strict';
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const manifest = path.resolve(appRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const resRoot = path.resolve(appRoot, 'android', 'app', 'src', 'main', 'res');
const capConfig = path.resolve(appRoot, 'capacitor.config.json');
const iconSourceRoot = path.resolve(appRoot, 'resources', 'icons');

if (!fs.existsSync(manifest)) throw new Error(`No existe ${manifest}`);
if (!fs.existsSync(capConfig)) throw new Error(`No existe ${capConfig}`);

const cap = JSON.parse(fs.readFileSync(capConfig, 'utf8'));
const appId = String(cap.appId || '').trim();
if (!appId) throw new Error('capacitor.config.json no tiene appId');
const packagePath = appId.split('.').join(path.sep);
const javaDir = path.resolve(appRoot, 'android', 'app', 'src', 'main', 'java', packagePath);
fs.mkdirSync(javaDir, { recursive: true });

let xml = fs.readFileSync(manifest, 'utf8');
// Edición deliberadamente offline: sin permiso de Internet.
xml = xml.replace(/\s*<uses-permission\s+android:name="android\.permission\.INTERNET"\s*\/?>\s*/g, '\n');
// Horizontal siempre.
xml = xml.replace(/<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/, (full, attrs) => {
  if (!/android:screenOrientation=/.test(attrs)) attrs += '\n            android:screenOrientation="sensorLandscape"';
  if (!/android:resizeableActivity=/.test(attrs)) attrs += '\n            android:resizeableActivity="false"';
  return `<activity${attrs}>`;
});
// Aceleración y tema oscuro base.
xml = xml.replace(/<application\b([^>]*)>/, (full, attrs) => {
  if (!/android:hardwareAccelerated=/.test(attrs)) attrs += '\n        android:hardwareAccelerated="true"';
  return `<application${attrs}>`;
});
fs.writeFileSync(manifest, xml);

const mainActivityJava = `package ${appId};

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void applyImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyImmersiveMode();
    }

    @Override
    protected void onResume() {
        super.onResume();
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveMode();
    }
}
`;
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), mainActivityJava, 'utf8');
const oldKt = path.join(javaDir, 'MainActivity.kt');
if (fs.existsSync(oldKt)) fs.rmSync(oldKt, { force: true });

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(iconSourceRoot, resRoot);

console.log('Android configurado: offline, horizontal, inmersivo a pantalla completa e icono actualizado.');
