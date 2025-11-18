import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Download, FileSpreadsheet, Plus, X, Check, 
  AlertCircle, ChevronRight, ChevronLeft, Package, 
  Trash2, RefreshCw, Search,
  ArrowRight, CheckCircle, ShoppingCart, FileText,
  UserPlus, Building2, Phone, Mail, MapPin,
  Eye,
} from 'lucide-react';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import * as XLSX from 'xlsx';
import { ErrorModal } from '../Notification_error';
import { SuccessModal } from '../Notification_success';
import toast from 'react-hot-toast';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string,
  storeId: string;
  storeName: string;
  storesLoading: boolean;
  productModels: ProductModel[];
  onStockEntrySubmitSuccess?: () => void; // Callback après succès
  suppliersListe: Supplier[];
  onRefreshSuppliers?: () => void;
}

interface Specification {
  name: string;
  value: string;
}

interface ArticleSpecifications {
  [articleIndex: number]: Specification[];
}

interface ProductModel {
  id: string;
  designation: string;
  reference: string;
  brand: string;
  colors: { id: string; colorName: string; hexaColor: string }[];
}

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  country: string;
}

interface ColumnMapping {
  excelColumn: string;
  dbField: keyof ArticleData | 'skip';
  preview: string[];
}

interface ArticleData {
  articleNumber: string;
  reference: string;
  modelReference: string;
  description: string;
  modelId: string;
  colorId?: string;
  // stockage_ram?: string
  variantId?: string;
  // supplierId?: string;
  
  // useFCFA: boolean;
  // pvTTC: string;
  // pamp: string;
  // oldPrice: string;
  // tva: string;
  
  // pvTTC_FCFA: string;
  // pamp_FCFA: string;
  // oldPrice_FCFA: string;
  
  // margin: string;
  // marginFCFA: string;
  // marginPercent: string;
  
  specifications?: Record<string, string>;
  condition: 'NEW' | 'LIKE_NEW' | 'REFURBISHED';
}

// ==========================================
// CONSTANTES ET VARIABLES DE TEXTE
// ==========================================

const TEXTS = {
  // Titres généraux
  MODAL_TITLE: 'Nouvelle entrée en stock',
  STEP_LABEL: (current: number, total: number) => `Étape ${current} sur ${total}`,
  
  // Steps
  STEP_DOCUMENT: 'Document',
  STEP_METHOD: 'Méthode',
  STEP_MAPPING: 'Mapping',
  STEP_ARTICLES: 'Articles',
  
  // Step 1 - Document
  STEP1_TITLE: 'Document justificatif de l\'entrée',
  DOCUMENT_FILE: 'Document justificatif',
  DOCUMENT_FILE_DESC: 'BL de transfert, facture, bon de commande...',
  DOCUMENT_TYPE: 'Nature du document',
  DOCUMENT_TYPE_PLACEHOLDER: 'Ex: Bon de livraison, Facture...',
  DOCUMENT_REFERENCES: 'Références du document',
  REFERENCE_NAME: 'Nom de la référence',
  REFERENCE_VALUE: 'Valeur',
  REFERENCE_NAME_PLACEHOLDER: 'Ex: N° BL, N° Facture...',
  REFERENCE_VALUE_PLACEHOLDER: 'Ex: BL-2024-001',
  ADD_REFERENCE: 'Ajouter une référence',
  MAX_REFERENCES: 'Maximum 5 références',
  SUPPLIER_LABEL: 'Fournisseur',
  SELECT_SUPPLIER: 'Sélectionnez un fournisseur',
  NEW_SUPPLIER: 'Nouveau fournisseur',
  PURCHASE_DATE: 'Date d\'achat',
  UPLOAD_DOCUMENT: 'Télécharger le document',
  UPLOAD_DOCUMENT_DESC: 'Glissez le document ici ou cliquez pour parcourir',
  DOCUMENT_FORMATS: 'PDF, JPG, PNG jusqu\'à 10MB',
  
  // Modal nouveau fournisseur
  NEW_SUPPLIER_TITLE: 'Créer un nouveau fournisseur',
  SUPPLIER_NAME: 'Nom du fournisseur',
  SUPPLIER_CONTACT: 'Nom du contact',
  SUPPLIER_PHONE: 'Téléphone',
  SUPPLIER_EMAIL: 'Email',
  SUPPLIER_ADDRESS: 'Adresse',
  SUPPLIER_COUNTRY: 'Pays',
  CANCEL: 'Annuler',
  SAVE: 'Enregistrer',
  
  // Step 2 - Méthode
  STEP2_TITLE: 'Méthode d\'ajout des articles',
  MANUAL_ENTRY: 'Saisie manuelle',
  MANUAL_DESC: 'Ajoutez les articles un par un manuellement',
  EXCEL_IMPORT: 'Import Excel',
  EXCEL_DESC: 'Importez plusieurs articles depuis un fichier Excel',
  
  // Articles
  ARTICLE_NUMBER: 'Numéro d\'article',
  ARTICLE_REFERENCE: 'Référence article',
  MODEL_REFERENCE: 'Référence modèle',
  CONDITION: 'État',
  PRICE_TTC_EUR: 'Prix TTC (€)',
  PAMP_EUR: 'PAMP (€)',
  OLD_PRICE_EUR: 'Ancien prix (€)',
  PRICE_TTC_FCFA: 'Prix TTC (FCFA)',
  PAMP_FCFA: 'PAMP (FCFA)',
  OLD_PRICE_FCFA: 'Ancien prix (FCFA)',
  TVA: 'TVA (%)',
  CALCULATED_MARGINS: 'Marges calculées',
  MARGIN_EURO: 'Euro',
  MARGIN_FCFA: 'FCFA',
  MARGIN_PERCENT: '%',
  
  // États
  CONDITION_NEW: 'Neuf',
  CONDITION_LIKE_NEW: 'Comme neuf',
  CONDITION_REFURBISHED: 'Reconditionné',
  
  // Actions
  ADD_ARTICLE: 'Ajouter l\'article',
  ARTICLES_COUNT: (count: number) => `${count} article(s)`,
  USE_FCFA: 'Saisir les prix en FCFA',
  
  // Navigation
  PREVIOUS: 'Précédent',
  NEXT: 'Suivant',
  VALIDATE_ENTRY: 'Valider l\'entrée en stock',
  SAVING: 'Enregistrement...',
  
  // Erreurs
  ERROR_SUPPLIER_EXISTS: 'Ce fournisseur existe déjà',
  ERROR_SUPPLIER_REQUIRED: 'Tous les champs obligatoires doivent être remplis',
  ERROR_REFERENCE_DUPLICATE: 'Les références doivent avoir des noms et valeurs uniques',
  ERROR_ARTICLE_REQUIRED: 'Le numéro d\'article et la référence sont obligatoires',
  SUCCESS_SUPPLIER: 'Fournisseur créé avec succès',
};

