# Générer l'APK janen_car

Le projet est configuré avec Capacitor :
- nom Android : `Janen_Car`
- identifiant : `com.janen.car`
- icône : voiture + clé + validation
- sortie APK attendue : `janen_car.apk`

## Windows — méthode la plus simple

1. Installer **Android Studio** avec Android SDK.
2. Installer **Java/JDK 21** et **Node.js**.
3. Extraire ce ZIP.
4. Double-cliquer sur `BUILD_APK_WINDOWS.bat`.
5. À la fin, le fichier `janen_car.apk` sera créé à la racine du projet.

## En terminal Windows

```bat
npm install
npm run build
npx cap add android
npx cap sync android
cd android
gradlew.bat assembleDebug
```

Puis récupérer :
`android\app\build\outputs\apk\debug\app-debug.apk`

## Linux

Lancer :

```bash
./BUILD_APK_LINUX.sh
```


## Splash screen Android
Le projet contient déjà les ressources de splash dans `public/` et `android_splash_resources/`. Après création du dossier Android, copiez les ressources indiquées dans `ANDROID_SPLASH_SETUP.md`.


## Remplacement de l'icône Android
Après création du dossier Android (`npx cap add android`), copiez tout le contenu de `android_icon_resources/` vers `android/app/src/main/res/`. Cela remplace l'icône par défaut par le logo JaneneCar fourni.
