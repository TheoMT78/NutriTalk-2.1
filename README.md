
# NutriTalk

Cette application React permet de suivre votre alimentation et vos objectifs nutritionnels.

## Installation

```bash
npm install
```

Le script `postinstall` installe aussi les dépendances du dossier `server`. Démarrez ensuite l'API avec :

```bash
(cd server && npm start)
```

Pour étendre la base d'aliments locale, exécutez :

```bash
npm run update-food-db
```

## Configuration

L'application front-end lit l'URL de l'API depuis la variable `VITE_API_URL`.
En production, l'application pointe par défaut vers
`https://nutritalk-2-0.onrender.com/api`. Créez un fichier `.env` à la racine si
vous souhaitez cibler un autre serveur ou utiliser `localhost` en
développement :

```bash
VITE_API_URL=http://localhost:3001/api
VITE_OPENAI_API_KEY=sk-yourkey
EDAMAM_APP_ID=
EDAMAM_APP_KEY=
SPOONACULAR_KEY=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
```
Si `VITE_OPENAI_API_KEY` n'est pas défini, l'analyse des aliments se limite au parsage par regex.
Sans ce fichier, l'URL ci-dessus est utilisée par défaut.


## Nouveautés

- Recherche d'aliments en ligne via OpenFoodFacts lorsque la base interne ne suffit pas.
- L'analyse des repas peut faire appel à GPT-3.5 si `VITE_OPENAI_API_KEY` est configuré, pour mieux comprendre les phrases naturelles.
- Si aucun résultat n'est trouvé, chaque mot de votre requête est recherché séparément pour améliorer la détection d'aliments.
- Les recherches utilisent aussi une correspondance approximative pour trouver l'aliment le plus proche dans la base locale.
- Possibilité de scanner un code-barres pour importer automatiquement un aliment.
  Si le navigateur ne supporte pas l'API BarcodeDetector, un lecteur alternatif basé sur ZXing est utilisé.
  Le produit scanné est désormais enregistré instantanément dans votre base personnelle avec ses macronutriments et un message de confirmation s'affiche.
  Le scanner se ferme en cliquant à l'extérieur et coupe correctement la caméra.
- Calcul automatique des besoins quotidiens en calories et macronutriments à partir de l'âge, du poids, de la taille et du sexe avec ajustement selon la fréquence d'activité.
- Les macronutriments sont répartis sur 25% de protéines, 25% de lipides et 50% de glucides.
- Suivi du nombre de pas avec objectif personnalisable et calcul automatique des calories brûlées.
- Boutons rapides (+500 à +5000) pour mettre à jour les pas.
- Calcul des calories restantes en tenant compte des pas.
- Suivi du poids quotidien avec réglages rapides depuis le tableau de bord.
- Objectifs de poids déclinés en perte légère/modérée ou prise légère/modérée (±5 à ±10%).
- Les besoins quotidiens et l'objectif calorique se mettent à jour dès que l'objectif de poids est modifié.
- Personnalisation manuelle des objectifs caloriques et macronutriments.
- Connexion par email avec création de compte locale.
- Interface en mode sombre par défaut.
- Progression des calories ajustée automatiquement avec les pas effectués.
- Les glucides recommandés augmentent selon les calories brûlées.
- L'historique est vide au départ et se remplit avec vos entrées.
- Les barres de l'historique passent au vert si l'objectif journalier est respecté à ±5%.
- Suivi du poids sur 7 jours grâce à un graphique intégré au tableau de bord.
- Le suivi des pas affiche le pourcentage exact même au-delà de 100%.
- Base d'aliments enrichie avec encore plus de produits crus, légumineuses et fruits pour de meilleurs résultats lors des recherches.
- Une base locale de 500 aliments issus d'OpenFoodFacts est embarquée dans `aliments.json`.
  Vous pouvez l'enrichir en exécutant `npm run update-food-db` qui télécharge
  plusieurs milliers d'aliments supplémentaires depuis OpenFoodFacts.
- Ajout de nouveaux aliments comme la patate douce et le kiwi jaune pour améliorer la reconnaissance hors ligne.
- Les poids par pièce (oeuf, kiwi...) sont normalisés via `unitWeights.ts` pour convertir correctement "1 œuf" ou "1 egg" en grammes.
- Historique enrichi avec graphiques du poids et du nombre de pas.
- Historique d'exemple d'un an pour visualiser immédiatement les graphiques.
- Historique vide par défaut et calendrier plus large avec cases réduites.
- Un clic sur la progression des calories affiche un tableau détaillé des macro et micronutriments.
- Les fibres sont calculées lorsque vous ajoutez des fruits et les vitamines A, C, calcium et fer s'affichent en pourcentage de l'apport quotidien.
- Le tableau des macros est désormais défilable pour rester lisible sur mobile.
- Les cartes Protéines, Glucides et Lipides affichent une barre de progression.
- La carte Calories affiche également une barre de progression bleue.
- Objectif d'hydratation personnalisable avec des boutons +1L, +500 ml, +250 ml et -250 ml.
- L'hydratation apparaît sur le tableau de bord sous forme de jauge circulaire à côté des pas.
- Nouvelle section "Recette" accessible depuis la barre de navigation.
- L'assistant IA peut aussi extraire une recette dictée pour l'ajouter aux recettes.
- Les produits scannés sont enregistrés automatiquement pour enrichir votre base personnelle.
- Les graphiques de l'historique permettent désormais de choisir la période (7 jours à un an) et les détails quotidiens sont affichés du plus récent au plus ancien.

Ces fonctionnalités reposent sur l'API publique OpenFoodFacts.
Pour obtenir des informations plus précises lorsque la base locale échoue,
l'application peut également interroger Edamam, Spoonacular ou
Google Custom Search. Ce moteur est configuré pour cibler en priorité MyProtein,
Prozis et Bulk afin d'obtenir les valeurs nutritionnelles de ces sites lorsque
c'est possible.
Renseignez les clés correspondantes dans `.env` pour activer ces services.
Configurez également Google Programmable Search si vous souhaitez un dernier recours.
Ce moteur doit contenir vos sites favoris (MyProtein, Prozis, Bulk…).
Définissez les variables suivantes dans `.env` :

```bash
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
```
