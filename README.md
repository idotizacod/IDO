# IDOcash

Finanzas del hogar con estética **Idotiza** (papel con tinta sobre fondo negro,
letra Special Elite, LED de estudio rojo).

> ido = abstraerse · tiza = perfecto

## Instalar la app (APK Android)

La versión actual se descarga desde GitHub Releases:

- [Descargar APK](https://github.com/idotizacod/IDOcash/releases) (botón **IDOcash-3.1-release.apk**)
- Cada nueva versión se publica ahí como un asset de su Release.

El APK está firmado con la misma keystore de siempre, por lo que las actualizaciones
se instalan sobre la versión anterior sin desinstalar.

## Desarrollo web

```bash
npm install
npm run dev        # servidor local con recarga en caliente
npm run build      # build de producción en dist/
```

## Build Android (APK)

```bash
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleRelease   # genera app/build/libs o outputs/apk
```

Requisitos: JDK 21, Android SDK (ruta en `android/local.properties`).

## Stack

- React 19 + Vite
- Tailwind CSS 3
- Capacitor 8 (Android)
- Almacenamiento local (localStorage) — sin backend

## Repositorio

- Rama principal: `main`
- Las versiones usan tags (`v3.0`, ...) con su Release y APK adjunto.