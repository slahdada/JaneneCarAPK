# Corrections UX — Locations

## Cause du champ conducteur
`formatHumanName(cleanDriverName(...))` etait appele dans `onChange`. `formatHumanName` normalise les espaces, donc l'espace final saisi apres un prenom disparaissait immediatement. Le champ conserve maintenant la chaine exacte pendant la frappe et normalise uniquement au `blur` / a la sauvegarde. Le conducteur secondaire suit la meme regle.

## Recherche vehicule
Le composant `VehicleSearchableSelect` recherche sans tenir compte de la casse dans la marque, le modele et l'immatriculation. L'immatriculation est aussi comparee sans espaces/tirets. Le champ utilise le placeholder demande et le menu a un z-index explicite, un contraste sombre renforce et une zone de resultats scrollable.

## Modale
La modale est limitee a la hauteur du viewport avec son propre scroll, une largeur max de 4xl et un padding mobile reduit. Le header et le footer restent sticky. La zone de recherche a son propre contexte z-index.

## Mode grille Locations
Un choix Liste / Grille a ete ajoute sur desktop. La grille utilise 2 colonnes puis 3 sur grands ecrans, cartes de hauteur reguliere, contenu protege contre les debordements et actions en bas avec retour a la ligne. Sur mobile, les cartes restent en une colonne.

## Fichiers applicatifs modifies
- src/components/RentalFormModal.tsx
- src/components/VehicleSearchableSelect.tsx
- src/components/RentalCard.tsx
- src/pages/RentalsView.tsx

`src/services/pdfService.ts` n'a pas ete modifie.

## Validation
- inspection statique des handlers du conducteur et du conducteur secondaire
- verification recherche marque/modele/immatriculation insensible a la casse
- verification structure responsive grille/liste
- `npx tsc --noEmit` tente; bloque par les dependances React/Lucide non installees dans l'environnement
