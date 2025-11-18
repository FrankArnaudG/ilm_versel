import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * API pour annuler une commande en attente
 * Appelée quand l'utilisateur annule sur Stripe ou manuellement
 */
export async function POST(req: NextRequest) {
  try {
    const userSession = await currentUser();
    
    if (!userSession?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // ----------------------------------------
    // 1. RÉCUPÉRATION DES DONNÉES
    // ----------------------------------------
    const { orderId, sessionId, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId manquant' },
        { status: 400 }
      );
    }

    console.log('🔄 Demande d\'annulation de commande:', { orderId, sessionId, reason });

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
        user: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la commande appartient à l'utilisateur
    if (order.userId !== userSession.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que la commande n'est pas déjà confirmée
    if (order.paymentStatus === 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Cette commande a déjà été payée et ne peut être annulée' },
        { status: 400 }
      );
    }

    // Vérifier que la commande n'est pas déjà annulée
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { 
          success: true,
          message: 'Commande déjà annulée',
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status
          }
        }
      );
    }

    console.log('✅ Commande trouvée:', order.orderNumber);
    console.log('📦 Items à libérer:', order.items.length);

    // ----------------------------------------
    // 3. ANNULER LA COMMANDE - TRANSACTION
    // ----------------------------------------
    await db.$transaction(async (tx) => {
      // 1. Remettre les articles en stock
      for (const item of order.items) {
        if (item.articleId && item.article) {
          // Ne remettre en stock que si l'article était réservé
          if (item.article.status === 'RESERVED') {
            await tx.article.update({
              where: { id: item.articleId },
              data: { status: 'IN_STOCK' }
            });
            
            console.log(`  ✅ Article ${item.article.articleNumber} remis en stock`);
          }
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
          providerPaymentId: sessionId || 'manual-cancellation',
          status: 'CANCELLED',
          method: 'CARD',
          metadata: {
            reason: reason || 'Annulation manuelle par l\'utilisateur',
            sessionId: sessionId,
            cancelledAt: new Date().toISOString(),
            cancelledBy: userSession.id
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
          changedBy: userSession.id,
          note: reason || `Commande annulée par l'utilisateur${sessionId ? ` - Session: ${sessionId}` : ''}`
        }
      });

      console.log('✅ Commande annulée et articles libérés:', order.orderNumber);
    });

    // ----------------------------------------
    // 4. RÉPONSE
    // ----------------------------------------
    return NextResponse.json({
      success: true,
      message: 'Commande annulée avec succès',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: 'CANCELLED'
      }
    });

  } catch (error) {
    console.error('❌ Erreur annulation commande:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'annulation de la commande',
        message: 'Erreur lors de l\'annulation de la commande'
      },
      { status: 500 }
    );
  }
}