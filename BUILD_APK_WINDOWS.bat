@echo off
setlocal
cd /d "%~dp0"
echo =============================================
echo   Janen_Car - Construction APK Android
ECHO =============================================
where java >nul 2>nul || (echo ERREUR: Java 21 requis. Installez JDK 21. & pause & exit /b 1)
where npm >nul 2>nul || (echo ERREUR: Node.js/npm requis. & pause & exit /b 1)
call npm install || goto :error
call npm run build || goto :error
if not exist android (
  call npx cap add android || goto :error
)
call npx cap sync android || goto :error
cd android
call gradlew.bat assembleDebug || goto :error
cd ..
if exist android\app\build\outputs\apk\debug\app-debug.apk (
  copy /Y android\app\build\outputs\apk\debug\app-debug.apk Janen_Car.apk >nul
  echo.
  echo APK cree avec succes : %CD%\Janen_Car.apk
  echo Vous pouvez copier Janen_Car.apk sur votre telephone Android.
) else (
  echo ERREUR: APK non trouve apres compilation.
)
pause
exit /b 0
:error
echo.
echo ECHEC DE LA CONSTRUCTION.
echo Verifiez votre connexion Internet, Java 21 et Android SDK/Android Studio.
pause
exit /b 1
