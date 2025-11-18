import React, { useState, useMemo } from 'react';
import { 
  X, Check, ChevronRight, Package, Image as ImageIcon, 
  Package2, Settings, Upload, Trash2, AlertCircle, ChevronLeft,
  Plus, Search, Link as LinkIcon, RefreshCw, Star
} from 'lucide-react';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { useStores } from '../../ilm2/contexts/StoresContext';
import Image from 'next/image';

interface AddProductModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

interface ColorImage {
  url: string;
  file?: File;
  name: string;
}

interface ProductColor {
  name: string;
  hex: string;
  images: ColorImage[];
}

interface VariantSpec {
  key: string;
  value: string;
}

interface ProductVariantInput {
  storeId: string;                        // NOUVEAU : ID de la boutique
  colorId?: string;                       // ID de la couleur (optionnel)
  variantAttribute?: string;              // "256GB", "45mm", "20000mAh", etc.
  attributeType?: 'STORAGE_RAM' | 'SIZE' | 'CAPACITY' | 'CONNECTOR' | 'MEMORY' | 'NONE';
  
  // Prix en EUR
  useFCFA?: boolean;
  pvTTC?: number;
  pamp?: number;
  oldPrice?: number;
  margin?: number;
  tva?: number;
  
  // Prix en FCFA
  pvTTC_FCFA?: number;
  pamp_FCFA?: number;
  oldPrice_FCFA?: number;
  marginFCFA?: number;
  marginPercent?: number;
}

interface StorageVariant {
  name: string;                           // "256GB", "512GB", etc.
  attributeType?: 'STORAGE_RAM' | 'SIZE' | 'CAPACITY' | 'CONNECTOR' | 'MEMORY' | 'NONE';
  specs: VariantSpec[];
  
  // Prix par boutique
  storeVariants: Array<{
    storeId: string;
    storeName: string;
    
    // Prix EUR
    useFCFA: boolean;
    pvTTC: string;
    pamp: string;
    oldPrice: string;
    tva: string;
    margin: string;
    
    // Prix FCFA
    pvTTC_FCFA: string;
    pamp_FCFA: string;
    oldPrice_FCFA: string;
    marginFCFA: string;
  }>;
}

interface Specification {
  key: string;
  value: string;
}

interface FormData {
  designation: string;
  brand: string;
  family: string;
  subFamily: string;
  reference: string;
  category: string;
  description: string;
  status: string;
}


interface ExistingProduct {
  id: string;
  designation: string;
  reference: string;
  brand: string;
  price: string;
  stock: number;
  category: string;
  image?: string;
}

interface UploadedImage {
  url: string;
  fileName: string;
  originalName?: string;
  displayOrder: number;
}

interface ProcessedColor {
  colorName: string;
  hexaColor: string;
  images: {
    url: string;
    fileName: string;
    displayOrder: number;
  }[];
}