const COLORS = {
  primary: '#800080',
  primaryHover: '#6b006b',
  primaryLight: '#9333ea',
  gradient: 'from-[#800080] to-[#9333ea]',
  gradientHover: 'from-[#6b006b] to-[#7e22ce]',
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
const StockEntryModal: React.FC<StockEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  // stores = [],
  // storesLoading = false,
  selectedRole,
  storeId,
  storeName,
  productModels = [],
  onStockEntrySubmitSuccess,
  // onRefreshSuppliers,
  suppliersListe
}) => {
  const user = useCurrentUser();
  const [step, setStep] = useState(1);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Step 1 - Document
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentReference, setDocumentReference] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    country: 'Burkina Faso'
  });
  const [supplierSearch, setSupplierSearch] = useState('');
  
  // Import Excel
  const [importMethod, setImportMethod] = useState<'MANUAL' | 'EXCEL'>('MANUAL');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<unknown[][]>([]);
  // const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // État pour gérer les spécifications d'un article
  const [articleSpecifications, setArticleSpecifications] = useState<ArticleSpecifications>({});


  
  // Articles
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [currentArticle, setCurrentArticle] = useState<ArticleData>({
    articleNumber: '',
    reference: '',
    modelReference: '',
    description: '',
    modelId: '',
    variantId: '',
    // useFCFA: false,
    // pvTTC: '',
    // pamp: '',
    // oldPrice: '',
    // tva: '18',
    // pvTTC_FCFA: '',
    // pamp_FCFA: '',
    // oldPrice_FCFA: '',
    // margin: '0',
    // marginFCFA: '0',
    // marginPercent: '0',
    condition: 'NEW'
  });
  
  // États
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // ==========================================
  // FONCTIONS - SUPPLIERS
  // ==========================================
  const filteredSuppliers = suppliersListe.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const addSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contactName || !newSupplier.phone) {
      setError(TEXTS.ERROR_SUPPLIER_REQUIRED);
      return;
    }

    // Vérifier si le fournisseur existe déjà
    if (suppliersListe.some(s => s.name.toLowerCase() === newSupplier.name.toLowerCase())) {
      setError(TEXTS.ERROR_SUPPLIER_EXISTS);
      return;
    }

    try {
      // Appel API pour créer le fournisseur
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSupplier,
          createdBy: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du fournisseur');
      }

      
      // Réinitialiser et fermer le modal
      setNewSupplier({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        country: 'Burkina Faso'
      });
      setShowSupplierModal(false);
      setError(null);
      
      alert(TEXTS.SUCCESS_SUPPLIER);

    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la création du fournisseur');
    }
  };

  // ==========================================
  // FONCTIONS - DOCUMENT UPLOAD
  // ==========================================
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      
      // Vérifier le type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format de fichier non supporté');
        return;
      }
      
      setDocumentFile(file);
      setError(null);
    }
  };


  // ==========================================
  // FONCTIONS - EXCEL (identiques à avant)
  // ==========================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        cellStyles: true,
        cellFormula: true,
        cellDates: true
      });

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        throw new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as unknown[][];

      // setExcelHeaders(headers);
      setExcelData(rows);

      // Mapping automatique
      const initialMappings: ColumnMapping[] = headers.map((header, index) => {
        const lowerHeader = header.toLowerCase();
        let suggestedField: keyof ArticleData | 'skip' = 'skip';

        if (lowerHeader.includes('numéro') || lowerHeader.includes('article')) {
          suggestedField = 'articleNumber';
        } else if (lowerHeader.includes('référence article')) {
          suggestedField = 'reference';
        } else if (lowerHeader.includes('référence modèle') || lowerHeader.includes('model')) {
          suggestedField = 'modelReference';
        } else if (lowerHeader.includes('état') || lowerHeader.includes('condition')) {
          suggestedField = 'condition';
        }

        return {
          excelColumn: header,
          dbField: suggestedField,
          preview: rows.slice(0, 3).map(row => String((row as unknown[])[index] || ''))
        };
      });

      setColumnMappings(initialMappings);
      setStep(3);

    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setError('Erreur lors de la lecture du fichier Excel');
    }
  };

  const applyMapping = () => {
    const mappedArticles: ArticleData[] = excelData.map((row: unknown[]) => {
      const article: Partial<ArticleData> = {
        modelId: '',
        condition: 'NEW',
      };

      columnMappings.forEach((mapping, index) => {
        if (mapping.dbField !== 'skip' && row[index] !== undefined) {
          (article as Record<string, unknown>)[mapping.dbField] = String(row[index]);
        }
      });

      return article as ArticleData;
    });

    setArticles(mappedArticles);
    setStep(4);
  };

  const addArticle = () => {
    if (!currentArticle.articleNumber || !currentArticle.reference) {
      setError(TEXTS.ERROR_ARTICLE_REQUIRED);
      return;
    }

    setArticles([...articles, currentArticle]);
    
    // setCurrentArticle({
    //   articleNumber: '',
    //   reference: '',
    //   modelReference: '',
    //   description: '',
    //   modelId: '',
    //   condition: 'NEW'
    // });
    
    setError(null);
  };

  const downloadTemplate = () => {
    const template = [
      ['Numéro Article', 'Référence Article', 'Référence Modèle', 'État', 'Prix TTC (€)', 'PAMP (€)', 'Ancien Prix (€)', 'TVA (%)'],
      ['ART001', 'REF-001', 'APL-IP15PM', 'NEW', '999.99', '750.00', '1199.99', '18'],
      ['ART002', 'REF-002', 'SAM-S24U', 'NEW', '599.99', '450.00', '699.99', '18']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'modele_entree_stock.xlsx');
  };

  // ==========================================
  // NAVIGATION
  // ==========================================
  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  // const prevStep = () => {
  //   if (step > 1) setStep(step - 1);
  // };

  if (!isOpen) return null;

  const selectedSupplierData = suppliersListe .find(s => s.id === selectedSupplier);

  const steps = [
    { id: 1, name: TEXTS.STEP_DOCUMENT, icon: FileText },
    { id: 2, name: TEXTS.STEP_METHOD, icon: FileSpreadsheet },
    { id: 3, name: TEXTS.STEP_MAPPING, icon: Upload },
    { id: 4, name: TEXTS.STEP_ARTICLES, icon: ShoppingCart }
  ];

  const StockEntrySubmit = async () => {
    try {
      // ============================================
      // VALIDATIONS AVANT ENVOI
      // ============================================

      setIsSubmitting(true); // État de chargement

      // Vérifier qu'il y a au moins un article
      if(articles.length === 0) {
          setIsSubmitting(false)
          setErrorMessage("Veuillez ajouter au moins un article")
          setShowError(true);
          return
      }

      if (!documentFile) {
          setIsSubmitting(false)
          setErrorMessage("Veuillez ajouter le document justificatif de l'entrée")
          setShowError(true);
          setStep(1); // Retour à l'étape 1
          return
      }

      if (!documentFile) {
          setIsSubmitting(false)
          setErrorMessage("Veuillez présiser la nature du document justificatif de l'entrée")
          setShowError(true);
          setStep(1); // Retour à l'étape 1
          return
      }

      if (!selectedSupplier) {
          setIsSubmitting(false)
          setErrorMessage("Veuillez sélectionner un fournisseur")
          setShowError(true);
          setStep(1); // Retour à l'étape 1
          return
      }

      if (!purchaseDate) {
          setIsSubmitting(false)
          setErrorMessage("Veuillez présiser la date d'achat des articles")
          setShowError(true);
          setStep(1); // Retour à l'étape 1
          return
      }

      if (!storeId) {
        console.log('La boutique est obligatoire');
        return;
      }

      // Vérifier que tous les articles ont les champs obligatoires
      const invalidArticles = articles.filter(article => 
        !article.articleNumber || 
        !article.reference || 
        !article.modelId || 
        !article.colorId || 
        !article.variantId || 
        !article.condition
      );

      if (invalidArticles.length > 0) {
        setIsSubmitting(false)
        setErrorMessage(`${invalidArticles.length} article(s) incomplet(s)`);
        setShowError(true);
        setStep(4); // Retour à l'étape 4
        return
      }

      // ============================================
      // PRÉPARATION DU PAYLOAD
      // ============================================

      

      const payload = {
        user_id: user?.id,
        role: selectedRole,
        
        // Document (niveau global)
        document_file: documentFile?.name || null,
        document_type: documentType || null,
        document_refs: documentReference || null,
        
        // Import
        import_source: importMethod === 'MANUAL' ? 'MANUAL' : 'EXCEL',
        excel_file_name: importMethod === 'EXCEL' ? excelFile?.name : undefined,
        
        // Informations communes (niveau global)
        supplier_id: selectedSupplier,
        store_id: storeId,
        purchase_date: purchaseDate,
        
        // Articles - MAPPING IMPORTANT
        articles: articles.map(article => ({
          article_number: article.articleNumber,
          reference: article.reference,
          model_reference: article.modelReference,
          description: article.description || null,
          model_id: article.modelId,
          color_id: article.colorId,
          variant_id: article.variantId,

          // Specifications (déjà au bon format Record<string, string>)
          specifications: article.specifications || {},
          
          // Condition
          condition: article.condition,
          
          // Status
          status: 'IN_STOCK',
        }))
      };

      // ============================================
      // ENVOI À L'API
      // ============================================
      
      const response = await fetch('/api/products/models/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      // ============================================
      // GESTION DE LA RÉPONSE
      // ============================================
      
      if (!response.ok) {
        // Erreur de l'API
        setIsSubmitting(false)
        setErrorMessage(data.message);
        setShowError(true);
        return;
      }

      // ===========================
      // STEP 1: Upload du document justificatif
      // ===========================
      let documentUrl = null;

      if (documentFile) {
        console.log('📤 Upload du document justificatif...');
        
        const formData = new FormData();
        formData.append('document', documentFile);
        formData.append('stockEntryId', data.stockEntry.id); // L'ID que vous avez créé avant

        try {
          const uploadResponse = await fetch('/api/products/models/articles/upload-document', {
            method: 'POST',
            body: formData
          });

          const uploadResult = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadResult.success) {
            throw new Error(uploadResult.message || 'Erreur lors de l\'upload du document');
          }

          documentUrl = uploadResult.document.url;
          console.log('✅ Document uploadé:', documentUrl);

        } catch (error) {
          console.error('❌ Erreur upload document:', error);
          toast.error('Erreur lors de l\'upload du document justificatif');
          // Décider si vous voulez continuer ou arrêter le processus
          return; // ou throw error; selon votre logique
        }
      }

      setIsSubmitting(false)
      setSuccessMessage(data.message)
      setShowSuccess(true);

      // Réinitialiser le formulaire et fermer le modal
      resetForm();
      // onClose();

      // Appeler la fonction de callback pour recharger les données
        if (onStockEntrySubmitSuccess) {
          onStockEntrySubmitSuccess();
        }

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      console.log('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false); // Fin du chargement
    }
  };

  // Fonction de réinitialisation du formulaire
  const resetForm = () => {
    // Réinitialiser Step 1
    setDocumentFile(null);
    setDocumentType('');
    setDocumentReference('');
    setSelectedSupplier('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    
    // Réinitialiser Step 2
    setImportMethod('MANUAL');
    setExcelFile(null);
    
    // Réinitialiser les articles
    setArticles([]);
    
    // Retour à l'étape 1
    setStep(1);
  };

  // Fonction pour ajouter une spécification à un article
  const addSpecification = (articleIndex: number) => {
    setArticleSpecifications(prev => ({
      ...prev,
      [articleIndex]: [
        ...(prev[articleIndex] || []),
        { name: '', value: '' }
      ]
    }));
  };

  // Fonction pour mettre à jour une spécification
  const updateSpecification = (
    articleIndex: number, 
    specIndex: number, 
    field: 'name' | 'value', 
    value: string
  ) => {
    setArticleSpecifications(prev => {
      const articleSpecs = [...(prev[articleIndex] || [])];
      articleSpecs[specIndex] = {
        ...articleSpecs[specIndex],
        [field]: value
      };

      // Mettre à jour l'article avec les spécifications au format Record<string, string>
      const specs: Record<string, string> = {};
      articleSpecs.forEach(spec => {
        if (spec.name && spec.value) {
          specs[spec.name] = spec.value;
        }
      });
      
      updateArticle(articleIndex, 'specifications', specs);

      return {
        ...prev,
        [articleIndex]: articleSpecs
      };
    });
  };

  // Fonction pour supprimer une spécification
  const removeSpecification = (articleIndex: number, specIndex: number) => {
    setArticleSpecifications(prev => {
      const articleSpecs = [...(prev[articleIndex] || [])];
      articleSpecs.splice(specIndex, 1);
      
      // Mettre à jour l'article
      const specs: Record<string, string> = {};
      articleSpecs.forEach(spec => {
        if (spec.name && spec.value) {
          specs[spec.name] = spec.value;
        }
      });
      
      updateArticle(articleIndex, 'specifications', specs);
      
      return {
        ...prev,
        [articleIndex]: articleSpecs
      };
    });
  };

  const updateArticle = (articleIndex: number, field: string, value: string | Record<string, string>) => {
    setArticles(prev => {
      const updatedArticles = [...prev];
      updatedArticles[articleIndex] = {
        ...updatedArticles[articleIndex],
        [field]: value
      };
      return updatedArticles;
    });
  };

  return (
    <>
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
        // message="La boutique a été créée avec succès ! Vous pouvez maintenant la gérer depuis le tableau de bord."
      />

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
        // message="Une erreur est survenue lors de la création de la boutique. Veuillez vérifier les informations saisies et réessayer."
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          
          <div className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className={`sticky top-0 bg-gradient-to-r ${COLORS.gradient} px-8 py-6 text-white z-10 rounded-t-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Nouvelle entrée en stock pour la boutique: {storeName}</h2>
                  <p className="text-purple-100 text-sm">{TEXTS.STEP_LABEL(step, 4)}</p>
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
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* STEP 1: Document */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{TEXTS.STEP1_TITLE}</h3>
                              
                  {/* Upload Document */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {TEXTS.DOCUMENT_FILE} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">{TEXTS.DOCUMENT_FILE_DESC}</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#800080] transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                      />
                      <label htmlFor="document-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {documentFile ? documentFile.name : TEXTS.UPLOAD_DOCUMENT}
                        </p>
                        <p className="text-xs text-gray-600">
                          {TEXTS.UPLOAD_DOCUMENT_DESC}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {TEXTS.DOCUMENT_FORMATS}
                        </p>
                      </label>
                    </div>

                    {documentFile && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-600" size={20} />
                          <div>
                            <p className="text-sm font-semibold text-green-900">{documentFile.name}</p>
                            <p className="text-xs text-green-700">
                              {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDocumentFile(null)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nature du document */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {TEXTS.DOCUMENT_TYPE} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      placeholder={TEXTS.DOCUMENT_TYPE_PLACEHOLDER}
                    />
                  </div>

                  {/* Référence du document */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Référence du document
                    </label>
                    <input
                      type="text"
                      value={documentReference}
                      onChange={(e) => setDocumentReference(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                      placeholder="Ex: BL-2024-001, FAC-2024-123..."
                    />
                  </div>

                  {/* Fournisseur */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {TEXTS.SUPPLIER_LABEL} <span className="text-red-500">*</span>
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
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredSuppliers.length > 0 ? (
                              filteredSuppliers.map(supplier => (
                                <button
                                  key={supplier.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSupplier(supplier.id);
                                    setSupplierSearch(supplier.name);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <p className="font-semibold text-gray-900">{supplier.name}</p>
                                  <p className="text-xs text-gray-600">{supplier.contactName} • {supplier.phone}</p>
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
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap transition-colors"
                      >
                        <UserPlus size={18} />
                        {TEXTS.NEW_SUPPLIER}
                      </button>
                    </div>
                    {selectedSupplier && !supplierSearch && selectedSupplierData && (
                      <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="text-[#800080] flex-shrink-0 mt-0.5" size={20} />
                          <div className="flex-1">
                            <p className="font-semibold text-purple-900">{selectedSupplierData.name}</p>
                            <div className="mt-2 space-y-1 text-xs text-purple-700">
                              <p className="flex items-center gap-2">
                                <Building2 size={14} />
                                {selectedSupplierData.contactName}
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone size={14} />
                                {selectedSupplierData.phone}
                              </p>
                              {selectedSupplierData.email && (
                                <p className="flex items-center gap-2">
                                  <Mail size={14} />
                                  {selectedSupplierData.email}
                                </p>
                              )}
                              {selectedSupplierData.address && (
                                <p className="flex items-center gap-2">
                                  <MapPin size={14} />
                                  {selectedSupplierData.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date d'achat */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {TEXTS.PURCHASE_DATE} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Méthode */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{TEXTS.STEP2_TITLE}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => {
                        setImportMethod('MANUAL');
                        setStep(4);
                      }}
                      className="p-8 border-2 border-gray-300 rounded-xl hover:border-[#800080] hover:bg-purple-50 transition-all group"
                    >
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-[#800080] transition-colors" />
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{TEXTS.MANUAL_ENTRY}</h4>
                      <p className="text-sm text-gray-600">
                        {TEXTS.MANUAL_DESC}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMethod('EXCEL')}
                      className={`p-8 border-2 rounded-xl transition-all group ${
                        importMethod === 'EXCEL' 
                          ? 'border-[#800080] bg-purple-50' 
                          : 'border-gray-300 hover:border-[#800080] hover:bg-purple-50'
                      }`}
                    >
                      <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-[#800080] transition-colors" />
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{TEXTS.EXCEL_IMPORT}</h4>
                      <p className="text-sm text-gray-600">
                        {TEXTS.EXCEL_DESC}
                      </p>
                    </button>
                  </div>

                  {importMethod === 'EXCEL' && (
                    <div className="mt-8 space-y-6">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-[#800080] flex-shrink-0 mt-0.5" size={20} />
                          <div className="space-y-3">
                            <p className="text-sm text-purple-900 font-semibold">
                              Comment préparer votre fichier Excel :
                            </p>
                            <ul className="text-sm text-purple-800 space-y-2 ml-4 list-disc">
                              <li>La première ligne doit contenir les en-têtes de colonnes</li>
                              <li>Colonnes obligatoires : Numéro article, Référence article, Référence modèle</li>
                              <li>Colonnes prix : Prix TTC, PAMP, Ancien prix (en € ou FCFA)</li>
                              <li>Vous pourrez mapper les colonnes à l&apos;étape suivante</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={downloadTemplate}
                        className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition-colors"
                      >
                        <Download size={20} />
                        Télécharger le modèle Excel
                      </button>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#800080] transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer">
                          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {excelFile ? excelFile.name : 'Glissez votre fichier Excel ici'}
                          </p>
                          <p className="text-sm text-gray-600">
                            ou cliquez pour parcourir
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Formats acceptés : .xlsx, .xls
                          </p>
                        </label>
                      </div>

                      {excelFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="text-green-600" size={24} />
                              <div>
                                <p className="font-semibold text-green-900">{excelFile.name}</p>
                                <p className="text-xs text-green-700">
                                  {excelData.length} ligne(s) détectée(s)
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setExcelFile(null);
                                setExcelData([]);
                                // setExcelHeaders([]);
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Mapping Excel */}
              {step === 3 && importMethod === 'EXCEL' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Mapper les colonnes Excel</h3>
                    <p className="text-sm text-gray-600">
                      {excelData.length} ligne(s) à importer
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                      <p className="text-sm text-yellow-800">
                        Associez chaque colonne de votre fichier Excel aux champs correspondants.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {columnMappings.map((mapping, index) => (
                      <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#800080] transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                          {/* Colonne Excel */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Colonne Excel
                            </label>
                            <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                              <p className="font-semibold text-gray-900">{mapping.excelColumn}</p>
                            </div>
                          </div>

                          {/* Mapping */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Champ de destination
                            </label>
                            <select
                              value={mapping.dbField}
                              onChange={(e) => {
                                const newMappings = [...columnMappings];
                                newMappings[index].dbField = e.target.value as keyof ArticleData | 'skip';
                                setColumnMappings(newMappings);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            >
                              <option value="skip">-- Ignorer --</option>
                              <optgroup label="Informations obligatoires">
                                <option value="articleNumber">Numéro d&apos;article *</option>
                                <option value="reference">Référence article *</option>
                                <option value="modelReference">Référence modèle *</option>
                              </optgroup>
                              <optgroup label="Informations générales">
                                <option value="description">Description</option>
                                <option value="condition">État (NEW/USED/...)</option>
                              </optgroup>
                              <optgroup label="Prix en Euro">
                                <option value="pvTTC">Prix TTC (€)</option>
                                <option value="pamp">PAMP (€)</option>
                                <option value="oldPrice">Ancien prix (€)</option>
                              </optgroup>
                              <optgroup label="Prix en FCFA">
                                <option value="pvTTC_FCFA">Prix TTC (FCFA)</option>
                                <option value="pamp_FCFA">PAMP (FCFA)</option>
                                <option value="oldPrice_FCFA">Ancien prix (FCFA)</option>
                              </optgroup>
                              <optgroup label="Autres">
                                <option value="tva">TVA (%)</option>
                              </optgroup>
                            </select>
                          </div>

                          {/* Aperçu */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Aperçu des données
                            </label>
                            <div className="space-y-1">
                              {mapping.preview.slice(0, 3).map((value, i) => (
                                <div key={i} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 truncate">
                                  {value || <span className="text-gray-400 italic">vide</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-[#800080] flex-shrink-0" size={20} />
                      <p className="text-sm text-purple-800">
                        Les marges seront calculées automatiquement. Si vous avez des prix en Euro ou en FCFA, l&apos;autre devise sera convertie automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Articles */}
              {/* STEP 4: Articles */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      {importMethod === 'MANUAL' ? 'Ajouter des articles' : 'Réviser les articles importés'}
                    </h3>
                    <div className="text-sm font-semibold text-[#800080]">
                      {TEXTS.ARTICLES_COUNT(articles.length)}
                    </div>
                  </div>

                  {importMethod === 'MANUAL' && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Nouvel article</h4>
                      
                      <div className="space-y-6">
                        {/* Informations de base */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              {TEXTS.ARTICLE_NUMBER} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={currentArticle.articleNumber}
                              onChange={(e) => setCurrentArticle({...currentArticle, articleNumber: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              placeholder="ART-001"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              {TEXTS.ARTICLE_REFERENCE} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={currentArticle.reference}
                              onChange={(e) => setCurrentArticle({...currentArticle, reference: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              placeholder="REF-001"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              {TEXTS.MODEL_REFERENCE} <span className="text-red-500">*</span>
                            </label>
                            <ModelReferenceSelect
                              value={currentArticle.modelId}
                              onChange={(modelId) => {
                                setCurrentArticle({
                                  ...currentArticle, 
                                  modelId: modelId,
                                  colorId: '', // Réinitialiser la couleur quand on change de modèle
                                });
                              }}
                              productModels={productModels}
                            />
                          </div>

                          {/* Dans votre formulaire d'article */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Couleur <span className="text-red-500">*</span>
                            </label>
                            
                            <ColorSelector
                              modelId={currentArticle.modelId}
                              role={selectedRole}
                              selectedColorId={currentArticle.colorId || ''}
                              onChange={(colorId) => setCurrentArticle({
                                ...currentArticle,
                                colorId: colorId
                              })}
                              disabled={!currentArticle.modelId}
                            />
                          </div>

                          {/* Dans votre formulaire d'article */}
                          <div>
                            <label
                              htmlFor="variant"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              Variante spécifique 
                              <span className="text-gray-500 ml-1 italic">
                                (ex : 256GB / 8GB, 45mm, 20000mAh, USB-C)
                              </span>
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            
                            <SpecificVariantSelector
                              modelId={currentArticle.modelId}
                              storeId={storeId}
                              role={selectedRole}
                              selectedSpecificVariantId={currentArticle.variantId || ''}
                              onChange={(variantId) => setCurrentArticle({
                                ...currentArticle,
                                variantId: variantId
                              })}
                              disabled={!currentArticle.modelId}
                            />
                          </div>

                          {/* Sélecteur de variant (stockage/RAM)
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Stockage / RAM *
                            </label>
                            <ProductVariantSelector
                              modelId={currentArticle.modelId}
                              role={selectedRole}
                              selectedVariant={currentArticle.variantId || ''}
                              onVariantChange={(variantId) => setCurrentArticle({
                                ...currentArticle,
                                variantId: variantId
                              })}
                              disabled={!currentArticle.modelId}
                            />
                          </div> */}

                          {/* <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Stockage / RAM <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={currentArticle.stockage_ram || ''}
                              onChange={(e) => setCurrentArticle({
                                ...currentArticle,
                                stockage_ram: e.target.value
                              })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              placeholder="Ex: 128GB / 8GB RAM"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Format suggéré : Stockage / RAM (ex: 256GB / 12GB RAM)
                            </p>
                          </div> */}
                        

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={currentArticle.description}
                              onChange={(e) => setCurrentArticle({...currentArticle, description: e.target.value})}
                              rows={2}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] resize-none"
                              placeholder="Description de l'article..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              {TEXTS.CONDITION}
                            </label>
                            <select
                              value={currentArticle.condition}
                              onChange={(e) => setCurrentArticle({...currentArticle, condition: e.target.value as 'NEW' | 'LIKE_NEW' | 'REFURBISHED'})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            >
                              <option value="NEW">{TEXTS.CONDITION_NEW}</option>
                              <option value="LIKE_NEW">{TEXTS.CONDITION_LIKE_NEW}</option>
                              <option value="REFURBISHED">{TEXTS.CONDITION_REFURBISHED}</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={addArticle}
                          className={`w-full px-6 py-3 bg-gradient-to-r ${COLORS.gradient} text-white rounded-lg hover:${COLORS.gradientHover} font-semibold flex items-center justify-center gap-2 transition-colors`}
                        >
                          <Plus size={20} />
                          {TEXTS.ADD_ARTICLE}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des articles */}
                  {articles.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-gray-900">
                        Articles à enregistrer ({articles.length})
                      </h4>

                      <div className="space-y-3">
                        {articles.map((article, articleIndex) => (
                          <div key={articleIndex} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#800080] transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold mb-1">Article</p>
                                  <p className="font-bold text-gray-900">{article.articleNumber}</p>
                                  <p className="text-sm text-gray-600">{article.reference}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500 font-semibold mb-1">Modèle</p>
                                  <p className="font-bold text-gray-900">{article.modelReference}</p>
                                  <p className="text-sm text-gray-600">{article.condition}</p>
                                </div>

                                {/* Couleur */}
                                {article.colorId && (() => {
                                  const color = productModels
                                    .find(m => m.id === article.modelId)
                                    ?.colors.find(c => c.id === article.colorId);
                                  return color ? (
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">Couleur</p>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                                          style={{ backgroundColor: color.hexaColor }}
                                        />
                                        <p className="font-bold text-gray-900">{color.colorName}</p>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}

                                {/* Variante */}

                                <div>
                                  <p className="text-xs text-gray-500 font-semibold mb-1">Variante spécifique</p>
                                  <p className="font-bold text-gray-900">{article.variantId}</p>
                                </div>
                                
                              </div>

                              <button
                                type="button"
                                onClick={() => setArticles(articles.filter((_, i) => i !== articleIndex))}
                                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            {article.description && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-700">{article.description}</p>
                              </div>
                            )}

                            {/* ======================================= */}
                            {/* SECTION SPÉCIFICATIONS - AJOUTEZ ICI */}
                            {/* ======================================= */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700">Spécifications</h4>
                                <button
                                  type="button"
                                  onClick={() => addSpecification(articleIndex)}
                                  className="text-sm text-[#800080] hover:text-[#600060] flex items-center gap-1 font-semibold"
                                >
                                  <Plus size={16} />
                                  Ajouter une spécification
                                </button>
                              </div>

                              {/* Liste des spécifications */}
                              {(articleSpecifications[articleIndex] || []).length > 0 ? (
                                <div className="space-y-2">
                                  {(articleSpecifications[articleIndex] || []).map((spec: Specification, specIndex: number) => (
                                    <div key={specIndex} className="flex gap-2 items-start">
                                      <input
                                        type="text"
                                        placeholder="Nom (ex: Taille)"
                                        value={spec.name}
                                        onChange={(e) => updateSpecification(articleIndex, specIndex, 'name', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Valeur (ex: 42)"
                                        value={spec.value}
                                        onChange={(e) => updateSpecification(articleIndex, specIndex, 'value', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeSpecification(articleIndex, specIndex)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  Aucune spécification ajoutée
                                </p>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>

                      {/* Statistiques */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                        <h5 className="text-sm font-bold text-indigo-900 mb-4">Résumé de l&apos;entrée</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-xs text-indigo-600 font-semibold mb-1">Total articles</p>
                            <p className="text-2xl font-bold text-indigo-900">{articles.length}</p>
                          </div>
                          
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
                  onClick={() => {
                    if (step === 3 && importMethod === 'MANUAL') {
                      setStep(2);
                    } else if (step === 4 && importMethod === 'MANUAL') {
                      setStep(2);
                    } else if (step > 1) {
                      setStep(step - 1);
                    }
                  }}
                  disabled={step === 1}
                  className={`px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                    step === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft size={20} />
                  {TEXTS.PREVIOUS}
                </button>

                {step === 4 ? (
                  <button
                    onClick={StockEntrySubmit}
                    disabled={isSubmitting || articles.length === 0}
                    className={`flex-1 px-6 py-3 bg-gradient-to-r ${COLORS.gradient} text-white rounded-lg hover:${COLORS.gradientHover} font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        {TEXTS.SAVING}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        {TEXTS.VALIDATE_ENTRY}
                      </>
                    )}
                  </button>
                ) : step === 3 ? (
                  <button
                    type="button"
                    onClick={applyMapping}
                    className={`px-6 py-3 bg-gradient-to-r ${COLORS.gradient} text-white rounded-lg hover:${COLORS.gradientHover} font-semibold flex items-center gap-2 transition-colors`}
                  >
                    Appliquer le mapping
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      nextStep();
                    }}
                    className={`px-6 py-3 bg-gradient-to-r ${COLORS.gradient} text-white rounded-lg hover:${COLORS.gradientHover} font-semibold flex items-center gap-2 transition-colors`}
                  >
                    {TEXTS.NEXT}
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Modal Nouveau Fournisseur */}
        {showSupplierModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => setShowSupplierModal(false)} />
            <div className="relative bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">{TEXTS.NEW_SUPPLIER_TITLE}</h3>
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {TEXTS.SUPPLIER_NAME} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="TechDistrib SARL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {TEXTS.SUPPLIER_CONTACT} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contactName}
                    onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {TEXTS.SUPPLIER_PHONE} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="+226 70 12 34 56"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {TEXTS.SUPPLIER_EMAIL}
                  </label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="contact@techdistrib.bf"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {TEXTS.SUPPLIER_ADDRESS}
                  </label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="Avenue Kwame N'Krumah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {TEXTS.SUPPLIER_COUNTRY}
                  </label>
                  <input
                    type="text"
                    value={newSupplier.country}
                    onChange={(e) => setNewSupplier({...newSupplier, country: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="Burkina Faso"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {TEXTS.CANCEL}
                </button>
                <button
                  type="button"
                  onClick={addSupplier}
                  disabled={!newSupplier.name || !newSupplier.contactName || !newSupplier.phone}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r ${COLORS.gradient} text-white rounded-lg hover:${COLORS.gradientHover} font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-colors`}
                >
                  {TEXTS.SAVE}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StockEntryModal;




// Type pour un modèle de produit
interface ProductModel {
  id: string;
  designation: string;
}

// Props du composant
interface ModelReferenceSelectProps {
  value: string;
  onChange: (value: string) => void;
  productModels: ProductModel[];
}

// Composant de recherche avec autocomplete
const ModelReferenceSelect: React.FC<ModelReferenceSelectProps> = ({ 
  value, 
  onChange, 
  productModels 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filteredModels, setFilteredModels] = useState<ProductModel[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Trouver le modèle sélectionné
  const selectedModel = productModels.find(m => m.id === value);

  // Filtrer les modèles en fonction de la recherche
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = productModels
        .filter(model => 
          model.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 50); // Limiter à 50 résultats pour la performance
      setFilteredModels(filtered);
    } else {
      setFilteredModels([]);
    }
  }, [searchTerm, productModels]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (model: ProductModel) => {
    onChange(model.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#800080] bg-white">
        {selectedModel && !isOpen ? (
          <div className="flex items-center justify-between">
            <span>{selectedModel.designation} - {selectedModel.id}</span>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
              }}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Rechercher un modèle (min. 2 caractères)..."
            className="w-full outline-none"
          />
        )}
      </div>

      {isOpen && filteredModels.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredModels.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model)}
              className="w-full px-4 py-2 text-left hover:bg-purple-50 focus:bg-purple-50 focus:outline-none"
            >
              <div className="font-medium">{model.designation}</div>
              <div className="text-sm text-gray-500">{model.id}</div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm.length >= 2 && filteredModels.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500">
          Aucun modèle trouvé
        </div>
      )}
    </div>
  );
};



// ==========================================
// COMPOSANT DE SÉLECTION DE COULEUR
// ==========================================


interface ColorOption {
  id: string;
  colorName: string;
  hexaColor: string;
}

interface ColorSelectorProps {
  modelId: string;
  role: string;
  selectedColorId: string;
  onChange: (colorId: string) => void;
  disabled?: boolean;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ 
  modelId,
  role,
  selectedColorId, 
  onChange,
  disabled = false 
}) => {
  const user = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string>(''); // NOUVEAU
  const dropdownRef = useRef<HTMLDivElement>(null);

  // NOUVEAU: Réinitialiser les couleurs quand le modèle change
  useEffect(() => {
    if (modelId !== currentModelId) {
      setColors([]); // Vider le cache des couleurs
      setIsOpen(false); // Fermer le dropdown
      setError('');
      setCurrentModelId(modelId); // Mettre à jour le modèle actuel
    }
  }, [modelId, currentModelId]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch des couleurs disponibles pour ce modèle
  const fetchColors = async () => {
    if (!modelId || !user?.id) {
      console.log('Modèle non sélectionné');
      return;
    }

    setLoading(true);
    setError('');
    setColors([]); // Vider avant de charger

    try {
      const response = await fetch(
        `/api/products/models/${modelId}/colors?user_id=${user.id}&role=${role}`
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Erreur lors du chargement des couleurs');
        console.log(data.message || 'Erreur lors du chargement des couleurs');
        return;
      }

      if (data.colors && data.colors.length > 0) {
        setColors(data.colors);
        setIsOpen(true);
      } else {
        console.log('Aucune couleur disponible pour ce modèle');
      }

    } catch (err) {
      console.error('Erreur fetch couleurs:', err);
      setError('Erreur de connexion au serveur');
      console.log('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dropdown et charger les couleurs
  const handleOpenColors = () => {
    if (disabled) return;
    
    if (!modelId) {
      console.log('Veuillez d\'abord sélectionner un modèle');
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // MODIFIÉ: Toujours recharger si le modèle a changé
    if (colors.length > 0 && modelId === currentModelId) {
      setIsOpen(true);
      return;
    }

    fetchColors();
  };

  // Sélectionner une couleur
  const handleSelectColor = (colorId: string) => {
    onChange(colorId);
    setIsOpen(false);
  };

  // Trouver la couleur sélectionnée
  const selectedColor = colors.find(c => c.id === selectedColorId);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Reste du code identique */}
      <div className="flex gap-2">
        {selectedColor ? (
          <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: selectedColor.hexaColor }}
              />
              <span className="font-medium text-gray-900">
                {selectedColor.colorName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenColors}
            disabled={disabled || !modelId}
            className={`flex-1 px-4 py-3 border-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              disabled || !modelId
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-[#800080] text-[#800080] hover:bg-purple-50'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Eye size={20} />
                Voir les couleurs disponibles
              </>
            )}
          </button>
        )}
      </div>

      {/* Dropdown des couleurs */}
      {isOpen && colors.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">
              {colors.length} couleur(s) disponible(s)
            </p>
          </div>
          
          <div className="p-2 space-y-1">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => handleSelectColor(color.id)}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                  selectedColorId === color.id
                    ? 'bg-purple-50 border-2 border-[#800080]'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color.hexaColor }}
                />
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{color.colorName}</p>
                  <p className="text-xs text-gray-500 font-mono">{color.hexaColor}</p>
                </div>

                {selectedColorId === color.id && (
                  <CheckCircle size={20} className="text-[#800080] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute z-50 w-full mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};


// ==========================================
// COMPOSANT DE SÉLECTION DE Variante spécifique
// ==========================================


interface SpecificVariantOption {
  id: string;
  variantAttribute: string;
  pvTTC: string;
  pvTTC_FCFA: string;
}

interface SpecificVariantSelectorProps {
  modelId: string;
  storeId: string;
  role: string;
  selectedSpecificVariantId: string;
  onChange: (variantId: string) => void;
  disabled?: boolean;
}

const SpecificVariantSelector: React.FC<SpecificVariantSelectorProps> = ({ 
  modelId,
  storeId,
  role,
  selectedSpecificVariantId,
  onChange,
  disabled = false 
}) => {
  const user = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [specificVariant, setSpecificVariant] = useState<SpecificVariantOption[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // NOUVEAU: Réinitialiser les couleurs quand le modèle change
  useEffect(() => {
    if (modelId !== currentModelId) {
      setSpecificVariant([]); // Vider le cache des couleurs
      setIsOpen(false); // Fermer le dropdown
      setError('');
      setCurrentModelId(modelId); // Mettre à jour le modèle actuel
    }
  }, [modelId, currentModelId]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch des couleurs disponibles pour ce modèle
  const fetchVariants = async () => {
    if (!modelId || !user?.id) {
      console.log('Modèle non sélectionné');
      return;
    }

    setLoading(true);
    setError('');
    setSpecificVariant([]); // Vider avant de charger

    try {
      const response = await fetch(
        `/api/products/models/${modelId}/productVariant?user_id=${user.id}&store_id=${storeId}&role=${role}`
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Erreur lors du chargement des couleurs');
        console.log(data.message || 'Erreur lors du chargement des couleurs');
        return;
      }

      if (data.variants_specifique && data.variants_specifique.length > 0) {
        setSpecificVariant(data.variants_specifique);
        setIsOpen(true);
      } else {
        console.log('Aucune Variante specifique disponible pour ce modèle');
      }

    } catch (err) {
      console.error('Erreur fetch specificVariant:', err);
      setError('Erreur de connexion au serveur');
      console.log('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dropdown et charger les variants
  const handleOpenVariants = () => {
    if (disabled) return;
    
    if (!modelId) {
      console.log('Veuillez d\'abord sélectionner un modèle');
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // MODIFIÉ: Toujours recharger si le modèle a changé
    if (specificVariant.length > 0 && modelId === currentModelId) {
      setIsOpen(true);
      return;
    }

    fetchVariants();
  };

  // Sélectionner une specificVariant
  const handleSelectVariants = (colorId: string) => {
    onChange(colorId);
    setIsOpen(false);
  };

  // Trouver la specificVariant sélectionnée
  const selectedSpecificVariant = specificVariant.find(c => c.id === selectedSpecificVariantId);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Reste du code identique */}
      <div className="flex gap-2">
        {selectedSpecificVariant ? (
          <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: '#ffffff' }}
              />
              <span className="font-medium text-gray-900">
                {selectedSpecificVariant.id} - {selectedSpecificVariant.variantAttribute} - {selectedSpecificVariant.pvTTC}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenVariants}
            disabled={disabled || !modelId}
            className={`flex-1 px-4 py-3 border-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              disabled || !modelId
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-[#800080] text-[#800080] hover:bg-purple-50'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Eye size={20} />
                Voir les Variantes disponibles
              </>
            )}
          </button>
        )}
      </div>

      {/* Dropdown des variant */}
      {isOpen && specificVariant.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">
              {specificVariant.length} variant(s) disponible(s)
            </p>
          </div>
          
          <div className="p-2 space-y-1">
            {specificVariant.map((specificVariantAff) => (
              <button
                key={specificVariantAff.id}
                type="button"
                onClick={() => handleSelectVariants(specificVariantAff.id)}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                  selectedSpecificVariantId === specificVariantAff.id
                    ? 'bg-purple-50 border-2 border-[#800080]'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                />
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{specificVariantAff.id}</p>
                  <p className="font-semibold text-gray-900">{specificVariantAff.variantAttribute}</p>
                  <p className="text-xs text-gray-500 font-mono">{specificVariantAff.pvTTC} €</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute z-50 w-full mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// COMPOSANT DE SÉLECTION DE VARIANTE (Nouveau Design)
// ==========================================

// interface VariantOption {
//   id: string;
//   name: string;
//   specifications: {
//     RAM?: string;
//     ram?: string;
//     stockage?: string;
//     Stockage?: string;
//     [key: string]: any;
//   };
//   pvTTC_FCFA: string;
//   useFCFA: boolean;
// }

// interface ProductVariantSelectorProps {
//   modelId: string;
//   role: string;
//   selectedVariant: string;
//   onVariantChange: (variantId: string) => void;
//   disabled?: boolean;
// }

// const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
//   modelId,
//   role,
//   selectedVariant,
//   onVariantChange,
//   disabled = false,
// }) => {
//   const user = useCurrentUser();
//   const [variants, setVariants] = useState<VariantOption[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);
//   const [error, setError] = useState('');
//   const [currentModelId, setCurrentModelId] = useState<string>('');
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Fonction utilitaire pour récupérer une valeur insensible à la casse
//   const getValueCaseInsensitive = (obj: any, key: string): string => {
//     if (!obj) return '';
//     const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
//     return foundKey ? obj[foundKey] : '';
//   };

//   // Fermer le dropdown quand on clique en dehors
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isOpen]);

//   // Réinitialiser quand le modèle change
//   useEffect(() => {
//     if (modelId !== currentModelId) {
//       setVariants([]);
//       setError('');
//       onVariantChange('');
//     }
//   }, [modelId, currentModelId]);

//   // Fonction pour récupérer les variantes
//   const fetchVariants = async () => {
//     if (!modelId || !user?.id || !role) {
//       setError('Informations manquantes');
//       console.log('⚠️ Informations manquantes:', { modelId, userId: user?.id, role });
//       return;
//     }

//     setLoading(true);
//     setError('');
//     setCurrentModelId(modelId);

//     try {
//       console.log('🔍 Fetching variants pour:', { modelId, userId: user.id, role });
      
//       const response = await fetch(
//         `/api/products/models/${modelId}/productVariant?user_id=${user.id}&role=${role}`
//       );
      
//       console.log('📡 Response status:', response.status);
      
//       const data = await response.json();
//       console.log('📦 Data reçue:', data);

//       if (!response.ok) {
//         setError(data.message || 'Erreur lors du chargement');
//         console.error('❌ Erreur API:', data);
//         return;
//       }

//       // IMPORTANT: Votre API retourne "variants" et non "storages"
//       if (data.variants && data.variants.length > 0) {
//         console.log('✅ Variantes trouvées:', data.variants.length);
//         setVariants(data.variants);
//         setIsOpen(true);
//       } else {
//         console.log('⚠️ Aucune variante disponible pour ce modèle');
//         setError('Aucune variante disponible');
//       }

//     } catch (err) {
//       console.error('❌ Erreur fetch variantes:', err);
//       setError('Erreur de connexion au serveur');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Ouvrir le dropdown et charger les variantes
//   const handleOpenVariants = () => {
//     if (disabled) {
//       console.log('⚠️ Dropdown désactivé');
//       return;
//     }
    
//     if (!modelId) {
//       console.log('⚠️ Aucun modèle sélectionné');
//       return;
//     }

//     if (isOpen) {
//       console.log('🔽 Fermeture du dropdown');
//       setIsOpen(false);
//       return;
//     }

//     // Toujours recharger si le modèle a changé
//     if (variants.length > 0 && modelId === currentModelId) {
//       console.log('♻️ Réutilisation du cache');
//       setIsOpen(true);
//       return;
//     }

//     console.log('🚀 Chargement des variantes...');
//     fetchVariants();
//   };

//   // Sélectionner une variante
//   const handleSelectVariant = (variantId: string) => {
//     console.log('✅ Variante sélectionnée:', variantId);
//     onVariantChange(variantId);
//     setIsOpen(false);
//   };

//   // Trouver la variante sélectionnée
//   const selectedVariantData = variants.find(v => v.id === selectedVariant);

//   // Extraire stockage et RAM de la variante sélectionnée
//   const getStorageInfo = (variant: VariantOption) => {
//     const storage = getValueCaseInsensitive(variant.specifications, 'stockage');
//     const ram = getValueCaseInsensitive(variant.specifications, 'RAM');
//     return { storage, ram };
//   };

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <div className="flex gap-2">
//         {selectedVariantData ? (
//           <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
//                 <Package size={16} className="text-white" />
//               </div>
//               <div>
//                 <p className="font-medium text-gray-900">
//                   {(() => {
//                     const { storage, ram } = getStorageInfo(selectedVariantData);
//                     return storage && ram ? `${storage} | ${ram} RAM` : selectedVariantData.name;
//                   })()}
//                 </p>
//                 <p className="text-sm text-gray-500">
//                   {parseFloat(selectedVariantData.pvTTC_FCFA).toLocaleString('fr-FR')} FCFA
//                 </p>
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={() => onVariantChange('')}
//               disabled={disabled}
//               className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
//               title="Désélectionner"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         ) : (
//           <button
//             type="button"
//             onClick={handleOpenVariants}
//             disabled={disabled || !modelId}
//             className={`flex-1 px-4 py-3 border-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
//               disabled || !modelId
//                 ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
//                 : 'border-[#800080] text-[#800080] hover:bg-purple-50'
//             }`}
//           >
//             {loading ? (
//               <>
//                 <RefreshCw size={20} className="animate-spin" />
//                 Chargement...
//               </>
//             ) : (
//               <>
//                 <Eye size={20} />
//                 Voir les variantes disponibles
//               </>
//             )}
//           </button>
//         )}
//       </div>

//       {/* Dropdown des variantes */}
//       {isOpen && variants.length > 0 && (
//         <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
//           <div className="p-3 border-b border-gray-200 bg-gray-50">
//             <p className="text-sm font-semibold text-gray-700">
//               {variants.length} variante(s) disponible(s)
//             </p>
//           </div>
          
//           <div className="p-2 space-y-1">
//             {variants.map((variant) => {
//               const { storage, ram } = getStorageInfo(variant);
//               const displayName = storage && ram ? `${storage} | ${ram} RAM` : variant.name;
//               const price = parseFloat(variant.pvTTC_FCFA);

//               return (
//                 <button
//                   key={variant.id}
//                   type="button"
//                   onClick={() => handleSelectVariant(variant.id)}
//                   className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
//                     selectedVariant === variant.id
//                       ? 'bg-purple-50 border-2 border-[#800080]'
//                       : 'hover:bg-gray-50 border-2 border-transparent'
//                   }`}
//                 >
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center flex-shrink-0 shadow-sm">
//                     <Package size={20} className="text-white" />
//                   </div>
                  
//                   <div className="flex-1">
//                     <p className="font-semibold text-gray-900">
//                       {displayName}
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       {price.toLocaleString('fr-FR')} FCFA
//                     </p>
//                   </div>

//                   {selectedVariant === variant.id && (
//                     <CheckCircle size={20} className="text-[#800080] flex-shrink-0" />
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {error && (
//         <div className="absolute z-50 w-full mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
//           <p className="text-sm text-red-600">{error}</p>
//         </div>
//       )}
//     </div>
//   );
// };