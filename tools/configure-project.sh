#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

read -r -p 'Nombre de la aplicación [BackRooms NoClip Offline]: ' APP_NAME
APP_NAME=${APP_NAME:-BackRooms NoClip Offline}
read -r -p 'ID Android [com.backroomsnoclip.offline]: ' APP_ID
APP_ID=${APP_ID:-com.backroomsnoclip.offline}

case "$APP_ID" in
  *.*.*) ;;
  *) echo 'El ID debe parecerse a com.tunombre.backroomsnoclip'; exit 1 ;;
esac

python - "$APP_NAME" "$APP_ID" <<'PY'
from pathlib import Path
import json, sys
name, appid = sys.argv[1:]
p = Path('android-app/capacitor.config.json')
cfg = json.loads(p.read_text(encoding='utf-8'))
cfg['appName'] = name
cfg['appId'] = appid
p.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Configurado: {name} · {appid}')
PY

echo 'No cambies el ID Android después de publicar la primera APK.'
