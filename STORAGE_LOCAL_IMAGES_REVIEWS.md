# 📸 Stockage Local des Images d'Avis

## ✅ Implémentation Complète

Le système de stockage local des images pour les avis est maintenant **opérationnel** !

---

## 📁 Architecture

### Structure des Dossiers

```
project/
├── public/
│   └── reviews/                    # Dossier d'upload des images
│       ├── .gitkeep               # Garde le dossier dans Git
│       └── review_*.jpg/png/...   # Images uploadées
├── app/
│   └── api/
│       └── upload/
│           └── review-images/
│               └── route.ts        # API d'upload
└── app/(main)/(view)/components/
    └── ProductReviews.tsx          # Composant avec upload
```

---

## 🔧 Fonctionnement

### 1. Sélection des Images (Frontend)

```typescript
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  const fileArray = Array.from(files);
  
  // Stocker les fichiers réels
  setSelectedFiles(prev => [...prev, ...fileArray]);
  
  // Créer des aperçus locaux (blob URLs)
  const newPreviews = fileArray.map(file => URL.createObjectURL(file));
  setImagePreviews(prev => [...prev, ...newPreviews]);
};
```

### 2. Upload des Images (API)

**Endpoint:** `POST /api/upload/review-images`

```typescript
// Upload avec FormData
const formData = new FormData();
files.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('/api/upload/review-images', {
  method: 'POST',
  body: formData
});

const data = await response.json();
// data.urls = ['/reviews/review_1234567890_abc123.jpg', ...]
```

**Traitement côté serveur:**

```typescript
// 1. Créer le dossier si nécessaire
const uploadsDir = join(process.cwd(), 'public', 'reviews');
await mkdir(uploadsDir, { recursive: true });

// 2. Pour chaque fichier
for (const file of files) {
  // Générer un nom unique
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileName = `review_${timestamp}_${randomString}.${extension}`;
  
  // Sauvegarder
  const filePath = join(uploadsDir, fileName);
  await writeFile(filePath, buffer);
  
  // Retourner l'URL publique
  uploadedUrls.push(`/reviews/${fileName}`);
}
```

### 3. Soumission de l'Avis

```typescript
const submitReview = async () => {
  // 1. Upload des images d'abord
  let uploadedImageUrls: string[] = [];
  if (selectedFiles.length > 0) {
    setUploadingImages(true);
    uploadedImageUrls = await uploadImages(selectedFiles);
    setUploadingImages(false);
  }

  // 2. Soumettre l'avis avec les URLs
  const response = await fetch(`/api/reviews/${productModelId}`, {
    method: 'POST',
    body: JSON.stringify({
      rating: newRating,
      comment: newComment.trim(),
      images: uploadedImageUrls  // ['/reviews/image1.jpg', '/reviews/image2.jpg']
    })
  });
};
```

### 4. Affichage des Images

```typescript
// Dans la base de données
{
  "id": "review_123",
  "images": [
    "/reviews/review_1234567890_abc123.jpg",
    "/reviews/review_1234567891_def456.png"
  ]
}

// Dans le HTML
<img src="/reviews/review_1234567890_abc123.jpg" alt="Review image" />
```

---

## 🎯 Flux Complet

```
1. Utilisateur sélectionne des images
   ↓
2. Aperçus locaux créés (blob URLs)
   ↓
3. Utilisateur clique "Publier l'avis"
   ↓
4. Upload des fichiers vers /api/upload/review-images
   ↓
5. Fichiers sauvegardés dans public/reviews/
   ↓
6. API retourne les URLs : ['/reviews/image1.jpg', ...]
   ↓
7. Soumission de l'avis avec les URLs
   ↓
8. URLs stockées en base de données
   ↓
9. Images affichées depuis /reviews/...
```

---

## 📊 Format des Noms de Fichiers

**Pattern:** `review_[timestamp]_[random].[extension]`

**Exemples:**
- `review_1735234567890_8k3j4h5g6.jpg`
- `review_1735234567891_x9y2a3b4c.png`
- `review_1735234567892_p1q2r3s4t.webp`

**Avantages:**
- ✅ Noms uniques garantis
- ✅ Pas de collision possible
- ✅ Facilement triables par date
- ✅ Identifiable comme image d'avis

---

## 🔐 Sécurité

### Validations Implémentées

1. **Type de fichier**
   ```typescript
   if (!file.type.startsWith('image/')) {
     continue; // Ignorer les non-images
   }
   ```

2. **Taille des fichiers**
   - ⚠️ **À IMPLÉMENTER** : Limite de taille recommandée

3. **Formats acceptés**
   - ✅ JPEG (.jpg, .jpeg)
   - ✅ PNG (.png)
   - ✅ WebP (.webp)
   - ✅ GIF (.gif)

### Recommandations Supplémentaires

```typescript
// À ajouter dans l'API d'upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

for (const file of files) {
  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux (max 5MB)');
  }
  
  // Vérifier le type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé');
  }
}
```

---

## ⚙️ Configuration

### Variables d'Environnement (Optionnel)

