# Changelog

## [Non publié] - 2025-01-XX

### 🔄 Redirection sur la page de contact

#### Modifié

- `app/(main)/(view)/[locality]/contact/page.tsx` :
  - Vérification de la validité de la localité dans l'URL
  - Redirection automatique vers la page de contact de la localité choisie par l'utilisateur si la localité dans l'URL n'existe pas
  - Utilisation de la localité par défaut (Guadeloupe) si aucune localité n'est choisie
  - Affichage d'un écran de chargement pendant la redirection
  - Import de `useLocation` et `DEFAULT_LOCATION` pour récupérer la localité de l'utilisateur
- `app/(main)/(view)/[locality]/boutiques/page.tsx` :
  - Ajout de la Navbar en haut de la page pour la navigation
  - Vérification de la validité de la localité dans l'URL
  - Redirection automatique vers la page boutiques de la localité choisie par l'utilisateur si la localité dans l'URL n'existe pas
  - Utilisation de la localité par défaut (Guadeloupe) si aucune localité n'est choisie
  - Affichage d'un écran de chargement pendant la redirection
  - Import de `useLocation`, `DEFAULT_LOCATION` et `useRouter` pour gérer la redirection

### 👤 Menu Utilisateur dans la Navbar

#### Ajouté

- **Menu utilisateur dans la Navbar** :
  - Affichage d'un avatar avec l'initiale de l'utilisateur si connecté
  - Menu déroulant avec informations utilisateur (nom et email)
  - Lien vers la page de profil
  - Lien vers la page d'administration (`/view_admin/ilm2`) si l'utilisateur a un rôle admin (différent de USER)
  - Bouton de déconnexion
  - Lien "Connexion" si l'utilisateur n'est pas connecté
  - Version mobile avec affichage des informations utilisateur dans le menu latéral
  - Fermeture automatique du menu au clic en dehors

#### Modifié

- `app/(main)/(view)/components/Navbar.tsx` :
  - Import de `useCurrentUser` et `useActiveRoles` pour vérifier l'état de connexion et les rôles
  - Import de `logOut` pour la déconnexion
  - Import de l'icône `Settings` depuis lucide-react
  - Ajout du menu utilisateur dans la section "Right Icons"
  - Ajout du menu utilisateur mobile dans le menu latéral
  - Gestion de l'état `userMenuOpen` pour le menu déroulant
  - Vérification des rôles actifs pour afficher le lien Administration
  - Lien vers `/view_admin/ilm2` affiché uniquement si l'utilisateur a un rôle différent de USER
  - Effet pour fermer le menu au clic en dehors

### ❤️ Système de Liste de Souhaits (Wishlist)

#### Ajouté

- **Modèle WishlistItem** : Nouveau modèle Prisma pour gérer les listes de souhaits des clients
  - Champs : id, userId, productModelId, createdAt, updatedAt
  - Contrainte unique sur userId + productModelId pour éviter les doublons
  - Index sur userId, productModelId et createdAt pour optimiser les recherches
  - Relations avec User et ProductModel avec suppression en cascade
- **API de gestion de la wishlist** :
  - Route `GET /api/customer/wishlist` : Récupère tous les produits de la wishlist de l'utilisateur connecté
  - Route `POST /api/customer/wishlist` : Ajoute un produit à la wishlist
  - Route `DELETE /api/customer/wishlist/[productModelId]` : Retire un produit de la wishlist
  - Route `GET /api/customer/wishlist/[productModelId]` : Vérifie si un produit est dans la wishlist
  - Protection par authentification (utilisateur connecté requis)
