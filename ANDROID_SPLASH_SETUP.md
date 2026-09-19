# Configuration du splash screen Android — Janen_Car

Le splash screen Android utilise maintenant **la dernière image fournie par l'utilisateur**.

## Fichiers générés
- `android_splash_resources/app/src/main/res/drawable/splash.png`
- `android_splash_resources/app/src/main/res/drawable/splash_brand.png`

> Note : les copies de travail dans `public/` (splash-screen.png, splash-android-portrait.png,
> splash-android-landscape.png, android12-splash-brand.png) ont été supprimées lors du nettoyage du projet.

## Étapes après génération du dossier Android
1. `npm install`
2. `npm run build`
3. `npx cap add android` (une seule fois)
4. `npx cap sync android`
5. Copier le contenu de `android_splash_resources/app/src/main/res/` vers `android/app/src/main/res/`
6. Ouvrir le dossier `android/` dans Android Studio et compiler l'APK.

## Résultat attendu
- écran de lancement Android avec fond bleu flouté
- l'image Janen_Car au centre comme visuel principal
- configuration compatible Capacitor / Android splash
