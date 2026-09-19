# Branding Android / PWA — Janen_Car

Cette version remplace l'ancienne icône par le logo **JaneneCar** fourni par l'utilisateur.

## Icônes remplacées
- `public/icon-192.png`
- `public/icon-512.png`
- `public/icon-maskable-192.png`
- `public/icon-maskable-512.png`
- `public/apple-touch-icon.png`
- `public/favicon.*`
- `android_icon_resources/mipmap-*/ic_launcher.png`
- `android_icon_resources/mipmap-*/ic_launcher_round.png`
- `android_icon_resources/mipmap-*/ic_launcher_foreground.png`
- `android_icon_resources/mipmap-anydpi-v26/ic_launcher.xml`
- `android_icon_resources/mipmap-anydpi-v26/ic_launcher_round.xml`

## Pour Android Studio
Après `npx cap add android`, copiez le contenu du dossier `android_icon_resources/` vers `android/app/src/main/res/` pour remplacer l'icône par défaut.
