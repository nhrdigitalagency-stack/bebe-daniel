# Configuration Supabase — Le Voir bébé de Daniel

Ce dossier contient le schéma SQL complet, les politiques Row-Level Security (RLS) et la configuration du bucket privé pour l'album familial et la modération des photos.

## 1. Étapes d'installation dans Supabase

1. Créez un projet Supabase.
2. Ouvrez l'**éditeur SQL (SQL Editor)** de Supabase et exécutez le contenu du fichier :
   `supabase/migrations/001_initial_schema.sql`
3. Dans **Authentication > Users**, créez le compte des parents (email + mot de passe fort) et désactivez l'inscription libre si souhaité, ou ajoutez uniquement l'identifiant UUID des parents dans la table `public.admin_users` :
   ```sql
   INSERT INTO public.admin_users (user_id, email)
   VALUES ('VOTRE-UUID-SUPABASE-AUTH', 'parents@exemple.fr');
   ```
4. Définissez le code familial initial haché (ou modifiez-le directement depuis l'interface `/admin` une fois connecté) :
   ```sql
   UPDATE public.event_settings
   SET family_code_hash = crypt('VOTRE_CODE_FAMILIAL', gen_salt('bf'))
   WHERE id = 1;
   ```

## 2. Variables d'environnement à renseigner

Dans votre environnement serveur (`.env`) :

```env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="votre-cle-anon-publique"
SUPABASE_URL="https://votre-projet.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="votre-cle-service-role-secrete-serveur"
SUPABASE_STORAGE_BUCKET="daniel-memories-private"
FAMILY_INVITE_CODE_SECRET="optionnel-code-de-secours-serveur"
```

## 3. Sécurité appliquée

- **Bucket privé (`daniel-memories-private`)** : aucun fichier n'est accessible par URL publique permanente.
- **URL signées courte durée** : seules les photos ayant le statut `approved` reçoivent une URL signée temporaire après vérification des droits d'accès.
- **Nettoyage EXIF & GPS** : le serveur inspecte les octets magiques (JPEG, PNG, WebP) et retire systématiquement les segments EXIF/GPS avant l'envoi dans le stockage privé.
- **Aucune clé `service_role` dans le navigateur** : toutes les opérations sensibles (vérification du code familial, dépôt de fichiers, modération, suppression physique) transitent par les routes serveur `/api/*`.
