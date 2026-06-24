# Android Auto — intégration native

## Ce qui a été ajouté

Un vrai support Android Auto, sans dépendance tierce (pas de
react-native-track-player, pas de lib payante) : un service Android
natif (`MediaBrowserServiceCompat` + `MediaSessionCompat`) écrit à la
main en Kotlin, qui ne s'appuie que sur `androidx.media` — la
bibliothèque Jetpack standard sur laquelle Android Auto lui-même est
construit.

Rappel important : Android Auto **ne peut pas afficher l'UI vidéo de
l'appli**. Seul le catalogue est exposé, sous forme d'arborescence
parcourable (catégories → vidéos), et la lecture se fait en **audio
uniquement** (l'image de la vidéo est ignorée par le lecteur natif) —
c'est une contrainte d'Android Auto, pas une limitation de cette
implémentation.

### Fichiers ajoutés
- `plugins/withAndroidAuto.js` — config plugin Expo : modifie
  `AndroidManifest.xml` (service, receiver, permissions, métadonnée
  automotive), copie les sources Kotlin et le XML automotive dans le
  projet Android généré, ajoute la dépendance `androidx.media:media`
  à `app/build.gradle`, et enregistre le module natif dans
  `MainApplication`.
- `plugins/android-auto/native/MediaPlaybackService.kt` — le service
  Android Auto (arborescence + lecture audio via `MediaPlayer` +
  notification media-style).
- `plugins/android-auto/native/AndroidAutoCatalogModule.kt` — pont
  React Native (`NativeModules.AndroidAutoCatalog`) qui reçoit le
  catalogue depuis JS et l'écrit dans un fichier JSON privé à l'appli.
- `plugins/android-auto/native/AndroidAutoCatalogPackage.kt` —
  enregistrement du module ci-dessus.
- `plugins/android-auto/automotive_app_desc.xml` — déclare l'appli
  comme appli media auprès d'Android Auto.
- `src/lib/androidAuto.ts` — `publishAndroidAutoCatalog(videos)` /
  `clearAndroidAutoCatalog()`, appelées depuis `App.tsx` (no-op sur
  iOS/web, et si le module natif n'est pas encore compilé).

### Fichiers modifiés
- `app.json` — `android.package` défini (`com.formationvideos.app`,
  **valeur provisoire à confirmer avant toute publication réelle**) +
  `plugins: ["./plugins/withAndroidAuto.js"]`.
- `package.json` — scripts `prebuild` et `android:dev`.
- `App.tsx` — publie le catalogue (vidéos publiées uniquement, donc
  jamais les brouillons admin) vers le service natif à chaque
  changement de `videos`, et le vide à la déconnexion.

## Build (à faire sur ta machine — pas possible depuis ce chat)

Ce projet utilise du code natif personnalisé : **Expo Go ne
fonctionnera plus** pour cette fonctionnalité, il faut un dev client.

```
npm install
npx expo install expo-dev-client
npm run prebuild          # génère/régénère le dossier android/
npm run android:dev       # build + installe le dev client sur device/émulateur
```

Si tu modifies `plugins/withAndroidAuto.js` ou les fichiers `.kt`
après un premier prebuild, relance `npm run prebuild` pour que les
changements soient repris dans `android/`.

## Tester avec le Desktop Head Unit (DHU)

1. Dans Android Studio : SDK Manager → SDK Tools → installe
   **Android Auto Desktop Head Unit**.
2. Sur le téléphone/émulateur où l'appli est installée : installe
   l'appli **Android Auto** depuis le Play Store, ouvre-la, tape 10x
   sur la version dans les paramètres pour activer le mode
   développeur, puis active "Démarrer l'unité principale" /
   "Sources inconnues".
3. Connecte l'appareil en USB (ou utilise un émulateur) et lance le
   DHU (`<sdk>/extras/google/auto/desktop-head-unit`), ou via
   `adb forward tcp:5277 tcp:5277` puis `desktop-head-unit`.
4. L'appli doit apparaître dans la liste des apps media du DHU.

## Checklist de vérification
- [ ] L'appli apparaît dans Android Auto comme appli media (pas
      "non compatible")
- [ ] L'arborescence affiche une entrée par catégorie de vidéos
- [ ] Ouvrir une catégorie liste bien les vidéos publiées de cette
      catégorie
- [ ] Sélectionner une vidéo démarre la lecture **audio**
- [ ] Les commandes play/pause/suivant/précédent du DHU (et du volant
      si testé en voiture réelle) fonctionnent
- [ ] La notification media (lock screen / barre de notif) affiche le
      bon titre et les bons boutons
- [ ] Changer de vidéo dans l'appli (admin publie/dépublie) met à jour
      le catalogue côté Android Auto après relance de l'appli
- [ ] Se déconnecter vide le catalogue (plus rien de parcourable côté
      Android Auto)

## Limites connues
- Le `MediaPlayer` Android lit directement l'URL `playback_url` :
  pas de mise en cache hors-ligne, pas d'adaptation de débit — ok pour
  des MP4 simples comme ceux de la démo, à valider avec vos vrais
  fichiers de prod.
- Si tu changes un jour `android.package` dans `app.json`, mets aussi
  à jour le `package com.formationvideos.app.androidauto` déclaré en
  tête des 3 fichiers `.kt` (sinon le `<service>` du manifeste, qui se
  résout en `<package>.androidauto.MediaPlaybackService`, ne pointera
  plus vers la bonne classe).
- Aucune lecture vidéo n'est possible dans la voiture : c'est une
  restriction d'Android Auto lui-même, pas un choix technique de cette
  implémentation.