- **Bouton cœur sur la page de détails du produit** :
  - Positionné en haut à droite de l'image principale
  - Fond blanc circulaire avec ombre
  - Cœur violet (#800080) quand le produit est dans la wishlist
  - Cœur gris quand le produit n'est pas dans la wishlist
  - Indicateur de chargement pendant les opérations
  - Notifications toast pour confirmer les actions
- **Onglet Liste de souhaits dans le profil** :
  - Affichage de tous les produits ajoutés à la wishlist
  - Grille responsive avec images, prix et informations des produits
  - Bouton pour retirer un produit de la wishlist
  - Confirmation avec SweetAlert2 avant de retirer un produit
  - Message de succès après suppression réussie
  - État de chargement et message quand la liste est vide
  - Navigation vers la page de détails du produit au clic

#### Modifié

- `prisma/schema.prisma` :
  - Ajout du modèle WishlistItem
  - Ajout de la relation wishlistItems dans User
  - Ajout de la relation wishlistItems dans ProductModel
- `app/(main)/(view)/[locality]/[brandName]/[categoryName]/[id]/page.tsx` :
  - Ajout du bouton cœur sur l'image du produit
  - Vérification automatique de l'état de la wishlist au chargement
  - Fonction handleToggleWishlist pour ajouter/retirer de la wishlist
  - Notifications toast pour les actions de wishlist
- `app/(main)/(profil)/profile/page.tsx` :
  - Ajout de l'interface WishlistProduct
  - Chargement automatique de la wishlist quand l'onglet est actif
  - Affichage des produits dans une grille responsive
  - Fonction handleRemoveFromWishlist pour retirer un produit
  - Utilisation de la localité sélectionnée par l'utilisateur (depuis le contexte LocationContext, cookie ou localStorage) au lieu de "martinique" en dur
  - Fonction getLocality() pour récupérer la localité avec fallback sur la valeur par défaut "Guadeloupe"
  - Ajout de SweetAlert2 pour la confirmation de retrait d'un produit de la wishlist
  - Message de confirmation avec le nom du produit avant suppression
  - Message de succès après suppression réussie
  - Message d'erreur en cas d'échec de la suppression
  - Ajout de la Navbar en haut de la page pour la navigation

## [Non publié] - 2025-01-XX

### 📧 Système de Newsletter

#### Ajouté

- **Modèle NewsletterSubscriber** : Nouveau modèle Prisma pour stocker les souscripteurs à la newsletter
  - Champs : id, email (unique), createdAt, updatedAt
  - Index sur email et createdAt pour optimiser les recherches
- **API d'inscription à la newsletter** : Route `/api/newsletter/subscribe`
  - Validation de l'email (format et unicité)
  - Gestion des erreurs et messages appropriés
  - Retourne un message de succès avec les informations du souscripteur
- **Section Newsletter améliorée** :
  - Intégration avec l'API pour sauvegarder les emails
  - Affichage de notifications toast de succès/erreur
  - Gestion de l'état de chargement pendant l'inscription
  - Support de la touche Entrée pour soumettre le formulaire
- **Page admin Newsletter** : Nouvelle page dans le panneau d'administration
  - Affichage de la liste des souscripteurs avec pagination
  - Recherche par email
  - Export des emails en format PDF
  - Accessible uniquement aux SuperAdmin
- **API admin Newsletter** : Route `/api/(admin)/newsletter/subscribers`
  - Récupération paginée des souscripteurs
  - Recherche par email (insensible à la casse)
  - Protection par authentification (SuperAdmin uniquement)

#### Modifié

- `prisma/schema.prisma` : Ajout du modèle NewsletterSubscriber
- `app/(main)/(view)/[locality]/page.tsx` :
  - Modification du composant NewsletterSection pour utiliser l'API
  - Ajout des notifications toast pour le feedback utilisateur
  - Gestion des états de chargement et d'erreur
- `app/(main)/view_admin/ilm2/page.tsx` :
  - Ajout de l'item "Newsletter" au menu admin (visible uniquement pour SuperAdmin)
  - Création du composant NewsletterSubscribersPage avec fonctionnalités d'affichage et d'export PDF

### 🔗 Lien Boutique dans la Navbar

#### Modifié

- `app/(main)/(view)/components/Navbar.tsx` :
  - Ajout du lien "Boutique" au début de la navigation (version desktop et mobile)
  - Le lien pointe vers `/${selectedLocation?.name}/boutique`
  - Style cohérent avec les autres liens de navigation

### 🏪 Section Boutique sur la page d'accueil

#### Ajouté

- **Section Boutique** : Nouvelle section sur la page d'accueil affichant les 12 derniers produits
  - Positionnée après la section NewsletterSection
  - Affichage en grille responsive (1-4 colonnes selon la taille d'écran)
  - Chaque produit affiche l'image, la désignation, la marque, les couleurs disponibles et le prix
  - Bouton "Comparer" au survol pour ajouter au comparateur
  - Bouton "Voir plus" qui redirige vers la page boutique complète
  - Utilise l'API `/api/produits/${locality}/search?limit=12` pour récupérer les produits
  - Gestion des états de chargement et d'erreur
  - Intégration du comparateur de produits avec notifications

#### Modifié

- `app/(main)/(view)/[locality]/page.tsx` :
  - Ajout de la section BoutiqueSection après NewsletterSection
  - Ajout des interfaces TypeScript nécessaires (ProductModel, ProductColor, ProductVariant, Article, ProductImage)
  - Ajout de l'import `Check` depuis lucide-react

### 🔍 Fonctionnalité de recherche et page boutique

#### Ajouté

- **Route API de recherche** : Nouvelle route `/api/produits/[locality]/search` pour rechercher des produits par localité
  - Recherche dans la désignation, marque, catégorie, référence et description
  - Retourne les produits avec leurs variantes, articles, couleurs et images
  - Gère le cas sans terme de recherche (retourne tous les produits actifs)
  - Filtre par localité et stock disponible uniquement
- **Popup de recherche dans la Navbar** :
  - Popup modal avec suggestions en temps réel lors de la saisie
  - Debounce de 300ms pour optimiser les appels API
  - Affichage des suggestions avec image, nom, marque, catégorie et prix
  - Navigation vers la page boutique avec le terme de recherche
  - Raccourcis clavier (Entrée pour rechercher, Esc pour fermer)
- **Page boutique** : Nouvelle page `/[locality]/boutique` pour afficher les résultats de recherche
  - Affichage des produits avec ou sans terme de recherche
  - Filtres fonctionnels (prix, gamme, stockage, couleur, état)
  - Tri par prix, nom ou en vedette
  - Vues grille et liste
  - Pagination avec sélection du nombre d'éléments par page
  - Intégration du comparateur de produits
  - Barre de recherche dans le hero banner
  - Gestion des états de chargement et d'erreur

#### Modifié

- `app/(main)/(view)/[locality]/page.tsx` :
  - Ajout du popup de recherche dans la Navbar avec gestion d'état
  - Intégration des suggestions de recherche en temps réel
  - Gestion des raccourcis clavier pour la recherche
- `app/api/(user_view)/produits/[locality]/search/route.ts` :
  - Nouvelle route API pour la recherche de produits par localité
  - Support de la recherche avec ou sans terme de recherche
  - Formatage des données identique aux autres routes produits

## [Non publié] - 2025-01-XX
### 🎯 Système de recommandations de produits avec toast et modal

#### Ajouté

- **Route API POST `/api/products/models/recommendations`** :
  - Création/mise à jour des recommandations de produits depuis l'admin
  - Validation de l'authentification et des permissions (products.create/update)
  - Vérification de l'existence des produits (principal et recommandés)
  - Suppression automatique des anciennes recommandations avant création des nouvelles
  - Support des types de recommandation (ACCESSORY, COMPLEMENTARY, UPGRADE, ALTERNATIVE, BUNDLE)
  - Gestion des priorités, remises bundle et descriptions
- **Toast de confirmation** : Affichage d'un toast de 2 secondes lors de l'ajout au panier
- **Modal de recommandations** : Modal automatique après ajout au panier affichant les produits recommandés
  - Groupement par type de recommandation (ACCESSORY, COMPLEMENTARY, etc.)
  - Slider horizontal pour chaque catégorie avec overflow-x-auto
  - Design cohérent avec le reste du site
- **Interface admin de gestion des recommandations** :
  - Bouton "Définir des produits recommandés" sur chaque modèle (vue Grille et Liste)
  - Modal de sélection avec recherche de produits (`RecommendProductsModal`)
  - Multi-sélection de produits à recommander
  - Choix du type de recommandation pour chaque produit (ACCESSORY, COMPLEMENTARY, UPGRADE, ALTERNATIVE, BUNDLE)
  - Configuration de la priorité (1-10) pour chaque recommandation
  - Envoi des données vers l'API POST `/api/products/models/recommendations`
- **Composant `RecommendProductsModal`** : Nouveau composant réutilisable pour la gestion des recommandations dans l'admin

#### Modifié

- `app/(main)/(view)/[locality]/[brandName]/[categoryName]/[id]/page.tsx` :
  - Remplacement de l'alert par un toast de 2 secondes lors de l'ajout au panier
  - Ajout du composant `RecommendationsModal` avec groupement par type et sliders horizontaux
  - Ouverture automatique du modal après ajout au panier
- `app/(main)/view_admin/components/ProductModelsPage.tsx` :
  - Ajout du bouton "Définir des produits recommandés" sur chaque carte produit
  - Import et utilisation du composant `RecommendProductsModal`
  - Intégration avec l'API POST `/api/products/models/recommendations`
- `app/(main)/view_admin/components/products/RecommendProductsModal.tsx` :
  - Nouveau composant modal pour la gestion des recommandations
  - Recherche de produits par nom, marque, référence ou catégorie
  - Multi-sélection avec configuration individuelle du type et de la priorité
  - Gestion des erreurs et feedback utilisateur
- `app/(main)/(view)/[locality]/[brandName]/[categoryName]/[id]/page.tsx` :
  - Amélioration du modal de recommandations avec labels lisibles pour les types (🔌 Accessoires, ✨ Produits complémentaires, etc.)

#### Impact

- Les administrateurs peuvent désormais définir des produits recommandés pour chaque modèle
- Les utilisateurs voient automatiquement des suggestions de produits complémentaires après ajout au panier
- Amélioration de l'expérience utilisateur avec des recommandations contextuelles
- Augmentation potentielle du panier moyen grâce aux suggestions pertinentes

### 🌱 Seeder pour générer des produits de test

#### Ajouté

- **Seeder Prisma** : Nouveau fichier `prisma/seed.ts` pour générer automatiquement des données de test
  - Récupère automatiquement les stores, catégories et marques depuis la base de données
  - Génère au moins 5 ProductModel pour chaque combinaison store + catégorie + marque
  - Crée automatiquement les variantes, articles, couleurs, images et entrées de stock associées
  - Génère des données réalistes avec prix, stock, spécifications, etc.
  - Script npm : `npm run seed` ou `npx prisma db seed`

#### Modifié

- `package.json` :
  - Ajout du script `seed` et configuration Prisma pour le seeding
- `prisma/seed.ts` :
  - Seeder complet qui génère des ProductModel, ProductVariant, Article, ProductColor, ProductImage, StockEntry et Supplier
  - Gestion intelligente des attributs de variantes selon la catégorie (stockage pour téléphones, taille pour montres, etc.)
  - Génération de prix en EUR ou FCFA selon la boutique
  - Création d'un fournisseur et d'un utilisateur système si nécessaire

### 🛍️ Intégration des produits nouveaux et recommandés depuis la base de données

#### Ajouté

- **Nouveaux champs dans ProductModel** : Ajout de 4 attributs booléens pour gérer la visibilité des produits :
  - `is_new` : Produit nouveau
  - `is_recommanded` : Produit recommandé
  - `is_our_best_seller` : Meilleure vente
  - `is_on_deal` : En promotion
- **API route pour produits mis en avant** : Nouvelle route `/api/produits/[locality]/featured` pour récupérer les produits nouveaux (`type=new`) ou recommandés (`type=recommended`) filtrés par localité et boutique

#### Modifié

- `prisma/schema.prisma` :
  - Ajout des 4 champs booléens dans le modèle `ProductModel` avec valeur par défaut `false`
- `app/api/(user_view)/produits/[locality]/featured/route.ts` :
  - Nouvelle route API pour récupérer les produits nouveaux ou recommandés avec leurs variantes et images
  - Filtrage par localité (Martinique, Guadeloupe, Guyane) et statut ACTIVE
  - Formatage des données pour l'affichage (prix en EUR ou FCFA, images, liens)
- `app/(main)/(view)/[locality]/page.tsx` :
  - `NewProductsSection` : Remplacement des données statiques par un appel API pour récupérer les produits avec `is_new = true`
  - `RecommendedSection` : Remplacement des données statiques par un appel API pour récupérer les produits avec `is_recommanded = true`
  - Ajout d'états de chargement et de gestion d'erreurs
  - Ajout de l'interface `FormattedProduct` pour typer les produits
  - Adaptation du formatage des prix (EUR/FCFA) pour le comparateur

#### Impact

- Les sections "Nouveau Produits" et "Recommandés pour vous" affichent désormais les produits depuis la base de données
- Les administrateurs peuvent définir manuellement les produits à mettre en avant via les champs booléens dans la base de données
- Les produits sont automatiquement filtrés par localité et boutique

## [Non publié] - 2025-11-10

### 🗺️ Amélioration de la page des boutiques - Centrage et zoom dynamiques

#### Ajouté

- **Centrage de la carte sur une boutique** : Clic sur une boutique dans la liste pour centrer la carte sur sa position avec zoom à 15
- **Zoom personnalisé par département** : Configuration du zoom initial par département dans `LOCATION_CONFIG` :
  - Martinique : zoom 11
  - Guadeloupe : zoom 11
  - Guyane : zoom 9
- **Bouton de réinitialisation** : Bouton "Réinitialiser la vue" visible quand la carte est centrée sur une boutique pour revenir à la vue par défaut
- **Feedback visuel** : Les cartes de boutique dans la liste sont cliquables avec effet hover (bordure violette)

#### Modifié

- `app/(main)/(view)/[locality]/boutiques/page.tsx` :
  - Remplacement de `LOCATION_CENTERS` par `LOCATION_CONFIG` avec support du zoom par département
  - Ajout d'états `mapCenter` et `mapZoom` pour contrôler dynamiquement la carte
  - Fonction `handleFocusBoutique()` pour centrer la carte sur une boutique
  - Fonction `handleResetMap()` pour réinitialiser la vue
  - Ajout de `stopPropagation()` sur les boutons pour éviter le déclenchement du centrage lors des clics sur les actions

## [Non publié] - 2025-11-10

### 🚚 Intégration Chronopost – Corrections critiques d'appel SOAP

#### Modifié

- `lib/chronopost/config.ts` :
  - Remplacement de l'URL SOAP par l'endpoint service (sans `?wsdl`) pour l'appel POST: `https://www.chronopost.fr/shipping-cxf/ShippingServiceWS`.
  - Corrections des messages d'erreur de validation des credentials par localité (Guyane/Martinique inversés).
- `lib/chronopost/client.ts` :
  - Utilisation correcte de `idEmit` dans `headerValue` (`CHRFR`) au lieu de la civilité.
  - Mise à jour de l'en-tête `SOAPAction` avec l'URI complet de l'opération: `http://cxf.shipping.soap.chronopost.fr/shippingMultiParcelV4`.

### 🧾 Page détail produit — Zone scrollable pour texte long

#### Modifié

- `app/(main)/(view)/[locality]/[brandName]/[categoryName]/[id]/page.tsx` :
  - Ajout d’une zone à hauteur maximale avec `overflow-y-auto` autour du contenu des onglets “Description” et “Caractéristiques” afin d’afficher une barre de défilement quand le contenu est long.
  - Ajout d’un toast de confirmation (2s) lors de l’ajout au panier et ouverture d’un modal présentant des produits recommandés, groupés par type et avec slider horizontal.

### ⭐ Recommandations produits

#### Ajouté

- `prisma/schema.prisma` (déjà présent mais confirmé/structuré) :
  - Modèle `RecommendedProduct` avec relations `mainProduct` et `recommendedProduct` vers `ProductModel`, champs `relationType`, `priority`, `bundleDiscount`, `bundlePrice`, `isActive`.
- `app/(main)/view_admin/components/ProductModelsPage.tsx` :
  - Bouton “Définir recommandations” (grille et liste) ouvrant un modal.
  - Modal de sélection de modèles recommandés (recherche, multi-sélection, choix du `relationType`) avec envoi vers `/api/products/models/recommendations`.

#### Impact

- Après l’ajout au panier, l’utilisateur voit immédiatement des suggestions pertinentes à ajouter, avec une UX conforme (carousel/slider horizontal).
- Les administrateurs peuvent configurer les produits recommandés par modèle depuis l’interface d’administration.

#### Impact

- Les créations d'envois via `shippingMultiParcelV4` ne sont plus dirigées vers le WSDL et respectent le `SOAPAction` attendu par Chronopost.
- Évite les erreurs d'authentification liées à un `idEmit` invalide.
- Messages d'erreurs `.env` cohérents avec les comptes réellement utilisés par localité.
- Meilleure lisibilité des pages produit lorsque la description ou les caractéristiques sont très longues.

Tous les changements notables de ce projet seront documentés dans ce fichier.

## [Non publié] - 2025-11-06

### 👤 Ajout du champ nom dans l'inscription

#### Ajouté

- **Champ nom dans le formulaire d'inscription** : Ajout d'un champ "Nom complet" dans le formulaire d'inscription avec validation
- **Validation du nom** : Le nom doit contenir entre 2 et 50 caractères

#### Modifié

- **RegisterSchema** : Ajout du champ `name` dans le schéma de validation Zod
- **Page signUp** : Ajout du FormField pour le nom avec icône User
- **Action register** : Enregistrement du nom de l'utilisateur lors de la création du compte
- **Valeurs par défaut du formulaire** : Ajout de `name: ''` dans les defaultValues

#### Impact

- Les utilisateurs fournissent maintenant leur nom lors de l'inscription
- Le nom est enregistré directement dans la base de données lors de la création du compte
- Plus besoin de passer par la page `complete-profile` pour les utilisateurs qui s'inscrivent par email/mot de passe

## [Non publié] - 2025-11-06

### 📍 Amélioration du système de localisation avec redirection côté serveur

#### Ajouté

- **Gestion des cookies pour la localisation** : Ajout de fonctions utilitaires `setCookie`, `getCookie`, et `deleteCookie` dans `LocationContext`
- **Page serveur de redirection** : Création de `app/(main)/(view)/page.tsx` pour redirection SSR vers `/NomLocalisation`
- **Affichage dynamique de la localité** : Le nom de la localité choisie s'affiche maintenant dans le texte principal "On te livre en 24 heures le produit que tu aimes en [Localité]"
- **Redirection automatique lors du changement** : Lors du changement de localisation via le modal, redirection immédiate vers la nouvelle localité
- Localisation par défaut (Guadeloupe) dans `LocationContext`
- Propriété `isInitialized` dans le contexte pour éviter les flashs de popup
- Export de `DEFAULT_LOCATION` dans LocationContext

#### Modifié

- **Stockage de la localisation** : La localisation est maintenant sauvegardée à la fois dans `localStorage` (client) et dans des cookies (accessible côté serveur)
- **Redirection côté serveur** : La redirection vers la localisation se fait maintenant côté serveur pour de meilleures performances
- **Modal LocationModal** : Ajout de `router.push()` dans `handleKeepLocation` et `handleConfirm` pour rediriger immédiatement vers la localité choisie
- **HeroWithHelp** : Utilisation de `useParams()` pour récupérer la localité depuis l'URL et l'afficher dynamiquement
- Modal de localisation avec deux vues :
  - Vue 1 : Confirmation de la localisation actuelle avec options "Garder" ou "Choisir une autre"
  - Vue 2 : Liste complète des localisations disponibles
- **Architecture de routing** : Déplacement de la page principale vers `app/(main)/(view)/[locality]/page.tsx`
- Amélioration de l'UX : affichage d'abord de la localisation actuelle avant la liste complète
- État initial du modal changé de `true` à `false` pour éviter l'affichage prématuré
- Gestion de l'initialisation du contexte pour charger la localisation par défaut si aucune n'est sauvegardée
- Mise à jour des imports dans `[locality]/page.tsx` pour pointer vers `../contexts/LocationContext`

#### Corrections

- Correction du flash du popup au chargement grâce à `isInitialized`
- Suppression du code inutilisé `handleChangeLocation` dans Navbar
- Correction de la structure JSX avec fermeture correcte des balises
- Correction de `document.cookies` en `document.cookie`
- **Correction de la redirection** : Le changement de localisation redirige maintenant immédiatement sans nécessiter de rafraîchir la page

#### Architecture technique

- **Cookies** : `userLocation` et `locationConfirmed` avec expiration de 365 jours
- **SSR** : Lecture des cookies côté serveur pour redirection instantanée lors de l'accès à `/`
- **CSR** : Redirection côté client via `router.push()` lors du changement de localisation dans le modal
- **Synchronisation** : Les cookies et localStorage sont synchronisés pour une expérience cohérente
- **Paramètres dynamiques** : Utilisation de `useParams()` pour accéder au paramètre `[locality]` de l'URL

## [Non publié] - 2025-11-06

### 🔐 Système d'Authentification Complet

#### Ajouté

**API Routes**

- `app/api/user/update-profile/route.ts`: Endpoint PATCH pour mettre à jour le nom de l'utilisateur
  - Authentification requise
  - Validation des données (2-50 caractères)
  - Mise à jour sécurisée dans la base de données

**Base de données**

- Ajout du champ `password` (optionnel) au modèle User pour stocker les mots de passe hashés
- Ajout de l'enum `TokenType` avec les valeurs `EMAIL_VERIFICATION` et `PASSWORD_RESET`
- Ajout du champ `type` au modèle VerificationToken pour différencier les types de tokens
- Ajout d'index sur les champs `identifier` et `type` du modèle VerificationToken

**Schémas de validation**

- `LoginSchema`: Validation pour connexion avec email et mot de passe
- `RegisterSchema`: Validation pour inscription avec règles strictes de mot de passe (8 caractères min, majuscule, minuscule, chiffre)
- `ForgotPasswordSchema`: Validation pour demande de réinitialisation de mot de passe
- `ResetPasswordSchema`: Validation pour réinitialisation de mot de passe avec token
- `ChangePasswordSchema`: Validation pour modification de mot de passe (utilisateur connecté)

**Système d'emails**

- `lib/mail.ts`: Système d'envoi d'emails avec Resend
  - `sendVerificationEmail()`: Envoi d'email de vérification lors de l'inscription
  - `sendPasswordResetEmail()`: Envoi d'email de réinitialisation de mot de passe
- Templates HTML professionnels pour les emails

**Gestion des tokens**

- `lib/tokens.ts`: Gestion des tokens de sécurité
  - `generateVerificationToken()`: Génération de token de vérification d'email
  - `generatePasswordResetToken()`: Génération de token de réinitialisation de mot de passe
  - `verifyEmailToken()`: Vérification et validation d'un token de vérification d'email
  - `verifyPasswordResetToken()`: Vérification et validation d'un token de réinitialisation
- Tokens avec expiration de 1 heure
- Suppression automatique des anciens tokens

**Actions serveur**

- `actions/auth.ts`: Actions serveur complètes pour l'authentification
  - `login()`: Connexion avec email/mot de passe
  - `register()`: Inscription avec envoi d'email de vérification
  - `verifyEmail()`: Vérification d'email via token
  - `forgotPassword()`: Demande de réinitialisation de mot de passe
  - `resetPassword()`: Réinitialisation de mot de passe via token
  - `changePassword()`: Modification de mot de passe pour utilisateur connecté
- Hashage des mots de passe avec bcryptjs (10 rounds)
- Gestion des erreurs et messages de succès appropriés

**Configuration NextAuth**

- Ajout du `CredentialsProvider` dans `ts/auth.config.ts`
- Vérification automatique de l'email lors de la connexion par credentials
- Vérification du mot de passe hashé
- Mise à jour des callbacks NextAuth pour gérer l'authentification par credentials

**Pages d'authentification**

- `app/(auth)/signIn/page.tsx`: Page de connexion modernisée
  - Connexion par email/mot de passe
  - Connexion OAuth avec Google
  - Affichage/masquage du mot de passe
  - Lien vers mot de passe oublié
  - Lien vers page d'inscription
- `app/(auth)/verify-request/page.tsx`: Page de vérification améliorée
  - Design moderne cohérent avec l'application
  - Instructions claires et détaillées
  - Icônes et visuels informatifs
  - Liens vers connexion et renvoi d'email
  - Support utilisateur intégré
- `app/(auth)/signUp/page.tsx`: Page d'inscription complète

  - Formulaire avec validation en temps réel
  - Règles de mot de passe affichées
  - Confirmation de mot de passe
  - Connexion OAuth avec Google
  - Messages de succès/erreur

- `app/(auth)/forgot-password/page.tsx`: Page de demande de réinitialisation
  - Formulaire simple avec email
  - Envoi sécurisé (pas de révélation si l'email existe)
  - Messages informatifs
- `app/(auth)/reset-password/page.tsx`: Page de réinitialisation
  - Vérification du token dans l'URL
  - Formulaire de nouveau mot de passe
  - Validation des règles de mot de passe
  - Redirection automatique après succès
- `app/(auth)/verify-email/page.tsx`: Page de vérification d'email
  - Vérification automatique au chargement
  - Animation de chargement
  - Messages de succès/erreur
  - Redirection automatique vers connexion

**Pages de profil**

- `app/(main)/profile-test/page.tsx`: Page de test de profil
  - Affichage des informations utilisateur
  - Protection par authentification
  - Bouton de modification de mot de passe
  - Design moderne et responsive
- `app/(main)/change-password/page.tsx`: Page de modification de mot de passe
  - Vérification du mot de passe actuel
  - Formulaire complet avec 3 champs
  - Validation des règles de sécurité
  - Protection par authentification
  - Redirection après succès

**Routes**

- Ajout des nouvelles routes d'authentification dans `ts/routes.ts`:
  - `/signUp`: Inscription
  - `/verify-email`: Vérification d'email
  - `/forgot-password`: Mot de passe oublié
  - `/reset-password`: Réinitialisation de mot de passe

**Dépendances**

- Installation de `bcryptjs` et `@types/bcryptjs` pour le hashage des mots de passe
- Installation de `uuid` et `@types/uuid` pour la génération de tokens

#### Modifié

**Base de données**

- Le modèle User supporte maintenant l'authentification par mot de passe ET OAuth
- Le champ `password` est optionnel pour permettre les connexions OAuth sans mot de passe

**NextAuth**

- Suppression du provider `Resend` (remplacé par système custom)
- Configuration pour utiliser `CredentialsProvider` avec vérification d'email
- Amélioration du callback `signIn` pour vérifier l'email vérifié
- Callback `jwt` mis à jour pour rafraîchir le nom lors des updates de session
- Callback `session` mis à jour pour inclure le nom dans la session

**Page de connexion**

- Transformation de l'authentification par code email vers email/mot de passe
- Ajout du champ mot de passe avec affichage/masquage
- Amélioration de l'UX avec messages d'erreur clairs

**Page complete-profile**

- Correction du bug d'enregistrement du nom (API route manquante)
- Ajout du rafraîchissement de session après mise à jour
- Amélioration de l'UX avec toast notifications
- Utilisation de Next.js Image au lieu de <img>
- Gestion des erreurs améliorée
- Redirection vers la page d'accueil (`/`) après soumission (au lieu du dashboard)

**Middleware**

- Ajout de l'exception pour les routes `/api/user/*` pour permettre les mises à jour de profil
- Redirection vers la page d'accueil (`/`) quand l'utilisateur a déjà un nom et tente d'accéder à complete-profile
- Empêche l'accès à complete-profile pour les utilisateurs avec profil déjà complété

#### Sécurité

- ✅ Mots de passe hashés avec bcryptjs (10 rounds)
- ✅ Validation stricte des mots de passe (8 caractères min, majuscule, minuscule, chiffre)
- ✅ Tokens de sécurité avec expiration (1 heure)
- ✅ Vérification obligatoire de l'email avant connexion
- ✅ Suppression automatique des anciens tokens
- ✅ Messages d'erreur génériques pour éviter l'énumération d'emails
- ✅ Protection CSRF via NextAuth
- ✅ Sessions JWT sécurisées

#### UX/UI

- Design moderne et cohérent sur toutes les pages d'authentification
- Gradients et effets visuels (backdrop-blur, shadows)
- Animations de chargement
- Messages de succès/erreur clairs
- Redirections automatiques intelligentes
- Responsive design pour mobile et desktop
- Icônes Lucide pour une meilleure lisibilité

#### Architecture

- Séparation claire des responsabilités:
  - `lib/`: Utilitaires (mail, tokens, schemas)
  - `actions/`: Actions serveur
  - `app/(auth)/`: Pages publiques d'authentification
  - `app/(main)/`: Pages protégées nécessitant authentification
- Code réutilisable et maintenable
- Gestion d'erreurs robuste
- TypeScript pour la sécurité des types

---

## Notes de migration

⚠️ **Important**: Après avoir récupéré ce code, vous devez:

1. Exécuter la migration Prisma:

```bash
npx prisma migrate dev --name add_password_and_token_type
```

2. Configurer les variables d'environnement (si pas déjà fait):

```env
# NextAuth
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Resend (pour envoi d'emails)
AUTH_RESEND_KEY=your-resend-api-key

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# App URL (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Installer les dépendances si nécessaire:

```bash
npm install bcryptjs uuid
npm install --save-dev @types/bcryptjs @types/uuid
```

4. Tester le système:
   - S'inscrire avec un nouvel email
   - Vérifier l'email (cliquer sur le lien dans l'email)
   - Se connecter avec email/mot de passe
   - Tester le mot de passe oublié
   - Tester la modification de mot de passe depuis `/profile-test`

# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

## [Non publié] - 2025-01-XX

### ✨ Création de la page de contact

#### Ajouté

- **Page de contact** (`app/(main)/(view)/[locality]/contact/page.tsx`) :
  - Nouvelle page de contact affichant les informations de contact pour chaque département (Martinique, Guadeloupe, Guyane)
  - Section adresse principale avec les coordonnées complètes de chaque département
  - Section téléphones avec les numéros de téléphone par département (Service Client, Ventes, Support Technique, Service Après-Vente) avec horaires d'ouverture
  - Section WhatsApp avec les numéros WhatsApp par département et disponibilité
  - Section emails avec les adresses email par département (Service Client, Ventes, Support Technique, Service Après-Vente, Direction)
  - Liens cliquables pour téléphoner, envoyer un email ou ouvrir WhatsApp
  - Design responsive avec cartes élégantes et icônes Lucide
  - Intégration de la Navbar et du Footer pour une navigation cohérente
  - Liens vers les boutiques et retour à l'accueil

#### Modifié

- **Page principale** (`app/(main)/(view)/[locality]/page.tsx`) :
  - Mise à jour du lien "Demander à un spécialiste" pour pointer vers la page de contact (`/${locality}/contact`)
  - Remplacement de la balise `<a>` par `<Link>` de Next.js pour une navigation optimisée
  - Export du composant `Footer` pour permettre sa réutilisation dans d'autres pages

#### Détails techniques

- Utilisation de `useParams()` pour récupérer la localité depuis l'URL
- Normalisation du nom de la localité pour correspondre aux données de contact
- Gestion des clics sur les numéros de téléphone, emails et WhatsApp avec ouverture automatique des applications correspondantes
- Données de contact structurées par département avec informations complètes pour chaque service

### 🔧 Correction du z-index des modaux et ajout des fonctionnalités de modification/suppression

#### Corrigé

- **Page des boutiques** (`app/(main)/(view)/[locality]/boutiques/page.tsx`) :
  - Correction du problème où les modaux d'ajout et d'édition restaient cachés derrière la carte OpenStreetMap
  - Utilisation de `createPortal` de React pour rendre les modaux directement dans le `body`, en dehors de la hiérarchie DOM
  - Augmentation du z-index des modaux à `z-[1000]` pour qu'ils s'affichent au-dessus de la carte Leaflet (qui utilise des z-index autour de 400-500)
  - Les modaux s'affichent maintenant correctement au-dessus de la carte OpenStreetMap

#### Ajouté

- **Page des boutiques** (`app/(main)/(view)/[locality]/boutiques/page.tsx`) :
  - Boutons "Modifier" et "Supprimer" pour chaque boutique (visibles uniquement pour SUPER_ADMIN)
  - Modal d'édition avec formulaire pré-rempli pour modifier une boutique existante
  - Fonction de suppression avec confirmation avant suppression
  - États de chargement pour les actions de modification et suppression
  - Intégration avec les routes API PUT et DELETE existantes

### ✨ Intégration OpenStreetMap pour les boutiques physiques

#### Ajouté

- **Modèle Prisma `OfflineStoreLocation`** (`prisma/schema.prisma`) :

  - Nouveau modèle pour gérer les boutiques physiques avec les champs : id, nom, departement, adresse, latitude, longitude, telephone, google_map_link
  - Index sur le champ `departement` pour optimiser les requêtes par localité
  - Support pour les départements : Martinique, Guadeloupe, Guyane

- **Routes API pour les boutiques physiques** :

  - **GET `/api/(user_view)/boutiques/[locality]`** : Récupération de toutes les boutiques d'un département
  - **POST `/api/(user_view)/boutiques/[locality]`** : Création d'une nouvelle boutique (SUPER_ADMIN uniquement)
  - **PUT `/api/(user_view)/boutiques/[locality]/[id]`** : Modification d'une boutique (SUPER_ADMIN uniquement)
  - **DELETE `/api/(user_view)/boutiques/[locality]/[id]`** : Suppression d'une boutique (SUPER_ADMIN uniquement)
  - Validation des coordonnées géographiques (latitude entre -90 et 90, longitude entre -180 et 180)
  - Vérification des permissions SUPER_ADMIN pour toutes les opérations de modification

- **Page des boutiques** (`app/(main)/(view)/[locality]/boutiques/page.tsx`) :
  - Intégration d'OpenStreetMap avec react-leaflet pour afficher les boutiques sur une carte interactive
  - Centrage automatique de la carte selon la localité (coordonnées fixes par département)
  - Affichage des marqueurs pour chaque boutique avec popup contenant les informations
  - Table des boutiques avec colonnes : nom, département, adresse, téléphone
  - Boutons "Voir sur Google Maps" et "Itinéraire" pour chaque boutique
  - Modal d'ajout de boutique visible uniquement pour les utilisateurs SUPER_ADMIN
  - Formulaire de création avec validation des champs obligatoires
  - Gestion des erreurs et états de chargement
  - Responsive design avec layout adaptatif (carte + liste)

#### Détails techniques

- Utilisation de `react-leaflet` (déjà installé) pour l'intégration de la carte
- Import dynamique des composants Leaflet pour éviter les erreurs SSR
- Correction des icônes par défaut de Leaflet avec les CDN appropriés
- Coordonnées de centrage par département :
  - Martinique : 14.6415, -61.0242
  - Guadeloupe : 16.2650, -61.5510
  - Guyane : 4.9224, -52.3135
- Format des URLs Google Maps :
  - Voir sur Google Maps : `https://www.google.com/maps?q=latitude,longitude`
  - Itinéraire : `https://www.google.com/maps/dir/?api=1&destination=latitude,longitude`

## [Non publié] - 2025-11-10

### ✨ Ajout de la localité dans les liens du ProductSlider

#### Ajouté

- **Composant ProductSlider** (`[locality]/page.tsx`) :
  - Ajout de la localité dans tous les liens des produits du slider
  - Les liens pointent maintenant vers `/{locality}/{brandName}` au lieu de `/{brandName}`
  - Utilisation de `useParams()` pour récupérer la localité depuis l'URL
  - Retrait de `target="_blank"` et `rel="noopener noreferrer"` car les liens sont maintenant internes
  - Les liens fonctionnent correctement avec la structure de routage de l'application

### 🔧 Correction du z-index du panier (CartDrawer)

#### Corrigé

- **Composant panier** (`components/cart/CartComponents.tsx`) :
  - Correction du problème où le panier s'affichait derrière la NavBar et les headers lorsqu'on cliquait sur le CartIcon
  - Utilisation d'un portal React (`createPortal`) pour rendre le CartDrawer directement dans le `body`, en dehors de la hiérarchie DOM
  - Augmentation du `z-index` de l'overlay du panier de `z-[60]` à `z-[100]` pour qu'il s'affiche au-dessus de la NavBar (`z-50`) et des headers (`z-50`)
  - Augmentation du `z-index` du drawer du panier de `z-[70]` à `z-[110]` pour qu'il s'affiche au-dessus de tous les éléments de navigation
  - Le panier s'affiche maintenant correctement au-dessus de la NavBar et de tous les headers dans toutes les pages, même ceux avec `sticky top-0`

### 🔧 Correction de l'affichage de la notification de changement de localité

#### Corrigé

- **Page principale** (`[locality]/page.tsx`) :
  - Correction du problème où la notification de changement de localité ne s'affichait pas correctement
  - Modification de l'ordre d'exécution pour afficher la notification AVANT de changer la localité ou de rediriger
  - Ajout d'un `useRef` pour éviter les vérifications multiples pour la même combinaison de localité
  - Amélioration de la gestion du timeout pour nettoyer correctement les notifications précédentes
  - La notification s'affiche maintenant correctement lorsque la localité dans l'URL diffère de celle sélectionnée
  - Correction du `z-index` de la notification toast (`z-[100]`) pour qu'elle s'affiche au-dessus de la navbar (`z-50`)
- **Page produits** (`[locality]/[brandName]/[categoryName]/page.tsx`) :
  - Correction du `z-index` de la notification toast (`z-[100]`) pour qu'elle s'affiche au-dessus du header (`z-50`)

### ✨ Vérification et changement automatique de localité selon l'URL

#### Ajouté

- **Page principale** (`[locality]/page.tsx`) :
  - Vérification automatique de la localité dans l'URL au chargement de la page
  - Si la localité dans l'URL diffère de `selectedLocation`, changement automatique de la localité
  - Vérification que la nouvelle localité existe dans la liste des localités disponibles
  - Affichage d'une notification toast de succès lors du changement de localité
  - Redirection vers la localité par défaut ou la `selectedLocation` actuelle si la localité dans l'URL est invalide
  - Affichage d'une notification toast d'erreur lors de la redirection
- **Page produits par marque** (`[locality]/[brandName]/page.tsx`) :
  - Réutilise le même composant que `[locality]/[brandName]/[categoryName]/page.tsx`
  - La logique de vérification de localité est automatiquement appliquée
- **Page produits par marque et catégorie** (`[locality]/[brandName]/[categoryName]/page.tsx`) :
  - Vérification automatique de la localité dans l'URL au chargement de la page
  - Si la localité dans l'URL diffère de `selectedLocation`, changement automatique de la localité
  - Vérification que la nouvelle localité existe dans la liste des localités disponibles
  - Affichage d'une notification toast de succès lors du changement de localité
  - Redirection vers la localité par défaut ou la `selectedLocation` actuelle si la localité dans l'URL est invalide
  - Affichage d'une notification toast d'erreur lors de la redirection
  - Gestion correcte de la redirection avec ou sans `categoryName` dans l'URL

### 🔧 Correction des erreurs de linting dans le code de navigation dynamique

#### Corrigé

- **Page liste produits** (`[locality]/[brandName]/[categoryName]/page.tsx`) :
  - Remplacement de `var` par `let` ou `const` pour respecter les bonnes pratiques JavaScript
  - Remplacement de `==` par `===` pour les comparaisons strictes
  - Ajout de types explicites pour `mainElementName` (`string | null`)
  - Ajout de vérifications de nullité dans les conditions et le JSX pour éviter les erreurs TypeScript
  - Amélioration de la gestion des noms d'éléments dynamiques dans le breadcrumb et le titre de la page

### ✨ Support de la page produits sans catégorie

#### Ajouté

- **Page liste produits** (`[locality]/[brandName]/[categoryName]/page.tsx`) :
  - Support du paramètre `categoryName` optionnel
  - La page fonctionne maintenant avec ou sans `categoryName` dans l'URL
  - Filtrage uniquement sur `brandName` et `locality` lorsque `categoryName` n'est pas présent
- **Route API** (`/api/produits/[locality]/[brandName]/route.ts`) :
  - Nouvelle route API pour récupérer les produits par localité et marque sans catégorie
  - Filtrage des produits uniquement par `brandName` et `locality` lorsque `categoryName` n'est pas fourni
- **Route API existante** (`/api/produits/[locality]/[brandName]/[categoryName]/route.ts`) :
  - `categoryName` rendu optionnel dans les paramètres
  - Filtrage conditionnel : si `categoryName` est présent, filtre par catégorie, sinon filtre uniquement par marque et localité
- **Route page** (`[locality]/[brandName]/page.tsx`) :
  - Nouvelle route pour afficher les produits sans catégorie
  - Réutilise le même composant que la route avec `categoryName`

## [Non publié] - 2025-11-10

### 🔧 Correction du problème de double sauvegarde du comparateur

#### Corrigé

- **Page comparateur** (`comparateur/page.tsx`) :
  - Suppression de la sauvegarde automatique au chargement de la page
  - Sauvegarde uniquement manuelle via le bouton "Enregistrer la comparaison"
  - Ajout d'un mécanisme de vérification via `localStorage` pour éviter les sauvegardes multiples
  - Utilisation de `useRef` pour suivre les produits déjà sauvegardés sans causer de re-renders
- **Page liste produits** (`[locality]/[brandName]/[categoryName]/page.tsx`) :
  - Ajout d'un mécanisme de vérification via `localStorage` pour éviter les sauvegardes multiples
  - Vérification si la combinaison de produits a déjà été sauvegardée avant de sauvegarder
  - Affichage d'une notification "Comparaison déjà sauvegardée" si la combinaison existe déjà
- **Mécanisme partagé** :
  - Utilisation de `localStorage` avec la clé `savedComparisons` pour partager l'information entre les pages
  - Stockage des combinaisons de produits déjà sauvegardées pour éviter les doublons

### 🔧 Correction de l'erreur de sauvegarde du comparateur

#### Corrigé

- **API route `/api/comparisons`** :
  - Amélioration de la gestion d'erreur pour afficher des messages d'erreur plus détaillés
  - Ajout de logs détaillés pour faciliter le débogage
  - Retour d'informations supplémentaires en mode développement
- **Page liste produits** :
  - Amélioration de la fonction `saveComparison` pour mieux gérer les erreurs de l'API
  - Affichage du message d'erreur détaillé de l'API dans la notification toast
  - Gestion améliorée des erreurs avec affichage du message exact de l'API
- **Base de données** :
  - Synchronisation du schéma Prisma avec la base de données pour créer la table `product_comparisons`
  - La table `product_comparisons` est maintenant créée et accessible

## [Non publié] - 2025-11-10

### 🔧 Correction d'erreur de syntaxe JSX

#### Corrigé

- **Page liste de produits** (`[locality]/[brandName]/[categoryName]/page.tsx`) :
  - Correction de l'erreur de build "Expected '</', got 'jsx text ('" causée par une balise `</div>` manquante avant la fermeture du `<header>`. La structure JSX est maintenant correctement fermée.
  - Correction de l'erreur de build "Unterminated regexp literal" causée par une section "List View" dupliquée et mal structurée. La section dupliquée a été supprimée et la structure JSX est maintenant correcte.
  - Correction de l'erreur runtime "model is not defined" causée par du code orphelin utilisant `model` et `firstImage` en dehors de leur scope dans la section "Toolbar". Le code orphelin a été supprimé.

### 🆕 Extension du système de comparateur - Boutons universels

#### Ajouté

- **Composant ComparatorButton** : Nouveau composant réutilisable affichant l'icône du comparateur avec badge du nombre de produits
  - Positionné en haut à droite de toutes les pages (à côté du panier)
  - Affiche le nombre de produits dans le comparateur en temps réel
  - Navigation directe vers `/comparateur` au clic
- **Boutons "Comparer" sur toutes les sections** :
  - **Page d'accueil** :
    - Section "Nouveau Produits" : Bouton au survol de chaque produit
    - Section "Recommandés pour vous" : Bouton au survol de chaque produit
    - Section "Les grandes marques" (BrandSection) : Déjà implémenté précédemment
  - **Page liste de produits** (`[locality]/[brandName]/[categoryName]`) :
    - Boutons "Comparer" visibles au survol de chaque carte produit (vue grille et liste)
    - Synchronisation avec le comparateur global
    - Bande de comparateur en bas de page montrant les produits sélectionnés
  - **Page détail produit** (`[locality]/[brandName]/[categoryName]/[id]`) :
    - Bouton ComparatorButton dans l'en-tête de la page
    - Bouton "Ajouter au comparateur" à côté du bouton "Ajouter au panier"
    - Système de notification toast (succès/erreur/info) identique aux autres sections
    - Vérification si le produit est déjà dans le comparateur
    - Affichage de notification lors de l'ajout ou si la limite de 3 produits est atteinte
- **Badge dynamique** : Le compteur de produits dans le bouton ComparatorButton se met à jour automatiquement
- **États des boutons** :
  - Bouton activé : Fond blanc avec bordure violette
  - Bouton désactivé : Grisé avec opacité réduite quand 3 produits sont déjà sélectionnés
  - Bouton sélectionné : Fond violet avec check icon

#### Modifié

- **Toutes les navbars** : Ajout du `ComparatorButton` dans l'en-tête de :
  - Page d'accueil (`[locality]/page.tsx`)
  - Liste de produits (`[locality]/[brandName]/[categoryName]/page.tsx`)
  - Détail produit (`[locality]/[brandName]/[categoryName]/[id]/page.tsx`)
- **Sections de produits** : Transformation des cartes produits pour supporter le survol et l'affichage du bouton
- **NewProductsSection** :
  - Ajout du state `hoveredProduct` et gestion du clic avec `stopPropagation`
  - Ajout du système de notification toast (succès/erreur) identique à BrandSection
  - Affichage de notification lors de l'ajout d'un produit ou si la limite de 3 produits est atteinte
- **RecommendedSection** :
  - Ajout du state `hoveredProduct` et gestion du clic avec `stopPropagation`
  - Ajout du système de notification toast (succès/erreur) identique à BrandSection
  - Affichage de notification lors de l'ajout d'un produit ou si la limite de 3 produits est atteinte
- **Page liste produits** :
  - Intégration du contexte `ComparatorContext` et synchronisation avec la barre de comparateur locale
  - Ajout du système de notification toast (succès/erreur/info) identique aux autres sections
  - Affichage de notification lors de l'ajout ou retrait d'un produit du comparateur
  - Amélioration des boutons "Comparer" avec l'icône `GitCompare` pour cohérence visuelle
  - **Bande de comparateur en bas de page** :
    - Utilisation du comparateur global (`comparatorProducts`) au lieu du comparateur local
    - Affichage de la liste des produits du comparateur avec image, nom, marque, catégorie et prix
    - Bouton "Comparer" : Navigation vers la page `/comparateur` pour afficher la comparaison détaillée
    - Bouton "Effacer" : Sauvegarde de la comparaison en base de données puis vidage du comparateur
    - Gestion du `sessionId` pour les utilisateurs non connectés (stocké dans `localStorage`)
    - État de chargement pendant la sauvegarde ("Sauvegarde...")
    - Notification de succès/erreur lors de la sauvegarde
- **Page détail produit** :
  - Intégration du contexte `ComparatorContext`
  - Ajout de la fonction `handleAddToComparator` pour ajouter le produit au comparateur
  - Ajout du système de notification toast avec gestion des erreurs et succès
  - Vérification si le produit est déjà dans le comparateur avant l'ajout

#### Améliorations UX

- Boutons apparaissent uniquement au survol pour ne pas surcharger l'interface
- Feedback visuel immédiat lors de l'ajout d'un produit
- Badge rouge avec le nombre de produits toujours visible en haut à droite
- Navigation fluide vers le comparateur depuis n'importe quelle page
- Désactivation automatique des boutons quand la limite de 3 produits est atteinte

## [Non publié] - 2025-11-09

### 🔄 Système de comparateur de produits

#### Ajouté

- **Modèle de base de données** : Ajout du modèle `ProductComparison` dans le schéma Prisma pour enregistrer les comparaisons de produits avec support pour utilisateurs connectés et anonymes
- **Contexte React** : Création du `ComparatorContext` pour gérer l'état global du comparateur (ajout/suppression de produits, limite de 3 produits maximum)
- **Page Comparateur** : Nouvelle page `/comparateur` permettant de :
  - Afficher jusqu'à 3 produits côte à côte pour comparaison
  - Rechercher et ajouter des produits au comparateur
  - Comparer les caractéristiques techniques des produits
  - Sauvegarder automatiquement les comparaisons en base de données
  - Visualiser les prix, notes et spécifications de chaque produit
- **API Routes** :
  - `POST /api/comparisons` : Enregistrement des comparaisons avec tracking utilisateur/session
  - `GET /api/comparisons` : Récupération de l'historique des comparaisons pour les utilisateurs connectés
  - `GET /api/products/search` : Recherche de produits par nom, marque, catégorie ou référence
- **Intégration Interface** :
  - Ajout du bouton "Accéder au comparateur" dans la section BrandSection avec indicateur du nombre de produits
  - Bouton "Ajouter au comparateur" sur chaque produit (visible au survol) dans la section BrandSection
  - Badge affichant le nombre de produits actuellement dans le comparateur
  - Notifications toast élégantes pour les actions utilisateur
- **Composant Toast** : Système de notifications élégant avec animations

#### Modifié

- **Layout principal** : Ajout du `ComparatorProvider` pour rendre le contexte disponible dans toute l'application
- **Page d'accueil** : Intégration des fonctionnalités du comparateur dans la section BrandSection
- **API Routes** : Correction de l'import d'authentification (`@/ts/auth` au lieu de `@/auth`)

#### Fonctionnalités

- Comparaison simultanée de jusqu'à 3 produits maximum
- Persistance des produits sélectionnés dans localStorage
- Enregistrement automatique de chaque comparaison en base de données pour analytics
- Support utilisateurs connectés et anonymes (via sessionId)
- Recherche en temps réel avec debounce pour optimiser les performances
- Interface responsive et intuitive
- Tracking des comparaisons pour analyse des préférences clients et amélioration du catalogue

#### Technique

- Utilisation de Next.js App Router pour le routing
- Gestion d'état avec React Context API
- Intégration avec Prisma ORM pour la persistance des données
- TypeScript pour la sécurité du typage
- Composants React optimisés avec hooks
- API REST pour la communication client-serveur

## [Non publié] - 2025-11-06

### 👤 Ajout du champ nom dans l'inscription

#### Ajouté

- **Champ nom dans le formulaire d'inscription** : Ajout d'un champ "Nom complet" dans le formulaire d'inscription avec validation
- **Validation du nom** : Le nom doit contenir entre 2 et 50 caractères

#### Modifié

- **RegisterSchema** : Ajout du champ `name` dans le schéma de validation Zod
- **Page signUp** : Ajout du FormField pour le nom avec icône User
- **Action register** : Enregistrement du nom de l'utilisateur lors de la création du compte
- **Valeurs par défaut du formulaire** : Ajout de `name: ''` dans les defaultValues

#### Impact

- Les utilisateurs fournissent maintenant leur nom lors de l'inscription
- Le nom est enregistré directement dans la base de données lors de la création du compte
- Plus besoin de passer par la page `complete-profile` pour les utilisateurs qui s'inscrivent par email/mot de passe

## [Non publié] - 2025-11-06

### 📍 Amélioration du système de localisation avec redirection côté serveur

#### Ajouté

- **Gestion des cookies pour la localisation** : Ajout de fonctions utilitaires `setCookie`, `getCookie`, et `deleteCookie` dans `LocationContext`
- **Page serveur de redirection** : Création de `app/(main)/(view)/page.tsx` pour redirection SSR vers `/NomLocalisation`
- **Affichage dynamique de la localité** : Le nom de la localité choisie s'affiche maintenant dans le texte principal "On te livre en 24 heures le produit que tu aimes en [Localité]"
- **Redirection automatique lors du changement** : Lors du changement de localisation via le modal, redirection immédiate vers la nouvelle localité
- Localisation par défaut (Guadeloupe) dans `LocationContext`
- Propriété `isInitialized` dans le contexte pour éviter les flashs de popup
- Export de `DEFAULT_LOCATION` dans LocationContext

#### Modifié

- **Stockage de la localisation** : La localisation est maintenant sauvegardée à la fois dans `localStorage` (client) et dans des cookies (accessible côté serveur)
- **Redirection côté serveur** : La redirection vers la localisation se fait maintenant côté serveur pour de meilleures performances
- **Modal LocationModal** : Ajout de `router.push()` dans `handleKeepLocation` et `handleConfirm` pour rediriger immédiatement vers la localité choisie
- **HeroWithHelp** : Utilisation de `useParams()` pour récupérer la localité depuis l'URL et l'afficher dynamiquement
- Modal de localisation avec deux vues :
  - Vue 1 : Confirmation de la localisation actuelle avec options "Garder" ou "Choisir une autre"
  - Vue 2 : Liste complète des localisations disponibles
- **Architecture de routing** : Déplacement de la page principale vers `app/(main)/(view)/[locality]/page.tsx`
- Amélioration de l'UX : affichage d'abord de la localisation actuelle avant la liste complète
- État initial du modal changé de `true` à `false` pour éviter l'affichage prématuré
- Gestion de l'initialisation du contexte pour charger la localisation par défaut si aucune n'est sauvegardée
- Mise à jour des imports dans `[locality]/page.tsx` pour pointer vers `../contexts/LocationContext`

#### Corrections

- Correction du flash du popup au chargement grâce à `isInitialized`
- Suppression du code inutilisé `handleChangeLocation` dans Navbar
- Correction de la structure JSX avec fermeture correcte des balises
- Correction de `document.cookies` en `document.cookie`
- **Correction de la redirection** : Le changement de localisation redirige maintenant immédiatement sans nécessiter de rafraîchir la page

#### Architecture technique

- **Cookies** : `userLocation` et `locationConfirmed` avec expiration de 365 jours
- **SSR** : Lecture des cookies côté serveur pour redirection instantanée lors de l'accès à `/`
- **CSR** : Redirection côté client via `router.push()` lors du changement de localisation dans le modal
- **Synchronisation** : Les cookies et localStorage sont synchronisés pour une expérience cohérente
- **Paramètres dynamiques** : Utilisation de `useParams()` pour accéder au paramètre `[locality]` de l'URL

## [Non publié] - 2025-11-06

### 🔐 Système d'Authentification Complet

#### Ajouté

**API Routes**

- `app/api/user/update-profile/route.ts`: Endpoint PATCH pour mettre à jour le nom de l'utilisateur
  - Authentification requise
  - Validation des données (2-50 caractères)
  - Mise à jour sécurisée dans la base de données

**Base de données**

- Ajout du champ `password` (optionnel) au modèle User pour stocker les mots de passe hashés
- Ajout de l'enum `TokenType` avec les valeurs `EMAIL_VERIFICATION` et `PASSWORD_RESET`
- Ajout du champ `type` au modèle VerificationToken pour différencier les types de tokens
- Ajout d'index sur les champs `identifier` et `type` du modèle VerificationToken

**Schémas de validation**

- `LoginSchema`: Validation pour connexion avec email et mot de passe
- `RegisterSchema`: Validation pour inscription avec règles strictes de mot de passe (8 caractères min, majuscule, minuscule, chiffre)
- `ForgotPasswordSchema`: Validation pour demande de réinitialisation de mot de passe
- `ResetPasswordSchema`: Validation pour réinitialisation de mot de passe avec token
- `ChangePasswordSchema`: Validation pour modification de mot de passe (utilisateur connecté)

**Système d'emails**

- `lib/mail.ts`: Système d'envoi d'emails avec Resend
  - `sendVerificationEmail()`: Envoi d'email de vérification lors de l'inscription
  - `sendPasswordResetEmail()`: Envoi d'email de réinitialisation de mot de passe
- Templates HTML professionnels pour les emails

**Gestion des tokens**

- `lib/tokens.ts`: Gestion des tokens de sécurité
  - `generateVerificationToken()`: Génération de token de vérification d'email
  - `generatePasswordResetToken()`: Génération de token de réinitialisation de mot de passe
  - `verifyEmailToken()`: Vérification et validation d'un token de vérification d'email
  - `verifyPasswordResetToken()`: Vérification et validation d'un token de réinitialisation
- Tokens avec expiration de 1 heure
- Suppression automatique des anciens tokens

**Actions serveur**

- `actions/auth.ts`: Actions serveur complètes pour l'authentification
  - `login()`: Connexion avec email/mot de passe
  - `register()`: Inscription avec envoi d'email de vérification
  - `verifyEmail()`: Vérification d'email via token
  - `forgotPassword()`: Demande de réinitialisation de mot de passe
  - `resetPassword()`: Réinitialisation de mot de passe via token
  - `changePassword()`: Modification de mot de passe pour utilisateur connecté
- Hashage des mots de passe avec bcryptjs (10 rounds)
- Gestion des erreurs et messages de succès appropriés

**Configuration NextAuth**

- Ajout du `CredentialsProvider` dans `ts/auth.config.ts`
- Vérification automatique de l'email lors de la connexion par credentials
- Vérification du mot de passe hashé
- Mise à jour des callbacks NextAuth pour gérer l'authentification par credentials

**Pages d'authentification**

- `app/(auth)/signIn/page.tsx`: Page de connexion modernisée
  - Connexion par email/mot de passe
  - Connexion OAuth avec Google
  - Affichage/masquage du mot de passe
  - Lien vers mot de passe oublié
  - Lien vers page d'inscription
- `app/(auth)/verify-request/page.tsx`: Page de vérification améliorée
  - Design moderne cohérent avec l'application
  - Instructions claires et détaillées
  - Icônes et visuels informatifs
  - Liens vers connexion et renvoi d'email
  - Support utilisateur intégré
- `app/(auth)/signUp/page.tsx`: Page d'inscription complète

  - Formulaire avec validation en temps réel
  - Règles de mot de passe affichées
  - Confirmation de mot de passe
  - Connexion OAuth avec Google
  - Messages de succès/erreur

- `app/(auth)/forgot-password/page.tsx`: Page de demande de réinitialisation
  - Formulaire simple avec email
  - Envoi sécurisé (pas de révélation si l'email existe)
  - Messages informatifs
- `app/(auth)/reset-password/page.tsx`: Page de réinitialisation
  - Vérification du token dans l'URL
  - Formulaire de nouveau mot de passe
  - Validation des règles de mot de passe
  - Redirection automatique après succès
- `app/(auth)/verify-email/page.tsx`: Page de vérification d'email
  - Vérification automatique au chargement
  - Animation de chargement
  - Messages de succès/erreur
  - Redirection automatique vers connexion

**Pages de profil**

- `app/(main)/profile-test/page.tsx`: Page de test de profil
  - Affichage des informations utilisateur
  - Protection par authentification
  - Bouton de modification de mot de passe
  - Design moderne et responsive
- `app/(main)/change-password/page.tsx`: Page de modification de mot de passe
  - Vérification du mot de passe actuel
  - Formulaire complet avec 3 champs
  - Validation des règles de sécurité
  - Protection par authentification
  - Redirection après succès

**Routes**

- Ajout des nouvelles routes d'authentification dans `ts/routes.ts`:
  - `/signUp`: Inscription
  - `/verify-email`: Vérification d'email
  - `/forgot-password`: Mot de passe oublié
  - `/reset-password`: Réinitialisation de mot de passe

**Dépendances**

- Installation de `bcryptjs` et `@types/bcryptjs` pour le hashage des mots de passe
- Installation de `uuid` et `@types/uuid` pour la génération de tokens

#### Modifié

**Base de données**

- Le modèle User supporte maintenant l'authentification par mot de passe ET OAuth
- Le champ `password` est optionnel pour permettre les connexions OAuth sans mot de passe

**NextAuth**

- Suppression du provider `Resend` (remplacé par système custom)
- Configuration pour utiliser `CredentialsProvider` avec vérification d'email
- Amélioration du callback `signIn` pour vérifier l'email vérifié
- Callback `jwt` mis à jour pour rafraîchir le nom lors des updates de session
- Callback `session` mis à jour pour inclure le nom dans la session

**Page de connexion**

- Transformation de l'authentification par code email vers email/mot de passe
- Ajout du champ mot de passe avec affichage/masquage
- Amélioration de l'UX avec messages d'erreur clairs

**Page complete-profile**

- Correction du bug d'enregistrement du nom (API route manquante)
- Ajout du rafraîchissement de session après mise à jour
- Amélioration de l'UX avec toast notifications
- Utilisation de Next.js Image au lieu de <img>
- Gestion des erreurs améliorée
- Redirection vers la page d'accueil (`/`) après soumission (au lieu du dashboard)

**Middleware**

- Ajout de l'exception pour les routes `/api/user/*` pour permettre les mises à jour de profil
- Redirection vers la page d'accueil (`/`) quand l'utilisateur a déjà un nom et tente d'accéder à complete-profile
- Empêche l'accès à complete-profile pour les utilisateurs avec profil déjà complété

#### Sécurité

- ✅ Mots de passe hashés avec bcryptjs (10 rounds)
- ✅ Validation stricte des mots de passe (8 caractères min, majuscule, minuscule, chiffre)
- ✅ Tokens de sécurité avec expiration (1 heure)
- ✅ Vérification obligatoire de l'email avant connexion
- ✅ Suppression automatique des anciens tokens
- ✅ Messages d'erreur génériques pour éviter l'énumération d'emails
- ✅ Protection CSRF via NextAuth
- ✅ Sessions JWT sécurisées

#### UX/UI

- Design moderne et cohérent sur toutes les pages d'authentification
- Gradients et effets visuels (backdrop-blur, shadows)
- Animations de chargement
- Messages de succès/erreur clairs
- Redirections automatiques intelligentes
- Responsive design pour mobile et desktop
- Icônes Lucide pour une meilleure lisibilité

#### Architecture

- Séparation claire des responsabilités:
  - `lib/`: Utilitaires (mail, tokens, schemas)
  - `actions/`: Actions serveur
  - `app/(auth)/`: Pages publiques d'authentification
  - `app/(main)/`: Pages protégées nécessitant authentification
- Code réutilisable et maintenable
- Gestion d'erreurs robuste
- TypeScript pour la sécurité des types

---

## Notes de migration

⚠️ **Important**: Après avoir récupéré ce code, vous devez:

1. Exécuter la migration Prisma:

```bash
npx prisma migrate dev --name add_password_and_token_type
```

2. Configurer les variables d'environnement (si pas déjà fait):

```env
# NextAuth
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Resend (pour envoi d'emails)
AUTH_RESEND_KEY=your-resend-api-key

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# App URL (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Installer les dépendances si nécessaire:

```bash
npm install bcryptjs uuid
npm install --save-dev @types/bcryptjs @types/uuid
```

4. Tester le système:
   - S'inscrire avec un nouvel email
   - Vérifier l'email (cliquer sur le lien dans l'email)
   - Se connecter avec email/mot de passe
   - Tester le mot de passe oublié
   - Tester la modification de mot de passe depuis `/profile-test`

# Changelog

## [Non publié] - 2025-11-11

### 🛍️ Listing produits — Affichage du prix le plus bas

#### Modifié

- `app/(main)/(view)/[locality]/[brandName]/[categoryName]/page.tsx` :
  - Calcul existant du prix minimum conservé.
  - Ajout de l’affichage “à partir de {prix}€” sous le bloc “Stockage” en vue grille et liste.
  - En vue Liste, le bouton “Comparer” se place désormais en bas à droite de la carte.
  - Navigation produit: si `categoryName` est indéfini dans l’URL, fallback automatique sur `model.category` lors du `router.push`.
  - Navbar désormais fixe en haut de page; suppression du `sticky` sur le header et ajout d’un `pt-16` pour compenser la hauteur du navbar.

#### Impact

- Les utilisateurs voient désormais un repère de prix clair directement sous les options de stockage pour chaque produit.
- Ergonomie améliorée en vue Liste avec un placement cohérent du bouton “Comparer”.
- Les liens produits restent corrects même sans `categoryName` explicite dans l’URL.
- La navigation reste visible en permanence, sans double zone “collante”.

Tous les changements notables de ce projet seront documentés dans ce fichier.

## [Non publié] - 2025-11-06

### 👤 Ajout du champ nom dans l'inscription

#### Ajouté

- **Champ nom dans le formulaire d'inscription** : Ajout d'un champ "Nom complet" dans le formulaire d'inscription avec validation
- **Validation du nom** : Le nom doit contenir entre 2 et 50 caractères

#### Modifié

- **RegisterSchema** : Ajout du champ `name` dans le schéma de validation Zod
- **Page signUp** : Ajout du FormField pour le nom avec icône User
- **Action register** : Enregistrement du nom de l'utilisateur lors de la création du compte
- **Valeurs par défaut du formulaire** : Ajout de `name: ''` dans les defaultValues

#### Impact

- Les utilisateurs fournissent maintenant leur nom lors de l'inscription
- Le nom est enregistré directement dans la base de données lors de la création du compte
- Plus besoin de passer par la page `complete-profile` pour les utilisateurs qui s'inscrivent par email/mot de passe

## [Non publié] - 2025-11-06

### 📍 Amélioration du système de localisation avec redirection côté serveur

#### Ajouté

- **Gestion des cookies pour la localisation** : Ajout de fonctions utilitaires `setCookie`, `getCookie`, et `deleteCookie` dans `LocationContext`
- **Page serveur de redirection** : Création de `app/(main)/(view)/page.tsx` pour redirection SSR vers `/NomLocalisation`
- **Affichage dynamique de la localité** : Le nom de la localité choisie s'affiche maintenant dans le texte principal "On te livre en 24 heures le produit que tu aimes en [Localité]"
- **Redirection automatique lors du changement** : Lors du changement de localisation via le modal, redirection immédiate vers la nouvelle localité
- Localisation par défaut (Guadeloupe) dans `LocationContext`
- Propriété `isInitialized` dans le contexte pour éviter les flashs de popup
- Export de `DEFAULT_LOCATION` dans LocationContext

#### Modifié

- **Stockage de la localisation** : La localisation est maintenant sauvegardée à la fois dans `localStorage` (client) et dans des cookies (accessible côté serveur)
- **Redirection côté serveur** : La redirection vers la localisation se fait maintenant côté serveur pour de meilleures performances
- **Modal LocationModal** : Ajout de `router.push()` dans `handleKeepLocation` et `handleConfirm` pour rediriger immédiatement vers la localité choisie
- **HeroWithHelp** : Utilisation de `useParams()` pour récupérer la localité depuis l'URL et l'afficher dynamiquement
- Modal de localisation avec deux vues :
  - Vue 1 : Confirmation de la localisation actuelle avec options "Garder" ou "Choisir une autre"
  - Vue 2 : Liste complète des localisations disponibles
- **Architecture de routing** : Déplacement de la page principale vers `app/(main)/(view)/[locality]/page.tsx`
- Amélioration de l'UX : affichage d'abord de la localisation actuelle avant la liste complète
- État initial du modal changé de `true` à `false` pour éviter l'affichage prématuré
- Gestion de l'initialisation du contexte pour charger la localisation par défaut si aucune n'est sauvegardée
- Mise à jour des imports dans `[locality]/page.tsx` pour pointer vers `../contexts/LocationContext`

#### Corrections

- Correction du flash du popup au chargement grâce à `isInitialized`
- Suppression du code inutilisé `handleChangeLocation` dans Navbar
- Correction de la structure JSX avec fermeture correcte des balises
- Correction de `document.cookies` en `document.cookie`
- **Correction de la redirection** : Le changement de localisation redirige maintenant immédiatement sans nécessiter de rafraîchir la page

#### Architecture technique

- **Cookies** : `userLocation` et `locationConfirmed` avec expiration de 365 jours
- **SSR** : Lecture des cookies côté serveur pour redirection instantanée lors de l'accès à `/`
- **CSR** : Redirection côté client via `router.push()` lors du changement de localisation dans le modal
- **Synchronisation** : Les cookies et localStorage sont synchronisés pour une expérience cohérente
- **Paramètres dynamiques** : Utilisation de `useParams()` pour accéder au paramètre `[locality]` de l'URL

## [Non publié] - 2025-11-06

### 🔐 Système d'Authentification Complet

#### Ajouté

**API Routes**

- `app/api/user/update-profile/route.ts`: Endpoint PATCH pour mettre à jour le nom de l'utilisateur
  - Authentification requise
  - Validation des données (2-50 caractères)
  - Mise à jour sécurisée dans la base de données

**Base de données**

- Ajout du champ `password` (optionnel) au modèle User pour stocker les mots de passe hashés
- Ajout de l'enum `TokenType` avec les valeurs `EMAIL_VERIFICATION` et `PASSWORD_RESET`
- Ajout du champ `type` au modèle VerificationToken pour différencier les types de tokens
- Ajout d'index sur les champs `identifier` et `type` du modèle VerificationToken

**Schémas de validation**

- `LoginSchema`: Validation pour connexion avec email et mot de passe
- `RegisterSchema`: Validation pour inscription avec règles strictes de mot de passe (8 caractères min, majuscule, minuscule, chiffre)
- `ForgotPasswordSchema`: Validation pour demande de réinitialisation de mot de passe
- `ResetPasswordSchema`: Validation pour réinitialisation de mot de passe avec token
- `ChangePasswordSchema`: Validation pour modification de mot de passe (utilisateur connecté)

**Système d'emails**

- `lib/mail.ts`: Système d'envoi d'emails avec Resend
  - `sendVerificationEmail()`: Envoi d'email de vérification lors de l'inscription
  - `sendPasswordResetEmail()`: Envoi d'email de réinitialisation de mot de passe
- Templates HTML professionnels pour les emails

**Gestion des tokens**

- `lib/tokens.ts`: Gestion des tokens de sécurité
  - `generateVerificationToken()`: Génération de token de vérification d'email
  - `generatePasswordResetToken()`: Génération de token de réinitialisation de mot de passe
  - `verifyEmailToken()`: Vérification et validation d'un token de vérification d'email
  - `verifyPasswordResetToken()`: Vérification et validation d'un token de réinitialisation
- Tokens avec expiration de 1 heure
- Suppression automatique des anciens tokens

**Actions serveur**

- `actions/auth.ts`: Actions serveur complètes pour l'authentification
  - `login()`: Connexion avec email/mot de passe
  - `register()`: Inscription avec envoi d'email de vérification
  - `verifyEmail()`: Vérification d'email via token
  - `forgotPassword()`: Demande de réinitialisation de mot de passe
  - `resetPassword()`: Réinitialisation de mot de passe via token
  - `changePassword()`: Modification de mot de passe pour utilisateur connecté
- Hashage des mots de passe avec bcryptjs (10 rounds)
- Gestion des erreurs et messages de succès appropriés

**Configuration NextAuth**

- Ajout du `CredentialsProvider` dans `ts/auth.config.ts`
- Vérification automatique de l'email lors de la connexion par credentials
- Vérification du mot de passe hashé
- Mise à jour des callbacks NextAuth pour gérer l'authentification par credentials

**Pages d'authentification**

- `app/(auth)/signIn/page.tsx`: Page de connexion modernisée
  - Connexion par email/mot de passe
  - Connexion OAuth avec Google
  - Affichage/masquage du mot de passe
  - Lien vers mot de passe oublié
  - Lien vers page d'inscription
- `app/(auth)/verify-request/page.tsx`: Page de vérification améliorée
  - Design moderne cohérent avec l'application
  - Instructions claires et détaillées
  - Icônes et visuels informatifs
  - Liens vers connexion et renvoi d'email
  - Support utilisateur intégré
- `app/(auth)/signUp/page.tsx`: Page d'inscription complète

  - Formulaire avec validation en temps réel
  - Règles de mot de passe affichées
  - Confirmation de mot de passe
  - Connexion OAuth avec Google
  - Messages de succès/erreur

- `app/(auth)/forgot-password/page.tsx`: Page de demande de réinitialisation
  - Formulaire simple avec email
  - Envoi sécurisé (pas de révélation si l'email existe)
  - Messages informatifs
- `app/(auth)/reset-password/page.tsx`: Page de réinitialisation
  - Vérification du token dans l'URL
  - Formulaire de nouveau mot de passe
  - Validation des règles de mot de passe
  - Redirection automatique après succès
- `app/(auth)/verify-email/page.tsx`: Page de vérification d'email
  - Vérification automatique au chargement
  - Animation de chargement
  - Messages de succès/erreur
  - Redirection automatique vers connexion

**Pages de profil**

- `app/(main)/profile-test/page.tsx`: Page de test de profil
  - Affichage des informations utilisateur
  - Protection par authentification
  - Bouton de modification de mot de passe
  - Design moderne et responsive
- `app/(main)/change-password/page.tsx`: Page de modification de mot de passe
  - Vérification du mot de passe actuel
  - Formulaire complet avec 3 champs
  - Validation des règles de sécurité
  - Protection par authentification
  - Redirection après succès

**Routes**

- Ajout des nouvelles routes d'authentification dans `ts/routes.ts`:
  - `/signUp`: Inscription
  - `/verify-email`: Vérification d'email
  - `/forgot-password`: Mot de passe oublié
  - `/reset-password`: Réinitialisation de mot de passe

**Dépendances**

- Installation de `bcryptjs` et `@types/bcryptjs` pour le hashage des mots de passe
- Installation de `uuid` et `@types/uuid` pour la génération de tokens

#### Modifié

**Base de données**

- Le modèle User supporte maintenant l'authentification par mot de passe ET OAuth
- Le champ `password` est optionnel pour permettre les connexions OAuth sans mot de passe

**NextAuth**

- Suppression du provider `Resend` (remplacé par système custom)
- Configuration pour utiliser `CredentialsProvider` avec vérification d'email
- Amélioration du callback `signIn` pour vérifier l'email vérifié
- Callback `jwt` mis à jour pour rafraîchir le nom lors des updates de session
- Callback `session` mis à jour pour inclure le nom dans la session

**Page de connexion**

- Transformation de l'authentification par code email vers email/mot de passe
- Ajout du champ mot de passe avec affichage/masquage
- Amélioration de l'UX avec messages d'erreur clairs

**Page complete-profile**

- Correction du bug d'enregistrement du nom (API route manquante)
- Ajout du rafraîchissement de session après mise à jour
- Amélioration de l'UX avec toast notifications
- Utilisation de Next.js Image au lieu de <img>
- Gestion des erreurs améliorée
- Redirection vers la page d'accueil (`/`) après soumission (au lieu du dashboard)

**Middleware**

- Ajout de l'exception pour les routes `/api/user/*` pour permettre les mises à jour de profil
- Redirection vers la page d'accueil (`/`) quand l'utilisateur a déjà un nom et tente d'accéder à complete-profile
- Empêche l'accès à complete-profile pour les utilisateurs avec profil déjà complété

#### Sécurité

- ✅ Mots de passe hashés avec bcryptjs (10 rounds)
- ✅ Validation stricte des mots de passe (8 caractères min, majuscule, minuscule, chiffre)
- ✅ Tokens de sécurité avec expiration (1 heure)
- ✅ Vérification obligatoire de l'email avant connexion
- ✅ Suppression automatique des anciens tokens
- ✅ Messages d'erreur génériques pour éviter l'énumération d'emails
- ✅ Protection CSRF via NextAuth
- ✅ Sessions JWT sécurisées

#### UX/UI

- Design moderne et cohérent sur toutes les pages d'authentification
- Gradients et effets visuels (backdrop-blur, shadows)
- Animations de chargement
- Messages de succès/erreur clairs
- Redirections automatiques intelligentes
- Responsive design pour mobile et desktop
- Icônes Lucide pour une meilleure lisibilité

#### Architecture

- Séparation claire des responsabilités:
  - `lib/`: Utilitaires (mail, tokens, schemas)
  - `actions/`: Actions serveur
  - `app/(auth)/`: Pages publiques d'authentification
  - `app/(main)/`: Pages protégées nécessitant authentification
- Code réutilisable et maintenable
- Gestion d'erreurs robuste
- TypeScript pour la sécurité des types

---

## Notes de migration

⚠️ **Important**: Après avoir récupéré ce code, vous devez:

1. Exécuter la migration Prisma:

```bash
npx prisma migrate dev --name add_password_and_token_type
```

2. Configurer les variables d'environnement (si pas déjà fait):

```env
# NextAuth
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Resend (pour envoi d'emails)
AUTH_RESEND_KEY=your-resend-api-key

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# App URL (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Installer les dépendances si nécessaire:

```bash
npm install bcryptjs uuid
npm install --save-dev @types/bcryptjs @types/uuid
```

4. Tester le système:
   - S'inscrire avec un nouvel email
   - Vérifier l'email (cliquer sur le lien dans l'email)
   - Se connecter avec email/mot de passe
   - Tester le mot de passe oublié
   - Tester la modification de mot de passe depuis `/profile-test`
