# Publicar desde Termux

## 1. Preparar Termux

```bash
pkg update -y
pkg install -y git gh openssh nodejs-lts openjdk-21 unzip
termux-setup-storage
gh auth login --web
```

## 2. Extraer y mover a la carpeta privada de Termux

```bash
cd ~/storage/downloads
unzip backrooms-noclip-android-offline.zip
mkdir -p ~/projects
rm -rf ~/projects/backrooms-noclip-android-offline
mv backrooms-noclip-android-offline ~/projects/
cd ~/projects/backrooms-noclip-android-offline
```

No trabajes directamente dentro de `/storage/emulated/0/Download`, porque Git puede marcar esa carpeta como propiedad dudosa.

## 3. Configurar nombre e ID Android

```bash
bash tools/configure-project.sh
```

El ID Android es permanente después de publicar la primera APK.

## 4. Crear el repositorio

```bash
GH_USER="$(gh api user --jq '.login')"
GH_ID="$(gh api user --jq '.id')"

git init -b main
git config user.name "$GH_USER"
git config user.email "${GH_ID}+${GH_USER}@users.noreply.github.com"
git add .
git commit -m "feat: iniciar edición Android offline"

gh repo create backrooms-noclip-android-offline \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "Continuación comunitaria no comercial de BackRooms NoClip para Android offline"
```

## 5. Crear la firma permanente

```bash
bash tools/setup-android-signing.sh
```

Guarda copias seguras de `~/backrooms-release.jks` y sus contraseñas. No compartas ni subas la clave al repositorio.

## 6. Publicar la primera beta

```bash
git status
bash tools/release.sh v0.1.0-beta.1
```

Ese comando actualiza automáticamente:

- `CHANGELOG.md`
- `RELEASE_NOTES.md`
- la versión mostrada dentro del juego
- el changelog interno
- la sección de última versión del README
- el tag de Git
- la GitHub Release, mediante Actions

## 7. Ver la compilación

```bash
gh run list --workflow android-release.yml --limit 3
RUN_ID="$(gh run list --workflow android-release.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run watch "$RUN_ID"
```

Abrir la Release:

```bash
gh release view v0.1.0-beta.1 --web
```

## Actualizaciones siguientes

Trabaja normalmente:

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

Cuando quieras publicar una APK nueva:

```bash
bash tools/release.sh v0.1.1-beta.1
```

Usa commits como `feat:`, `fix:` o `chore:` para que el changelog se organice mejor.
