// app/api/payments/stripe/verify-session/route.ts

// Vérifie et confirme le paiement après redirection
// Met à jour la commande, articles et stocks
// Crée l'enregistrement Payment

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

/**
 * Cette route vérifie et confirme un paiement Stripe après la redirection
 * Elle est appelée depuis la page /success avec session_id et order_id
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, orderId } = await req.json();

    if (!sessionId || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    console.log('🔍 Vérification du paiement:', { sessionId, orderId });

    // ----------------------------------------
    // 1. RÉCUPÉRER LA SESSION STRIPE
    // ----------------------------------------
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session Stripe introuvable' },
        { status: 404 }
      );
    }

    console.log('📋 Session Stripe:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
    });

    // Vérifier que le paiement est bien réussi
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paiement non confirmé',
          paymentStatus: session.payment_status 
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 2. RÉCUPÉRER LA COMMANDE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            article: true
          }
        },
        user: true,
        shippingAddress: true,
        billingAddress: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la commande n'a pas déjà été confirmée
    if (order.paymentStatus === 'SUCCEEDED') {
      console.log('⚠️ Commande déjà confirmée, skip...');
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      });
    }

    // ----------------------------------------
    // 3. MISE À JOUR DANS UNE TRANSACTION
    // ----------------------------------------
    console.log('🔄 Début de la transaction de confirmation...');

    const result = await db.$transaction(async (tx) => {
      // 3.1 - Créer l'enregistrement Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'EUR',
          provider: 'stripe',
          providerPaymentId: session.payment_intent as string,
          status: 'SUCCEEDED',
          method: 'CARD',
          metadata: {
            sessionId: {
                label: 'ID de session Stripe',
                value: session.id
            },
            customerId: {
                label: 'ID client Stripe',
                value: typeof session.customer === 'string' 
                ? session.customer 
                : session.customer?.id ?? null
            },
            amountTotal: {
                label: 'Montant total',
                value: session.amount_total
            }
            },
          processedAt: new Date()
        }
      });

      console.log('✅ Payment créé:', payment.id);

      // 3.2 - Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'SUCCEEDED',
          paymentProvider: 'stripe',
          paymentIntentId: session.payment_intent as string,
          paidAt: new Date()
        }
      });

      console.log('✅ Commande mise à jour:', updatedOrder.orderNumber);

      // 3.3 - Mettre à jour le statut des articles (RESERVED → SOLD)
      for (const item of order.items) {
        if (item.articleId) {
          await tx.article.update({
            where: { id: item.articleId },
            data: {
              status: 'SOLD',
              soldDate: new Date()
            }
          });

          console.log(`✅ Article ${item.articleId} marqué comme SOLD`);
        }
      }

      // 3.4 - Mettre à jour les stocks des variantes
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
            soldStock: { increment: quantity }
          }
        });

        console.log(`✅ Variant ${variantId}: -${quantity} réservé, +${quantity} vendu`);
      }

      // 3.5 - Créer l'historique de statut
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          changedBy: order.userId,
          note: `Paiement Stripe confirmé - Session: ${sessionId.substring(0, 20)}...`
        }
      });

      console.log('✅ Historique créé');

      return {
        payment,
        order: updatedOrder
      };
    });

    // ----------------------------------------
    // 4. RÉPONSE
    // ----------------------------------------
    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus,
        totalAmount: result.order.totalAmount.toNumber()
      },
      payment: {
        id: result.payment.id,
        amount: result.payment.amount.toNumber(),
        status: result.payment.status
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la vérification du paiement',
      },
      { status: 500 }
    );
  }
}