# BACKROOMS — NoClip Android Offline

Continuación comunitaria e independiente de **BACKROOMS — No-Clip**, adaptada como aplicación exclusiva para Android.

<!-- latest-release:start -->
**Última versión preparada:** `v0.1.0-dev`
<!-- latest-release:end -->

## Última actualización

<!-- latest-summary:start -->
- Pendiente de publicar una actualización nueva.
<!-- latest-summary:end -->

## Características

- APK completamente jugable sin conexión.
- Modo inmersivo Android para ocultar barras del sistema y aprovechar la pantalla completa.
- Icono adaptado al estilo visual del juego.
- Un jugador; no incluye servidor, cuentas online ni multijugador.
- Perfiles, partidas, ajustes y Códice guardados localmente en el dispositivo.
- Compilación, firma y publicación de la APK mediante GitHub Actions.
- `tools/release.sh` actualiza versión, `CHANGELOG.md`, changelog interno, README, tag y Release.

## Compilar y publicar

Consulta [`TERMUX.md`](TERMUX.md). El flujo resumido es:

```bash
bash tools/setup-android-signing.sh
bash tools/release.sh v0.1.0-beta.1
```

La GitHub Action construirá una APK firmada y la adjuntará a la Release correspondiente.

## Desarrollo

El juego está en `game/`. Capacitor copia esa carpeta dentro del proyecto Android durante la compilación.

Pruebas principales:

```bash
node pipeline/parse.test.js
node game/js/systems/game.test.js
node game/js/systems/rules.test.js
node game/js/sim/sala.test.js
node pipeline/level0-audit.js
```

## Licencias y atribución

- Código y juego original: © 2026 MeltStudio, bajo [PolyForm Noncommercial 1.0.0](LICENSE.md).
- Esta continuación debe permanecer **no comercial**, salvo autorización adicional del titular.
- El lore derivado de Backrooms Wiki conserva las URL de sus fuentes y está sujeto a CC BY-SA 3.0.
- Consulta [`NOTICE.md`](NOTICE.md).
