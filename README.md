# Deka Group — Chassis Invoice Manager

Application web pour gérer les entrées/sorties (IN / OUT) de chassis DKN et générer des factures PDF automatiques.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Shadcn-style UI · Supabase (Auth + DB) · React Hook Form · Zod · jsPDF · Recharts

## 1. Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.example .env.local
# puis remplir les valeurs (voir section Supabase ci-dessous)

# 3. Lancer en développement
npm run dev
```

L'app tourne sur http://localhost:3000

## 2. Configuration Supabase

1. Créer un projet sur https://supabase.com
2. Aller dans **SQL Editor** et exécuter tout le contenu de `supabase/schema.sql`
   (crée les tables, les triggers de calcul automatique, et les policies RLS)
2bis. Exécuter ensuite `supabase/seed_chassis.sql` pour créer automatiquement
   les 15 chassis réels de Deka Group (DKN-001 à DKN-015), statut `available`
3. Aller dans **Project Settings → API** et récupérer :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ ne jamais exposer côté client)
4. Coller ces valeurs dans `.env.local`

### Créer le premier compte Admin

Après avoir exécuté le schéma SQL, crée manuellement le tout premier admin :

1. Dans Supabase → **Authentication → Users → Add user**, crée un utilisateur avec email/mot de passe
2. Dans **Table Editor → users**, modifie la ligne créée automatiquement pour ce nouvel utilisateur et mets `role = admin`

Une fois connecté avec ce compte admin, tu peux créer tous les autres utilisateurs (Admin ou Modpass) directement depuis l'interface (`/users`).

## 3. Déploiement sur Vercel

```bash
# 1. Pousser le code sur GitHub
git init
git add .
git commit -m "Initial commit - Deka Group Chassis Invoice Manager"
git branch -M main
git remote add origin https://github.com/<ton-compte>/deka-chassis-manager.git
git push -u origin main

# 2. Sur vercel.com : "New Project" → importer le repo GitHub
# 3. Dans les "Environment Variables" de Vercel, ajouter les 3 variables Supabase
#    (les mêmes que dans .env.local) + les variables NEXT_PUBLIC_COMPANY_*
# 4. Cliquer "Deploy"
```

Aucune configuration serveur additionnelle n'est nécessaire — l'app est 100% compatible avec le plan gratuit de Vercel.

## 4. Structure du projet

```
app/
  login/                → page de connexion
  (dashboard)/          → toutes les pages protégées (sidebar commune)
    dashboard/          → stats + graphiques IN/OUT
    clients/            → CRUD clients
    chassis/             → CRUD chassis + statut
    invoices/            → liste, création (lignes dynamiques), détail + PDF
    users/               → gestion utilisateurs (admin uniquement)
    audit-log/           → historique non modifiable
  api/users/             → route serveur (service role) pour créer/supprimer des comptes
components/
  ui/                    → composants Shadcn-style (button, input, table, dialog...)
  dashboard/, invoices/, clients/, chassis/, users/, layout/
lib/
  supabase/              → clients browser / server / middleware
  types.ts, validations.ts (Zod), pdf-generator.ts, utils.ts
supabase/schema.sql       → schéma complet (tables, triggers, RLS)
```

## 5. Fonctionnement clé

- **Numérotation automatique des factures** : générée côté base de données (`DKN-2026-00001`, incrémentée par année) via une fonction PostgreSQL — jamais de doublon possible.
- **Calcul automatique des totaux** : un trigger recalcule `total_in`, `total_out` et `balance` à chaque ajout/modification/suppression d'une ligne de facture.
- **Mise à jour automatique du statut chassis** : un trigger passe un chassis en `IN` ou `OUT` dès qu'une ligne de facture le mentionne.
- **Rôles** : Admin (tout + suppression) vs Modpass (créer/modifier/imprimer, jamais supprimer) — appliqué à la fois en RLS (base de données) et dans l'interface.
- **Audit log** : la table `activity_logs` n'a **aucune policy UPDATE/DELETE** → impossible à modifier ou effacer, même par un admin, directement dans Supabase.
- **PDF** : généré côté navigateur avec jsPDF + jspdf-autotable, reproduit l'entête, le tableau, les totaux, la zone signature/cachet et le footer Deka Group.

## 6. Prochaines améliorations possibles

- Upload du vrai logo Deka Group dans Supabase Storage et intégration dans le PDF (actuellement le PDF fonctionne sans logo si aucun n'est fourni)
- Export PDF groupé de plusieurs factures
- Pagination sur les listes pour de très gros volumes
