import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { OrderStatus, ShippingStatus } from '@prisma/client';

// ============================================
// GET - RÉCUPÉRER LES INFORMATIONS D'EXPÉDITION
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // ----------------------------------------
    // ÉTAPE 1 : VÉRIFICATION DE L'UTILISATEUR
    // ----------------------------------------
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const allowedRoles = ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId manquant'
      }, { status: 400 });
    }

    console.log('📦 Récupération des informations d\'expédition pour:', orderId);

    // ----------------------------------------
    // ÉTAPE 2 : RÉCUPÉRER LA COMMANDE COMPLÈTE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: {
          select: {
            fullName: true,
            civility: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            postalCode: true,
            country: true
          }
        },
        billingAddress: {
          select: {
            fullName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            postalCode: true,
            country: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            address: true,
            phone: true,
            email: true,
            country: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            clientId: true
          }
        },
        items: {
          select: {
            id: true,
            productName: true,
            brand: true,
            colorName: true,
            storage: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            imageUrl: true,
            article: {
              select: {
                id: true,
                articleNumber: true,
                status: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Commande introuvable'
      }, { status: 404 });
    }

    console.log('✅ Commande récupérée:', order.orderNumber);

    // ----------------------------------------
    // ÉTAPE 3 : FORMATER LA RÉPONSE
    // ----------------------------------------
    const response = {
      success: true,
      order: {
        // Informations de base
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        locality: order.locality,
        
        // Montants
        subtotal: parseFloat(order.subtotal.toString()),
        shippingCost: parseFloat(order.shippingCost.toString()),
        taxAmount: parseFloat(order.taxAmount.toString()),
        totalAmount: parseFloat(order.totalAmount.toString()),
        
        // Chronopost
        chronopostLabel: order.chronopostLabel,
        chronopostSkybillNumber: order.chronopostSkybillNumber,
        chronopostAccount: order.chronopostAccount,
        chronopostProductCode: order.chronopostProductCode,
        chronopostError: order.chronopostError,
        chronopostRetries: order.chronopostRetries,
        labelGeneratedAt: order.labelGeneratedAt?.toISOString() || null,

        totalWeight: order.totalWeight,
        totalLength: order.totalLength,
        totalWidth: order.totalWidth,
        totalHeight: order.totalHeight,
        
        // Enlèvement
        pickupRequested: order.pickupRequested,
        pickupRequestedAt: order.pickupRequestedAt?.toISOString() || null,
        pickupConfirmed: order.pickupConfirmed,
        
        // Tracking
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        
        // Dates
        orderedAt: order.orderedAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        
        // Client
        customer: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          clientId: order.user.clientId
        },
        
        // Adresse de livraison
        shippingAddress: {
          fullName: order.shippingAddress.fullName,
          civility: order.shippingAddress.civility,
          phone: order.shippingAddress.phone,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2,
          city: order.shippingAddress.city,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country
        },
        
        // Adresse de facturation
        billingAddress: {
          fullName: order.billingAddress.fullName,
          addressLine1: order.billingAddress.addressLine1,
          addressLine2: order.billingAddress.addressLine2,
          city: order.billingAddress.city,
          postalCode: order.billingAddress.postalCode,
          country: order.billingAddress.country
        },
        
        // Boutique
        store: {
          id: order.store.id,
          name: order.store.name,
          code: order.store.code,
          city: order.store.city,
          address: order.store.address,
          phone: order.store.phone,
          email: order.store.email,
          country: order.store.country
        },
        
        // Articles
        items: order.items.map(item => ({
          id: item.id,
          productName: item.productName,
          brand: item.brand,
          colorName: item.colorName,
          storage: item.storage,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          totalPrice: parseFloat(item.totalPrice.toString()),
          imageUrl: item.imageUrl,
          article: item.article ? {
            id: item.article.id,
            articleNumber: item.article.articleNumber,
            status: item.article.status,
          } : null
        })),
        
        // Notes
        customerNote: order.customerNote,
        internalNote: order.internalNote
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur récupération commande:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération de la commande',
    }, { status: 500 });
  }
}

