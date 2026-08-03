#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
VERSION="${1:?Uso: bash tools/release.sh v0.1.0-beta.1}"

if [ -n "$(git status --porcelain)" ]; then
  echo 'Hay cambios sin commit. Haz commit antes de publicar la versión.'
  exit 1
fi

git fetch --tags origin
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "La versión $VERSION ya existe. Usa un número nuevo."
  exit 1
fi

python tools/release.py "$VERSION"
node --check game/js/main.js
node --check game/js/ui/changelog.js

git add README.md CHANGELOG.md RELEASE_NOTES.md game/js/main.js game/js/ui/changelog.js android-app/package.json
git commit -m "chore(release): $VERSION"
git push origin main
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"

echo "Versión $VERSION enviada. GitHub Actions construirá, firmará y publicará la APK."