const AddProductModelModal: React.FC<AddProductModelModalProps> = ({ isOpen, onClose }) => {
  const user = useCurrentUser();
  const [step, setStep] = useState(1);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    designation: '',
    brand: '',
    family: '',
    subFamily: '',
    reference: '',
    category: '',
    description: '',
    status: ''
  });

  const [colors, setColors] = useState<ProductColor[]>([
    { name: '', hex: '#000000', images: [] }
  ]);

  const [variants, setVariants] = useState<StorageVariant[]>([
    { 
      name: '128GB',
      attributeType: 'STORAGE_RAM',
      specs: [],
      storeVariants: []
    }
  ]);
  const [newVariantName, setNewVariantName] = useState('');
  

  const [specs, setSpecs] = useState<Specification[]>([
    { key: 'Écran', value: '' },
    { key: 'Processeur', value: '' },
    { key: 'RAM', value: '' },
    { key: 'Caméra', value: '' },
    { key: 'Batterie', value: '' }
  ]);

  // const [suppliers, setSuppliers] = useState<Supplier[]>([
  //   { id: '1', name: 'TechDistrib SARL', contact: 'Jean Dupont', phone: '+226 70 12 34 56' },
  //   { id: '2', name: 'Global Import BF', contact: 'Marie Kaboré', phone: '+226 75 98 76 54' },
  //   { id: '3', name: 'Phone Express', contact: 'Abdoul Traoré', phone: '+226 78 45 67 89' }
  // ]);
  // const [showSupplierModal, setShowSupplierModal] = useState(false);
  // const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '' });
  // const [supplierSearch, setSupplierSearch] = useState('');

  const [existingProducts] = useState<ExistingProduct[]>([
    { id: '1', designation: 'iPhone 14 Pro', reference: 'APL-IP14P-256', brand: 'Apple', price: '850000', stock: 5, category: 'Téléphones', image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400' },
    { id: '2', designation: 'Samsung Galaxy S23', reference: 'SAM-S23-128', brand: 'Samsung', price: '650000', stock: 8, category: 'Téléphones', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400' },
    { id: '3', designation: 'iPhone 13', reference: 'APL-IP13-128', brand: 'Apple', price: '550000', stock: 12, category: 'Téléphones', image: 'https://images.unsplash.com/photo-1592286927505-c0c8c40f29f1?w=400' },
    { id: '4', designation: 'Galaxy Z Fold 5', reference: 'SAM-ZF5-512', brand: 'Samsung', price: '1200000', stock: 3, category: 'Téléphones', image: 'https://images.unsplash.com/photo-1677246890046-87951a9e0b6e?w=400' },
    { id: '5', designation: 'Xiaomi 13 Pro', reference: 'XIA-13P-256', brand: 'Xiaomi', price: '450000', stock: 15, category: 'Téléphones', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400' }
  ]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const categories = ['Téléphones', 'Tablettes', 'Ordinateurs', 'Montres connectées', 'Écouteurs', 'Accessoires'];
  const brands = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'OnePlus', 'OPPO', 'Autre'];

  const families = {
    'Smartphones': ['Haut de gamme', 'Milieu de gamme', 'Entrée de gamme'],
    'Tablettes': ['Standard', 'Pro', 'Lite'],
    'Ordinateurs': ['Gaming', 'Bureautique', 'Ultrabook'],
    'Accessoires': ['Protection', 'Audio', 'Chargement', 'Câbles']
  };

  const predefinedColors = [
    { name: 'Noir', hex: '#000000' },
    { name: 'Blanc', hex: '#FFFFFF' },
    { name: 'Bleu', hex: '#3B82F6' },
    { name: 'Rouge', hex: '#EF4444' },
    { name: 'Vert', hex: '#10B981' },
    { name: 'Rose', hex: '#EC4899' },
    { name: 'Violet', hex: '#8B5CF6' },
    { name: 'Or', hex: '#F59E0B' },
    { name: 'Argent', hex: '#E5E7EB' },
    { name: 'Gris', hex: '#6B7280' }
  ];
  const { stores } = useStores();
  // Ajouter une boutique à une variante
  const addStoreToVariant = (variantIndex: number, storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    
    const newVariants = [...variants];
    
    // Vérifier que cette boutique n'est pas déjà ajoutée
    if (newVariants[variantIndex].storeVariants.some(sv => sv.storeId === storeId)) {
      alert('Cette boutique est déjà configurée pour cette variante');
      return;
    }
    
    newVariants[variantIndex].storeVariants.push({
      storeId: store.id,
      storeName: store.name,
      useFCFA: false,
      pvTTC: '',
      pamp: '',
      oldPrice: '',
      tva: '18',
      margin: '0',
      pvTTC_FCFA: '',
      pamp_FCFA: '',
      oldPrice_FCFA: '',
      marginFCFA: '0'
    });
    
    setVariants(newVariants);
  };

  // Supprimer une boutique d'une variante
  const removeStoreFromVariant = (variantIndex: number, storeIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].storeVariants.splice(storeIndex, 1);
    setVariants(newVariants);
  };

  // Mettre à jour les prix d'une boutique dans une variante
  const updateStoreVariantPrice = (
    variantIndex: number, 
    storeIndex: number, 
    field: string, 
    value: string
  ) => {
    const newVariants = [...variants];
    const storeVariant = newVariants[variantIndex].storeVariants[storeIndex];
    
    type StoreVariantKey = keyof typeof storeVariant;
    (storeVariant[field as StoreVariantKey] as string) = value;
    
    // Recalculer automatiquement les conversions et marges
    if (field === 'pvTTC' && storeVariant.useFCFA === false) {
      storeVariant.pvTTC_FCFA = convertToFCFA(value);
    } else if (field === 'pvTTC_FCFA' && storeVariant.useFCFA === true) {
      storeVariant.pvTTC = convertToEuro(value);
    }
    
    if (field === 'pamp' && storeVariant.useFCFA === false) {
      storeVariant.pamp_FCFA = convertToFCFA(value);
    } else if (field === 'pamp_FCFA' && storeVariant.useFCFA === true) {
      storeVariant.pamp = convertToEuro(value);
    }
    
    // Recalculer les marges
    if (field === 'pvTTC' || field === 'pamp' || field === 'tva') {
      storeVariant.margin = calculateMargin(storeVariant.pvTTC, storeVariant.pamp, storeVariant.tva);
    }
    
    if (field === 'pvTTC_FCFA' || field === 'pamp_FCFA') {
      storeVariant.marginFCFA = calculateMarginFCFA(storeVariant.pvTTC_FCFA, storeVariant.pamp_FCFA);
    }
    
    setVariants(newVariants);
  };

  // Basculer entre EUR et FCFA
  const toggleCurrencyMode = (variantIndex: number, storeIndex: number) => {
    const newVariants = [...variants];
    const storeVariant = newVariants[variantIndex].storeVariants[storeIndex];
    
    storeVariant.useFCFA = !storeVariant.useFCFA;
    
    // Synchroniser les valeurs
    if (storeVariant.useFCFA) {
      // Passer en mode FCFA - garder les valeurs FCFA
      if (storeVariant.pvTTC) {
        storeVariant.pvTTC_FCFA = convertToFCFA(storeVariant.pvTTC);
      }
      if (storeVariant.pamp) {
        storeVariant.pamp_FCFA = convertToFCFA(storeVariant.pamp);
      }
    } else {
      // Passer en mode EUR - garder les valeurs EUR
      if (storeVariant.pvTTC_FCFA) {
        storeVariant.pvTTC = convertToEuro(storeVariant.pvTTC_FCFA);
      }
      if (storeVariant.pamp_FCFA) {
        storeVariant.pamp = convertToEuro(storeVariant.pamp_FCFA);
      }
    }
    
    setVariants(newVariants);
  };

  const EURO_TO_FCFA = 655.957;

  const generateReference = () => {
    if (formData.brand) {
      const initials = formData.brand.substring(0, 3).toUpperCase();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData({ ...formData, reference: `${initials}-${random}` });
    }
  };

  const convertToFCFA = (euroAmount: string): string => {
    const amount = parseFloat(euroAmount) || 0;
    return Math.round(amount * EURO_TO_FCFA).toString();
  };

  const convertToEuro = (fcfaAmount: string): string => {
    const amount = parseFloat(fcfaAmount) || 0;
    return (amount / EURO_TO_FCFA).toFixed(2);
  };

  const calculateMargin = (pvTTC: string, pamp: string, tva: string): string => {
    const pvNum = parseFloat(pvTTC) || 0;
    const pampNum = parseFloat(pamp) || 0;
    const tvaNum = parseFloat(tva) || 0;

    if (pvNum === 0 || pampNum === 0) return '0';

    const pvHT = pvNum / (1 + tvaNum / 100);
    const margin = ((pvHT - pampNum) / pampNum) * 100;
    
    return margin.toFixed(2);
  };

  const calculateMarginFCFA = (pvTTC: string, pamp: string): string => {
    const pvNum = parseFloat(pvTTC) || 0;
    const pampNum = parseFloat(pamp) || 0;

    if (pvNum === 0 || pampNum === 0) return '0';

    return Math.round(pvNum - pampNum).toString();
  };

  // const filteredSuppliers = useMemo(() => {
  //   return suppliers.filter(s => 
  //     s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  //   );
  // }, [suppliers, supplierSearch]);

  // const addSupplier = () => {
  //   if (newSupplier.name && newSupplier.contact) {
  //     const supplier: Supplier = {
  //       id: Date.now().toString(),
  //       ...newSupplier
  //     };
  //     setSuppliers([...suppliers, supplier]);
  //     setFormData({ ...formData, supplier: supplier.id });
  //     setNewSupplier({ name: '', contact: '', phone: '' });
  //     setShowSupplierModal(false);
  //   }
  // };

  const filteredProducts = useMemo(() => {
    return existingProducts.filter(p =>
      p.designation.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.reference.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [existingProducts, productSearch]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addVariant = () => {
    if (newVariantName && !variants.some(v => v.name === newVariantName)) {
      setVariants([...variants, { 
        name: newVariantName,
        attributeType: 'STORAGE_RAM', // Type par défaut
        specs: [],
        storeVariants: []
      }]);
      setNewVariantName('');
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };



  const addVariantSpec = (variantIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].specs.push({ key: '', value: '' });
    setVariants(newVariants);
  };

  const updateVariantSpec = (variantIndex: number, specIndex: number, field: keyof VariantSpec, value: string) => {
    const newVariants = [...variants];
    newVariants[variantIndex].specs[specIndex] = {
      ...newVariants[variantIndex].specs[specIndex],
      [field]: value
    };
    setVariants(newVariants);
  };

  const removeVariantSpec = (variantIndex: number, specIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].specs = newVariants[variantIndex].specs.filter((_, i) => i !== specIndex);
    setVariants(newVariants);
  };

  const addColor = () => {
    setColors([...colors, { name: '', hex: '#000000', images: [] }]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, field: keyof ProductColor, value: string | ColorImage[]) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setColors(newColors);
  };

  const moveImage = (colorIndex: number, fromIndex: number, toIndex: number) => {
    const newColors = [...colors];
    const images = [...newColors[colorIndex].images];
    const [movedImage] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, movedImage);
    newColors[colorIndex].images = images;
    setColors(newColors);
  };

  const setMainImage = (colorIndex: number, imageIndex: number) => {
    const newColors = [...colors];
    const images = [...newColors[colorIndex].images];
    const [mainImage] = images.splice(imageIndex, 1);
    images.unshift(mainImage);
    newColors[colorIndex].images = images;
    setColors(newColors);
  };

  const updateSpec = (index: number, field: keyof Specification, value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setSpecs(newSpecs);
  };

  const addSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  // Fonction pour uploader les images
  // Dans votre composant
  const uploadColorImages = async (
    modelName: string, 
    colorName: string, 
    images: ColorImage[]
  ): Promise<UploadedImage[]> => {
    
    if (images.length === 0) return [];

    const formData = new FormData();
    formData.append('modelName', modelName);
    formData.append('colorName', colorName);

    for (const image of images) {
      if (image.file) {
        formData.append('files', image.file);
      }
    }

    try {
      const response = await fetch('/api/products/models/upload-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload des images');
      }

      const data = await response.json();
      return data.files as UploadedImage[];

    } catch (error) {
      console.error('Erreur upload images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setIsSubmitting(true);
    // setSubmitError(null);

    if (!formData.designation) {
      throw new Error('Veuillez remplire le champs designation');
    }

    if (!formData.brand) {
      throw new Error('Veuillez remplire le champs Marque');
    }

    if (!formData.category) {
      throw new Error('Veuillez remplire le champs Catégorie');
    }

    try {
      // ===========================
      // 1. VALIDATION FINALE
      // ===========================
      if (!canProceed()) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (!formData.designation || !formData.brand || !formData.reference) {
        throw new Error('Les champs désignation, marque et référence sont obligatoires');
      }

      if (colors.filter(c => c.name && c.hex).length === 0) {
        throw new Error('Au moins une couleur doit être définie');
      }

      // ===========================
      // 2. UPLOAD DES IMAGES
      // ===========================
      console.log('🔄 Upload des images en cours...');
      
      const processedColors: ProcessedColor[] = await Promise.all(
        colors
          .filter(c => c.name && c.hex)
          .map(async (color): Promise<ProcessedColor> => {
            let uploadedImages: UploadedImage[] = [];
            
            // Upload des images si elles existent
            if (color.images.length > 0) {
              console.log(`📤 Upload de ${color.images.length} image(s) pour la couleur ${color.name}`);
              uploadedImages = await uploadColorImages(
                formData.designation,
                color.name,
                color.images
              );
              console.log(`✅ ${uploadedImages.length} image(s) uploadée(s) pour ${color.name}`);
            }

            return {
              colorName: color.name,
              hexaColor: color.hex,
              images: uploadedImages.map(img => ({
                url: img.url,
                fileName: img.fileName,
                displayOrder: img.displayOrder
              }))
            };
          })
      );

      console.log('✅ Toutes les images ont été uploadées avec succès');

      // ===========================
      // 3. PRÉPARER LES VARIANTES
      // ===========================
      // Préparer les variantes avec prix par boutique
      const processedVariants: ProductVariantInput[] = [];

      // 🔍 DEBUG - AVANT traitement
      console.log('🔍 DEBUG - Variantes à traiter:', {
        nombreDeVariantes: variants.length,
        variants: variants.map(v => ({
          name: v.name,
          storeVariants: v.storeVariants.map(sv => ({
            storeId: sv.storeId,
            storeName: sv.storeName,
            pvTTC: sv.pvTTC
          }))
        }))
      });

      for (const variant of variants) {
        for (const storeVariant of variant.storeVariants) {
          // ✅ CORRECTION : Ne pas créer une entrée par couleur
          // Les couleurs sont déjà associées au modèle, pas aux variantes de prix
          
          console.log('📝 Création variante:', {
            variantName: variant.name,
            storeId: storeVariant.storeId,
            storeName: storeVariant.storeName,
            pvTTC: storeVariant.pvTTC
          });
          
          processedVariants.push({
            storeId: storeVariant.storeId,
            colorId: undefined, // ❌ NE PAS mettre de colorId ici - les couleurs sont au niveau du modèle
            variantAttribute: variant.name,
            attributeType: variant.attributeType || 'STORAGE_RAM',
            
            // Prix
            useFCFA: storeVariant.useFCFA,
            pvTTC: parseFloat(storeVariant.pvTTC) || 0,
            pamp: parseFloat(storeVariant.pamp) || 0,
            oldPrice: parseFloat(storeVariant.oldPrice) || 0,
            tva: parseFloat(storeVariant.tva) || 18,
            margin: parseFloat(storeVariant.margin) || 0,
            
            pvTTC_FCFA: parseFloat(storeVariant.pvTTC_FCFA) || 0,
            pamp_FCFA: parseFloat(storeVariant.pamp_FCFA) || 0,
            oldPrice_FCFA: parseFloat(storeVariant.oldPrice_FCFA) || 0,
            marginFCFA: parseFloat(storeVariant.marginFCFA) || 0,
            marginPercent: parseFloat(storeVariant.margin) || 0
          });
        }
      }

      // 🔍 DEBUG - APRÈS traitement
      console.log('✅ DEBUG - Variantes processées:', {
        nombre: processedVariants.length,
        variantes: processedVariants.map(pv => ({
          storeId: pv.storeId,
          variantAttribute: pv.variantAttribute,
          pvTTC: pv.pvTTC,
          pvTTC_FCFA: pv.pvTTC_FCFA
        }))
      });

      // ===========================
      // 4. PRÉPARER LES SPÉCIFICATIONS GÉNÉRALES
      // ===========================
      const processedSpecs = specs.reduce((acc, spec) => {
        if (spec.key && spec.value) {
          acc[spec.key] = spec.value;
        }
        return acc;
      }, {} as Record<string, string>);

      // ===========================
      // 5. PRÉPARER LES PRODUITS RECOMMANDÉS
      // ===========================
      const processedRecommendedProducts = selectedProducts.map((productId, index) => ({
        recommendedProductId: productId,
        priority: index + 1,
        relationType: 'ACCESSORY' as const,
        bundleDiscount: null,
        bundlePrice: null,
        description: null
      }));

      // ===========================
      // 6. CONSTRUIRE LE PAYLOAD
      // ===========================
      const payload = {
        user_id: user?.id, // ⚠️ À remplacer par l'ID réel de l'utilisateur connecté
        role: user?.role, // ⚠️ À remplacer par le rôle réel de l'utilisateur
        
        // Informations de base
        designation: formData.designation,
        brand: formData.brand,
        reference: formData.reference,
        category: formData.category,
        family: formData.family || null,
        subFamily: formData.subFamily || null,
        description: formData.description || null,
        status: formData.status,
        
        // Spécifications générales
        specifications: Object.keys(processedSpecs).length > 0 ? processedSpecs : null,
        
        // Couleurs avec images uploadées
        colors: processedColors,
        
        // Variantes de stockage
        variants: processedVariants,
        
        // Produits recommandés
        recommendedProducts: processedRecommendedProducts.length > 0 ? processedRecommendedProducts : []
      };

      // ===========================
      // 7. APPEL API POUR CRÉER LE MODÈLE
      // ===========================
      const response = await fetch('/api/products/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
 
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du modèle');
      }
      
      // Fermer le modal
      onClose();
      
      // Réinitialiser l'étape
      setStep(1);
      
      // Réinitialiser les données du formulaire
      setFormData({
        designation: '',
        brand: '',
        family: '',
        subFamily: '',
        reference: '',
        category: 'Téléphones',
        description: '',
        status: 'DRAFT'
      });
      
      // Réinitialiser les couleurs
      setColors([{ name: '', hex: '#000000', images: [] }]);
      
      // Réinitialiser les variantes
      setVariants([{ 
        name: '128GB',
        attributeType: 'STORAGE_RAM',
        specs: [],
        storeVariants: []
      }]);
      
      // Réinitialiser les spécifications
      setSpecs([
        { key: 'Écran', value: '' },
        { key: 'Processeur', value: '' },
        { key: 'RAM', value: '' },
        { key: 'Caméra', value: '' },
        { key: 'Batterie', value: '' }
      ]);
      
      // Réinitialiser les produits sélectionnés
      setSelectedProducts([]);
      
      // Réinitialiser les erreurs
      // setSubmitError(null);

      console.log('🔄 Formulaire réinitialisé');
      
    } catch (error) {
      // ===========================
      // 10. GESTION DES ERREURS
      // ===========================
      console.error('❌ Erreur lors de la soumission:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      // setSubmitError(errorMessage);
      
      alert(`❌ Erreur\n\n${errorMessage}\n\nVeuillez vérifier les données et réessayer.`);
      
    } finally {
      // ===========================
      // 11. NETTOYAGE FINAL
      // ===========================
      // setIsSubmitting(false);
      console.log('✔️ Processus de soumission terminé');
    }
  };


  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.designation && formData.brand && formData.reference;
      case 2:
        return colors.some(c => c.name && c.hex);
      case 3:
        return variants.length > 0;
      case 4:
        return true; // Step 4 specs are optional, can always proceed
      case 5:
        return true; // Step 5 is optional
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, name: 'Informations', icon: Package },
    { id: 2, name: 'Couleurs', icon: ImageIcon },
    { id: 3, name: 'Variantes', icon: Package2 },
    { id: 4, name: 'Spécifications', icon: Settings },
    { id: 5, name: 'Produits liés', icon: LinkIcon }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white z-10 rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Créer un nouveau modèle</h2>
                <p className="text-purple-100 text-sm">Étape {step} sur 5</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const StepIcon = s.icon;
                return (
                  <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        step >= s.id ? 'bg-white text-[#800080]' : 'bg-white/20 text-white'
                      }`}>
                        {step > s.id ? <Check size={20} /> : <StepIcon size={20} />}
                      </div>
                      <p className={`text-xs mt-2 hidden sm:block ${step >= s.id ? 'text-white font-semibold' : 'text-purple-200'}`}>
                        {s.name}
                      </p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                        step > s.id ? 'bg-white' : 'bg-white/20'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de base</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Désignation du modèle <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      placeholder="iPhone 15 Pro Max"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Marque <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      required
                    >
                      <option value="">Sélectionnez une marque</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      required
                    >
                      <option value="">Sélectionnez une categorie</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Famille
                    </label>
                    <select
                      value={formData.family}
                      onChange={(e) => setFormData({...formData, family: e.target.value, subFamily: ''})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    >
                      <option value="">Sélectionnez une famille</option>
                      {Object.keys(families).map(family => (
                        <option key={family} value={family}>{family}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sous-famille
                    </label>
                    <select
                      value={formData.subFamily}
                      onChange={(e) => setFormData({...formData, subFamily: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      disabled={!formData.family}
                    >
                      <option value="">Sélectionnez une sous-famille</option>
                      {formData.family && families[formData.family as keyof typeof families]?.map(subFamily => (
                        <option key={subFamily} value={subFamily}>{subFamily}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Référence du modèle <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                        placeholder="APL-IP15PM-001"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateReference}
                        disabled={!formData.brand}
                        className="px-4 py-3 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <RefreshCw size={18} />
                        Générer
                      </button>
                    </div>
                  </div>

                  {/* Après le champ description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Statut du modèle
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({
                        ...formData, 
                        status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED' | 'DESTOCKING_ACTIVE' | 'DESTOCKING_END_OF_LIFE'
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    >
                      <option value="DRAFT">📝 Brouillon</option>
                      <option value="ACTIVE">✅ Actif</option>
                      <option value="ARCHIVED">📦 Archivé</option>
                      <option value="DESTOCKING_ACTIVE">🔥 Actif à déstocker</option>
                      <option value="DESTOCKING_END_OF_LIFE">⏸️ Fin de vie à déstocker</option>
                      <option value="INACTIVE">❌ Fin de vie</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.status === 'DRAFT' && 'Le modèle sera enregistré en brouillon'}
                      {formData.status === 'ACTIVE' && 'Le modèle sera immédiatement visible et disponible'}
                      {formData.status === 'INACTIVE' && 'Le modèle ne sera pas visible dans le catalogue'}
                      {formData.status === 'ARCHIVED' && 'Le modèle sera archivé'}
                      {formData.status === 'DESTOCKING_ACTIVE' && 'Le modèle est actif et en cours de déstockage'}
                      {formData.status === 'DESTOCKING_END_OF_LIFE' && 'Le modèle est en fin de vie et en cours de déstockage'}
                    </p>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Statut du modèle
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({
                        ...formData, 
                        status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED'
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    >
                      <option value="DRAFT">📝 Brouillon</option>
                      <option value="ACTIVE">✅ Actif</option>
                      <option value="ARCHIVED">📦 Archivé</option>
                      <option value="DESTOCKING_ACTIVE">🔥 Actif à déstocker</option>
                      <option value="DESTOCKING_END_OF_LIFE">⏸️ Fin de vie à déstocker</option>
                      <option value="INACTIVE">❌ Fin de vie</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.status === 'DRAFT' && 'Le modèle sera enregistré en brouillon'}
                      {formData.status === 'ACTIVE' && 'Le modèle sera immédiatement visible et disponible'}
                      {formData.status === 'INACTIVE' && 'Le modèle ne sera pas visible dans le catalogue'}
                      {formData.status === 'ARCHIVED' && 'Le modèle sera archivé'}
                    </p>
                  </div> */}

                  {/* <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fournisseur <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          onFocus={() => setSupplierSearch('')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                          placeholder="Rechercher un fournisseur..."
                        />
                        <Search className="absolute right-3 top-3.5 text-gray-400" size={20} />
                        
                        {supplierSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredSuppliers.length > 0 ? (
                              filteredSuppliers.map(supplier => (
                                <button
                                  key={supplier.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({...formData, supplier: supplier.id});
                                    setSupplierSearch(supplier.name);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors"
                                >
                                  <p className="font-semibold text-gray-900">{supplier.name}</p>
                                  <p className="text-xs text-gray-600">{supplier.contact} • {supplier.phone}</p>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">Aucun fournisseur trouvé</div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSupplierModal(true)}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                      >
                        <UserPlus size={18} />
                        Nouveau
                      </button>
                    </div>
                    {formData.supplier && !supplierSearch && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800">
                          ✓ Fournisseur sélectionné: {suppliers.find(s => s.id === formData.supplier)?.name}
                        </p>
                      </div>
                    )}
                  </div> */}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] resize-none"
                    placeholder="Description détaillée du produit..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Colors with preview */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Couleurs disponibles</h3>
                  <button
                    type="button"
                    onClick={addColor}
                    className="text-sm text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Ajouter une couleur
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Couleurs prédéfinies</p>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map(preColor => (
                      <button
                        key={preColor.name}
                        type="button"
                        onClick={() => {
                          if (!colors.some(c => c.name === preColor.name)) {
                            setColors([...colors, { ...preColor, images: [] }]);
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-[#800080] transition-colors"
                      >
                        <span
                          className="w-5 h-5 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: preColor.hex }}
                        />
                        <span className="text-sm text-gray-700">{preColor.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {colors.map((color, colorIndex) => (
                    <div key={colorIndex} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#800080] transition-colors">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Nom de la couleur
                            </label>
                            <input
                              type="text"
                              value={color.name}
                              onChange={(e) => updateColor(colorIndex, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              placeholder="Titane Noir"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Code couleur
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={color.hex}
                                onChange={(e) => updateColor(colorIndex, 'hex', e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={color.hex}
                                onChange={(e) => updateColor(colorIndex, 'hex', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                placeholder="#000000"
                              />
                              {/* Color Preview Box */}
                              <div 
                                className="w-16 h-10 rounded-lg border-2 border-gray-300 shadow-inner"
                                style={{ backgroundColor: color.hex }}
                                title={`Aperçu: ${color.hex}`}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeColor(colorIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Images ({color.name || 'cette couleur'})
                          </label>
                          {color.images.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {color.images.length} image{color.images.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {color.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {color.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative group bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-[#800080] transition-all aspect-square overflow-hidden">
                                <Image
                                  src={image.url}
                                  alt={`${color.name} - ${imgIndex + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                
                                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#800080] text-white flex items-center justify-center text-xs font-bold shadow-lg">
                                  {imgIndex + 1}
                                </div>

                                {imgIndex === 0 && (
                                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Star size={12} fill="white" />
                                    Principal
                                  </div>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {imgIndex > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => moveImage(colorIndex, imgIndex, imgIndex - 1)}
                                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                      title="Déplacer à gauche"
                                    >
                                      <ChevronLeft size={16} className="text-gray-700" />
                                    </button>
                                  )}

                                  {imgIndex !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setMainImage(colorIndex, imgIndex)}
                                      className="p-2 bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
                                      title="Définir comme principale"
                                    >
                                      <Star size={16} className="text-white" fill="white" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newColors = [...colors];
                                      newColors[colorIndex].images = newColors[colorIndex].images.filter((_, i) => i !== imgIndex);
                                      setColors(newColors);
                                    }}
                                    className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} className="text-white" />
                                  </button>

                                  {imgIndex < color.images.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => moveImage(colorIndex, imgIndex, imgIndex + 1)}
                                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                      title="Déplacer à droite"
                                    >
                                      <ChevronRight size={16} className="text-gray-700" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#800080] transition-colors cursor-pointer bg-gray-50">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const fileArray = Array.from(files);
                                const newImages: ColorImage[] = fileArray.map(file => ({
                                  url: URL.createObjectURL(file),
                                  file: file,
                                  name: file.name
                                }));
                                
                                const newColors = [...colors];
                                newColors[colorIndex].images = [...newColors[colorIndex].images, ...newImages];
                                setColors(newColors);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                            id={`upload-${colorIndex}`}
                          />
                          <label htmlFor={`upload-${colorIndex}`} className="cursor-pointer">
                            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                            <p className="text-sm text-gray-600 font-medium">
                              Glissez des images ici ou cliquez pour parcourir
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              PNG, JPG, WEBP jusqu&apos;à 10MB
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colors.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <ImageIcon size={48} className="mx-auto mb-2 text-gray-400" />
                      <p className="font-semibold">Aucune couleur ajoutée</p>
                      <p className="text-sm">Ajoutez au moins une couleur pour continuer</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Variants avec prix par boutique */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Variantes et prix par boutique</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2 text-sm text-blue-800">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Configuration des variantes par boutique</p>
                      <p>Pour chaque variante (128GB, 256GB, etc.), vous pouvez définir des prix différents pour chaque boutique.</p>
                    </div>
                  </div>
                </div>

                {/* Ajouter une variante */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ajouter une variante
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVariantName}
                      onChange={(e) => setNewVariantName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addVariant();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      placeholder="Ex: 128GB, 256GB, 512GB, 45mm, 20000mAh..."
                    />
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      defaultValue="STORAGE_RAM"
                    >
                      <option value="STORAGE_RAM">💾 Stockage</option>
                      <option value="SIZE">📏 Taille</option>
                      <option value="CAPACITY">🔋 Capacité</option>
                      <option value="CONNECTOR">🔌 Connecteur</option>
                      <option value="MEMORY">🧠 Mémoire</option>
                      <option value="NONE">➖ Aucun</option>
                    </select>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Liste des variantes */}
                <div className="space-y-6">
                  {variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      {/* En-tête de la variante */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-gray-900">{variant.name}</h4>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                            {variant.attributeType || 'STORAGE_RAM'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(variantIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Prix par boutique */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-bold text-gray-900">Prix par boutique</h5>
                          <select
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            onChange={(e) => {
                              if (e.target.value) {
                                addStoreToVariant(variantIndex, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            value=""
                          >
                            <option value="">+ Ajouter une boutique</option>
                            {stores
                              .filter(store => !variant.storeVariants.some(sv => sv.storeId === store.id))
                              .map(store => (
                                <option key={store.id} value={store.id}>
                                  {store.name} ({store.code})
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        {variant.storeVariants.length > 0 ? (
                          <div className="space-y-4">
                            {variant.storeVariants.map((storeVariant, storeIndex) => (
                              <div key={storeIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                {/* En-tête boutique */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">{storeVariant.storeName}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleCurrencyMode(variantIndex, storeIndex)}
                                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                                        storeVariant.useFCFA
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      }`}
                                    >
                                      {storeVariant.useFCFA ? '🇧🇫 FCFA' : '🇪🇺 EUR'}
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeStoreFromVariant(variantIndex, storeIndex)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                {/* Champs de prix */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {storeVariant.useFCFA ? (
                                    <>
                                      {/* Mode FCFA */}
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          PV TTC (FCFA)
                                        </label>
                                        <input
                                          type="number"
                                          value={storeVariant.pvTTC_FCFA}
                                          onChange={(e) => updateStoreVariantPrice(variantIndex, storeIndex, 'pvTTC_FCFA', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          PAMP (FCFA)
                                        </label>
                                        <input
                                          type="number"
                                          value={storeVariant.pamp_FCFA}
                                          onChange={(e) => updateStoreVariantPrice(variantIndex, storeIndex, 'pamp_FCFA', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          Ancien prix (FCFA)
                                        </label>
                                        <input
                                          type="number"
                                          value={storeVariant.oldPrice_FCFA}
                                          onChange={(e) => updateStoreVariantPrice(variantIndex, storeIndex, 'oldPrice_FCFA', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          Marge (FCFA)
                                        </label>
                                        <input
                                          type="text"
                                          value={storeVariant.marginFCFA}
                                          readOnly
                                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Mode EUR */}
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          PV TTC (€)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={storeVariant.pvTTC}
                                          onChange={(e) => updateStoreVariantPrice(variantIndex, storeIndex, 'pvTTC', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          PAMP (€)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={storeVariant.pamp}
                                          onChange={(e) => updateStoreVariantPrice(variantIndex, storeIndex, 'pamp', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          TVA (%)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={storeVariant.tva}
                                          onChange={(e) => updateStoreVariantPrice(variantIndex, storeIndex, 'tva', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                          placeholder="18"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          Marge (%)
                                        </label>
                                        <input
                                          type="text"
                                          value={storeVariant.margin}
                                          readOnly
                                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Équivalence */}
                                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                                  <span className="font-semibold">Équivalence: </span>
                                  {storeVariant.useFCFA ? (
                                    <span>{storeVariant.pvTTC}€ = {storeVariant.pvTTC_FCFA} FCFA</span>
                                  ) : (
                                    <span>{storeVariant.pvTTC}€ = {storeVariant.pvTTC_FCFA} FCFA</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <p className="text-sm">Aucune boutique configurée pour cette variante</p>
                            <p className="text-xs mt-1">Utilisez le menu déroulant ci-dessus pour ajouter une boutique</p>
                          </div>
                        )}
                      </div>

                      {/* Spécifications de la variante */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-bold text-gray-900">Spécifications de cette variante</h5>
                          <button
                            type="button"
                            onClick={() => addVariantSpec(variantIndex)}
                            className="text-xs text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
                          >
                            <Plus size={14} />
                            Ajouter
                          </button>
                        </div>

                        {variant.specs.length > 0 ? (
                          <div className="space-y-2">
                            {variant.specs.map((spec, specIndex) => (
                              <div key={specIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  placeholder="Nom"
                                  value={spec.key}
                                  onChange={(e) => updateVariantSpec(variantIndex, specIndex, 'key', e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                />
                                <input
                                  type="text"
                                  placeholder="Valeur"
                                  value={spec.value}
                                  onChange={(e) => updateVariantSpec(variantIndex, specIndex, 'value', e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVariantSpec(variantIndex, specIndex)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Aucune spécification pour cette variante</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: General Specs */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Spécifications générales du modèle</h3>
                  <button
                    type="button"
                    onClick={addSpec}
                    className="text-sm text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Ajouter
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2 text-sm text-blue-800">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>
                      Ces spécifications s&apos;appliquent à <strong>toutes les variantes</strong> du modèle.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {specs.map((spec, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Nom (ex: Écran, Processeur...)"
                        value={spec.key}
                        onChange={(e) => updateSpec(index, 'key', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      />
                      <input
                        type="text"
                        placeholder="Valeur (ex: 6.7 pouces...)"
                        value={spec.value}
                        onChange={(e) => updateSpec(index, 'value', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      />
                      <button 
                        type="button"
                        onClick={() => removeSpec(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Linked Products */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Produits liés</h3>
                    <p className="text-sm text-gray-600 mt-1">Sélectionnez les produits existants à associer</p>
                  </div>
                  <div className="text-sm font-semibold text-[#800080]">
                    {selectedProducts.length} sélectionné{selectedProducts.length > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="Rechercher par désignation, référence ou marque..."
                  />
                  <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                </div>

                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                    <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                      <div className="col-span-1"></div>
                      <div className="col-span-1">Image</div>
                      <div className="col-span-3">Désignation</div>
                      <div className="col-span-2">Référence</div>
                      <div className="col-span-2">Marque</div>
                      <div className="col-span-2">Prix</div>
                      <div className="col-span-1">Stock</div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 hover:bg-purple-50 cursor-pointer transition-colors ${
                            selectedProducts.includes(product.id) ? 'bg-purple-100' : ''
                          }`}
                        >
                          <div className="col-span-1 flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProduct(product.id)}
                              className="w-5 h-5 text-[#800080] rounded focus:ring-2 focus:ring-[#800080]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="col-span-1 flex items-center">
                            {product.image ? (
                              <div className="relative w-12 h-12 rounded-lg border border-gray-300 overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                <Image
                                  src={product.image}
                                  alt={product.designation}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEnlargedImage(product.image || null);
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div 
                            className="col-span-3 font-semibold text-gray-900 flex items-center"
                            onClick={() => toggleProduct(product.id)}
                          >
                            {product.designation}
                          </div>
                          <div 
                            className="col-span-2 text-sm text-gray-600 flex items-center"
                            onClick={() => toggleProduct(product.id)}
                          >
                            {product.reference}
                          </div>
                          <div 
                            className="col-span-2 text-sm text-gray-600 flex items-center"
                            onClick={() => toggleProduct(product.id)}
                          >
                            {product.brand}
                          </div>
                          <div 
                            className="col-span-2 text-sm font-semibold text-green-600 flex items-center"
                            onClick={() => toggleProduct(product.id)}
                          >
                            {product.price} F
                          </div>
                          <div 
                            className="col-span-1 text-sm text-gray-600 flex items-center"
                            onClick={() => toggleProduct(product.id)}
                          >
                            {product.stock}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Search size={48} className="mx-auto mb-2 text-gray-400" />
                        <p>Aucun produit trouvé</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-[#800080] rounded-lg p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Produits sélectionnés ({selectedProducts.length})</h4>
                    <div className="space-y-2">
                      {selectedProducts.map(productId => {
                        const product = existingProducts.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                          <div key={productId} className="flex items-center justify-between bg-white rounded-lg p-3">
                            <div className="flex items-center gap-3 flex-1">
                              {product.image ? (
                                <div className="relative w-12 h-12 rounded-lg border border-gray-300 overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer flex-shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.designation}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                    onClick={() => setEnlargedImage(product.image || null)}
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <ImageIcon size={20} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{product.designation}</p>
                                <p className="text-xs text-gray-600">{product.reference} • {product.brand} • {product.price} FCFA</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleProduct(productId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Image Enlargement Modal */}
                {enlargedImage && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div 
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
                      onClick={() => setEnlargedImage(null)} 
                    />
                    <div className="relative bg-white rounded-xl p-4 max-w-xl w-full shadow-2xl">
                      <button
                        onClick={() => setEnlargedImage(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-lg"
                      >
                        <X size={20} />
                      </button>
                      <div className="relative w-full" style={{ maxHeight: '60vh', aspectRatio: 'auto' }}>
                        <Image
                          src={enlargedImage}
                          alt="Agrandie"
                          width={800}
                          height={600}
                          className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                          sizes="(max-width: 640px) 100vw, 640px"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className={`px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold transition-colors ${
                  step === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                ← Précédent
              </button>

              {step === 5 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    const formEvent = e as unknown as React.FormEvent<HTMLFormElement>;
                    handleSubmit(formEvent);
                  }}
                  className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors bg-gradient-to-r from-[#800080] to-[#9333ea] text-white hover:from-[#6b006b] hover:to-[#7e22ce]"
                >
                  <Check size={20} />
                  Créer le modèle
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    canProceed()
                      ? 'bg-[#800080] text-white hover:bg-[#6b006b]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Suivant →
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

 export default AddProductModelModal;