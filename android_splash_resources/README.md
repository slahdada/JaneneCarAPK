# Splash screen Android — Janen_Car

Ces fichiers préparent le splash screen Android à partir de l'image fournie.

## Fichiers générés
- `app/src/main/res/drawable/splash.png`
- `app/src/main/res/drawable/splash_brand.png`
- `app/src/main/res/drawable/launch_background.xml`
- `app/src/main/res/values/colors.xml`
- `app/src/main/res/values/styles.xml`

## Après `npx cap add android`
Copiez le contenu de `android_splash_resources/app/src/main/res/` vers `android/app/src/main/res/`.

Sous Android Studio, vérifiez ensuite que le thème de lancement référencé dans `AndroidManifest.xml` correspond bien au style `AppTheme.NoActionBarLaunch`.
