# Plan projet - Référencement de 20 restaurants Miwadoo

## Objectif
Créer un site ou mini-projet qui référence 20 restaurants avec un angle clair : bonne qualité, prix accessibles, et identité visuelle cohérente avec Miwadoo.

Le projet doit permettre :
- un classement lisible des restaurants
- une page détail pour chaque restaurant
- l'utilisation de certaines données Google quand elles sont disponibles
- une couche éditoriale Miwadoo plus forte que la simple reprise de données externes

## Ce qu'on peut prendre depuis Google
Pour chaque restaurant, on peut en principe utiliser via Google Places API (New) :
- `rating`
- `userRatingCount`
- `priceLevel` si disponible
- jusqu'à 3 à 5 avis visibles

## Limites importantes Google
- Certains restaurants peuvent avoir des données incomplètes.
- `priceLevel` n'est pas garanti pour tous.
- Les avis doivent être affichés avec attribution.
- Il faut respecter les règles d'usage et d'affichage de Google Maps Platform.
- Il ne faut pas dépendre uniquement de Google pour construire la valeur du projet.

## Stratégie recommandée
Chaque fiche restaurant doit mélanger 2 couches :

### 1. Données Google
Utiliser Google pour :
- crédibiliser la fiche avec une note publique
- afficher le volume d'avis
- montrer quelques avis visibles
- enrichir si possible avec le niveau de prix

### 2. Données éditoriales Miwadoo
Utiliser Miwadoo pour :
- le résumé du restaurant
- les points forts
- la cible budget
- l'ambiance
- les plats conseillés
- les avantages / limites
- le quartier ou la zone
- la recommandation finale

## Pourquoi cette approche est la bonne
- La fiche reste utile même si Google renvoie peu de données.
- Le projet garde une vraie identité Miwadoo.
- On évite un site trop dépendant d'une source externe.
- On construit un contenu plus SEO et plus différenciant.

## Structure recommandée du projet
Prévoir au minimum :
- 1 page d'accueil ou page top 20
- 1 page listing de tous les restaurants
- 1 page détail par restaurant
- 1 page méthode de classement (optionnel mais recommandé)

## Contenu de la page listing
La page listing doit permettre de comparer rapidement les 20 restaurants.

Champs recommandés :
- nom du restaurant
- ville / quartier
- type de cuisine
- note Google
- nombre d'avis Google
- niveau de prix ou budget estimé
- badge Miwadoo du type `Bon plan`, `Petit budget`, `Très populaire`, `Cadre sympa`
- court résumé
- lien vers la page détail

## Contenu d'une page détail restaurant
Chaque fiche détail devrait contenir :
- nom du restaurant
- galerie / image principale
- localisation
- type de cuisine
- note Google
- nombre d'avis Google
- niveau de prix si disponible
- résumé éditorial Miwadoo
- points forts
- limites éventuelles
- plats ou expériences recommandés
- budget estimé
- horaires si disponibles
- contact / lien externe si disponible
- section avis Google visibles
- appel à l'action clair

## Modèle de données recommandé
Créer une source de données unique par restaurant.

Exemple de structure :
- `id`
- `slug`
- `name`
- `city`
- `area`
- `cuisine`
- `googlePlaceId`
- `googleRating`
- `googleUserRatingCount`
- `googlePriceLevel`
- `googleReviews[]`
- `heroImage`
- `gallery[]`
- `miwadooScore`
- `budgetLabel`
- `editorialSummary`
- `strengths[]`
- `weaknesses[]`
- `recommendedDishes[]`
- `openingHours[]`
- `contactPhone`
- `websiteUrl`
- `mapsUrl`
- `tags[]`

## Système de classement recommandé
Le classement final ne doit pas être basé seulement sur Google.

Pondération conseillée :
- 40% accessibilité prix
- 25% qualité perçue
- 15% régularité / réputation
- 10% cadre / expérience
- 10% service

Cela permet d'assumer clairement le positionnement du projet : bon rapport qualité / prix avant tout.

## UX recommandée
Le projet doit s'inspirer du confort d'usage de TripAdvisor, mais rester visuellement dans l'univers Miwadoo.

À prévoir :
- cartes restaurant lisibles
- badges prix très visibles
- note bien mise en avant
- navigation mobile-first
- style chaleureux et premium-accessible
- ton éditorial local et crédible

## Composants utiles
Prévoir des composants réutilisables :
- `RestaurantCard`
- `RestaurantHero`
- `RatingBadge`
- `PriceBadge`
- `ReviewSnippet`
- `StrengthList`
- `RestaurantMeta`
- `TopRankBadge`

## SEO recommandé
Chaque page détail doit être pensée pour le référencement.

À prévoir :
- URL propre par restaurant
- `title` et `meta description` uniques
- contenu suffisamment riche
- balises structurées si pertinent
- texte différencié sur chaque fiche

## Risques à anticiper
- données Google manquantes ou incomplètes pour certains restaurants
- coût API si on recharge souvent les données
- dépendance excessive à Google si on ne rédige pas assez de contenu propre
- incohérences si la méthodologie de classement n'est pas définie dès le début

## Plan de réalisation recommandé
1. Définir la stack du projet.
2. Créer la structure de données des 20 restaurants.
3. Renseigner les données éditoriales Miwadoo.
4. Brancher les données Google autorisées.
5. Construire la page listing.
6. Construire le template page détail.
7. Intégrer l'identité visuelle Miwadoo.
8. Remplir les 20 fiches.
9. Vérifier responsive, performance et SEO.
10. Ajuster le classement final avant mise en ligne.

## Recommandation finale
La meilleure approche pour ce projet est :
- Google pour la preuve sociale
- Miwadoo pour l'analyse, la sélection et l'identité

Autrement dit :
- Google apporte la note et quelques avis
- Miwadoo apporte la vraie valeur éditoriale
