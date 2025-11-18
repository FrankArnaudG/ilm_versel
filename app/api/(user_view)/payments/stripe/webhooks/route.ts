// app/api/webhooks/stripe/route.ts

// Reçoit les événements de paiement Stripe
// Traitement côté serveur sécurisé
// Gère les paiements réussis et échoués

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
// import { ChronopostShipmentService } from '@/lib/chronopost/shipment.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * WEBHOOK STRIPE - Reçoit les événements de paiement
 * C'est la méthode SÉCURISÉE et RECOMMANDÉE pour confirmer les paiements
 * 
 * Configuration dans Stripe Dashboard:
 * 1. Aller dans Developers > Webhooks
 * 2. Ajouter un endpoint: https://votredomaine.com/api/webhooks/stripe
 * 3. Sélectionner les événements: checkout.session.completed
 * 4. Copier le signing secret dans STRIPE_WEBHOOK_SECRET
 */
/**
 * Webhook Stripe - Gère les événements de paiement
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature Stripe manquante' },
      { status: 400 }
    );
  }

  // ============================================
  // 1. VÉRIFIER LA SIGNATURE STRIPE
  // ============================================

  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Erreur signature webhook:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: `Signature invalide: ${err instanceof Error ? err.message : 'Erreur inconnue'}` },
      { status: 400 }
    );
  }

  console.log('🔔 Webhook reçu:', event.type);

  // ----------------------------------------
  // GÉRER LES DIFFÉRENTS ÉVÉNEMENTS
  // ----------------------------------------
  try {
    switch (event.type) {
      // case 'checkout.session.completed':
      //   await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      //   break;

      case 'payment_intent.succeeded':
        console.log('✅ Payment intent succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`ℹ️ Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Erreur traitement webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Gérer l'événement checkout.session.completed
 * Déclenché quand un paiement Stripe Checkout est réussi
 */
// async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
//   console.log('💳 Checkout session completed:', session.id);

//   // Récupérer l'orderId depuis les metadata
//   const orderId = session.metadata?.orderId;

//   if (!orderId) {
//     console.error('⚠️ Pas d\'orderId dans les metadata');
//     return;
//   }

//   console.log('📦 Order ID:', orderId);

//   // Vérifier que le paiement est bien réussi
//   if (session.payment_status !== 'paid') {
//     console.warn('⚠️ Payment status:', session.payment_status);
//     return;
//   }

//   // Récupérer la commande
//   const order = await db.order.findUnique({
//     where: { id: orderId },
//     include: {
//       items: {
//         include: {
//           article: true
//         }
//       },
//       user: true
//     }
//   });

//   if (!order) {
//     console.error('❌ Commande introuvable:', orderId);
//     return;
//   }

//   // Vérifier si la commande n'a pas déjà été confirmée
//   if (order.paymentStatus === 'SUCCEEDED') {
//     console.log('⚠️ Commande déjà confirmée, skip...');
//     return;
//   }

//   console.log('🔄 Confirmation de la commande:', order.orderNumber);

//   // ----------------------------------------
//   // TRANSACTION DE CONFIRMATION
//   // ----------------------------------------
//   await db.$transaction(async (tx) => {
//     // 1. Créer l'enregistrement Payment
//     await tx.payment.create({
//       data: {
//         orderId: order.id,
//         amount: order.totalAmount,
//         currency: 'EUR',
//         provider: 'stripe',
//         providerPaymentId: session.payment_intent as string,
//         status: 'SUCCEEDED',
//         method: 'CARD',
//         metadata: {
//             session: {
//                 label: 'Session Stripe',
//                 value: session.id
//             },
//             customer: {
//                 label: 'Client Stripe',
//                 value: typeof session.customer === 'string' 
//                 ? session.customer 
//                 : session.customer?.id ?? null
//             },
//             webhook: {
//                 label: 'Webhook reçu',
//                 value: true
//             }
//         },
//         processedAt: new Date()
//       }
//     });

