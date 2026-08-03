'use strict';
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const manifest = path.resolve(appRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const resRoot = path.resolve(appRoot, 'android', 'app', 'src', 'main', 'res');
const capConfig = path.resolve(appRoot, 'capacitor.config.json');
const iconSourceRoot = path.resolve(appRoot, 'resources', 'android-icon', 'res');

if (!fs.existsSync(manifest)) throw new Error(`No existe ${manifest}`);
if (!fs.existsSync(capConfig)) throw new Error(`No existe ${capConfig}`);
if (!fs.existsSync(iconSourceRoot)) throw new Error(`No existen los iconos en ${iconSourceRoot}`);

const cap = JSON.parse(fs.readFileSync(capConfig, 'utf8'));
const appId = String(cap.appId || '').trim();
if (!appId) throw new Error('capacitor.config.json no tiene appId');
const packagePath = appId.split('.').join(path.sep);
const javaDir = path.resolve(appRoot, 'android', 'app', 'src', 'main', 'java', packagePath);
fs.mkdirSync(javaDir, { recursive: true });

let xml = fs.readFileSync(manifest, 'utf8');
// APK offline: no permiso de Internet.
xml = xml.replace(/\s*<uses-permission\s+android:name="android\.permission\.INTERNET"\s*\/?>\s*/g, '\n');
// Evita el modo de compatibilidad/letterbox provocado por resizeableActivity=false.
xml = xml.replace(/\s*android:resizeableActivity="[^"]*"/g, '');
xml = xml.replace(/<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/, (full, attrs) => {
  if (/android:screenOrientation=/.test(attrs)) {
    attrs = attrs.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="sensorLandscape"');
  } else {
    attrs += '\n            android:screenOrientation="sensorLandscape"';
  }
  return `<activity${attrs}>`;
});
// Fuerza el icono real y aceleración gráfica en el manifiesto final generado por Capacitor.
xml = xml.replace(/<application\b([^>]*)>/, (full, attrs) => {
  if (/android:hardwareAccelerated=/.test(attrs)) {
    attrs = attrs.replace(/android:hardwareAccelerated="[^"]*"/, 'android:hardwareAccelerated="true"');
  } else {
    attrs += '\n        android:hardwareAccelerated="true"';
  }
  if (/android:icon=/.test(attrs)) {
    attrs = attrs.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/backrooms_launcher"');
  } else {
    attrs += '\n        android:icon="@mipmap/backrooms_launcher"';
  }
  if (/android:roundIcon=/.test(attrs)) {
    attrs = attrs.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/backrooms_launcher_round"');
  } else {
    attrs += '\n        android:roundIcon="@mipmap/backrooms_launcher_round"';
  }
  return `<application${attrs}>`;
});
fs.writeFileSync(manifest, xml);

// Modo inmersivo compatible con Android moderno y capas OEM.
const mainActivityJava = `package ${appId};

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int LEGACY_IMMERSIVE_FLAGS =
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
        View.SYSTEM_UI_FLAG_FULLSCREEN |
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE;

    private void applyImmersiveMode() {
        final Window window = getWindow();
        final View decor = window.getDecorView();

        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = window.getAttributes();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
            } else {
                params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            }
            window.setAttributes(params);
        }

        decor.setSystemUiVisibility(LEGACY_IMMERSIVE_FLAGS);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decor);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);

        // Algunos fabricantes vuelven a mostrar la navegación al crear la WebView.
        decor.postDelayed(() -> {
            decor.setSystemUiVisibility(LEGACY_IMMERSIVE_FLAGS);
            WindowInsetsControllerCompat delayed = new WindowInsetsControllerCompat(window, decor);
            delayed.hide(WindowInsetsCompat.Type.systemBars());
            delayed.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }, 300);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyImmersiveMode();
    }

    @Override
    public void onPostResume() {
        super.onPostResume();
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
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(iconSourceRoot, resRoot);

console.log('Android configurado: pantalla completa real, sin letterbox del sistema e icono oficial forzado.');
