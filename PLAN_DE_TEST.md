# Plan de test manuel — Formation Videos (Expo)

## 1. Avant de commencer

Stack : Expo / React Native + Supabase (auth par magic link, tables `allowed_emails`, `admin_emails`, `videos`, `video_progress`).

**Blocage détecté dans `.env`** : les valeurs sont des placeholders (`https://your-project.supabase.co` / `your-public-anon-key`). Comme ce sont des chaînes non vides, `hasSupabaseConfig` (dans `src/lib/supabase.ts`) les considère valides → le mode démo automatique ne se déclenche pas, mais les vrais appels Supabase échoueront (l'URL n'existe pas). Choisis une option avant de lancer :

- **Option A — Tester avec un vrai projet Supabase** : renseigne `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` dans `.env` avec tes vraies valeurs, et crée les 4 tables citées plus haut.
- **Option B — Tester en mode démo (sans backend)** : vide les deux valeurs dans `.env` (laisse juste `EXPO_PUBLIC_SUPABASE_URL=` et `EXPO_PUBLIC_SUPABASE_ANON_KEY=`). `hasSupabaseConfig` passera à `false`, et le bouton "Voir la démo locale" apparaîtra sur l'écran de connexion avec les 3 vidéos de `src/data.ts`.

## 2. Lancer l'appli

À faire sur ta machine (un environnement de dev mobile a besoin de ton simulateur/appareil — pas dans ce chat). Depuis `D:\projects\video-learning-app` :

```
npm install        # si pas déjà fait
npm run typecheck  # sanity check avant de lancer
npx expo start
```

Puis dans le terminal Expo : `a` pour Android, `i` pour iOS (Mac uniquement), `w` pour le web. Ou directement `npm run android` / `npm run ios` / `npm run web`.

## 3. Checklist de test manuel

### Mode démo (sans Supabase configuré)
- [ ] L'écran de connexion affiche "Voir la démo locale"
- [ ] Clic → accès direct au catalogue (3 vidéos démo : Bienvenue, Les bases essentielles, Mise en pratique)
- [ ] La lecture vidéo fonctionne (plein écran, picture-in-picture)
- [ ] "Marquer comme terminée" change l'état localement (pas de sync serveur en démo)
- [ ] Pas de bouton Admin visible
- [ ] "Sortir" retourne à l'écran de connexion

### Mode connecté (Supabase réel)
- [ ] Email invalide → message d'erreur
- [ ] Email valide → "Lien envoyé", email magic link reçu, le lien ramène dans l'appli avec une session active
- [ ] Email absent de `allowed_emails` → écran "Accès non autorisé" + lien "Utiliser un autre email"
- [ ] Email présent dans `allowed_emails` → accès au catalogue, vidéos publiées uniquement (`is_published = true`)
- [ ] Email présent dans `admin_emails` → bouton "Admin" visible, accès à toutes les vidéos (publiées + brouillons)
- [ ] "Marquer comme terminée" écrit bien dans `video_progress` (vérifier côté Supabase)
- [ ] Fermer/rouvrir l'appli → la session persiste (AsyncStorage)
- [ ] "Sortir" déconnecte réellement (plus de session au redémarrage)

### Écran Admin
- [ ] Ajouter un email autorisé → apparaît dans la liste, persiste après rechargement
- [ ] Supprimer un email autorisé → disparaît
- [ ] Ajouter une vidéo (titre + URL obligatoires) → apparaît dans le catalogue
- [ ] Ajout sans titre/URL → message d'erreur, rien n'est créé
- [ ] Bascule Publiée/Brouillon → la vidéo apparaît/disparaît du catalogue des non-admins
- [ ] Suppression d'une vidéo → disparaît partout

### Cas limites
- [ ] Coupure réseau au démarrage → l'écran de chargement ne reste pas bloqué indéfiniment
- [ ] Erreur Supabase (table manquante, etc.) → une alerte s'affiche au lieu de planter
- [ ] Catalogue vide → l'écran Library s'affiche sans lecteur, sans crash
- [ ] Rendu comparé sur iOS, Android, et Web si pertinent

## 4. Pour aller plus loin
- Aucun test automatisé n'existe pour l'instant (pas de Jest configuré) — possible à ajouter en complément.
- Pour une bêta avec de vrais utilisateurs externes (au-delà d'un test manuel local), il faudra un build EAS + distribution TestFlight / Play Internal Testing plutôt qu'Expo Go.
