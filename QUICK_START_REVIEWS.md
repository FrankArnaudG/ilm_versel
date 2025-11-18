# 🚀 Guide de Démarrage Rapide - Système de Notation

## ⚡ Mise en Place Rapide

### 1. Appliquer les Migrations

```bash
# Générer et appliquer la migration
npx prisma migrate dev --name add_product_reviews_system

# Régénérer le client Prisma
npx prisma generate
```

### 2. Vérifier que tout fonctionne

Accédez à une page de détails produit (par exemple) :
```
http://localhost:3000/Martinique/Apple/Téléphones/[productId]
```

Vous devriez voir :
- ✅ Une section "Avis clients" en bas de la page
- ✅ Un formulaire pour laisser un avis
- ✅ Les notes affichées sur les cartes produits (s'il y a déjà des avis)

## 📝 Comment Utiliser

### Pour les Clients

1. **Laisser un avis :**
   - Aller sur la page de détails d'un produit
   - Remplir le formulaire "Laisser un avis"
   - Sélectionner une note de 1 à 5 étoiles
   - Écrire un commentaire (optionnel)
   - Ajouter des photos (optionnel)
   - Cliquer sur "Publier l'avis"

2. **Répondre à un avis :**
   - Cliquer sur "Répondre" sous un avis
   - Entrer votre nom et votre réponse
   - Cliquer sur "Envoyer"

### Pour les Développeurs

**Ajouter le composant sur une nouvelle page :**
```tsx
import ProductReviews from '@/app/(main)/(view)/components/ProductReviews';

<ProductReviews 
  productModelId="xxx"
  initialAverageRating={null}
  initialTotalReviews={0}
/>
```

**Accéder aux avis via l'API :**
```typescript
// Note: Le projet utilise @/lib/db (et non @/lib/prisma)
import { db } from '@/lib/db';

// GET - Récupérer les avis d'un produit (côté client)
const response = await fetch('/api/reviews/[productModelId]');
const data = await response.json();

// POST - Ajouter un avis (côté client)
const response = await fetch('/api/reviews/[productModelId]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rating: 5,
    comment: "Excellent produit",
    authorName: "Jean Dupont",
    authorEmail: "jean@email.com",
    images: []
  })
});
```

## 🎨 Personnalisation

### Modifier les couleurs

Dans `ProductReviews.tsx`, recherchez et modifiez :
- `[#800080]` - Couleur principale (violet)
- `yellow-400` - Couleur des étoiles
- `green-` - Couleurs de succès

### Changer le nombre maximum d'images

Dans `ProductReviews.tsx`, ajoutez une limite dans `handleImageSelect` :
```typescript
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  const MAX_IMAGES = 5; // Limite à 5 images
  const fileArray = Array.from(files).slice(0, MAX_IMAGES);
  // ...
};
```

## 🔧 Configuration

### Activer les achats vérifiés

Pour marquer automatiquement les avis des clients ayant acheté le produit :

1. Dans l'API `POST /api/reviews/[productModelId]`, modifiez :
```typescript
// Au lieu de :
isVerifiedPurchase: false

// Utilisez :
isVerifiedPurchase: await checkUserPurchase(userId, productModelId)
```

2. Créez la fonction de vérification :
```typescript
import { db } from '@/lib/db';

async function checkUserPurchase(userId: string, productModelId: string) {
  // Vérifier si l'utilisateur a une commande validée contenant ce produit
  const purchase = await db.order.findFirst({
    where: {
      userId,
      status: 'COMPLETED',
      items: {
        some: {
          productModelId
        }
      }
    }
  });
  return !!purchase;
}
```

### Ajouter l'authentification

Pour lier les avis aux utilisateurs connectés, dans le composant `ProductReviews.tsx` :

```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();

// Dans submitReview :
body: JSON.stringify({
  // ...
  userId: session?.user?.id,
  authorName: session?.user?.name || authorName,
  authorEmail: session?.user?.email || authorEmail,
})
```

## 📊 Statistiques

Pour afficher des statistiques détaillées (répartition des notes) :

```typescript
// Dans l'API GET
import { db } from '@/lib/db';

const ratingDistribution = await db.productReview.groupBy({
  by: ['rating'],
  where: { productModelId, isVisible: true },
  _count: { rating: true }
});

// Résultat : 
// [
//   { rating: 5, _count: { rating: 8 } },
//   { rating: 4, _count: { rating: 3 } },
//   { rating: 3, _count: { rating: 1 } },
// ]
```

## 🐛 Problèmes Courants

### "ProductReview not found"
```bash
# Régénérer le client Prisma
npx prisma generate
```

### Les notes ne s'affichent pas
```bash
# Vérifier que la migration est appliquée
npx prisma migrate status

# Si nécessaire, appliquer les migrations
npx prisma migrate deploy
```

### Erreur de type sur `averageRating`
Le champ est de type `Decimal` dans Prisma mais `number` en TypeScript.
Utilisez : `parseFloat(averageRating.toString())`

## 📞 Support

Pour toute question ou problème :
1. Consulter `PRODUCT_REVIEWS_IMPLEMENTATION.md` pour la documentation complète
2. Vérifier les logs de la console navigateur
3. Vérifier les logs serveur dans le terminal

## ✨ Fonctionnalités Implémentées

✅ Notation de 1 à 5 étoiles
✅ Commentaires texte
✅ Upload d'images multiples
✅ Réponses aux avis
✅ Recalcul automatique de la note moyenne
✅ Affichage sur liste et détails produits
✅ Formatage automatique des dates
✅ États de chargement
✅ Validation des données
✅ Soft delete des avis
✅ Support mobile et desktop

Bon développement ! 🎉

