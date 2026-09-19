# JaneneCar — Refonte UX/UI

## Objectif
Refonte de l'interface sans suppression de fonctionnalité métier ni modification des règles de stockage, de location, de conflit, de PDF ou de CSV.

## Pages améliorées
- Tableau de bord
- Locations
- Véhicules
- Conducteurs
- Rapports & historique
- Paramètres
- Modale de création/modification de location
- Tableau des locations
- Confirmations et notifications

## Principales améliorations UX
- Navigation desktop par sidebar structurée et menu mobile dédié.
- Sidebar réductible, thème clair/sombre et plein écran conservés.
- Une action principale évidente par écran.
- Actions secondaires regroupées dans « Plus d’actions ».
- Dashboard recentré sur « Aujourd’hui », « Attention requise » et l’état de la flotte.
- Alertes de retards accessibles directement depuis l’interface.
- Tableau Locations allégé : informations regroupées, action « Voir » visible, menu contextuel pour les actions secondaires.
- Pagination des locations (10 éléments par page).
- Formulaire Location avec consigne claire, en-tête fixe et barre d’actions fixe.
- Libellé d’enregistrement explicite : « Créer la location » ou « Enregistrer les modifications ».
- Confirmation destructive plus explicite et accessible.
- Notifications adaptées au mobile et priorité ARIA renforcée pour les erreurs.
- États de chargement par skeleton.
- Focus clavier visible et respect de prefers-reduced-motion.
- Design system léger centralisé dans `src/index.css`.

## Composants créés
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/LoadingState.tsx`

## Composants refactorisés
- `src/components/Header.tsx`
- `src/components/RentalTable.tsx`
- `src/components/RentalFormModal.tsx`
- `src/components/ConfirmDialog.tsx`
- `src/components/NotificationToast.tsx`
- `src/App.tsx`

## Validation
Une passe TypeScript a été exécutée. Aucun diagnostic TypeScript autre que les erreurs provoquées par les dépendances absentes n'a été détecté.

Le build complet n'a pas pu être exécuté dans l'environnement de travail car `node_modules` n'est pas présent et `npm install` a dépassé le délai disponible.

## Lancer le projet
```bash
npm install
npm run dev
```
Puis ouvrir `http://localhost:3000`.

## Vérifications recommandées
```bash
npm run lint
npm run build
npm run preview
```

## Parcours de recette manuelle
1. Ouvrir Tableau de bord et vérifier les cartes, Aujourd’hui et Attention requise.
2. Créer une location et vérifier la validation de véhicule/conflit.
3. Modifier, dupliquer, exporter en PDF puis supprimer une location.
4. Ajouter/importer un véhicule, changer son statut, réserver et louer.
5. Ajouter/modifier/supprimer un conducteur.
6. Vérifier Rapports & historique et les exports/partages.
7. Basculer thème clair/sombre et plein écran.
8. Tester la navigation et les formulaires en largeur mobile.
