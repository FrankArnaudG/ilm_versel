'use client';

// Affichage après paiement réussi
// Appelle l'API de vérification
// Affiche les détails de la commande

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Home, Package, Truck, Mail, Download, Clock } from 'lucide-react';
import { useCart } from '@/app/(main)/(view)/contexts/CartContext';
import { useSearchParams } from 'next/navigation';

interface OrderDetails {
  orderNumber: string;
  totalAmount: number;
  items: [];
  customerEmail: string;
  shippingAddress: string;
  estimatedDelivery: string;
}

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  // const [whatsappSent, setWhatsappSent] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Empêcher les appels multiples
    if (hasProcessed) return;
    
    const processPaymentSuccess = async () => {
      if (!sessionId || !orderId) {
        setLoading(false);
        setError('Paramètres manquants dans l\'URL');
        return;
      }

      try {
        setHasProcessed(true); // ✅ Marquer comme traité AVANT l'appel
        
        console.log('🔄 Démarrage du traitement:', { sessionId, orderId });

        // ----------------------------------------
        // ÉTAPE 1 : VÉRIFIER ET CONFIRMER LE PAIEMENT
        // ----------------------------------------
        console.log('📋 Vérification du paiement Stripe...');
        
        const verifyResponse = await fetch('/api/payments/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, orderId })
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
          throw new Error(verifyData.error || 'Erreur lors de la vérification du paiement');
        }

        console.log('✅ Paiement vérifié:', verifyData);

        // Vider le panier seulement après confirmation du paiement
        clearCart();

        // ----------------------------------------
        // ÉTAPE 2 : RÉCUPÉRER LES DÉTAILS DE LA COMMANDE
        // ----------------------------------------
        console.log('📦 Récupération des détails de la commande...');
        
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        const orderData = await orderResponse.json();

        if (orderData.success && orderData.order) {
          setOrderDetails(orderData.order);
          console.log('✅ Détails de la commande récupérés');
        } else {
          throw new Error('Impossible de récupérer les détails de la commande');
        }

        // ----------------------------------------
        // ÉTAPE 3 : ENVOYER L'EMAIL DE CONFIRMATION
        // ----------------------------------------
        console.log('📧 Envoi de l\'email de confirmation...');
        
        try {
          const emailResponse = await fetch('/api/payments/notifications/send-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, sessionId })
          });

          const emailData = await emailResponse.json();
          
          if (emailData.success) {
            setEmailSent(true);
            console.log('✅ Email envoyé');
          } else {
            console.warn('⚠️ Email non envoyé:', emailData.error);
          }
        } catch (emailError) {
          console.error('❌ Erreur envoi email:', emailError);
          // Ne pas bloquer si l'email échoue
        }

        // ----------------------------------------
        // ÉTAPE 4 : ENVOYER LA NOTIFICATION WHATSAPP (optionnel)
        // ----------------------------------------
        // console.log('📱 Envoi de la notification WhatsApp...');
        
        // try {
        //   const whatsappResponse = await fetch('/api/payements/notifications/send-whatsapp', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //       orderId,
        //       orderNumber: orderData.order.orderNumber,
        //       totalAmount: orderData.order.totalAmount
        //     })
        //   });

        //   const whatsappData = await whatsappResponse.json();
          
        //   if (whatsappData.success) {
        //     setWhatsappSent(true);
        //     console.log('✅ WhatsApp envoyé');
        //   }
        // } catch (whatsappError) {
        //   console.error('❌ Erreur WhatsApp:', whatsappError);
        // }

        // // ----------------------------------------
        // // ÉTAPE 5 : Génération silencieuse de l'étiquette
        // // ----------------------------------------
        // console.log('Créer une étiquette (shippingMultiParcelV4)');
        
        // try {
        //   const chronopostShippingResponse = await fetch('/api/chronopost/shipping', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' }, 
        //     body: JSON.stringify({ orderId, sessionId })
        //   });

        //    const chronopostShippingData = await chronopostShippingResponse.json();
  
        //   if (chronopostShippingData.success) {
        //     console.log('✅ Étiquette générée avec succès');
        //     // // ✅ Succès - Afficher l'étiquette
            
        //     // // OPTION 1: Téléchargement direct
        //     // const pdfBase64 = chronopostShippingData.pdfEtiquette;
        //     // const trackingNumber = chronopostShippingData.skybillNumber;
            
        //     // // Créer un blob depuis le base64
        //     // const byteCharacters = atob(pdfBase64);
        //     // const byteNumbers = new Array(byteCharacters.length);
        //     // for (let i = 0; i < byteCharacters.length; i++) {
        //     //   byteNumbers[i] = byteCharacters.charCodeAt(i);
        //     // }
        //     // const byteArray = new Uint8Array(byteNumbers);
        //     // const blob = new Blob([byteArray], { type: 'application/pdf' });
            
        //     // // Télécharger automatiquement
        //     // const url = window.URL.createObjectURL(blob);
        //     // const link = document.createElement('a');
        //     // link.href = url;
        //     // link.download = `etiquette-${trackingNumber}.pdf`;
        //     // document.body.appendChild(link);
        //     // link.click();
        //     // document.body.removeChild(link);
        //     // window.URL.revokeObjectURL(url);
            
        //     // // Afficher un message de succès
        //     // console.log(`Étiquette générée ! N° de suivi : ${trackingNumber}`);
            
            
        //     // OPTION 2: Ouvrir dans un nouvel onglet
        //     /*
        //     const pdfWindow = window.open('');
        //     pdfWindow.document.write(
        //       `<iframe width='100%' height='100%' src='data:application/pdf;base64,${pdfBase64}'></iframe>`
        //     );
        //     */
            
            
        //     // OPTION 3: Afficher dans un modal/dialog
        //     /*
        //     setModalContent({
        //       isOpen: true,
        //       pdfData: `data:application/pdf;base64,${pdfBase64}`,
        //       trackingNumber: trackingNumber
        //     });
        //     */
            
        //   } else {
        //     // ❌ Erreur
        //     // toast.error(`Erreur : ${chronopostShippingData.error || 'Échec de la création'}`);
        //     console.error('Échec de génération d\'étiquette:', chronopostShippingData);
        //   }
        // } catch (error) {
        //   console.error('Erreur Chronopost:', error);
        // }

      } catch (error) {
        console.error('Erreur traitement:', error);
        setError('Une erreur est survenue lors du traitement de votre commande');
      } finally {
        setLoading(false);
      }
    };

    processPaymentSuccess();
  }, [sessionId, orderId, clearCart, hasProcessed]);

  // ----------------------------------------
  // AFFICHAGE : CHARGEMENT
  // ----------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Traitement de votre commande...</p>
          <p className="text-sm text-gray-500 mt-2">Ne fermez pas cette page</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // AFFICHAGE : ERREUR
  // ----------------------------------------
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Erreur de traitement
          </h1>
          
          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <div className="space-y-3">
            <Link 
              href="/account/orders"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Voir mes commandes
            </Link>
            
            <Link 
              href="/"
              className="block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Retour à l&apos;accueil
            </Link>
          </div>

          {sessionId && orderId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-2">Informations de référence :</p>
              <p className="text-xs text-gray-600 font-mono break-all">
                Session: {sessionId.substring(0, 30)}...
              </p>
              <p className="text-xs text-gray-600 font-mono">
                Order: {orderId}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // AFFICHAGE : SUCCÈS
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête de succès */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Paiement réussi ! 🎉
          </h1>
          
          <p className="text-gray-600 text-lg mb-6">
            Merci pour votre confiance. Votre commande a été validée avec succès.
          </p>

          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
              <p className="text-2xl font-bold text-gray-900">{orderDetails.orderNumber}</p>
            </div>
          )}
        </div>

        {/* Statuts des notifications */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${emailSent ? 'border-green-500' : 'border-yellow-500'}`}>
            <div className="flex items-start gap-3">
              <Mail className={`w-6 h-6 ${emailSent ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email de confirmation</h3>
                <p className="text-sm text-gray-600">
                  {emailSent 
                    ? `✅ Envoyé à ${orderDetails?.customerEmail}` 
                    : '⏳ En cours d\'envoi...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Facture et détails de la commande inclus
                </p>
              </div>
            </div>
          </div>

          {/* <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${whatsappSent ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex items-start gap-3">
              <MessageCircle className={`w-6 h-6 ${whatsappSent ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Notification WhatsApp</h3>
                <p className="text-sm text-gray-600">
                  {whatsappSent 
                    ? '✅ Notification envoyée' 
                    : '➖ Non configuré'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Notre équipe a été notifiée
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Détails de la commande */}
        {orderDetails && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  📄 Votre facture est disponible
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Téléchargez votre facture au format PDF. Elle a également été envoyée par email.
                </p>
                <a
                  href={`/api/orders/${orderId}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Télécharger la facture PDF
                </a>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Vous pouvez également retrouver votre facture dans votre espace client
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prochaines étapes */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Prochaines étapes</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Préparation</h3>
                <p className="text-sm text-gray-600">
                  Votre commande est en cours de préparation dans notre entrepôt
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Expédition</h3>
                <p className="text-sm text-gray-600">
                  Livraison gratuite en Martinique, Guyane et Guadeloupe
                </p>
                {orderDetails?.estimatedDelivery && (
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Livraison estimée: {orderDetails.estimatedDelivery}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Suivi</h3>
                <p className="text-sm text-gray-600">
                  Vous recevrez un email avec le numéro de suivi dès l&apos;expédition
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Retour à la boutique
          </Link>
          
          <Link 
            href="/account/orders"
            className="flex-1 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-gray-200 flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Mes commandes
          </Link>

          {orderDetails && (
            <button
              onClick={() => window.open(`/api/orders/${orderId}/invoice`, '_blank')}
              className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Télécharger la facture
            </button>
          )}
        </div>

        {/* Informations techniques (masquées en prod) */}
        {sessionId && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
            <p>Session ID: {sessionId}</p>
            {orderId && <p>Order ID: {orderId}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}















// 'use client';

// import React, { useEffect, useState, Suspense } from 'react';
// import Link from 'next/link';
// import { CheckCircle, Home, Package, Truck, Mail, MessageCircle, Download, Clock } from 'lucide-react';
// import { useCart } from '@/app/(main)/(view)/contexts/CartContext';
// import { useSearchParams } from 'next/navigation';

// interface OrderDetails {
//   orderNumber: string;
//   totalAmount: number;
//   items: any[];
//   customerEmail: string;
//   shippingAddress: any;
//   estimatedDelivery: string;
// }

// function SuccessContent() {
//   const { clearCart } = useCart();
//   const searchParams = useSearchParams();
//   const sessionId = searchParams.get('session_id');
//   const orderId = searchParams.get('order_id');
  
//   const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [emailSent, setEmailSent] = useState(false);
//   const [whatsappSent, setWhatsappSent] = useState(false);
//   const [hasProcessed, setHasProcessed] = useState(false); 

//   useEffect(() => {
//     // ✅ Empêcher les appels multiples
//     if (hasProcessed) return;
    
//     const processPaymentSuccess = async () => {
//       if (!sessionId || !orderId) {
//         setLoading(false);
//         return;
//       }

//       try {
//         setHasProcessed(true); // ✅ Marquer comme traité AVANT l'appel
//         clearCart();

//         const orderResponse = await fetch(`/api/orders/${orderId}`);
//         const orderData = await orderResponse.json();

//         if (orderData.success) {
//           setOrderDetails(orderData.order);

//           // Email
//           const emailResponse = await fetch('/api/payements/notifications/send-invoice', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ orderId, sessionId })
//           });

//           if ((await emailResponse.json()).success) {
//             setEmailSent(true);
//           }

//           // // WhatsApp
//           // const whatsappResponse = await fetch('/api/payements/notifications/send-whatsapp', {
//           //   method: 'POST',
//           //   headers: { 'Content-Type': 'application/json' },
//           //   body: JSON.stringify({
//           //     orderId,
//           //     orderNumber: orderData.order.orderNumber,
//           //     totalAmount: orderData.order.totalAmount
//           //   })
//           // });

//           // if ((await whatsappResponse.json()).success) {
//           //   setWhatsappSent(true);
//           // }
//         }
//       } catch (error) {
//         console.error('Erreur:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     processPaymentSuccess();
//   }, [sessionId, orderId]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Traitement de votre commande...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
//       <div className="max-w-4xl mx-auto">
//         {/* En-tête de succès */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
//             <CheckCircle className="w-12 h-12 text-green-600" />
//           </div>
          
//           <h1 className="text-3xl font-bold text-gray-900 mb-3">
//             Paiement réussi ! 🎉
//           </h1>
          
//           <p className="text-gray-600 text-lg mb-6">
//             Merci pour votre confiance. Votre commande a été validée avec succès.
//           </p>

//           {orderDetails && (
//             <div className="bg-gray-50 rounded-lg p-4 inline-block">
//               <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
//               <p className="text-2xl font-bold text-gray-900">{orderDetails.orderNumber}</p>
//             </div>
//           )}
//         </div>

//         {/* Statuts des notifications */}
//         <div className="grid md:grid-cols-2 gap-4 mb-6">
//           <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${emailSent ? 'border-green-500' : 'border-yellow-500'}`}>
//             <div className="flex items-start gap-3">
//               <Mail className={`w-6 h-6 ${emailSent ? 'text-green-600' : 'text-yellow-600'}`} />
//               <div>
//                 <h3 className="font-semibold text-gray-900 mb-1">Email de confirmation</h3>
//                 <p className="text-sm text-gray-600">
//                   {emailSent 
//                     ? `✅ Envoyé à ${orderDetails?.customerEmail}` 
//                     : '⏳ En cours d\'envoi...'}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   Facture et détails de la commande inclus
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${whatsappSent ? 'border-green-500' : 'border-yellow-500'}`}>
//             <div className="flex items-start gap-3">
//               <MessageCircle className={`w-6 h-6 ${whatsappSent ? 'text-green-600' : 'text-yellow-600'}`} />
//               <div>
//                 <h3 className="font-semibold text-gray-900 mb-1">Notification WhatsApp</h3>
//                 <p className="text-sm text-gray-600">
//                   {whatsappSent 
//                     ? '✅ Notification envoyée' 
//                     : '⏳ En cours d\'envoi...'}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   Notre équipe a été notifiée
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Détails de la commande */}
//         {orderDetails && (
//           <div className="bg-white rounded-lg shadow p-6 mb-6">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé de votre commande</h2>
            
//             <div className="space-y-3 mb-6">
//               {orderDetails.items?.map((item, index) => (
//                 <div key={index} className="flex justify-between items-center py-2 border-b">
//                   <div>
//                     <p className="font-medium text-gray-900">{item.name}</p>
//                     <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
//                   </div>
//                   <p className="font-semibold text-gray-900">{item.price} €</p>
//                 </div>
//               ))}
//             </div>

//             <div className="border-t pt-4">
//               <div className="flex justify-between items-center text-lg font-bold">
//                 <span>Total</span>
//                 <span className="text-green-600">{orderDetails.totalAmount} €</span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Prochaines étapes */}
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-xl font-bold text-gray-900 mb-4">Prochaines étapes</h2>
          
//           <div className="space-y-4">
//             <div className="flex items-start gap-4">
//               <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                 <Package className="w-5 h-5 text-blue-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Préparation</h3>
//                 <p className="text-sm text-gray-600">
//                   Votre commande est en cours de préparation dans notre entrepôt
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-start gap-4">
//               <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
//                 <Truck className="w-5 h-5 text-purple-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Expédition</h3>
//                 <p className="text-sm text-gray-600">
//                   Livraison gratuite en Martinique, Guyane et Guadeloupe
//                 </p>
//                 {orderDetails?.estimatedDelivery && (
//                   <p className="text-sm text-gray-500 mt-1">
//                     <Clock className="w-4 h-4 inline mr-1" />
//                     Livraison estimée: {orderDetails.estimatedDelivery}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-start gap-4">
//               <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                 <Mail className="w-5 h-5 text-green-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Suivi</h3>
//                 <p className="text-sm text-gray-600">
//                   Vous recevrez un email avec le numéro de suivi dès l'expédition
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex flex-col sm:flex-row gap-4">
//           <Link 
//             href="/"
//             className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
//           >
//             <Home className="w-5 h-5" />
//             Retour à la boutique
//           </Link>
          
//           <Link 
//             href="/account/orders"
//             className="flex-1 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-gray-200 flex items-center justify-center gap-2"
//           >
//             <Package className="w-5 h-5" />
//             Mes commandes
//           </Link>

//           {orderDetails && (
//             <button
//               onClick={() => window.open(`/api/orders/${orderId}/invoice`, '_blank')}
//               className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
//             >
//               <Download className="w-5 h-5" />
//               Télécharger la facture
//             </button>
//           )}
//         </div>

//         {/* Informations techniques (masquées en prod) */}
//         {sessionId && process.env.NODE_ENV === 'development' && (
//           <div className="mt-6 bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
//             <p>Session ID: {sessionId}</p>
//             {orderId && <p>Order ID: {orderId}</p>}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function SuccessPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     }>
//       <SuccessContent />
//     </Suspense>
//   );
// }



// // 'use client';

// // import React, { useEffect, Suspense } from 'react';
// // import Link from 'next/link';
// // import { CheckCircle, Home, Package, Truck } from 'lucide-react';
// // import { useCart } from '@/app/(main)/(view)/contexts/CartContext';
// // import { useSearchParams } from 'next/navigation';

// // function SuccessContent() {
// //   const { clearCart } = useCart();
// //   const searchParams = useSearchParams();
// //   const sessionId = searchParams.get('session_id');

// //   useEffect(() => {
// //     if (sessionId) {
// //       clearCart();
// //     }
// //   }, [sessionId, clearCart]);

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-12">
// //       <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
// //         <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
// //           <CheckCircle size={56} className="text-white" />
// //         </div>

// //         <h1 className="text-3xl font-bold text-gray-900 mb-3">
// //           Paiement réussi ! 🎉
// //         </h1>

// //         <p className="text-gray-600 mb-8">
// //           Merci pour votre commande. Vous recevrez un email de confirmation avec les détails.
// //         </p>

// //         <div className="bg-gradient-to-r from-[#f3e8ff] to-[#fce7f3] rounded-2xl p-6 mb-6 border border-purple-200">
// //           <div className="flex items-center justify-center gap-3 mb-3">
// //             <Package size={32} className="text-[#800080]" />
// //             <Truck size={32} className="text-[#800080]" />
// //           </div>
// //           <p className="text-sm font-semibold text-gray-900 mb-2">
// //             Votre commande est en cours de préparation
// //           </p>
// //           <p className="text-xs text-gray-600 mb-3">
// //             Livraison gratuite en Martinique, Guyane et Guadeloupe
// //           </p>
// //           {sessionId && (
// //             <div className="bg-white rounded-lg p-3">
// //               <p className="text-xs text-gray-500">Numéro de session</p>
// //               <p className="text-xs font-mono text-gray-700 break-all">{sessionId}</p>
// //             </div>
// //           )}
// //         </div>

// //         <Link
// //           href="/"
// //           className="w-full py-3 bg-gradient-to-r from-[#800080] to-[#660066] text-white rounded-xl font-semibold hover:from-[#6b006b] hover:to-[#550055] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
// //         >
// //           <Home size={20} />
// //           Retour à la boutique
// //         </Link>
// //       </div>
// //     </div>
// //   );
// // }

// // export default function SuccessPage() {
// //   return (
// //     <Suspense fallback={
// //       <div className="min-h-screen flex items-center justify-center">
// //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800080]"></div>
// //       </div>
// //     }>
// //       <SuccessContent />
// //     </Suspense>
// //   );
// // }