'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, Home } from 'lucide-react';

function CancelledContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [orderNumber, setOrderNumber] = useState<string | null>(null);
  // const [orderLocality, setOrderLocality] = useState<string | null>(null);

  useEffect(() => {
    const cancelOrder = async () => {
      if (!orderId) {
        setError('Aucune commande à annuler');
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Annulation de la commande:', orderId);

        const response = await fetch('/api/orders/strip_cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            sessionId: sessionId?.replace('cs_test_', '').substring(0, 30),
            reason: 'Annulation sur la page de paiement Stripe'
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erreur lors de l\'annulation');
        }

        console.log('✅ Commande annulée:', data.order.orderNumber);
        // setOrderNumber(data.order.orderNumber);
        // setOrderLocality(data.order.locality);

      } catch (error) {
        console.error('❌ Erreur:', error);
        setError('Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    cancelOrder();
  }, [orderId, sessionId]);

  // ----------------------------------------
  // AFFICHAGE : CHARGEMENT
  // ----------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Annulation de votre commande...</p>
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
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Erreur d&apos;annulation
          </h1>
          
          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // AFFICHAGE : ANNULATION RÉUSSIE
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
            <XCircle className="w-12 h-12 text-orange-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Paiement annulé
          </h1>
          
          <p className="text-gray-600 text-lg mb-6">
            Votre commande a été annulée.
          </p>

          {/* {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-500 mb-1">Numéro de commande annulée</p>
              <p className="text-xl font-bold text-gray-900">{orderNumber}</p>
            </div>
          )} */}
        </div>

        {/* Informations */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Que s&apos;est-il passé ?</h2>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-lg">✅</span>
              <p>Votre commande a été annulée avec succès</p>
            </div>
            
            {/* <div className="flex items-start gap-3">
              <span className="text-lg">📦</span>
              <p>Les articles ont été remis en stock et sont à nouveau disponibles</p>
            </div> */}
            
            <div className="flex items-start gap-3">
              <span className="text-lg">💳</span>
              <p>Aucun montant n&apos;a été débité de votre compte</p>
            </div>
          </div>
        </div>

        {/* Message encouragement
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Changé d&apos;avis ?
              </h3>
              <p className="text-sm text-blue-700">
                Vos articles sont toujours disponibles ! Vous pouvez refaire votre commande à tout moment.
              </p>
            </div>
          </div>
        </div> */}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Retour à la boutique
          </Link>
          
          {/* <Link 
            href="/cart"
            className="flex-1 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-gray-200 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Voir mon panier
          </Link> */}
        </div>

        {/* Aide */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Besoin d&apos;aide ? Contactez notre{' '}
            <Link href="/user/contact" className="text-blue-600 hover:underline">
              service client
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <CancelledContent />
    </Suspense>
  );
}
