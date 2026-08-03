#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
KEYSTORE="${1:-$HOME/backrooms-release.jks}"
ALIAS="${2:-backrooms}"
REPO="$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"
[ -n "$REPO" ] || { echo 'No se pudo determinar el repositorio remoto.'; exit 1; }
command -v keytool >/dev/null || { echo 'Instala Java: pkg install openjdk-21'; exit 1; }
command -v gh >/dev/null || { echo 'Instala GitHub CLI: pkg install gh'; exit 1; }

if [ ! -f "$KEYSTORE" ]; then
  echo 'Crea una contraseña fuerte y guárdala fuera del teléfono.'
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$ALIAS" \
    -keyalg RSA -keysize 4096 -validity 10000 \
    -dname "CN=BackRooms NoClip Offline, OU=Community, O=BackRooms NoClip, L=Unknown, ST=Unknown, C=BR"
fi

read -r -s -p 'Contraseña del keystore: ' STORE_PASS; echo
read -r -s -p 'Contraseña de la clave (normalmente la misma): ' KEY_PASS; echo
base64 "$KEYSTORE" | tr -d '\n' | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO"
gh secret set ANDROID_KEY_ALIAS --repo "$REPO" --body "$ALIAS"
printf '%s' "$STORE_PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$REPO"
printf '%s' "$KEY_PASS" | gh secret set ANDROID_KEY_PASSWORD --repo "$REPO"

echo "Firma configurada para $REPO. Guarda una copia segura de: $KEYSTORE"
