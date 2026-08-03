'use strict';
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const androidRoot = path.join(appRoot, 'android');
const manifest = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
const resRoot = path.join(androidRoot, 'app', 'src', 'main', 'res');
const baseStyles = path.join(resRoot, 'values', 'styles.xml');
const capConfig = path.join(appRoot, 'capacitor.config.json');
const iconSourceRoot = path.join(appRoot, 'resources', 'android-icon', 'res');

for (const required of [manifest, baseStyles, capConfig, iconSourceRoot]) {
  if (!fs.existsSync(required)) throw new Error(`No existe ${required}`);
}

const cap = JSON.parse(fs.readFileSync(capConfig, 'utf8'));
const appId = String(cap.appId || '').trim();
if (!appId) throw new Error('capacitor.config.json no tiene appId');
const packagePath = appId.split('.').join(path.sep);
const javaDir = path.join(androidRoot, 'app', 'src', 'main', 'java', packagePath);
fs.mkdirSync(javaDir, { recursive: true });

function upsertAttribute(attrs, name, value) {
  const re = new RegExp(`\\s*${name}="[^"]*"`, 'g');
  attrs = attrs.replace(re, '');
  return `${attrs}\n            ${name}="${value}"`;
}

let xml = fs.readFileSync(manifest, 'utf8');
// APK offline: sin permiso de Internet.
xml = xml.replace(/\s*<uses-permission\s+android:name="android\.permission\.INTERNET"\s*\/?>\s*/g, '\n');
// Quita límites de proporción antiguos que pueden producir letterbox.
xml = xml.replace(/\s*android:maxAspectRatio="[^"]*"/g, '');
xml = xml.replace(/\s*<meta-data\s+android:name="android\.max_aspect"[\s\S]*?\/?>\s*/g, '\n');

xml = xml.replace(/<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/, (full, attrs) => {
  attrs = attrs.replace(/\/\s*$/, '');
  attrs = upsertAttribute(attrs, 'android:screenOrientation', 'sensorLandscape');
  attrs = upsertAttribute(attrs, 'android:resizeableActivity', 'true');
  attrs = upsertAttribute(attrs, 'android:theme', '@style/AppTheme.NoActionBar');
  return `<activity${attrs}>`;
});

xml = xml.replace(/<application\b([^>]*)>/, (full, attrs) => {
  const set = (name, value) => {
    const re = new RegExp(`\\s*${name}="[^"]*"`, 'g');
    attrs = attrs.replace(re, '');
    attrs += `\n        ${name}="${value}"`;
  };
  set('android:hardwareAccelerated', 'true');
  set('android:icon', '@mipmap/backrooms_launcher');
  set('android:roundIcon', '@mipmap/backrooms_launcher_round');
  return `<application${attrs}>`;
});
fs.writeFileSync(manifest, xml);

const COMMON_STYLE_ITEMS = {
  'android:windowFullscreen': 'true',
  'android:windowNoTitle': 'true',
  'android:windowActionModeOverlay': 'true',
  'android:windowDrawsSystemBarBackgrounds': 'true',
  'android:statusBarColor': '@android:color/transparent',
  'android:navigationBarColor': '@android:color/transparent',
  'android:windowDisablePreview': 'true',
};

function setStyleItems(xmlText, items) {
  return xmlText.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/g, (full, attrs, body) => {
    if (!/\bname="AppTheme(?:\.|\")/.test(attrs)) return full;
    for (const [name, value] of Object.entries(items)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      body = body.replace(new RegExp(`\\s*<item\\s+name="${escaped}">[\\s\\S]*?<\\/item>`, 'g'), '');
      body += `\n        <item name="${name}">${value}</item>`;
    }
    return `<style${attrs}>${body}\n    </style>`;
  });
}

const originalStyles = fs.readFileSync(baseStyles, 'utf8');
const commonStyles = setStyleItems(originalStyles, COMMON_STYLE_ITEMS);
fs.writeFileSync(baseStyles, commonStyles);

function writeQualifiedStyles(qualifier, extraItems) {
  const dir = path.join(resRoot, qualifier);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'styles.xml'), setStyleItems(commonStyles, extraItems));
}
writeQualifiedStyles('values-v28', {
  'android:windowLayoutInDisplayCutoutMode': 'shortEdges',
});
writeQualifiedStyles('values-v29', {
  'android:windowLayoutInDisplayCutoutMode': 'shortEdges',
  'android:enforceNavigationBarContrast': 'false',
  'android:enforceStatusBarContrast': 'false',
});
writeQualifiedStyles('values-v30', {
  'android:windowLayoutInDisplayCutoutMode': 'always',
  'android:enforceNavigationBarContrast': 'false',
  'android:enforceStatusBarContrast': 'false',
});

const mainActivityJava = `package ${appId};

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int IMMERSIVE_FLAGS =
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
        View.SYSTEM_UI_FLAG_FULLSCREEN |
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE;

    private void prepareWindowBeforeContent() {
        final Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = window.getAttributes();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
            } else {
                params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            }
            window.setAttributes(params);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.setNavigationBarDividerColor(Color.TRANSPARENT);
        }
    }

    private void hideSystemBarsNow() {
        final Window window = getWindow();
        final View decor = window.getDecorView();
        decor.setFitsSystemWindows(false);
        decor.setPadding(0, 0, 0, 0);
        decor.setSystemUiVisibility(IMMERSIVE_FLAGS);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    private void configureWebViewEdgeToEdge() {
        if (bridge == null || bridge.getWebView() == null) return;
        WebView webView = bridge.getWebView();
        webView.setFitsSystemWindows(false);
        webView.setPadding(0, 0, 0, 0);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(Color.BLACK);
        webView.setSystemUiVisibility(IMMERSIVE_FLAGS);
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> WindowInsetsCompat.CONSUMED);
        ViewCompat.requestApplyInsets(webView);
    }

    private void applyImmersiveMode() {
        prepareWindowBeforeContent();
        hideSystemBarsNow();
        configureWebViewEdgeToEdge();

        final View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            view.post(this::hideSystemBarsNow);
            return WindowInsetsCompat.CONSUMED;
        });
        decor.setOnSystemUiVisibilityChangeListener(visibility ->
            decor.postDelayed(this::hideSystemBarsNow, 80)
        );
        ViewCompat.requestApplyInsets(decor);

        decor.post(this::hideSystemBarsNow);
        decor.postDelayed(this::applyImmersivePass, 120);
        decor.postDelayed(this::applyImmersivePass, 500);
        decor.postDelayed(this::applyImmersivePass, 1500);
    }

    private void applyImmersivePass() {
        hideSystemBarsNow();
        configureWebViewEdgeToEdge();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        prepareWindowBeforeContent();
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

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        getWindow().getDecorView().post(this::applyImmersiveMode);
    }
}
`;
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), mainActivityJava, 'utf8');
const oldKt = path.join(javaDir, 'MainActivity.kt');
if (fs.existsSync(oldKt)) fs.rmSync(oldKt, { force: true });

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const source = path.join(src, entry.name);
    const target = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(source, target);
    else fs.copyFileSync(source, target);
  }
}
copyDir(iconSourceRoot, resRoot);

console.log('Android configurado: WebView edge-to-edge, cutout completo, barras consumidas y modo inmersivo persistente.');
