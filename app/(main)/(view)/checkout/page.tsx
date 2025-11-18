'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Building2, MapPin, User, ChevronLeft, ShieldCheck, Plus, Check } from 'lucide-react';
import { useCart, CartItem } from '../contexts/CartContext';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { useLocation } from '../contexts/LocationContext';
import Image from 'next/image';

// ============================================
// INTERFACES
// ============================================

interface Address {
  id: string;
  label?: string;
  civility: 'MR' | 'MME';
  fullName: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

interface ShippingForm {
  civility?: 'MR' | 'MME';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

interface BillingForm extends ShippingForm {
  sameAsShipping: boolean;
}

type PaymentMethod = 'CARD' | 'ALMA_2X' | 'ALMA_3X' | 'ALMA_4X';

// ============================================
// FONCTION UTILITAIRE
// ============================================

// Mapper le code pays vers la localité attendue
const getLocalityFromCountry = (countryCode: string): string => {
  const mapping: { [key: string]: string } = {
    'MQ': 'Martinique',
    'GP': 'Guadeloupe',
    'GF': 'Guyane',
    'FR': 'France Métropolitaine'
  };
  return mapping[countryCode] || '';
};

// Vérifier si le pays correspond à la localité des articles
const isCountryMatchingLocality = (country: string, itemsLocality: string): boolean => {
  const countryLocality = getLocalityFromCountry(country);
  return countryLocality === itemsLocality;
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const user = useCurrentUser();

  const { selectedLocation } = useLocation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localityMismatchError, setLocalityMismatchError] = useState<string | null>(null);

  //stripe
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
  // Adresses sauvegardées
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [useNewShippingAddress, setUseNewShippingAddress] = useState(false);
  const [useNewBillingAddress, setUseNewBillingAddress] = useState(false);

  const [stockError, setStockError] = useState<string | null>(null);