//     // 2. Mettre à jour la commande
//     await tx.order.update({
//       where: { id: order.id },
//       data: {
//         status: 'CONFIRMED',
//         paymentStatus: 'SUCCEEDED',
//         paymentProvider: 'stripe',
//         paymentIntentId: session.payment_intent as string,
//         stripeSessionId: session.id,
//         paidAt: new Date()
//       }
//     });

//     // 3. Mettre à jour le statut des articles (RESERVED → SOLD)
//     for (const item of order.items) {
//       if (item.articleId) {
//         await tx.article.update({
//           where: { id: item.articleId },
//           data: {
//             status: 'SOLD',
//             soldDate: new Date()
//           }
//         });
//       }
//     }

//     // 4. Mettre à jour les stocks des variantes
//     const variantUpdates = new Map<string, number>();
    
//     for (const item of order.items) {
//       const current = variantUpdates.get(item.variantId) || 0;
//       variantUpdates.set(item.variantId, current + item.quantity);
//     }

//     for (const [variantId, quantity] of variantUpdates) {
//       await tx.productVariant.update({
//         where: { id: variantId },
//         data: {
//           reservedStock: { decrement: quantity },
//           soldStock: { increment: quantity }
//         }
//       });
//     }

//     // 5. Créer l'historique
//     await tx.orderStatusHistory.create({
//       data: {
//         orderId: order.id,
//         fromStatus: 'PENDING',
//         toStatus: 'CONFIRMED',
//         changedBy: order.userId,
//         note: `Paiement confirmé via webhook Stripe - Session: ${session.id}`
//       }
//     });

//     console.log('✅ Commande confirmée:', order.orderNumber);
//   });

//   // TODO: Déclencher l'envoi d'email de confirmation
//   // await sendOrderConfirmationEmail(order.id);

//   // ============================================
//   // 🆕 6. GÉNÉRER L'ÉTIQUETTE CHRONOPOST
//   // ============================================
//   try {
//     console.log('🚀 Lancement génération étiquette Chronopost...');
    
//     const chronopostResult = await ChronopostShipmentService.createShipmentForOrder(orderId);

//     if (chronopostResult.success) {
//       console.log('✅ Étiquette Chronopost créée avec succès');
//       console.log(`   📋 Skybill Number: ${chronopostResult.skybillNumber}`);
//       console.log(`   📍 Tracking Number: ${chronopostResult.trackingNumber}`);
//       console.log(`   🔗 Tracking URL: ${chronopostResult.trackingUrl}`);

//       // Mettre à jour l'historique avec l'info Chronopost
//       await db.orderStatusHistory.create({
//         data: {
//           orderId: orderId,
//           fromStatus: 'CONFIRMED',
//           toStatus: 'CONFIRMED',
//           changedBy: null,
//           note: `Étiquette Chronopost générée - Tracking: ${chronopostResult.trackingNumber}`
//         }
//       });

//       // TODO: Envoyer l'email de confirmation avec l'étiquette
//       // await sendOrderConfirmationEmail(orderId, chronopostResult.pdfLabel);
//       console.log('📧 TODO: Envoyer email avec étiquette (à implémenter)');

//     } else {
//       console.error('❌ Échec génération étiquette Chronopost:', chronopostResult.message);
      
//       // Enregistrer l'erreur mais ne pas bloquer le webhook
//       await db.orderStatusHistory.create({
//         data: {
//           orderId: orderId,
//           fromStatus: 'CONFIRMED',
//           toStatus: 'CONFIRMED',
//           changedBy: null,
//           note: `Erreur génération étiquette Chronopost: ${chronopostResult.message}`
//         }
//       });
//     }

//   } catch (chronopostError: any) {
//     // ⚠️ IMPORTANT: On ne bloque pas le webhook si Chronopost échoue
//     console.error('❌ Erreur Chronopost (non bloquant):', chronopostError);
    