// ============================================
// PATCH - METTRE À JOUR LE STATUT D'EXPÉDITION
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // ----------------------------------------
    // ÉTAPE 1 : VÉRIFICATION DE L'UTILISATEUR
    // ----------------------------------------
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const allowedRoles = ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const { shippingStatus, trackingNumber, trackingUrl, internalNote } = body;

    console.log('📝 Mise à jour du statut d\'expédition:', orderId);

    // ----------------------------------------
    // ÉTAPE 2 : METTRE À JOUR LA COMMANDE
    // ----------------------------------------
     const updateData: {
      shippingStatus?: ShippingStatus;
      shippedAt?: Date;
      deliveredAt?: Date;
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      internalNote?: string | null;
    } = {};

    if (shippingStatus) {
      updateData.shippingStatus = shippingStatus as ShippingStatus;
      
      // Mettre à jour les dates selon le statut
      if (shippingStatus === 'SHIPPED' && !updateData.shippedAt) {
        updateData.shippedAt = new Date();
      } else if (shippingStatus === 'DELIVERED' && !updateData.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl;
    }

    if (internalNote !== undefined) {
      updateData.internalNote = internalNote;
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        shippingStatus: true,
        trackingNumber: true,
        shippedAt: true,
        deliveredAt: true
      }
    });

    // ----------------------------------------
    // ÉTAPE 3 : CRÉER L'HISTORIQUE
    // ----------------------------------------
    if (shippingStatus) {
      await db.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: null,
          toStatus: 'SHIPPED' as OrderStatus,
          changedBy: user.id,
          note: `Statut d'expédition mis à jour par ${user.name || user.email}`
        }
      });
    }

    console.log('✅ Commande mise à jour:', updatedOrder.orderNumber);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Statut d\'expédition mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour commande:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error))
        : undefined
    }, { status: 500 });
  }
}

// ============================================
// DELETE - ANNULER L'ÉTIQUETTE CHRONOPOST
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // ----------------------------------------
    // ÉTAPE 1 : VÉRIFICATION DE L'UTILISATEUR
    // ----------------------------------------
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Seuls les SUPER_ADMIN peuvent annuler une étiquette
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé - SUPER_ADMIN requis'
      }, { status: 403 });
    }

    const { orderId } = await params;

    console.log('🗑️ Annulation de l\'étiquette Chronopost:', orderId);

    // ----------------------------------------
    // ÉTAPE 2 : RÉCUPÉRER LA COMMANDE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        chronopostSkybillNumber: true,
        pickupRequested: true,
        shippingStatus: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Commande introuvable'
      }, { status: 404 });
    }

    if (!order.chronopostSkybillNumber) {
      return NextResponse.json({
        success: false,
        error: 'Aucune étiquette à annuler'
      }, { status: 400 });
    }

    if (order.pickupRequested) {
      return NextResponse.json({
        success: false,
        error: 'Impossible d\'annuler : un enlèvement a déjà été demandé'
      }, { status: 400 });
    }

    if (order.shippingStatus === 'SHIPPED' || order.shippingStatus === 'DELIVERED') {
      return NextResponse.json({
        success: false,
        error: 'Impossible d\'annuler : le colis est déjà expédié'
      }, { status: 400 });
    }

    // ----------------------------------------
    // ÉTAPE 3 : RÉINITIALISER LES DONNÉES CHRONOPOST
    // ----------------------------------------
    await db.order.update({
      where: { id: orderId },
      data: {
        chronopostLabel: null,
        chronopostSkybillNumber: null,
        chronopostAccount: null,
        chronopostProductCode: null,
        chronopostError: 'Étiquette annulée manuellement par admin',
        labelGeneratedAt: null,
        shippingStatus: 'PENDING'
      }
    });

    console.log('✅ Étiquette annulée pour:', order.orderNumber);

    // ----------------------------------------
    // ÉTAPE 4 : NOTIFIER L'ADMIN
    // ----------------------------------------
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/admin-chronopost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cancelled',
          orderId: order.id,
          orderNumber: order.orderNumber,
          cancelledBy: user.name || user.email
        })
      });
    } catch (emailError) {
      console.error('⚠️ Erreur notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Étiquette annulée avec succès. Vous pouvez en générer une nouvelle.'
    });

  } catch (error) {
    console.error('❌ Erreur annulation étiquette:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'annulation',
    }, { status: 500 });
  }
}