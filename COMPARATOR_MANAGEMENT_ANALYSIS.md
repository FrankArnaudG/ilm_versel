# Analyse de la Gestion du Comparateur Actuel

## 📋 Vue d'ensemble

Le comparateur de produits est géré à travers plusieurs couches :
1. **Context React** (`ComparatorContext`) : Gestion de l'état global côté client
2. **localStorage** : Persistance locale des produits dans le comparateur
3. **Base de données** : Sauvegarde des comparaisons pour analytics et historique
4. **API Route** : Endpoint pour sauvegarder/récupérer les comparaisons

---

## 🔍 Architecture Actuelle

### 1. **ComparatorContext** (`app/(main)/contexts/ComparatorContext.tsx`)

**État géré :**
- `products: Product[]` : Liste des produits dans le comparateur (max 3)
- `isComparatorOpen: boolean` : État d'ouverture du comparateur (non utilisé actuellement)

**Fonctions disponibles :**
- `addProduct(product)` : Ajouter un produit (vérifie limite de 3 et doublons)
- `removeProduct(productId)` : Retirer un produit
- `clearProducts()` : Vider le comparateur
- `openComparator()` / `closeComparator()` : Gérer l'état d'ouverture (non utilisé)
- `canAddMore: boolean` : Indique si on peut ajouter plus de produits

**Persistance :**
- ✅ **Chargement au montage** : Lit `localStorage.getItem('comparatorProducts')` au chargement
- ✅ **Sauvegarde automatique** : Sauvegarde dans `localStorage` à chaque modification via `useEffect`

**Problème identifié :**
- ⚠️ Le contexte utilise `localStorage` pour persister les produits, mais **ne synchronise PAS avec la base de données**
- ⚠️ Les produits sont stockés uniquement côté client jusqu'à ce qu'on clique sur "Effacer" ou "Enregistrer"

---

### 2. **Gestion du SessionId**

**Deux implémentations différentes :**

#### A. Page Comparateur (`/comparateur/page.tsx`)
```typescript
const [sessionId] = useState(() => {
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('sessionId', id);
  }
  return id;
});
```
- ✅ Utilise `localStorage.getItem('sessionId')`
- ✅ Génère un UUID si absent
- ⚠️ Clé : `'sessionId'`

#### B. Page Liste Produits (`[categoryName]/page.tsx`)
```typescript
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('comparatorSessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('comparatorSessionId', sessionId);
  }
  return sessionId;
};
```
- ✅ Utilise `localStorage.getItem('comparatorSessionId')`
- ✅ Génère un ID personnalisé si absent
- ⚠️ Clé : `'comparatorSessionId'` (DIFFÉRENTE de la page comparateur !)

**Problème identifié :**
- ⚠️ **Incohérence** : Deux clés différentes pour le même concept (`'sessionId'` vs `'comparatorSessionId'`)
- ⚠️ Deux formats différents (UUID vs format personnalisé)

---

### 3. **Sauvegarde en Base de Données**

#### A. Page Comparateur (`/comparateur/page.tsx`)
```typescript
// Sauvegarde AUTOMATIQUE quand les produits changent
useEffect(() => {
  if (products.length > 0 && !comparisonSaved) {
    saveComparison();
  }
}, [products]);

const saveComparison = async () => {
  // Sauvegarde sans vider le comparateur
  // Utilise 'sessionId' (UUID)
}
```
- ✅ Sauvegarde **automatique** quand on ajoute/retire un produit
- ✅ Ne vide **PAS** le comparateur après sauvegarde
- ⚠️ Utilise `'sessionId'` (UUID)

#### B. Page Liste Produits (`[categoryName]/page.tsx`)
```typescript
const saveComparison = async () => {
  // Sauvegarde MANUELLE (bouton "Effacer")
  // Utilise 'comparatorSessionId' (format personnalisé)
  // Vide le comparateur après sauvegarde
  clearProducts();
}
```
- ✅ Sauvegarde **manuelle** (bouton "Effacer")
- ✅ Vide le comparateur après sauvegarde
- ⚠️ Utilise `'comparatorSessionId'` (format personnalisé)

**Problème identifié :**
- ⚠️ **Deux comportements différents** :
  - Page comparateur : Sauvegarde automatique + garde les produits
  - Page liste : Sauvegarde manuelle + vide les produits
- ⚠️ **Deux sessionIds différents** pour la même session utilisateur

---

### 4. **API Route** (`/api/comparisons/route.ts`)

**POST `/api/comparisons`** :
- Reçoit : `{ productIds: string[], sessionId: string }`
- Crée une entrée `ProductComparison` en base de données
- Lie à l'utilisateur si connecté (`userId`)
- Stocke `sessionId`, `ipAddress`, `userAgent` pour analytics

**GET `/api/comparisons`** :
- Récupère les comparaisons de l'utilisateur connecté uniquement
- ⚠️ **Ne récupère PAS les comparaisons par sessionId** (pour utilisateurs non connectés)

**Problème identifié :**
- ⚠️ Les utilisateurs non connectés ne peuvent pas récupérer leurs comparaisons
- ⚠️ Pas de synchronisation entre le localStorage et la base de données