//     // Enregistrer l'erreur pour suivi
//     try {
//       await db.orderStatusHistory.create({
//         data: {
//           orderId: orderId,
//           fromStatus: 'CONFIRMED',
//           toStatus: 'CONFIRMED',
//           changedBy: null,
//           note: `Erreur critique Chronopost: ${chronopostError.message}`
//         }
//       });
//     } catch (dbError) {
//       console.error('❌ Impossible d\'enregistrer l\'erreur Chronopost:', dbError);
//     }
//   }
// }

/**
 * Gérer les échecs de paiement
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    console.error('⚠️ Pas d\'orderId dans les metadata');
    return;
  }

  // Mettre à jour la commande
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'FAILED',
      status: 'CANCELLED'
    }
  });

  // Libérer les articles réservés
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          article: true
        }
      }
    }
  });

  if (order) {
    await db.$transaction(async (tx) => {
      // Remettre les articles en stock
      for (const item of order.items) {
        if (item.articleId) {
          await tx.article.update({
            where: { id: item.articleId },
            data: { status: 'IN_STOCK' }
          });
        }
      }

      // Remettre à jour les stocks des variantes
      const variantUpdates = new Map<string, number>();
      
      for (const item of order.items) {
        const current = variantUpdates.get(item.variantId) || 0;
        variantUpdates.set(item.variantId, current + item.quantity);
      }

      for (const [variantId, quantity] of variantUpdates) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            reservedStock: { decrement: quantity },
            availableStock: { increment: quantity }
          }
        });
      }
    });

    console.log('✅ Articles remis en stock pour la commande:', order.orderNumber);
  }
}

/**
 * Gérer l'expiration d'une session Checkout
 * Se déclenche automatiquement après 30 minutes si non payée
 */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('⏱️ Checkout session expired:', session.id);

  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('⚠️ Pas d\'orderId dans les metadata');
    return;
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          article: true
        }
      }
    }
  });

  if (!order) {
    console.error('❌ Commande introuvable:', orderId);
    return;
  }

  // Vérifier que la commande n'a pas déjà été payée
  if (order.paymentStatus === 'SUCCEEDED') {
    console.log('⚠️ Commande déjà payée, skip expiration...');
    return;
  }

  // 🆕 Vérifier aussi si la commande n'est pas déjà annulée
  if (order.status === 'CANCELLED') {
    console.log('⚠️ Commande déjà annulée, skip...');
    return;
  }

  console.log('🔄 Libération des articles pour commande:', order.orderNumber);

  // ----------------------------------------
  // TRANSACTION DE LIBÉRATION
  // ----------------------------------------
  await db.$transaction(async (tx) => {
    // 1. Remettre les articles en stock
    for (const item of order.items) {
      if (item.articleId && item.article?.status === 'RESERVED') {
        await tx.article.update({
          where: { id: item.articleId },
          data: { status: 'IN_STOCK' }
        });
        
        console.log(`  ✅ Article ${item.article.articleNumber} remis en stock`);
      }
    }

    // 2. Mettre à jour les stocks des variantes
    const variantUpdates = new Map<string, number>();
    
    for (const item of order.items) {
      const current = variantUpdates.get(item.variantId) || 0;
      variantUpdates.set(item.variantId, current + item.quantity);
    }

    for (const [variantId, quantity] of variantUpdates) {
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          reservedStock: { decrement: quantity },
          availableStock: { increment: quantity }
        }
      });
      
      console.log(`  📊 Variant ${variantId}: +${quantity} disponible`);
    }

    // 3. Annuler la commande
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // 4. Créer l'enregistrement Payment en échec
    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'EUR',
        provider: 'stripe',
        providerPaymentId: session.id,
        status: 'CANCELLED',
        method: 'CARD',
        metadata: {
          reason: 'Session expirée après 30 minutes',
          sessionId: session.id,
          expiredAt: new Date().toISOString()
        },
        failedAt: new Date()
      }
    });

    // 5. Créer l'historique
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: 'PENDING',
        toStatus: 'CANCELLED',
        changedBy: null,
        note: `Session Stripe expirée automatiquement - ${session.id}`
      }
    });

    console.log('✅ Commande annulée et articles libérés:', order.orderNumber);
  });
  
}