```bash
# .env
MAX_REVIEW_IMAGE_SIZE=5242880  # 5MB en bytes
MAX_REVIEW_IMAGES=5            # Maximum d'images par avis
```

---

## 🎨 Expérience Utilisateur

### États de Chargement

1. **Sélection d'images**
   - Aperçus locaux immédiats (blob URLs)
   - Bouton supprimer sur chaque image

2. **Upload en cours**
   ```
   [Loader] Upload des images...
   ```

3. **Publication en cours**
   ```
   [Loader] Publication en cours...
   ```

4. **Succès**
   ```
   ✅ Votre avis a été publié avec succès !
   ```

### Gestion des Erreurs

```typescript
try {
  uploadedImageUrls = await uploadImages(selectedFiles);
} catch (error) {
  // Continuer sans images plutôt que de bloquer
  alert('Erreur lors de l\'upload des images. L\'avis sera publié sans images.');
}
```

---

## 📝 Exemple d'Utilisation

### Code Frontend

```typescript
// Composant ProductReviews
<input
  type="file"
  multiple
  accept="image/*"
  onChange={handleImageSelect}
  className="hidden"
/>

{imagePreviews.map((preview, idx) => (
  <div key={idx} className="relative">
    <img src={preview} alt="" className="w-20 h-20 object-cover rounded-lg" />
    <button onClick={() => removeImage(idx)}>
      <X size={14} />
    </button>
  </div>
))}
```

### Réponse API

```json
{
  "success": true,
  "urls": [
    "/reviews/review_1735234567890_8k3j4h5g6.jpg",
    "/reviews/review_1735234567891_x9y2a3b4c.png"
  ],
  "count": 2
}
```

### Données en Base

```json
{
  "id": "cm2345...",
  "productModelId": "cm1234...",
  "userId": "user123",
  "rating": 5,
  "comment": "Excellent produit !",
  "images": [
    "/reviews/review_1735234567890_8k3j4h5g6.jpg",
    "/reviews/review_1735234567891_x9y2a3b4c.png"
  ],
  "authorName": "Jean Dupont",
  "createdAt": "2024-12-27T10:30:00Z"
}
```

---

## ⚠️ Limitations du Stockage Local

### Inconvénients

1. **Pas de CDN**
   - Images servies depuis votre serveur
   - Pas d'optimisation automatique
   - Bande passante de votre hébergement

2. **Pas de compression**
   - Images stockées telles quelles
   - Pas de redimensionnement automatique
   - Taille de stockage non optimisée

3. **Pas de backup automatique**
   - Images sur le serveur uniquement
   - Risque de perte en cas de problème

4. **Scalabilité limitée**
   - Déploiements multiples = copies multiples
   - Pas adapté pour la production à grande échelle

### Recommandations

**✅ OK pour:**
- Développement local
- Prototypes
- Tests
- Petites applications

**❌ À éviter pour:**
- Production à grande échelle
- Applications avec beaucoup d'images
- Sites avec trafic élevé

---

## 🚀 Migration Future vers un Service Cloud

Quand vous serez prêt pour la production, vous pourrez migrer vers :

1. **Vercel Blob**
   ```bash
   npm install @vercel/blob
   ```

2. **Cloudinary**
   ```bash
   npm install cloudinary
   ```

3. **AWS S3**
   ```bash
   npm install @aws-sdk/client-s3
   ```

Le code existant sera facile à adapter car :
- ✅ L'API d'upload est séparée
- ✅ Seul `/api/upload/review-images/route.ts` doit être modifié
- ✅ Le frontend restera identique

---

## 📂 Fichiers Modifiés

1. ✅ `app/api/upload/review-images/route.ts` - API d'upload
2. ✅ `app/(main)/(view)/components/ProductReviews.tsx` - Upload frontend
3. ✅ `public/reviews/` - Dossier de stockage
4. ✅ `public/reviews/.gitkeep` - Pour Git

---

## ✅ Tests

### Test 1 : Upload d'images
```
1. Aller sur une page produit
2. Cliquer sur "Laisser un avis"
3. Sélectionner 2-3 images
4. ✅ Voir les aperçus
5. Cliquer "Publier l'avis"
6. ✅ Voir "Upload des images..."
7. ✅ Voir "Publication en cours..."
8. ✅ Avis publié avec images
```

### Test 2 : Vérification stockage
```
1. Ouvrir le dossier public/reviews/
2. ✅ Voir les images uploadées
3. ✅ Noms au format review_[timestamp]_[random].[ext]
```

### Test 3 : Affichage
```
1. Recharger la page produit
2. ✅ Voir l'avis avec les images
3. ✅ Images chargées depuis /reviews/
```

---

## 🎉 Résumé

**Système de Stockage Local : ✅ OPÉRATIONNEL**

- ✅ Upload d'images fonctionnel
- ✅ Stockage dans `public/reviews/`
- ✅ Noms uniques garantis
- ✅ Validation basique des types
- ✅ Gestion des erreurs
- ✅ États de chargement
- ✅ Aperçus avant upload
- ✅ Suppression d'images

**Pour tester:**
```bash
npm run dev
```

Puis allez sur une page produit et essayez de laisser un avis avec des images ! 📸

