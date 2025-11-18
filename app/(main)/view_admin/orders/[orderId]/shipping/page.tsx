'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Weight,
  Ruler,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface OrderShipping {
  id: string;
  orderNumber: string;
  status: string;
  shippingStatus: string;
  locality: string;
  totalAmount: number;
  totalWeight: number | null;
  totalLength: number | null;
  totalWidth: number | null;
  totalHeight: number | null;
  chronopostSkybillNumber: string | null;
  chronopostLabel: string | null;
  chronopostError: string | null;
  chronopostRetries: number;
  labelGeneratedAt: string | null;
  pickupRequested: boolean;
  pickupRequestedAt: string | null;
  pickupConfirmed: boolean;
  customer: {
    name: string;
    email: string;
    clientId: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  store: {
    name: string;
    city: string;
    address: string;
    phone: string;
  };
  items: Array<{
    id: string;
    productName: string;
    brand: string;
    colorName: string;
    storage: string;
    quantity: number;
    imageUrl: string;
  }>;
}

export default function OrderShippingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderShipping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal de saisie/confirmation des dimensions
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [dimensionsStep, setDimensionsStep] = useState<'form' | 'recap'>('form');
  const [dimensions, setDimensions] = useState({
    totalWeight: '',
    totalLength: '',
    totalWidth: '',
    totalHeight: ''
  });
  const [savingDimensions, setSavingDimensions] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  
  // États pour les actions supplémentaires
  const [cancellingLabel, setCancellingLabel] = useState(false);
  const [requestingPickup, setRequestingPickup] = useState(false);

  // Charger les données de la commande
  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  // Version améliorée
  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orders/${orderId}/shipping`);
      
      // Vérifier le statut HTTP
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Erreur ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);
        
        // Pré-remplir les dimensions si elles existent
        if (data.order.totalWeight) {
          setDimensions({
            totalWeight: String(data.order.totalWeight),
            totalLength: data.order.totalLength ? String(data.order.totalLength) : '',
            totalWidth: data.order.totalWidth ? String(data.order.totalWidth) : '',
            totalHeight: data.order.totalHeight ? String(data.order.totalHeight) : ''
          });
        }
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('Erreur chargement commande:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal selon l'état des dimensions
  const handleOpenModal = () => {
    if (order?.totalWeight) {
      // Dimensions déjà renseignées → aller direct au récapitulatif
      setDimensionsStep('recap');
    } else {
      // Pas de dimensions → afficher le formulaire
      setDimensionsStep('form');
    }
    setShowDimensionsModal(true);
  };

  // Sauvegarder les dimensions
  const handleSaveDimensions = async () => {
    setSavingDimensions(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/colis_dimensions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dimensions)
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'état local
        setOrder(prev => prev ? { ...prev, ...data.order } : null);
        // Passer au récapitulatif
        setDimensionsStep('recap');
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingDimensions(false);
    }
  };

  // Générer l'étiquette Chronopost
  const handleGenerateLabel = async () => {
    setGeneratingLabel(true);
    try {
      const response = await fetch('/api/chronopost/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Étiquette générée avec succès !');
        setShowDimensionsModal(false);
        fetchOrderData(); // Recharger les données
      } else {
        alert(`❌ Erreur : ${data.error}`);
      }
    } catch {
      alert('Erreur lors de la génération de l\'étiquette');
    } finally {
      setGeneratingLabel(false);
    }
  };

  // Télécharger l'étiquette PDF
  const handleDownloadLabel = () => {
    if (!order?.chronopostLabel) return;

    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${order.chronopostLabel}`;
    link.download = `etiquette-${order.orderNumber}.pdf`;
    link.click();
  };

  // Annuler l'étiquette (régénérer)
  const handleCancelLabel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette étiquette ? Vous devrez en générer une nouvelle.')) {
      return;
    }

    setCancellingLabel(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/shipping`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Étiquette annulée avec succès. Vous pouvez en générer une nouvelle.');
        fetchOrderData(); // Recharger les données
      } else {
        alert(`❌ Erreur : ${data.error}`);
      }
    } catch {
      alert('Erreur lors de l\'annulation');
    } finally {
      setCancellingLabel(false);
    }
  };

//   // ============================================
//   // DEMANDER UN ENLÈVEMENT
//   // ============================================
//   const handleRequestPickup = async () => {
//     if (!confirm('Voulez-vous demander un enlèvement Chronopost pour cette commande ?')) return;
    
//     try {
//       setActionLoading('pickup');
//       setError(null);
      
//       const response = await fetch('/api/chronopost/pickup', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ orderId })
//       });
      
//       const data = await response.json();
      
//       if (data.success) {
//         setSuccessMessage('Demande d\'enlèvement envoyée avec succès !');
//         await fetchOrderShipping();
//       } else {
//         setError(data.error || 'Erreur lors de la demande d\'enlèvement');
//       }
//     } catch (err) {
//       setError('Erreur réseau');
//     } finally {
//       setActionLoading(null);
//     }
//   };

  // Demander un enlèvement
  const handleRequestPickup = async () => {
    if (!confirm('Voulez-vous demander un enlèvement Chronopost pour cette commande ?')) {
      return;
    }

    setRequestingPickup(true);
    try {
      const response = await fetch('/api/chronopost/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Demande d\'enlèvement envoyée avec succès !');
        fetchOrderData(); // Recharger les données
      } else {
        alert(`Erreur : ${data.error}`);
      }
    } catch {
      alert('Erreur lors de la demande d\'enlèvement');
    } finally {
      setRequestingPickup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600">{error || 'Commande introuvable'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Expédition - {order.orderNumber}
              </h1>
              <p className="text-sm text-gray-500">
                {order.locality} • {order.store.name}
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            {!order.chronopostSkybillNumber ? (
              <button
                onClick={handleOpenModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                <Package className="w-5 h-5" />
                Générer l&apos;étiquette
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownloadLabel}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                >
                  <Download className="w-5 h-5" />
                  Télécharger
                </button>
                
                {!order.pickupRequested && (
                  <>
                    <button
                      onClick={handleRequestPickup}
                      disabled={requestingPickup}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                      <Truck className="w-5 h-5" />
                      {requestingPickup ? 'Envoi...' : 'Demander enlèvement'}
                    </button>

                    <button
                      onClick={handleCancelLabel}
                      disabled={cancellingLabel}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium disabled:opacity-50"
                      title="Annuler et régénérer"
                    >
                      {cancellingLabel ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Annulation...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Régénérer
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Statut Chronopost */}
        {order.chronopostSkybillNumber && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900">Étiquette générée</h3>
                <p className="text-sm text-green-700 mt-1">
                  Numéro de suivi : <span className="font-mono font-semibold">{order.chronopostSkybillNumber}</span>
                </p>
                {order.labelGeneratedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Généré le {new Date(order.labelGeneratedAt).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statut enlèvement */}
        {order.pickupRequested && (
          <div className={`border rounded-lg p-4 ${
            order.pickupConfirmed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {order.pickupConfirmed ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium ${
                  order.pickupConfirmed ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {order.pickupConfirmed 
                    ? 'Enlèvement confirmé' 
                    : 'Enlèvement demandé'}
                </h3>
                {order.pickupRequestedAt && (
                  <p className={`text-xs mt-1 ${
                    order.pickupConfirmed ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    Demandé le {new Date(order.pickupRequestedAt).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erreur Chronopost */}
        {order.chronopostError && !order.chronopostSkybillNumber && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">Erreur de génération</h3>
                <p className="text-sm text-red-700 mt-1">{order.chronopostError}</p>
                {order.chronopostRetries > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Tentatives : {order.chronopostRetries}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dimensions du colis */}
        {(order.totalWeight || order.totalLength) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Weight className="w-5 h-5" />
                Dimensions du colis
              </h2>
              
              {/* 🆕 BOUTON POUR MODIFIER LES DIMENSIONS */}
              {!order.chronopostSkybillNumber && (
                <button
                  onClick={() => {
                    setDimensionsStep('form');
                    setShowDimensionsModal(true);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Ruler className="w-4 h-4" />
                  Modifier
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {order.totalWeight && (
                <div>
                  <p className="text-sm text-gray-500">Poids</p>
                  <p className="text-lg font-semibold text-gray-900">{order.totalWeight} kg</p>
                </div>
              )}
              {order.totalLength && (
                <div>
                  <p className="text-sm text-gray-500">Longueur</p>
                  <p className="text-lg font-semibold text-gray-900">{order.totalLength} cm</p>
                </div>
              )}
              {order.totalWidth && (
                <div>
                  <p className="text-sm text-gray-500">Largeur</p>
                  <p className="text-lg font-semibold text-gray-900">{order.totalWidth} cm</p>
                </div>
              )}
              {order.totalHeight && (
                <div>
                  <p className="text-sm text-gray-500">Hauteur</p>
                  <p className="text-lg font-semibold text-gray-900">{order.totalHeight} cm</p>
                </div>
              )}
            </div>
            
            {/* 🆕 INFO SI ÉTIQUETTE DÉJÀ GÉNÉRÉE */}
            {order.chronopostSkybillNumber && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Les dimensions ne peuvent plus être modifiées car l&apos;étiquette a déjà été générée. 
                  Vous devez d&apos;abord régénérer l&apos;étiquette si vous souhaitez les changer.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Adresse de livraison */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse de livraison
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-gray-600">
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
              <p className="text-gray-600">{order.shippingAddress.country}</p>
              <p className="text-gray-600 flex items-center gap-2 mt-3">
                <Phone className="w-4 h-4" />
                {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations client
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {order.customer.email}
              </p>
              <p className="text-gray-600">
                Client ID : <span className="font-mono">{order.customer.clientId}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Articles ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-600">
                    {item.brand} • {item.colorName} • {item.storage}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Quantité : {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL - SAISIE/CONFIRMATION DES DIMENSIONS */}
      {showDimensionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* ÉTAPE 1 : FORMULAIRE DE SAISIE */}
            {dimensionsStep === 'form' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Saisir les dimensions du colis
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poids total (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={dimensions.totalWeight}
                      onChange={(e) => setDimensions(prev => ({ ...prev, totalWeight: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 1.5"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longueur (cm) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.totalLength}
                        onChange={(e) => setDimensions(prev => ({ ...prev, totalLength: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Largeur (cm) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.totalWidth}
                        onChange={(e) => setDimensions(prev => ({ ...prev, totalWidth: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hauteur (cm) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.totalHeight}
                        onChange={(e) => setDimensions(prev => ({ ...prev, totalHeight: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 10"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Conseil :</strong> Mesurez le colis physique emballé pour obtenir les dimensions exactes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDimensionsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveDimensions}
                    disabled={!dimensions.totalWeight || !dimensions.totalLength || !dimensions.totalWidth || !dimensions.totalHeight || savingDimensions}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingDimensions ? 'Sauvegarde...' : 'Suivant →'}
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : RÉCAPITULATIF */}
            {dimensionsStep === 'recap' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Récapitulatif de l&apos;expédition
                </h2>

                {/* Dimensions */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Ruler className="w-5 h-5" />
                    Dimensions du colis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Poids total</p>
                      <p className="text-lg font-semibold text-gray-900">{dimensions.totalWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dimensions</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {dimensions.totalLength} × {dimensions.totalWidth} × {dimensions.totalHeight} cm
                      </p>
                    </div>
                  </div>
                </div>

                {/* Adresse de livraison */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Adresse de livraison
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                    <p>{order.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Articles */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Articles ({order.items.length})
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                        <span>{item.productName} - {item.colorName}</span>
                        <span className="font-medium">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Vérifiez bien les informations avant de générer l&apos;étiquette. Une fois générée, elle ne pourra pas être modifiée sans l&apos;annuler.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDimensionsStep('form')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ← Modifier
                  </button>
                  <button
                    onClick={handleGenerateLabel}
                    disabled={generatingLabel}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generatingLabel ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Générer l&apos;étiquette
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}


















// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { 
//   Package, 
//   Download, 
//   RefreshCw, 
//   Truck, 
//   CheckCircle, 
//   AlertCircle,
//   Clock,
//   MapPin,
//   FileText,
//   ArrowLeft
// } from 'lucide-react';

// interface OrderShipping {
//   id: string;
//   orderNumber: string;
//   status: string;
//   shippingStatus: string;
  
//   // Chronopost
//   chronopostLabel: string | null;
//   chronopostSkybillNumber: string | null;
//   chronopostAccount: string | null;
//   chronopostProductCode: string | null;
//   chronopostError: string | null;
//   chronopostRetries: number;
//   labelGeneratedAt: string | null;
  
//   pickupRequested: boolean;
//   pickupRequestedAt: string | null;
//   pickupConfirmed: boolean;
  
//   // Adresses
//   shippingAddress: {
//     fullName: string;
//     addressLine1: string;
//     addressLine2?: string;
//     city: string;
//     postalCode: string;
//     phone: string;
//   };
  
//   locality: string;
//   totalAmount: number;
  
//   // Items
//   items: Array<{
//     productName: string;
//     quantity: number;
//     storage: string;
//   }>;
// }

// export default function OrderShippingPage() {
//   const params = useParams();
//   const router = useRouter();
//   const orderId = params.orderId as string;
  
//   const [order, setOrder] = useState<OrderShipping | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   // ============================================
//   // CHARGEMENT DES DONNÉES
//   // ============================================
//   useEffect(() => {
//     fetchOrderShipping();
//   }, [orderId]);

//   const fetchOrderShipping = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/orders/${orderId}/shipping`);
//       const data = await response.json();
      
//       if (data.success) {
//         setOrder(data.order);
//       } else {
//         setError(data.error || 'Erreur lors du chargement');
//       }
//     } catch (err) {
//       setError('Erreur réseau');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Mettre à jour le statut
//     const updateShippingStatus = async (newStatus: string) => {
//     const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ shippingStatus: newStatus })
//     });
    
//     const data = await response.json();
//     console.log('Statut mis à jour:', data.order);
//     };

//     // Annuler l'étiquette (SUPER_ADMIN uniquement)
//     const cancelLabel = async () => {
//     if (!confirm('Êtes-vous sûr de vouloir annuler cette étiquette ?')) return;
    
//     const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
//         method: 'DELETE'
//     });
    
//     const data = await response.json();
//     console.log(data.message);
//     };

//   // ============================================
//   // TÉLÉCHARGER L'ÉTIQUETTE PDF
//   // ============================================
//   const handleDownloadLabel = () => {
//     if (!order?.chronopostLabel) return;
    
//     try {
//       const byteCharacters = atob(order.chronopostLabel);
//       const byteNumbers = new Array(byteCharacters.length);
//       for (let i = 0; i < byteCharacters.length; i++) {
//         byteNumbers[i] = byteCharacters.charCodeAt(i);
//       }
//       const byteArray = new Uint8Array(byteNumbers);
//       const blob = new Blob([byteArray], { type: 'application/pdf' });
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `etiquette-${order.chronopostSkybillNumber || order.orderNumber}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       setSuccessMessage('Étiquette téléchargée avec succès');
//       setTimeout(() => setSuccessMessage(null), 3000);
//     } catch (err) {
//       setError('Erreur lors du téléchargement');
//     }
//   };

//   // ============================================
//   // RÉGÉNÉRER L'ÉTIQUETTE
//   // ============================================
//   const handleRegenerateLabel = async () => {
//     if (!confirm('Voulez-vous vraiment régénérer l\'étiquette ?')) return;
    
//     try {
//       setActionLoading('regenerate');
//       setError(null);
      
//       const response = await fetch('/api/chronopost/shipping', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ orderId, force: true })
//       });
      
//       const data = await response.json();
      
//       if (data.success) {
//         setSuccessMessage('Étiquette régénérée avec succès !');
//         await fetchOrderShipping();
//       } else {
//         setError(data.error || 'Erreur lors de la régénération');
//       }
//     } catch (err) {
//       setError('Erreur réseau');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // ============================================
//   // DEMANDER UN ENLÈVEMENT
//   // ============================================
//   const handleRequestPickup = async () => {
//     if (!confirm('Voulez-vous demander un enlèvement Chronopost pour cette commande ?')) return;
    
//     try {
//       setActionLoading('pickup');
//       setError(null);
      
//       const response = await fetch('/api/chronopost/pickup', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ orderId })
//       });
      
//       const data = await response.json();
      
//       if (data.success) {
//         setSuccessMessage('Demande d\'enlèvement envoyée avec succès !');
//         await fetchOrderShipping();
//       } else {
//         setError(data.error || 'Erreur lors de la demande d\'enlèvement');
//       }
//     } catch (err) {
//       setError('Erreur réseau');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // ============================================
//   // AFFICHAGE : CHARGEMENT
//   // ============================================
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <p className="text-gray-600">Commande introuvable</p>
//         </div>
//       </div>
//     );
//   }

//   // ============================================
//   // AFFICHAGE : PAGE PRINCIPALE
//   // ============================================
//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           <button
//             onClick={() => router.back()}
//             className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
//           >
//             <ArrowLeft size={20} />
//             <span>Retour</span>
//           </button>
          
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">
//                 Gestion de l'expédition
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 Commande {order.orderNumber} - {order.locality}
//               </p>
//             </div>
            
//             <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
//               order.shippingStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//               order.shippingStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
//               order.shippingStatus === 'SHIPPED' ? 'bg-green-100 text-green-800' :
//               'bg-gray-100 text-gray-800'
//             }`}>
//               {order.shippingStatus}
//             </div>
//           </div>
//         </div>

//         {/* Messages */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//             <div>
//               <p className="font-semibold text-red-900">Erreur</p>
//               <p className="text-red-700 text-sm">{error}</p>
//             </div>
//           </div>
//         )}

//         {successMessage && (
//           <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
//             <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
//             <p className="text-green-700">{successMessage}</p>
//           </div>
//         )}

//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Colonne gauche - Statut Chronopost */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Statut de l'étiquette */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <Package className="text-blue-600" />
//                 Étiquette Chronopost
//               </h2>

//               {order.chronopostSkybillNumber ? (
//                 <div className="space-y-4">
//                   {/* Étiquette générée */}
//                   <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                     <div className="flex items-start justify-between mb-3">
//                       <div>
//                         <p className="font-semibold text-green-900 flex items-center gap-2">
//                           <CheckCircle className="w-5 h-5" />
//                           Étiquette générée avec succès
//                         </p>
//                         <p className="text-sm text-green-700 mt-1">
//                           {order.labelGeneratedAt && 
//                             `Le ${new Date(order.labelGeneratedAt).toLocaleDateString('fr-FR')} à ${new Date(order.labelGeneratedAt).toLocaleTimeString('fr-FR')}`
//                           }
//                         </p>
//                       </div>
//                     </div>

//                     <div className="bg-white rounded p-3 space-y-2">
//                       <div className="flex justify-between text-sm">
//                         <span className="text-gray-600">Numéro de suivi :</span>
//                         <span className="font-mono font-semibold">{order.chronopostSkybillNumber}</span>
//                       </div>
//                       <div className="flex justify-between text-sm">
//                         <span className="text-gray-600">Compte Chronopost :</span>
//                         <span className="font-mono">{order.chronopostAccount}</span>
//                       </div>
//                       <div className="flex justify-between text-sm">
//                         <span className="text-gray-600">Code produit :</span>
//                         <span className="font-mono">{order.chronopostProductCode}</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Actions */}
//                   <div className="flex gap-3">
//                     <button
//                       onClick={handleDownloadLabel}
//                       className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
//                     >
//                       <Download size={20} />
//                       Télécharger l'étiquette
//                     </button>

//                     <button
//                       onClick={handleRegenerateLabel}
//                       disabled={actionLoading === 'regenerate'}
//                       className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
//                     >
//                       {actionLoading === 'regenerate' ? (
//                         <RefreshCw size={20} className="animate-spin" />
//                       ) : (
//                         <RefreshCw size={20} />
//                       )}
//                       Régénérer
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {/* Étiquette non générée */}
//                   {order.chronopostError ? (
//                     <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                       <div className="flex items-start gap-3">
//                         <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//                         <div>
//                           <p className="font-semibold text-red-900">
//                             Erreur lors de la génération
//                           </p>
//                           <p className="text-sm text-red-700 mt-1">
//                             {order.chronopostError}
//                           </p>
//                           <p className="text-xs text-red-600 mt-2">
//                             Tentatives : {order.chronopostRetries}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                       <div className="flex items-start gap-3">
//                         <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
//                         <div>
//                           <p className="font-semibold text-yellow-900">
//                             Étiquette non générée
//                           </p>
//                           <p className="text-sm text-yellow-700 mt-1">
//                             L'étiquette n'a pas encore été créée pour cette commande.
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <button
//                     onClick={handleRegenerateLabel}
//                     disabled={actionLoading === 'regenerate'}
//                     className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
//                   >
//                     {actionLoading === 'regenerate' ? (
//                       <>
//                         <RefreshCw size={20} className="animate-spin" />
//                         Génération en cours...
//                       </>
//                     ) : (
//                       <>
//                         <Package size={20} />
//                         Générer l'étiquette
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Enlèvement Chronopost */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <Truck className="text-purple-600" />
//                 Enlèvement Chronopost
//               </h2>

//               {order.pickupRequested ? (
//                 <div className="space-y-3">
//                   <div className={`border rounded-lg p-4 ${
//                     order.pickupConfirmed 
//                       ? 'bg-green-50 border-green-200' 
//                       : 'bg-blue-50 border-blue-200'
//                   }`}>
//                     <p className={`font-semibold flex items-center gap-2 ${
//                       order.pickupConfirmed ? 'text-green-900' : 'text-blue-900'
//                     }`}>
//                       {order.pickupConfirmed ? (
//                         <>
//                           <CheckCircle className="w-5 h-5" />
//                           Enlèvement confirmé
//                         </>
//                       ) : (
//                         <>
//                           <Clock className="w-5 h-5" />
//                           Enlèvement demandé
//                         </>
//                       )}
//                     </p>
//                     <p className={`text-sm mt-1 ${
//                       order.pickupConfirmed ? 'text-green-700' : 'text-blue-700'
//                     }`}>
//                       {order.pickupRequestedAt && 
//                         `Le ${new Date(order.pickupRequestedAt).toLocaleDateString('fr-FR')} à ${new Date(order.pickupRequestedAt).toLocaleTimeString('fr-FR')}`
//                       }
//                     </p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <p className="text-gray-600 text-sm">
//                     Demandez un enlèvement à Chronopost pour que le colis soit récupéré à l'entrepôt.
//                   </p>

//                   <button
//                     onClick={handleRequestPickup}
//                     disabled={!order.chronopostSkybillNumber || actionLoading === 'pickup'}
//                     className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {actionLoading === 'pickup' ? (
//                       <>
//                         <RefreshCw size={20} className="animate-spin" />
//                         Demande en cours...
//                       </>
//                     ) : (
//                       <>
//                         <Truck size={20} />
//                         Demander un enlèvement
//                       </>
//                     )}
//                   </button>

//                   {!order.chronopostSkybillNumber && (
//                     <p className="text-xs text-gray-500">
//                       ⚠️ Vous devez d'abord générer l'étiquette
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Colonne droite - Informations */}
//           <div className="space-y-6">
//             {/* Adresse de livraison */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
//                 <MapPin className="w-5 h-5 text-gray-600" />
//                 Adresse de livraison
//               </h3>
//               <div className="text-sm space-y-1">
//                 <p className="font-semibold">{order.shippingAddress.fullName}</p>
//                 <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
//                 {order.shippingAddress.addressLine2 && (
//                   <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
//                 )}
//                 <p className="text-gray-600">
//                   {order.shippingAddress.postalCode} {order.shippingAddress.city}
//                 </p>
//                 <p className="text-gray-600">{order.shippingAddress.phone}</p>
//               </div>
//             </div>

//             {/* Articles */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
//                 <FileText className="w-5 h-5 text-gray-600" />
//                 Articles ({order.items.length})
//               </h3>
//               <div className="space-y-2">
//                 {order.items.map((item, index) => (
//                   <div key={index} className="text-sm border-b pb-2">
//                     <p className="font-medium">{item.productName}</p>
//                     <p className="text-gray-600 text-xs">
//                       {item.storage} - Qté: {item.quantity}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//               <div className="mt-4 pt-4 border-t">
//                 <div className="flex justify-between font-bold">
//                   <span>Total</span>
//                   <span>{order.totalAmount.toFixed(2)} €</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }