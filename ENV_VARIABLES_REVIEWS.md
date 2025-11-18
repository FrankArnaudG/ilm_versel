# Variables d'environnement pour le système de notation

## 📝 Variable à ajouter dans votre fichier `.env`

Ajoutez cette ligne dans votre fichier `.env` :

```bash
# Modération des avis produits
# Si activée (true), les avis doivent être approuvés par un SuperAdmin avant d'être visibles
# Si désactivée (false), les avis sont immédiatement visibles après soumission
ENABLE_REVIEW_MODERATION=false
```

## ⚙️ Configuration

### Désactiver la modération (recommandé pour commencer)
```bash
ENABLE_REVIEW_MODERATION=false
```
Les avis sont automatiquement approuvés et visibles immédiatement après soumission.

### Activer la modération
```bash
ENABLE_REVIEW_MODERATION=true
```
Les avis doivent être approuvés par un SuperAdmin avant d'être visibles sur le site.

## 🔐 Accès à la page de modération

La page de modération est accessible uniquement aux utilisateurs avec le rôle `SUPER_ADMIN`.

URL : `/ilm2` (dans le menu Admin, section "Modération des avis")

## 🚀 Après l'ajout de la variable

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. La variable sera automatiquement chargée au démarrage de l'application.

