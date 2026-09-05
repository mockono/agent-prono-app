# AGENT PRONO REACTIVED V1 — Application (Étape 2/N)

Application Next.js (App Router, TypeScript, Tailwind) qui branche le moteur
de scoring/Poisson sur une interface complète : bandeau des matchs du jour,
cartes de match détaillées, et générateur de tickets Basic/Fun/Pro/Montante.

## ⚠️ Avant de lancer : pas de `node_modules` ici

Cet environnement de génération n'a **pas d'accès réseau**, donc `npm install`
n'a pas pu être exécuté ni vérifié ici. Le moteur (`lib/engine/*.ts`) a été
testé en exécution réelle avec `tsx` et fonctionne ; le reste (composants
React, pages) a été relu avec soin mais n'a pas tourné dans un vrai serveur
Next.js. Chez toi :

```bash
cd agent-prono-app
npm install
npm run dev
# -> http://localhost:3000
```

Si `npm run dev` remonte une erreur, c'est très probablement une coquille
mineure (import, prop) plutôt qu'un problème de logique — dis-le-moi avec le
message d'erreur et je corrige.

## Ce qui est fonctionnel

- **`lib/engine/`** — port TypeScript fidèle du prototype Python :
  `scoring.ts` (7 facteurs), `poissonModel.ts` (buts attendus + Dixon-Coles),
  `marketSelector.ts` (edge, value, choix du marché), `ticketBuilder.ts`
  (construction Basic/Fun/Pro/Montante, refuse d'ajouter un match
  artificiellement — testé en exécution).
- **`lib/data/mockMatches.ts`** — 6 matchs de démonstration (plusieurs
  championnats) avec des statistiques fictives mais plausibles. **Ce n'est
  pas connecté à Football-Data.co.uk** — c'est la prochaine étape.
- **`app/api/generate/route.ts`** — vraie route API (POST) qui reçoit
  `{ forfait, proSubtier?, montanteStep? }` et retourne le ticket construit.
- **`app/page.tsx`** — page d'accueil : ticker des matchs, cartes détaillées
  (score de confiance, 7 facteurs, marché retenu, cote), sélecteur de
  forfait et bouton Générer branché sur l'API.
- **`app/admin/page.tsx`** — stub de tableau de bord (stats du pool de
  matchs, répartition par championnat). L'import CSV n'est pas encore
  câblé — bouton désactivé en attendant `data_loader.py`.

## Limitation assumée : seulement 6 matchs de démo

Avec 6 matchs fictifs, Basic/Fun/Pro fonctionnent (testé), mais Montante
(10 à 40 matchs) et les paliers Pro élevés (50-1500) ne peuvent
mathématiquement pas être remplis — le moteur l'affiche honnêtement au lieu
de tricher. Une fois `data_loader.py` branché sur une vraie base avec des
dizaines de matchs par jour sur tous les championnats, ces forfaits
deviendront réellement utilisables.

## Prochaines étapes suggérées

1. Remplacer `lib/data/mockMatches.ts` par une vraie requête à une base
   (SQLite/Postgres via `schema.sql`) alimentée par `data_loader.py`
   (Football-Data.co.uk).
2. Calculer les `TeamSnapshot` automatiquement depuis l'historique en base
   au lieu de les écrire à la main.
3. Backtesting (`backtest.py` ou portage TS) pour calibrer réellement `rho`
   et valider le modèle avant tout usage réel.
4. Authentification + persistance des tickets générés (table `tickets` déjà
   prévue dans `schema.sql`).

Dis-moi si tu veux qu'on enchaîne sur le data loader, ou qu'on corrige
d'abord ce qui casse quand tu lances `npm run dev` chez toi.