  // Formulaires
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    civility: 'MME',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'FR'
  });

  const [billingForm, setBillingForm] = useState<BillingForm>({
    ...shippingForm,
    sameAsShipping: true
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Fonction pour déterminer le taux de TVA selon le code pays/région
  const getTaxRate = (countryCode: string): number => {
    switch(countryCode) {
      case 'MQ': // Martinique
      case 'GP': // Guadeloupe
        return 0.085; // 8.5%
      case 'GF': // Guyane
        return 0; // 0% - TVA non applicable
      case 'FR': // France métropolitaine
      default:
        return 0.20; // 20% (standard français)
    }
  };

  // Calculs
  const shippingCost = 0 ;
  const taxRate = getTaxRate(shippingForm.country);
  const taxAmount = totalPrice * taxRate;
  const finalTotal = totalPrice + shippingCost;

  // ============================================
  // CHARGEMENT DES ADRESSES
  // ============================================

  useEffect(() => {
    if (user?.id) {
      fetchSavedAddresses();
    }
  }, [user?.id]);
  
  const fetchSavedAddresses = async () => {
    try {
      // setLoadingAddresses(true);
      const response = await fetch('/api/customer/addresses');
      const data = await response.json();

      if (response.ok && data.addresses) {
        setSavedAddresses(data.addresses);
        
        // Pré-sélectionner les adresses par défaut
        const defaultShipping = data.addresses.find((addr: Address) => addr.isDefaultShipping);
        const defaultBilling = data.addresses.find((addr: Address) => addr.isDefaultBilling);
        
        if (defaultShipping) {
          setSelectedShippingAddressId(defaultShipping.id);
          fillShippingFromAddress(defaultShipping);
        }
        
        if (defaultBilling) {
          setSelectedBillingAddressId(defaultBilling.id);
        }
      }
    } catch (error) {
      console.error('Erreur chargement adresses:', error);
    } finally {
      // setLoadingAddresses(false);
    }
  };

  // Remplir le formulaire à partir d'une adresse sauvegardée
  const fillShippingFromAddress = (address: Address) => {
    const [firstName, ...lastNameParts] = address.fullName.split(' ');
    setShippingForm({
      civility: address.civility,
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      email: user?.email || '',
      phone: address.phone,
      company: '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      postalCode: address.postalCode,
      country: address.country
    });
  };

  const fillBillingFromAddress = (address: Address) => {
    const [firstName, ...lastNameParts] = address.fullName.split(' ');
    setBillingForm({
      civility: address.civility,
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      email: user?.email || '',
      phone: address.phone,
      company: '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      sameAsShipping: false
    });
  };

  // ============================================
  // GESTIONNAIRES
  // ============================================

  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShippingForm(prev => ({ ...prev, [field]: value }));

    // Vérifier la correspondance pays/localité lors du changement de pays
    if (field === 'country' && items.length > 0) {
      const itemsLocality = items[0].locality;
      if (!isCountryMatchingLocality(value, itemsLocality)) {
        setLocalityMismatchError(
          `Attention : Votre adresse de livraison doit être en ${itemsLocality} pour correspondre aux articles de votre panier.`
        );
      } else {
        setLocalityMismatchError(null);
      }
    }
    
    // Si même adresse, mettre à jour la facturation
    if (billingForm.sameAsShipping) {
      setBillingForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBillingChange = (field: keyof BillingForm, value: string | boolean) => {
    setBillingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectShippingAddress = (addressId: string) => {
    setSelectedShippingAddressId(addressId);
    setUseNewShippingAddress(false);
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      fillShippingFromAddress(address);
      
      // Vérifier la correspondance pays/localité
      if (items.length > 0) {
        const itemsLocality = items[0].locality;
        if (!isCountryMatchingLocality(address.country, itemsLocality)) {
          setLocalityMismatchError(
            `Attention : Cette adresse (${getLocalityFromCountry(address.country)}) ne correspond pas à la localité de vos articles (${itemsLocality}). Veuillez sélectionner une autre adresse ou en créer une nouvelle.`
          );
        } else {
          setLocalityMismatchError(null);
        }
      }
    }
  };

  const handleSelectBillingAddress = (addressId: string) => {
    setSelectedBillingAddressId(addressId);
    setUseNewBillingAddress(false);
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      fillBillingFromAddress(address);
    }
  };

  const validateStep1 = (): boolean => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'postalCode'];
    const isValid = required.every(field => shippingForm[field as keyof ShippingForm]?.toString().trim() !== '');
    
    if (!isValid) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingForm.email)) {
      setError('Adresse email invalide');
      return false;
    }

    // Vérifier la correspondance pays/localité
    if (items.length > 0) {
      const itemsLocality = items[0].locality;
      if (!isCountryMatchingLocality(shippingForm.country, itemsLocality)) {
        setError(
          `Votre adresse de livraison doit être en ${itemsLocality} pour correspondre aux articles de votre panier. ` +
          `Actuellement : ${getLocalityFromCountry(shippingForm.country)}.`
        );
        return false;
      }
    }

    setError(null);
    return true;
  };

  const validateSameLocality = (): boolean => {
    if (items.length === 0) return true;
    
    const firstLocality = items[0].locality;
    const hasDifferentLocalities = items.some(item => item.locality !== firstLocality);
    
    if (hasDifferentLocalities) {
      setError('Impossible de continuer : votre panier contient des articles de différentes localités. Veuillez ne garder que des articles d\'une seule région.');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Vérifier d'abord la localité
      if (!validateSameLocality()) {
        return; // Bloquer si différentes localités
      }
      
      // Puis valider le formulaire
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  // ============================================
  // SOUMISSION DE LA COMMANDE
  // ============================================

  // const handleSubmitOrder = async () => {
  //   if (!acceptedTerms) {
  //     setError('Veuillez accepter les conditions générales de vente');
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     // 1. Créer la commande
  //     const orderResponse = await fetch('/api/orders/create', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         items,
  //         shippingAddress: shippingForm,
  //         billingAddress: billingForm.sameAsShipping ? shippingForm : billingForm,
  //         paymentMethod,
  //         amounts: {
  //           subtotal: totalPrice,
  //           shippingCost,
  //           taxAmount,
  //           totalAmount: finalTotal
  //         }
  //       })
  //     });

  //     if (!orderResponse.ok) {
  //       const errorData = await orderResponse.json();
  //       throw new Error(errorData.message || 'Erreur lors de la création de la commande');
  //     }

  //     const { order } = await orderResponse.json();

  //     // 2. Initialiser le paiement selon la méthode
  //     if (paymentMethod === 'CARD') {
  //       // Stripe
  //       const paymentResponse = await fetch('/api/payments/stripe/create-intent', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           orderId: order.id,
  //           amount: finalTotal
  //         })
  //       });

  //       if (!paymentResponse.ok) {
  //         throw new Error('Erreur lors de l\'initialisation du paiement Stripe');
  //       }

  //       const { clientSecret } = await paymentResponse.json();
        
  //       // Rediriger vers la page de paiement Stripe
  //       router.push(`/checkout/payment/stripe?client_secret=${clientSecret}&order_id=${order.id}`);

  //     } else if (paymentMethod.startsWith('ALMA_')) {
  //       // Alma
  //       const installments = parseInt(paymentMethod.split('_')[1].replace('X', ''));
        
  //       const paymentResponse = await fetch('/api/payments/alma/create-payment', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           orderId: order.id,
  //           amount: finalTotal,
  //           installments
  //         })
  //       });

  //       if (!paymentResponse.ok) {
  //         throw new Error('Erreur lors de l\'initialisation du paiement Alma');
  //       }

  //       const { paymentUrl } = await paymentResponse.json();
        
  //       // Rediriger vers Alma
  //       window.location.href = paymentUrl;
  //     }

  //   } catch (err) {
  //     console.error('Erreur commande:', err);
  //     setError(err instanceof Error ? err.message : 'Une erreur est survenue');
  //     setLoading(false);
  //   }
  // };

  const handleSubmitOrder = async(e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('Veuillez accepter les conditions générales de vente');
      return;
    }

    setLoading(true);
    setError(null);
    setStockError(null);
    
    console.log('\n--- Vérification du stock en temps réel ---');
    
    try {
        // Étape 1 : Vérifier le stock
        console.log('items avant:', items);
        
        const stockCheck  = await fetch("/api/produits/cart/verify-stock", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items
            })
        });
        
        const stockData  = await stockCheck .json();
        console.log('Réponse API:', stockData);

        // if (!response.ok) {
        //     // Afficher le vrai message d'erreur de l'API
        //     console.error('Vérification du stock échouée:', data.error);
        //     throw new Error(data.error || 'Certains articles ne sont plus disponibles');
        // }
        if (!stockCheck.ok || !stockData.success) {
            setStockError(stockData.error || 'Stock insuffisant');
            setLoading(false);
            return;
        }

        // if (!stockData.success) {
        //     console.error('Vérification du stock échouée:', stockData.error);
        //     throw new Error(stockData.error || 'Erreur lors de la vérification du stock');
        // }

        console.log('✅ Stock vérifié avec succès:', stockData.stockStatus);

        // Tous les articles sont disponibles, continuer avec la commande
        // ... suite de votre logique de commande

        // Étape 2 : Créer la commande
        const orderResponse = await fetch("/api/orders/create", {
          method : 'POST',
          headers : { 
              'Content-Type': 'application/json',
          },
          body : JSON.stringify({
              items,
              shippingAddress: shippingForm,
              billingAddress: billingForm.sameAsShipping ? shippingForm : billingForm,
              paymentMethod,
              amounts: {
                subtotal: totalPrice,
                shippingCost,
                taxAmount,
                totalAmount: finalTotal
              }
          })
        })
        
        const orderData = await orderResponse.json();
        
        if (!orderResponse.ok || !orderData.success) {
            setStockError(orderData.error || 'Erreur lors de la création de la commande');
            return;
        }

        console.log('✅ Commande créée:', orderData.order.orderNumber);
        const order = orderData.order;

        // ----------------------------------------
      // ÉTAPE 3 : Initialisation du paiement
      // ----------------------------------------
      
      if (paymentMethod === 'CARD') {
        console.log('💳 Initialisation du paiement Stripe...');
        
         // Préparer les items au format Stripe
        const stripeItems = items.map((item: CartItem) => ({
          productName: item.designation || 'Produit',
          storage: item.storage || '',
          brand: item.brand || '',
          unitPrice: item.price,
          quantity: item.quantity,
          image: item.image || null
        }));

        // Préparer les infos client
      const customerInfo = {
        email: user?.email,
        name: `${billingForm.firstName} ${billingForm.lastName}`,
        phone: billingForm.phone,
        address: {
          line1: billingForm.addressLine1,
          line2: billingForm.addressLine2 || undefined,
          city: billingForm.city,
          postalCode: billingForm.postalCode,
          country: billingForm.country || 'FR',
          state: billingForm.city || undefined
        }
      };

      console.log('📤 Données envoyées à Stripe:', {
        items: stripeItems,
        orderId: order.id,
        customerInfo
      });
 
      try {
        // Appeler l'API Stripe
        const stripeResponse = await fetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            items: stripeItems,
            orderId: order.id,
            customerInfo: customerInfo
          })
        });

        console.log('📥 Statut de la réponse:', stripeResponse.status);
        console.log('📥 Headers:', Object.fromEntries(stripeResponse.headers.entries()));

        // Vérifier si la réponse est du JSON
        const contentType = stripeResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await stripeResponse.text();
          console.error('❌ Réponse non-JSON reçue:', textResponse.substring(0, 500));
          throw new Error('Le serveur a retourné une réponse invalide. Vérifiez les logs serveur.');
        }

        const stripeData = await stripeResponse.json();
        console.log('📥 Données Stripe reçues:', stripeData);

        if (!stripeResponse.ok || !stripeData.success) {
          throw new Error(stripeData.error || 'Erreur lors de l\'initialisation du paiement Stripe');
        }

        if (!stripeData.url) {
          throw new Error('URL de paiement manquante dans la réponse');
        }

        console.log('✅ Session Stripe créée');
        console.log('🔄 Redirection vers:', stripeData.url);
        
        // Vider le panier AVANT la redirection
        clearCart();
        
        // Redirection vers la page de paiement Stripe
        window.location.href = stripeData.url;

      } catch (fetchError) {
        console.error('❌ Erreur lors de l\'appel API Stripe:', fetchError);
        throw new Error(
          fetchError instanceof Error 
            ? fetchError.message 
            : 'Erreur lors de la communication avec le serveur de paiement'
        );
      }

      } else if (paymentMethod.startsWith('ALMA_')) {
        console.log('💰 Initialisation du paiement Alma...');
        
        const installments = parseInt(paymentMethod.split('_')[1].replace('X', ''));
        
        const almaResponse = await fetch('/api/payments/alma/create-payment', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: finalTotal,
            installments
          })
        });

        const almaData = await almaResponse.json();

        if (!almaResponse.ok || !almaData.success) {
          throw new Error(almaData.error || 'Erreur lors de l\'initialisation du paiement Alma');
        }

        console.log('✅ Paiement Alma initialisé');
        console.log('🔄 Redirection vers Alma...');
        
        // Vider le panier
        clearCart();
        
        // Redirection vers Alma
        window.location.href = almaData.paymentUrl;
      }


      // // 🆕 ÉTAPE 3: Initialisation du paiement selon la méthode
      // if (paymentMethod === 'CARD') {
      //   // 💳 Paiement par carte via Stripe
      //   console.log('💳 Initialisation Stripe...');
        
      //   const stripeResponse = await fetch('/api/payments/stripe/create-intent', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       orderId: order.id,
      //       amount: finalTotal
      //     })
      //   });

      //   const stripeData = await stripeResponse.json();

      //   if (!stripeResponse.ok || !stripeData.success) {
      //     throw new Error('Erreur lors de l\'initialisation du paiement');
      //   }

      //   console.log('✅ Stripe initialisé, redirection...');
        
      //   // Redirection vers la page de paiement Stripe
      //   // router.push(`/checkout/payment/stripe?client_secret=${stripeData.clientSecret}&order_id=${order.id}`);

      // } else if (paymentMethod.startsWith('ALMA_')) {
      //   // 💰 Paiement en plusieurs fois via Alma
      //   console.log('💰 Initialisation Alma...');
        
      //   const installments = parseInt(paymentMethod.split('_')[1].replace('X', ''));
        
      //   const almaResponse = await fetch('/api/payments/alma/create-payment', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       orderId: order.id,
      //       amount: finalTotal,
      //       installments
      //     })
      //   });

      //   const almaData = await almaResponse.json();

      //   if (!almaResponse.ok || !almaData.success) {
      //     throw new Error('Erreur lors de l\'initialisation du paiement Alma');
      //   }

      //   console.log('✅ Alma initialisé, redirection...');
        
      //   // Redirection vers Alma (en dehors de votre site)
      //   window.location.href = almaData.paymentUrl;
      // }

      // 🆕 Vider le panier après initialisation du paiement
      clearCart();

        // Étape 3 : Initialiser le paiement via paypal ou Alma
      // if (paymentMethod === 'CARD') {
      //   console.log('💳 Initialisation du paiement Stripe...');
        
      //   const paymentResponse = await fetch('/api/payments/stripe/create-intent', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       orderId: orderData.order.id,
      //       amount: finalTotal
      //     })
      //   });

      //   const paymentData = await paymentResponse.json();

      //   if (!paymentResponse.ok || !paymentData.success) {
      //     setStockError(paymentData.error || 'Erreur lors de l\'initialisation du paiement');
      //     return;
      //   }

      //   // Rediriger vers la page de paiement Stripe
      //   const redirectUrl = `/checkout/payment/stripe?client_secret=${paymentData.clientSecret}&order_id=${orderData.order.id}`;
      //   console.log('🔄 Redirection vers:', redirectUrl);
      //   router.push(redirectUrl);

      // } else if (paymentMethod.startsWith('ALMA_')) {
      //   console.log('💳 Initialisation du paiement Alma...');
        
      //   const installments = parseInt(paymentMethod.split('_')[1].replace('X', ''));
        
      //   const paymentResponse = await fetch('/api/payments/alma/create-payment', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       orderId: orderData.order.id,
      //       amount: finalTotal,
      //       installments
      //     })
      //   });
        
      //   const paymentData = await paymentResponse.json();

      //   if (!paymentResponse.ok) {
      //     setStockError('Erreur lors de l\'initialisation du paiement Alma');
      //     return;
      //   }

      //   console.log('🔄 Redirection vers Alma');
      //   window.location.href = paymentData.paymentUrl;
      // }

    } catch (error) {
      console.error('❌ Erreur:', error);
      setStockError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };



  // ============================================
  // RENDU
  // ============================================

  if (items.length === 0) {
    return null; // Redirigé par useEffect
  }

  return (
    <>
      {stockError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
                <h3 className="text-lg font-bold text-red-600 mb-2">
                    ⚠️ Stock insuffisant
                </h3>
                <p className="text-gray-700 mb-4">{stockError}</p>
                <button 
                    onClick={() => setStockError(null)}
                    className="w-full bg-blue-600 text-white py-2 rounded"
                >
                    Fermer
                </button>
            </div>
        </div>
      )}
    
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
                <span>Retour</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Finaliser ma commande</h1>
              <div className="w-20" /> {/* Spacer */}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Colonne Gauche - Formulaires */}
            <div className="lg:col-span-2 space-y-6">
              {/* Indicateur de progression */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map(step => (
                    <React.Fragment key={step}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step === currentStep
                            ? 'bg-[#800080] text-white'
                            : step < currentStep
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {step < currentStep ? '✓' : step}
                        </div>
                        <span className={`ml-3 font-medium ${
                          step === currentStep ? 'text-[#800080]' : 'text-gray-500'
                        }`}>
                          {step === 1 ? 'Livraison' : step === 2 ? 'Facturation' : 'Paiement'}
                        </span>
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-4 rounded ${
                          step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                  {error}
                </div>
              )}

              {/* ÉTAPE 1 : Adresse de livraison */}
              {currentStep === 1 && (
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={24} className="text-[#800080]" />
                    Adresse de livraison
                  </h2>

                  {/* 🆕 Alerte de correspondance pays/localité */}
                  {items.length > 0 && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            Livraison uniquement en {items[0].locality}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Assurez-vous que votre adresse de livraison correspond à cette localité.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🆕 Message d'erreur de correspondance */}
                  {localityMismatchError && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl flex-shrink-0">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-orange-900 mb-1">
                            Incompatibilité détectée
                          </p>
                          <p className="text-sm text-orange-800">
                            {localityMismatchError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adresses sauvegardées */}
                  {user?.id && savedAddresses.length > 0 && !useNewShippingAddress && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          Choisissez une adresse enregistrée
                        </p>
                        <button
                          onClick={() => setUseNewShippingAddress(true)}
                          className="text-sm text-[#800080] hover:underline flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Nouvelle adresse
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        {savedAddresses.map(address => {
                          const isCompatible = items.length === 0 || isCountryMatchingLocality(address.country, items[0].locality);
                          
                          return (
                            <button
                              key={address.id}
                              onClick={() => handleSelectShippingAddress(address.id)}
                              disabled={!isCompatible} // 🆕 Désactiver si incompatible
                              className={`text-left p-4 border-2 rounded-lg transition-all ${
                                !isCompatible
                                  ? 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed' // 🆕 Style pour incompatible
                                  : selectedShippingAddressId === address.id
                                  ? 'border-[#800080] bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {address.label && (
                                    <span className="text-sm font-bold text-[#800080]">
                                      {address.label}
                                    </span>
                                  )}
                                  {address.isDefaultShipping && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                      Par défaut
                                    </span>
                                  )}
                                  {/* 🆕 Badge incompatible */}
                                  {!isCompatible && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      ⚠️ Incompatible
                                    </span>
                                  )}
                                </div>
                                {selectedShippingAddressId === address.id && isCompatible && (
                                  <Check size={20} className="text-[#800080]" />
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-900">{address.fullName}</p>
                              <p className="text-sm text-gray-600">{address.addressLine1}</p>
                              {address.addressLine2 && (
                                <p className="text-sm text-gray-600">{address.addressLine2}</p>
                              )}
                              <p className="text-sm text-gray-600">
                                {address.postalCode} {address.city}
                              </p>
                              <p className="text-sm font-medium text-gray-700 mt-1">
                                📍 {getLocalityFromCountry(address.country)}
                              </p>
                              <p className="text-sm text-gray-500">{address.phone}</p>
                              
                              {/* 🆕 Message d'incompatibilité */}
                              {!isCompatible && (
                                <p className="text-xs text-red-600 mt-2 font-medium">
                                  Cette adresse n&apos;est pas dans la bonne localité pour vos articles.
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Formulaire nouvelle adresse OU si pas d'adresses sauvegardées */}
                  {(!user?.id || savedAddresses.length === 0 || useNewShippingAddress) && (
                    <>
                      {user?.id && savedAddresses.length > 0 && (
                        <button
                          onClick={() => setUseNewShippingAddress(false)}
                          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        >
                          <ChevronLeft size={16} />
                          Utiliser une adresse enregistrée
                        </button>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* 🆕 CHAMP CIVILITÉ */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Civilité <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleShippingChange('civility', 'MME')}
                              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                shippingForm.civility === 'MME'
                                  ? 'border-[#800080] bg-purple-50 text-[#800080]'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <User className="w-5 h-5 mx-auto mb-1" />
                              Madame
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShippingChange('civility', 'MR')}
                              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                shippingForm.civility === 'MR'
                                  ? 'border-[#800080] bg-purple-50 text-[#800080]'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <User className="w-5 h-5 mx-auto mb-1" />
                              Monsieur
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingForm.firstName}
                            onChange={(e) => handleShippingChange('firstName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingForm.lastName}
                            onChange={(e) => handleShippingChange('lastName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={shippingForm.email}
                            onChange={(e) => handleShippingChange('email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Téléphone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={shippingForm.phone}
                            onChange={(e) => handleShippingChange('phone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Société (optionnel)
                          </label>
                          <input
                            type="text"
                            value={shippingForm.company}
                            onChange={(e) => handleShippingChange('company', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adresse <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingForm.addressLine1}
                            onChange={(e) => handleShippingChange('addressLine1', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            placeholder="Numéro et nom de rue"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Complément d&apos;adresse (optionnel)
                          </label>
                          <input
                            type="text"
                            value={shippingForm.addressLine2}
                            onChange={(e) => handleShippingChange('addressLine2', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            placeholder="Appartement, étage, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code postal <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingForm.postalCode}
                            onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ville <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingForm.city}
                            onChange={(e) => handleShippingChange('city', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pays <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={shippingForm.country}
                            onChange={(e) => handleShippingChange('country', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                          >
                            <option value="FR">France</option>
                            <option value="GP">Guadeloupe</option>
                            <option value="MQ">Martinique</option>
                            <option value="GF">Guyane</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleNextStep}
                    className="w-full py-3 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors"
                  >
                    Continuer vers la facturation
                  </button>
                </div>
              )}

              {/* ÉTAPE 2 : Adresse de facturation */}
              {currentStep === 2 && (
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={24} className="text-[#800080]" />
                    Adresse de facturation
                  </h2>

                  <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-gray-300 rounded-lg hover:border-[#800080] transition-colors">
                    <input
                      type="checkbox"
                      checked={billingForm.sameAsShipping}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleBillingChange('sameAsShipping', checked);
                        if (checked) {
                          setBillingForm({ ...shippingForm, sameAsShipping: true });
                          setSelectedBillingAddressId(null);
                        }
                      }}
                      className="w-5 h-5 text-[#800080] rounded focus:ring-[#800080]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Identique à l&apos;adresse de livraison
                    </span>
                  </label>

                  {!billingForm.sameAsShipping && (
                    <>
                      {/* Adresses sauvegardées pour facturation */}
                      {user?.id && savedAddresses.length > 0 && !useNewBillingAddress && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              Choisissez une adresse de facturation
                            </p>
                            {/* <button
                              onClick={() => setUseNewBillingAddress(true)}
                              className="text-sm text-[#800080] hover:underline flex items-center gap-1"
                            >
                              <Plus size={16} />
                              Nouvelle adresse
                            </button> */}
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            {savedAddresses.map(address => (
                              <button
                                key={address.id}
                                onClick={() => handleSelectBillingAddress(address.id)}
                                className={`text-left p-4 border-2 rounded-lg transition-all ${
                                  selectedBillingAddressId === address.id
                                    ? 'border-[#800080] bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {address.label && (
                                      <span className="text-sm font-bold text-[#800080]">
                                        {address.label}
                                      </span>
                                    )}
                                    {address.isDefaultBilling && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        Par défaut
                                      </span>
                                    )}
                                  </div>
                                  {selectedBillingAddressId === address.id && (
                                    <Check size={20} className="text-[#800080]" />
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900">{address.fullName}</p>
                                <p className="text-sm text-gray-600">{address.addressLine1}</p>
                                {address.addressLine2 && (
                                  <p className="text-sm text-gray-600">{address.addressLine2}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {address.postalCode} {address.city}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formulaire nouvelle adresse de facturation */}
                      {(!user?.id || savedAddresses.length === 0 || useNewBillingAddress) && (
                        <>
                          {user?.id && savedAddresses.length > 0 && (
                            <button
                              onClick={() => setUseNewBillingAddress(false)}
                              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                            >
                              <ChevronLeft size={16} />
                              Utiliser une adresse enregistrée
                            </button>
                          )}

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Mêmes champs que shipping - similaire à l'étape 1 */}
                            {/* 🆕 CHAMP CIVILITÉ POUR FACTURATION */}
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Civilité <span className="text-red-500">*</span>
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleBillingChange('civility', 'MME')}
                                  className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                    billingForm.civility === 'MME'
                                      ? 'border-[#800080] bg-purple-50 text-[#800080]'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <User className="w-5 h-5 mx-auto mb-1" />
                                  Madame
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBillingChange('civility', 'MR')}
                                  className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                    billingForm.civility === 'MR'
                                      ? 'border-[#800080] bg-purple-50 text-[#800080]'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <User className="w-5 h-5 mx-auto mb-1" />
                                  Monsieur
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={billingForm.firstName}
                                onChange={(e) => handleBillingChange('firstName', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={billingForm.lastName}
                                onChange={(e) => handleBillingChange('lastName', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={billingForm.addressLine1}
                                onChange={(e) => handleBillingChange('addressLine1', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Code postal <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={billingForm.postalCode}
                                onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ville <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={billingForm.city}
                                onChange={(e) => handleBillingChange('city', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 py-3 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors"
                    >
                      Continuer vers le paiement
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : Paiement */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard size={24} className="text-[#800080]" />
                    Mode de paiement
                  </h2>

                  <div className="space-y-3">
                    {/* Carte bancaire - Stripe */}
                    <label className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:border-[#800080] transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'CARD'}
                        onChange={() => setPaymentMethod('CARD')}
                        className="w-5 h-5 text-[#800080]"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Carte bancaire</div>
                        <div className="text-sm text-gray-500">Paiement sécurisé par Stripe</div>
                      </div>
                      <div className="flex gap-2">
                        <Image src="/cards/visa.png" alt="Visa" width={40} height={24} className="h-6 w-auto" />
                        <Image src="/cards/mastercard.png" alt="Mastercard" width={40} height={24} className="h-6 w-auto" />
                        <Image src="/cards/amex.png" alt="Amex" width={40} height={24} className="h-6 w-auto" />
                        <Image src="/cards/Discover.png" alt="Discover" width={40} height={24} className="h-6 w-auto" />
                      </div>
                    </label>

                    {/* Alma 2x */}
                    <label className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:border-[#800080] transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'ALMA_2X'}
                        onChange={() => setPaymentMethod('ALMA_2X')}
                        className="w-5 h-5 text-[#800080]"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Payer en 2x sans frais</div>
                        <div className="text-sm text-gray-500">
                          {(finalTotal / 2).toFixed(2)}€ aujourd&apos;hui puis {(finalTotal / 2).toFixed(2)}€ dans 30 jours
                        </div>
                      </div>
                      <Image src="/cards/Alma.png" alt="Alma" width={40} height={24} className="h-6 w-auto" />
                    </label>

                    {/* Alma 3x */}
                    <label className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:border-[#800080] transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'ALMA_3X'}
                        onChange={() => setPaymentMethod('ALMA_3X')}
                        className="w-5 h-5 text-[#800080]"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Payer en 3x sans frais</div>
                        <div className="text-sm text-gray-500">
                          3 mensualités de {(finalTotal / 3).toFixed(2)}€
                        </div>
                      </div>
                      <Image src="/cards/Alma.png" alt="Alma" width={40} height={24} className="h-6 w-auto" />
                    </label>

                    {/* Alma 4x */}
                    <label className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:border-[#800080] transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'ALMA_4X'}
                        onChange={() => setPaymentMethod('ALMA_4X')}
                        className="w-5 h-5 text-[#800080]"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Payer en 4x sans frais</div>
                        <div className="text-sm text-gray-500">
                          4 mensualités de {(finalTotal / 4).toFixed(2)}€
                        </div>
                      </div>
                     <Image src="/cards/Alma.png" alt="Alma" width={40} height={24} className="h-6 w-auto" />
                    </label>
                  </div>

                  {/* CGV */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-5 h-5 text-[#800080] rounded mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      J&apos;accepte les{' '}
                      <a href={`/${selectedLocation?.name}/cgv`} className="text-[#800080] underline">
                        conditions générales de vente
                      </a>
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={loading || !acceptedTerms}
                      className="flex-1 py-3 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={20} />
                          Payer {finalTotal.toFixed(2)}€
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne Droite - Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Récapitulatif</h2>

                {/* Articles */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {items.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <Image 
                          src={item.image} 
                          alt={item.designation} 
                          fill
                          sizes="64px"
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{item.designation}</h3>
                        {/* <h3 className="font-medium text-sm text-gray-900 truncate">{item.id}</h3> */}
                        <h3 className="font-medium text-sm text-gray-900 truncate">{item.locality}</h3>
                        <p className="text-xs text-gray-500">{item.storage}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Qté: {item.quantity}</span>
                          <span className="font-semibold text-sm">{(item.price * item.quantity).toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{totalPrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison</span>
                    <span className="font-medium">
                      Offerte
                    </span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>TVA incluse ({(taxRate * 100).toFixed(1)}%)</span>
                      <span>{taxAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  {taxRate === 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>TVA non applicable</span>
                      <span>0.00€</span>
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        Livraison uniquement en {items[0].locality}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total TTC</span>
                    <span className="text-2xl font-bold text-[#800080]">{finalTotal.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Badge sécurité */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-green-600" />
                  <span className="text-sm text-green-700">Paiement 100% sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}