---

## 🔄 Flux de Données Actuel

### Scénario 1 : Utilisateur ajoute un produit
1. Clic sur "Comparer" → `addProduct(product)` dans `ComparatorContext`
2. `ComparatorContext` met à jour `products` state
3. `useEffect` sauvegarde dans `localStorage.setItem('comparatorProducts', ...)`
4. ✅ Produit visible dans le comparateur (badge, bande en bas, etc.)

### Scénario 2 : Utilisateur va sur `/comparateur`
1. Page charge → `useComparator()` récupère `products` depuis le contexte
2. `useEffect` détecte `products.length > 0` → Sauvegarde automatique en BDD
3. Utilise `localStorage.getItem('sessionId')` (UUID)
4. ✅ Produits affichés + sauvegarde automatique

### Scénario 3 : Utilisateur clique sur "Effacer" (page liste)
1. Clic sur "Effacer" → `saveComparison()`
2. Utilise `localStorage.getItem('comparatorSessionId')` (format personnalisé)
3. Sauvegarde en BDD via `/api/comparisons`
4. `clearProducts()` → Vide le comparateur
5. ✅ Comparaison sauvegardée + comparateur vidé

---

## ⚠️ Problèmes Identifiés

### 1. **Incohérence des SessionIds**
- Page comparateur : `'sessionId'` (UUID)
- Page liste : `'comparatorSessionId'` (format personnalisé)
- **Impact** : Deux comparaisons différentes pour la même session utilisateur

### 2. **Pas de Synchronisation BDD ↔ localStorage**
- Les produits sont dans `localStorage` mais pas toujours en BDD
- Si l'utilisateur ferme le navigateur, les produits sont perdus (sauf si sauvegardés)
- Pas de récupération des comparaisons depuis la BDD au chargement

### 3. **Comportements Différents**
- Page comparateur : Sauvegarde automatique + garde les produits
- Page liste : Sauvegarde manuelle + vide les produits
- **Impact** : Expérience utilisateur incohérente

### 4. **IDs Temporaires**
- Produits depuis sections "Nouveau" : `id: 'new-${index}'`
- Produits depuis sections "Recommandés" : `id: 'rec-${index}'`
- Produits depuis BrandSection : `id: '${category}-${name}'`
- **Impact** : Ces IDs ne correspondent pas à des `ProductModel` réels en BDD

### 5. **Pas de Récupération pour Utilisateurs Non Connectés**
- GET `/api/comparisons` nécessite un utilisateur connecté
- Les utilisateurs anonymes ne peuvent pas récupérer leurs comparaisons

---

## ✅ Recommandations

### 1. **Unifier le SessionId**
- Utiliser une seule clé : `'comparatorSessionId'`
- Utiliser un format unique (UUID recommandé)
- Créer une fonction utilitaire partagée

### 2. **Synchroniser localStorage ↔ BDD**
- Au chargement : Récupérer les comparaisons depuis la BDD (si connecté)
- Sauvegarder automatiquement en BDD à chaque modification
- Garder localStorage comme cache local

### 3. **Unifier le Comportement**
- Décider : Sauvegarde automatique OU manuelle ?
- Si automatique : Ne pas vider le comparateur
- Si manuelle : Vider après sauvegarde

### 4. **Gérer les IDs Temporaires**
- Filtrer les produits avec IDs temporaires avant sauvegarde
- OU permettre de sauvegarder même avec IDs temporaires (pour analytics)

### 5. **Récupération pour Utilisateurs Anonymes**
- Ajouter un endpoint GET qui accepte `sessionId` en paramètre
- Permettre de récupérer les comparaisons par sessionId

---

## 📊 Résumé de la Gestion Actuelle

| Aspect | État Actuel | Problème |
|--------|-------------|----------|
| **Stockage Client** | `localStorage.getItem('comparatorProducts')` | ✅ Fonctionne |
| **SessionId Page Comparateur** | `localStorage.getItem('sessionId')` (UUID) | ⚠️ Incohérent |
| **SessionId Page Liste** | `localStorage.getItem('comparatorSessionId')` (personnalisé) | ⚠️ Incohérent |
| **Sauvegarde Auto (Comparateur)** | ✅ Oui, automatique | ✅ Fonctionne |
| **Sauvegarde Manuelle (Liste)** | ✅ Oui, bouton "Effacer" | ✅ Fonctionne |
| **Vidage après Sauvegarde** | Page liste : ✅ Oui<br>Page comparateur : ❌ Non | ⚠️ Incohérent |
| **Récupération BDD** | ❌ Non implémenté | ⚠️ Manquant |
| **IDs Temporaires** | ⚠️ Acceptés mais invalides | ⚠️ Problème potentiel |

---

## 🎯 Conclusion

Le comparateur fonctionne **côté client** via `localStorage` et le contexte React, mais il y a des **incohérences** dans la gestion des sessionIds et des comportements différents entre les pages. La sauvegarde en base de données fonctionne, mais il manque la **synchronisation bidirectionnelle** et la **récupération** des comparaisons.

