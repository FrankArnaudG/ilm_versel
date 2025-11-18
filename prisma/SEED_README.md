# 🌱 Guide d'utilisation du Seeder

Ce seeder génère automatiquement des données de test pour votre base de données.

## 📋 Ce qui est généré

Le seeder crée :

- **ProductModel** : Au moins 5 modèles pour chaque combinaison de :
  - Store (boutique)
  - Catégorie
  - Marque
- **ProductVariant** : Variantes avec attributs selon la catégorie :

  - Téléphones : Stockage (128GB, 256GB, 512GB, 1TB)
  - Tablettes : Stockage (64GB, 128GB, 256GB)
  - Ordinateurs : RAM (8GB, 16GB, 32GB)
  - Montres : Taille (41mm, 45mm, 49mm)
  - Power Banks : Capacité (10000mAh, 20000mAh, 30000mAh)

- **Article** : Articles individuels (1 par unité en stock, entre 5 et 25 unités par variante)

- **ProductColor** : 2-3 couleurs aléatoires par modèle

- **ProductImage** : 1 image par couleur

- **StockEntry** : Entrées de stock pour chaque lot d'articles

- **Supplier** : Fournisseur générique (créé si nécessaire)

## 🚀 Utilisation

### Prérequis

1. Assurez-vous d'avoir au moins une boutique active dans la base de données
2. Installez les dépendances si nécessaire :
   ```bash
   npm install tsx --save-dev
   ```

### Exécution

```bash
# Méthode 1 : Via npm
npm run seed

# Méthode 2 : Via Prisma directement
npx prisma db seed
```

## ⚙️ Configuration

Le seeder utilise automatiquement :

- **Stores** : Toutes les boutiques avec le statut `ACTIVE`
- **Catégories** :
  - Si des ProductModel existent : catégories uniques depuis la base
  - Sinon : catégories par défaut (Téléphones, Tablettes, Ordinateurs, etc.)
- **Marques** :
  - Si des ProductModel existent : marques uniques depuis la base
  - Sinon : marques par défaut (Apple, Samsung, Xiaomi, etc.)

## 📊 Statistiques

Après l'exécution, le seeder affiche :

- Nombre de modèles créés
- Nombre de variantes créées
- Nombre d'articles créés

## ⚠️ Notes importantes

1. **Duplication** : Le seeder vérifie si un modèle ou une variante existe déjà avant de le créer (basé sur la référence unique)

2. **Utilisateur système** : Si aucun utilisateur SUPER_ADMIN n'existe, un utilisateur système est créé pour les entrées de stock

3. **Fournisseur** : Un fournisseur générique est créé si nécessaire

4. **Prix** :

   - Les prix sont générés aléatoirement entre 100 et 1000 EUR
   - Conversion automatique en FCFA pour les boutiques en Guyane (taux : 1 EUR = 655 FCFA)

5. **Stock** : Chaque variante a entre 5 et 25 articles en stock

## 🔄 Réexécution

Le seeder peut être réexécuté plusieurs fois. Il :

- Ignore les modèles existants (basé sur la référence unique)
- Ignore les variantes existantes (basé sur variantReference)
- Continue avec les nouvelles combinaisons

## 🐛 Dépannage

### Erreur : "Aucune boutique active trouvée"

**Solution** : Créez au moins une boutique avec le statut `ACTIVE` avant d'exécuter le seeder.

### Erreur : "tsx not found"

**Solution** : Installez tsx :

```bash
npm install tsx --save-dev
```

### Erreur de contrainte unique

**Solution** : Le seeder vérifie déjà les doublons, mais si vous avez des données existantes avec des références conflictuelles, vous devrez peut-être nettoyer la base de données.

## 📝 Exemple de sortie

```
🌱 Début du seeding...

✅ 3 boutique(s) trouvée(s)

✅ 8 catégorie(s) trouvée(s): Téléphones, Tablettes, Ordinateurs, ...

✅ 10 marque(s) trouvée(s): Apple, Samsung, Xiaomi, ...

✅ Fournisseur générique créé

✅ Utilisateur système créé pour les entrées de stock

📦 Traitement de la boutique: Boutique Martinique (MART-001)
  📱 Catégorie: Téléphones | Marque: Apple
  📱 Catégorie: Téléphones | Marque: Samsung
  ...

✅ Seeding terminé avec succès!
📊 Statistiques:
   - 1200 modèles de produits créés
   - 4800 variantes créées
   - 72000 articles créés
```
