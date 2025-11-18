// app/api/orders/[orderId]/route.ts

// Récupère les détails d'une commande
// Formate les données pour l'affichage
// Calcule la date de livraison

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * Récupérer les détails d'une commande
 * Utilisé dans la page /success pour afficher les informations
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const userSession = await currentUser();
    
    if (!userSession?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'ID de commande manquant' },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // RÉCUPÉRER LA COMMANDE COMPLÈTE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            article: {
              include: {
                model: true,
                color: true,
                variant: true
              }
            }
          }
        },
        user: true,
        shippingAddress: true,
        billingAddress: true,
        store: true,
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la commande appartient à l'utilisateur
    if (order.userId !== userSession.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // FORMATER LES DONNÉES POUR LE FRONTEND
    // ----------------------------------------
    const formattedOrder = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount.toNumber(),
      subtotal: order.subtotal.toNumber(),
      shippingCost: order.shippingCost.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      
      customerEmail: order.user.email,
      
      items: order.items.map(item => ({
        id: item.id,
        name: item.productName,
        brand: item.brand,
        storage: item.storage,
        colorName: item.colorName,
        quantity: item.quantity,
        price: item.totalPrice.toNumber(),
        image: item.imageUrl
      })),
      
      shippingAddress: {
        fullName: order.shippingAddress.fullName,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone
      },
      
      // 🆕 Informations de livraison Chronopost
      shipping: {
        carrier: order.trackingNumber ? 'Chronopost' : null,
        trackingNumber: order.trackingNumber || null,
        trackingUrl: order.trackingUrl || null,
        skybillNumber: order.chronopostSkybillNumber || null,
        labelGenerated: !!order.chronopostLabel,
        labelGeneratedAt: order.labelGeneratedAt || null,
        estimatedDelivery: calculateEstimatedDelivery(order.locality, order.paidAt),
        
        // 🔗 Lien pour télécharger l'étiquette (si disponible)
        labelDownloadUrl: order.chronopostLabel 
          ? `/api/orders/${orderId}/label` 
          : null,
      },
      
      orderedAt: order.orderedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    console.error('❌ Erreur récupération commande:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération de la commande',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculer la date de livraison estimée
 * 🆕 Prend en compte la date de paiement pour plus de précision
 * 
 * Chronopost Express intra-DOM : Livraison en 24h à 48h
 */
function calculateEstimatedDelivery(locality: string, paidAt: Date | null): string {
  const startDate = paidAt ? new Date(paidAt) : new Date();
  
  // Livraison Chronopost Express : 24h à 48h
  const minDate = new Date(startDate);
  minDate.setDate(startDate.getDate() + 1); // J+1
  
  const maxDate = new Date(startDate);
  maxDate.setDate(startDate.getDate() + 2); // J+2

  // Exclure les week-ends
  if (minDate.getDay() === 0) minDate.setDate(minDate.getDate() + 1); // Dimanche → Lundi
  if (minDate.getDay() === 6) minDate.setDate(minDate.getDate() + 2); // Samedi → Lundi
  
  if (maxDate.getDay() === 0) maxDate.setDate(maxDate.getDate() + 1);
  if (maxDate.getDay() === 6) maxDate.setDate(maxDate.getDate() + 2);

  const minDateStr = minDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  const maxDateStr = maxDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `Entre le ${minDateStr} et le ${maxDateStr}`;
}





// // app/api/orders/[orderId]/route.ts

// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { orderId: string } }
// ) {
//   try {
//     const { orderId } = params;

//     // TODO: Récupérer la commande depuis votre base de données
//     // Exemple avec Prisma:
//     // const order = await prisma.order.findUnique({
//     //   where: { id: orderId },
//     //   include: {
//     //     items: true,
//     //     shippingAddress: true,
//     //     billingAddress: true,
//     //   }
//     // });

//     // EXEMPLE DE DONNÉES (remplacez par votre vraie DB)
//     const order = {
//       id: orderId,
//       orderNumber: 'CMD-2025-001234',
//       status: 'PAID',
//       paymentMethod: 'CARD',
//       createdAt: new Date().toISOString(),
      
//       customerEmail: 'client@example.com',
      
//       shippingAddress: {
//         firstName: 'Jean',
//         lastName: 'Dupont',
//         email: 'client@example.com',
//         phone: '+596 696 XX XX XX',
//         address: '123 Rue Example',
//         addressComplement: 'Appt 4B',
//         city: 'Fort-de-France',
//         postalCode: '97200',
//         country: 'MQ',
//       },
      
//       items: [
//         {
//           id: '1',
//           name: 'iPhone 15 Pro 256GB',
//           quantity: 1,
//           unitPrice: 1299.00,
//           totalPrice: 1299.00,
//           image: '/images/iphone-15-pro.jpg',
//         },
//         {
//           id: '2',
//           name: 'AirPods Pro 2',
//           quantity: 1,
//           unitPrice: 279.00,
//           totalPrice: 279.00,
//           image: '/images/airpods-pro.jpg',
//         },
//       ],
      
//       amounts: {
//         subtotal: 1578.00,
//         shippingCost: 0.00,
//         taxAmount: 0.00,
//         totalAmount: 1578.00,
//       },
      
//       estimatedDelivery: '5-7 jours ouvrés',
      
//       trackingNumber: null, // Sera ajouté lors de l'expédition
//     };

//     if (!order) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Commande introuvable',
//         },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       order,
//     });

//   } catch (error: any) {
//     console.error('❌ Erreur lors de la récupération de la commande:', error);
    
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || 'Erreur lors de la récupération de la commande',
//       },
//       { status: 500 }
//     );
//   }
// }