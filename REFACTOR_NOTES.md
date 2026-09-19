# JaneneCar - Refactor & optimisation

## Changements appliqués

- Code splitting des pages principales avec `React.lazy` + `Suspense`.
- Chargement à la demande des grosses modales (formulaire de location, détail, import CSV, éditeur de contrat).
- Extraction de la gestion des notifications dans `src/hooks/useNotifications.ts`.
  - nettoyage des timers au démontage du composant ;
  - callbacks stables pour ajout/suppression des notifications.
- Extraction des fabriques de locations dans `src/utils/rentalFactory.ts`.
  - location immédiate ;
  - réservation selon la disponibilité ;
  - contrat vierge.
- Centralisation de l'état initial des filtres dans `src/utils/filterUtils.ts`.
- Centralisation du rafraîchissement locations/véhicules/historique après les opérations CRUD dans `App.tsx`.
- Mémorisation des compteurs de retours du jour et de retards.
- Optimisation de `VehiclesView` : les locations sont groupées une seule fois par matricule au lieu de rescanner toute la liste pour chaque carte véhicule.

## Validation

- Transpilation syntaxique TypeScript/TSX de tous les fichiers sous `src` : OK.
- `tsc --noEmit` ne peut pas être exécuté jusqu'au bout dans l'environnement courant car les dépendances npm (`react`, `lucide-react`, `vite`, etc.) ne sont pas installées.
- L'installation `npm install` a dépassé le délai disponible dans l'environnement de travail.

## Validation recommandée en local

```bash
npm install
npm run lint
npm run build
npm run dev
```
