# Formation Videos

Application mobile Expo pour donner acces a des videos instructives uniquement aux emails autorises.

## Demarrage

1. Copier `.env.example` vers `.env` et remplir les deux variables Supabase.
2. Executer la migration SQL dans `supabase/migrations/001_initial_schema.sql`.
3. Installer les dependances :

```bash
npm install
```

4. Lancer l'application :

```bash
npm start
```

## Principe

- Les utilisateurs se connectent par lien magique envoye par email.
- La table `allowed_emails` decide qui peut voir le contenu.
- La table `admin_emails` decide qui peut ouvrir le panneau admin.
- Les videos publiees sont lues depuis la table `videos`.
- La table `video_progress` garde les videos terminees par utilisateur.

Sans configuration Supabase, l'app affiche un mode demo local pour visualiser l'interface.

## Premier admin

Apres avoir execute la migration, ajoute ton email admin dans Supabase SQL Editor :

```sql
insert into public.admin_emails (email)
values ('ton-email@exemple.com');
```

Connecte-toi ensuite avec cet email. Le bouton `Admin` apparaitra dans le catalogue et permettra de :

- ajouter ou supprimer des emails autorises ;
- ajouter une video ;
- publier ou masquer une video ;
- supprimer une video.
