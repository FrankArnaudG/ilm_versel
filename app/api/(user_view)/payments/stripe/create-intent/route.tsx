import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';


interface CartItem {
  productName: string;
  brand?: string;
  storage?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
}
// ============================================
// INITIALISATION DE STRIPE
// ============================================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

// ============================================
// FONCTION POST - Créer une session de paiement
// ============================================
export async function POST(req: NextRequest) {
  try {
    // ----------------------------------------
    // 1. RÉCUPÉRATION DES DONNÉES
    // ----------------------------------------
    const { items, orderId, customerInfo } = await req.json();

    console.log('📤 Données envoyées à Stripe:', {
        items: items,
        orderId: orderId,
        customerInfo
      });

    // Validation : vérifier qu'il y a des articles
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Le panier est vide' },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 2. CONSTRUCTION DES URLs COMPLÈTES
    // ----------------------------------------
    const origin = req.headers.get('origin') ||
                    req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                    'http://localhost:3000';
    
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
    const cancelUrl = `${origin}/cancelled?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
    // const cancelUrl = `${origin}/`;

    console.log('🔍 Origin:', origin);
    console.log('✅ Success URL:', successUrl);
    console.log('❌ Cancel URL:', cancelUrl);
    console.log('🔍 Items:', items);
    console.log('📦 Order ID:', orderId);

    // ----------------------------------------
    // 3. CRÉATION DU CLIENT STRIPE
    // ----------------------------------------
    let customer;
    
    if (customerInfo) {
      // Utiliser les vraies données du client si fournies
      customer = await stripe.customers.create({
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: {
          line1: customerInfo.address?.line1,
          line2: customerInfo.address?.line2 || undefined,
          city: customerInfo.address?.city,
          state: customerInfo.address?.state || undefined,
          postal_code: customerInfo.address?.postalCode,
          country: customerInfo.address?.country || 'FR',
        },
        metadata: {
          orderId: orderId,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Nous avons du mal a identifier vos donner' },
        { status: 400 }
      );
    }

    console.log('👤 Customer créé:', customer.id);

    // ----------------------------------------
    // 4. CRÉATION DES LINE ITEMS
    // ----------------------------------------
    const isProduction = origin.startsWith('https://');

    const lineItems = items.map((item: CartItem) => {
      // Gérer les images uniquement en production (URLs HTTPS)
      let imageUrl = null;
      if (isProduction && item.image && item.image.startsWith('https://')) {
        imageUrl = item.image;
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.productName || 'Produit',
            description: [item.brand, item.storage].filter(Boolean).join(' - ') || undefined,
            ...(imageUrl && { images: [imageUrl] }),
          },
          unit_amount: Math.round(item.unitPrice * 100), // Convertir en centimes
        },
        quantity: item.quantity || 1,
      };
    });

    // ----------------------------------------
    // 5. CRÉATION DE LA SESSION STRIPE CHECKOUT
    // ----------------------------------------
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      
      // Métadonnées pour lier la session à la commande
      metadata: {
        orderId: orderId,
        itemCount: items.length.toString(),
      },

      // Options optionnelles selon vos besoins
      // shipping_address_collection: {
      //   allowed_countries: ['FR', 'MQ', 'GF', 'GP'],
      // },
      // phone_number_collection: {
      //   enabled: true,
      // },
      
      // Expiration de la session (30 min par défaut)
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    console.log('✅ Session Stripe créée:', session.id);

    await db.order.update({
      where: { id: orderId },
      data: {
        stripeSessionId: session.id  // Stocker le session ID
      }
    });

    // ----------------------------------------
    // 6. RÉPONSE AU CLIENT
    // ----------------------------------------
    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      url: session.url, // URL de redirection vers Stripe
    });

  } catch (error: unknown) {
    // ----------------------------------------
    // GESTION DES ERREURS
    // ----------------------------------------
    console.error('❌ Erreur Stripe:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erreur lors de la création de la session Stripe';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}



















// import { NextRequest, NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { db } from '@/lib/db';
// import { currentUser } from '@/lib/auth';

// // ============================================
// // INITIALISATION DE STRIPE
// // ============================================
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-10-29.clover',
// });

// // ============================================
// // POST - CRÉER UN PAYMENT INTENT STRIPE
// // ============================================
// export async function POST(req: NextRequest) {
//   try {
//     const userSession = await currentUser();
    
//     if (!userSession?.id) {
//       return NextResponse.json(
//         { error: 'Non authentifié' },
//         { status: 401 }
//       );
//     }

//     // ----------------------------------------
//     // 1. RÉCUPÉRATION DES DONNÉES
//     // ----------------------------------------
//     const { orderId, amount } = await req.json();

//     if (!orderId || !amount) {
//       return NextResponse.json(
//         { error: 'Données manquantes (orderId ou amount)' },
//         { status: 400 }
//       );
//     }

//     // Validation du montant
//     if (amount <= 0) {
//       return NextResponse.json(
//         { error: 'Montant invalide' },
//         { status: 400 }
//       );
//     }

//     console.log('💳 Initialisation paiement:', { orderId, amount });

//     // ----------------------------------------
//     // 2. RÉCUPÉRER LA COMMANDE
//     // ----------------------------------------
//     const order = await db.order.findUnique({
//       where: { id: orderId },
//       include: {
//         user: true,
//         shippingAddress: true,
//         billingAddress: true,
//         items: {
//           include: {
//             article: {
//               include: {
//                 model: true,
//                 color: true,
//                 variant: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!order) {
//       return NextResponse.json(
//         { error: 'Commande introuvable' },
//         { status: 404 }
//       );
//     }

//     // Vérifier que la commande appartient à l'utilisateur
//     if (order.userId !== userSession.id) {
//       return NextResponse.json(
//         { error: 'Non autorisé' },
//         { status: 403 }
//       );
//     }

//     // Vérifier que la commande n'est pas déjà payée
//     if (order.paymentStatus === 'SUCCEEDED') {
//       return NextResponse.json(
//         { error: 'Cette commande a déjà été payée' },
//         { status: 400 }
//       );
//     }

//     // Vérifier que le montant correspond
//     const orderTotal = parseFloat(order.totalAmount.toString());
//     if (Math.abs(orderTotal - amount) > 0.01) {
//       console.error('⚠️ Montant incorrect:', {
//         orderAmount: orderTotal,
//         requestedAmount: amount
//       });
//       return NextResponse.json(
//         { error: 'Le montant ne correspond pas à la commande' },
//         { status: 400 }
//       );
//     }

//     // ----------------------------------------
//     // 3. CRÉER OU RÉCUPÉRER LE CLIENT STRIPE
//     // ----------------------------------------
//     let stripeCustomerId: string | undefined;

//     // Chercher si l'utilisateur a déjà un customer Stripe
//     const existingPayments = await db.payment.findMany({
//       where: {
//         order: {
//           userId: userSession.id
//         },
//         provider: 'stripe'
//       },
//       orderBy: {
//         createdAt: 'desc'
//       },
//       take: 10
//     });

//     // Chercher le premier paiement avec un customerId dans les metadata
//     const paymentWithCustomer = existingPayments.find(payment => {
//       if (!payment.metadata || typeof payment.metadata !== 'object') return false;
//       const metadata = payment.metadata as Record<string, any>;
//       return !!metadata.customerId;
//     });

//     if (paymentWithCustomer) {
//       const metadata = paymentWithCustomer.metadata as Record<string, any>;
//       stripeCustomerId = metadata.customerId;
//       console.log('✅ Customer Stripe existant:', stripeCustomerId);
//     }

//     // Si l'utilisateur n'a pas encore de customer Stripe, en créer un
//     if (!stripeCustomerId) {
//       const customer = await stripe.customers.create({
//         email: order.user.email || undefined,
//         name: order.shippingAddress.fullName,
//         phone: order.shippingAddress.phone,
//         address: {
//           line1: order.shippingAddress.addressLine1,
//           line2: order.shippingAddress.addressLine2 || undefined,
//           city: order.shippingAddress.city,
//           postal_code: order.shippingAddress.postalCode,
//           country: order.shippingAddress.country,
//         },
//         metadata: {
//           userId: order.userId,
//           clientId: order.user.clientId || ''
//         }
//       });
      
//       stripeCustomerId = customer.id;
//       console.log('✅ Nouveau customer Stripe créé:', stripeCustomerId);
//     }

//     // ----------------------------------------
//     // 4. CRÉER LE PAYMENT INTENT
//     // ----------------------------------------
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount * 100), // Convertir en centimes
//       currency: 'eur',
//       customer: stripeCustomerId,
      
//       // Métadonnées pour traçabilité
//       metadata: {
//         orderId: order.id,
//         orderNumber: order.orderNumber,
//         userId: order.userId,
//         clientId: order.user.clientId || '',
//         locality: order.locality
//       },

//       // Description
//       description: `Commande ${order.orderNumber} - ${order.items.length} article(s)`,

//       // Configuration
//       automatic_payment_methods: {
//         enabled: true,
//       },

//       // Adresse de livraison
//       shipping: {
//         name: order.shippingAddress.fullName,
//         phone: order.shippingAddress.phone,
//         address: {
//           line1: order.shippingAddress.addressLine1,
//           line2: order.shippingAddress.addressLine2 || undefined,
//           city: order.shippingAddress.city,
//           postal_code: order.shippingAddress.postalCode,
//           country: order.shippingAddress.country,
//         }
//       },

//       // Récapitulatif des articles (optionnel, pour le tableau de bord Stripe)
//       statement_descriptor: `ILM ${order.orderNumber}`,
//       statement_descriptor_suffix: order.locality.substring(0, 10)
//     });

//     console.log('✅ Payment Intent créé:', paymentIntent.id);

//     // ----------------------------------------
//     // 5. ENREGISTRER LE PAIEMENT DANS LA BDD
//     // ----------------------------------------
//     const payment = await db.payment.create({
//       data: {
//         orderId: order.id,
//         amount: amount,
//         currency: 'EUR',
//         provider: 'stripe',
//         providerPaymentId: paymentIntent.id,
//         status: 'PENDING',
//         method: 'CARD',
//         metadata: {
//           clientSecret: paymentIntent.client_secret,
//           customerId: stripeCustomerId,
//           paymentIntentStatus: paymentIntent.status
//         }
//       }
//     });

//     console.log('✅ Enregistrement paiement BDD:', payment.id);

//     // Mettre à jour la commande
//     await db.order.update({
//       where: { id: order.id },
//       data: {
//         paymentProvider: 'stripe',
//         paymentIntentId: paymentIntent.id,
//         paymentStatus: 'PROCESSING'
//       }
//     });

//     // Créer l'historique
//     await db.orderStatusHistory.create({
//       data: {
//         orderId: order.id,
//         fromStatus: 'PENDING',
//         toStatus: 'PENDING',
//         changedBy: userSession.id,
//         note: `Paiement Stripe initialisé - ${paymentIntent.id}`
//       }
//     });

//     // ----------------------------------------
//     // 6. RÉPONSE
//     // ----------------------------------------
//     return NextResponse.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//       amount: amount,
//       currency: 'eur'
//     });

//   } catch (error: any) {
//     console.error('❌ Erreur création Payment Intent Stripe:', error);
    
//     // Gestion des erreurs Stripe spécifiques
//     if (error.type === 'StripeCardError') {
//       return NextResponse.json(
//         { 
//           error: 'Erreur de carte bancaire',
//           message: error.message 
//         },
//         { status: 400 }
//       );
//     }

//     if (error.type === 'StripeInvalidRequestError') {
//       return NextResponse.json(
//         { 
//           error: 'Requête Stripe invalide',
//           message: error.message 
//         },
//         { status: 400 }
//       );
//     }
    
//     return NextResponse.json(
//       { 
//         error: 'Erreur lors de l\'initialisation du paiement',
//         message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
//       },
//       { status: 500 }
//     );
//   }
// }







// // import { NextRequest, NextResponse } from 'next/server';
// // import Stripe from 'stripe';
// // import { db } from '@/lib/db';
// // import { currentUser } from '@/lib/auth';

// // // ============================================
// // // INITIALISATION DE STRIPE
// // // ============================================
// // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
// //   apiVersion: '2025-10-29.clover',
// // });

// // // ============================================
// // // POST - CRÉER UN PAYMENT INTENT STRIPE
// // // ============================================
// // export async function POST(req: NextRequest) {
// //   try {
// //     const userSession = await currentUser();
    
// //     if (!userSession?.id) {
// //       return NextResponse.json(
// //         { error: 'Non authentifié' },
// //         { status: 401 }
// //       );
// //     }

// //     // ----------------------------------------
// //     // 1. RÉCUPÉRATION DES DONNÉES
// //     // ----------------------------------------
// //     const { orderId, amount } = await req.json();

// //     console.log('amount:', amount)

// //     if (!orderId || !amount) {
// //       return NextResponse.json(
// //         { error: 'Données manquantes' },
// //         { status: 400 }
// //       );
// //     }

// //     // ----------------------------------------
// //     // 2. RÉCUPÉRER LA COMMANDE
// //     // ----------------------------------------
// //     const order = await db.order.findUnique({
// //       where: { id: orderId },
// //       include: {
// //         user: true,
// //         shippingAddress: true,
// //         billingAddress: true,
// //         items: {
// //           include: {
// //             article: {
// //               include: {
// //                 model: true,
// //                 color: true,
// //                 variant: true
// //               }
// //             }
// //           }
// //         }
// //       }
// //     });

// //     console.log('order:', order)

// //     if (!order) {
// //       return NextResponse.json(
// //         { error: 'Commande introuvable' },
// //         { status: 404 }
// //       );
// //     }

// //     // Vérifier que la commande appartient à l'utilisateur
// //     if (order.userId !== userSession.id) {
// //       return NextResponse.json(
// //         { error: 'Non autorisé' },
// //         { status: 403 }
// //       );
// //     }

// //     // Vérifier que la commande n'est pas déjà payée
// //     if (order.paymentStatus === 'SUCCEEDED') {
// //       return NextResponse.json(
// //         { error: 'Cette commande a déjà été payée' },
// //         { status: 400 }
// //       );
// //     }

// //     // ----------------------------------------
// //     // 3. CRÉER OU RÉCUPÉRER LE CLIENT STRIPE
// //     // ----------------------------------------
// //     let stripeCustomerId: string | undefined;

// //     // Chercher si l'utilisateur a déjà un customer Stripe
// //     const existingPayment = await db.payment.findFirst({
// //       where: {
// //         order: {
// //           userId: userSession.id
// //         },
// //         provider: 'stripe'
// //       },
// //       orderBy: {
// //         createdAt: 'desc'
// //       }
// //     });

// //     // Si l'utilisateur n'a pas encore de customer Stripe, en créer un
// //     if (!existingPayment) {
// //       const customer = await stripe.customers.create({
// //         email: order.user.email || undefined,
// //         name: order.shippingAddress.fullName,
// //         phone: order.shippingAddress.phone,
// //         address: {
// //           line1: order.shippingAddress.addressLine1,
// //           line2: order.shippingAddress.addressLine2 || undefined,
// //           city: order.shippingAddress.city,
// //           postal_code: order.shippingAddress.postalCode,
// //           country: order.shippingAddress.country,
// //         },
// //         metadata: {
// //           userId: order.userId,
// //           clientId: order.user.clientId || ''
// //         }
// //       });
      
// //       stripeCustomerId = customer.id;
// //     }

// //     // ----------------------------------------
// //     // 4. CRÉER LE PAYMENT INTENT
// //     // ----------------------------------------
// //     const paymentIntent = await stripe.paymentIntents.create({
// //       amount: Math.round(amount * 100), // Convertir en centimes
// //       currency: 'eur',
// //       customer: stripeCustomerId,
      
// //       // Métadonnées pour traçabilité
// //       metadata: {
// //         orderId: order.id,
// //         orderNumber: order.orderNumber,
// //         userId: order.userId,
// //         clientId: order.user.clientId || '',
// //         locality: order.locality
// //       },

// //       // Description
// //       description: `Commande ${order.orderNumber}`,

// //       // Configuration
// //       automatic_payment_methods: {
// //         enabled: true,
// //       },

// //       // Adresse de facturation
// //       shipping: {
// //         name: order.shippingAddress.fullName,
// //         phone: order.shippingAddress.phone,
// //         address: {
// //           line1: order.shippingAddress.addressLine1,
// //           line2: order.shippingAddress.addressLine2 || undefined,
// //           city: order.shippingAddress.city,
// //           postal_code: order.shippingAddress.postalCode,
// //           country: order.shippingAddress.country,
// //         }
// //       }
// //     });

// //     // ----------------------------------------
// //     // 5. ENREGISTRER LE PAIEMENT DANS LA BDD
// //     // ----------------------------------------
// //     await db.payment.create({
// //       data: {
// //         orderId: order.id,
// //         amount: amount,
// //         currency: 'EUR',
// //         provider: 'stripe',
// //         providerPaymentId: paymentIntent.id,
// //         status: 'PENDING',
// //         method: 'CARD',
// //         metadata: {
// //           clientSecret: paymentIntent.client_secret,
// //           customerId: stripeCustomerId
// //         }
// //       }
// //     });

// //     // Mettre à jour la commande avec l'ID du payment intent
// //     await db.order.update({
// //       where: { id: order.id },
// //       data: {
// //         paymentProvider: 'stripe',
// //         paymentIntentId: paymentIntent.id,
// //         paymentStatus: 'PROCESSING'
// //       }
// //     });

// //     // Créer l'historique
// //     await db.orderStatusHistory.create({
// //       data: {
// //         orderId: order.id,
// //         fromStatus: 'PENDING',
// //         toStatus: 'PENDING',
// //         changedBy: userSession.id,
// //         note: 'Paiement Stripe initialisé'
// //       }
// //     });

// //     // ----------------------------------------
// //     // 6. RÉPONSE
// //     // ----------------------------------------
// //     return NextResponse.json({
// //       success: true,
// //       clientSecret: paymentIntent.client_secret,
// //       paymentIntentId: paymentIntent.id
// //     });

// //   } catch (error: any) {
// //     console.error('❌ Erreur création Payment Intent Stripe:', error);
    
// //     return NextResponse.json(
// //       { 
// //         error: 'Erreur lors de l\'initialisation du paiement',
// //         message: error.message 
// //       },
// //       { status: 500 }
// //     );
// //   }
// // }








// // // import { currentUser } from '@/lib/auth';
// // // import { db } from '@/lib/db';
// // // import { NextRequest, NextResponse } from 'next/server';
// // // import Stripe from 'stripe';

// // // // ============================================
// // // // INITIALISATION DE STRIPE
// // // // ============================================
// // // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
// // //   apiVersion: '2025-10-29.clover',
// // // });

// // // // ============================================
// // // // POST - CRÉER UN PAYMENT INTENT STRIPE
// // // // ============================================

// // // export async function POST(req: NextRequest) {
// // //   try {
// // //     const userSession = await currentUser();
        
// // //     if (!userSession?.id) {
// // //       return NextResponse.json(
// // //         { error: 'Non authentifié' },
// // //         { status: 401 }
// // //       );
// // //     }

// // //     // ----------------------------------------
// // //     // 1. RÉCUPÉRATION DES DONNÉES
// // //     // ----------------------------------------
// // //     const { orderId, amount } = await req.json();

// // //     if (!orderId || !amount) {
// // //       return NextResponse.json(
// // //         { error: 'Données manquantes' },
// // //         { status: 400 }
// // //       );
// // //     }

// // //     // ----------------------------------------
// // //     // 2. RÉCUPÉRER LA COMMANDE
// // //     // ----------------------------------------
// // //     const order = await db.order.findUnique({
// // //       where: { id: orderId },
// // //       include: {
// // //         user: true,
// // //         shippingAddress: true,
// // //         billingAddress: true,
// // //         items: {
// // //           include: {
// // //             article: {
// // //               include: {
// // //                 model: true,
// // //                 color: true,
// // //                 variant: true
// // //               }
// // //             }
// // //           }
// // //         }
// // //       }
// // //     });

// // //     if (!order) {
// // //       return NextResponse.json(
// // //         { error: 'Commande introuvable' },
// // //         { status: 404 }
// // //       );
// // //     }

// // //     // Vérifier que la commande appartient à l'utilisateur
// // //     if (order.userId !== userSession.id) {
// // //       return NextResponse.json(
// // //         { error: 'Non autorisé' },
// // //         { status: 403 }
// // //       );
// // //     }

// // //     // Vérifier que la commande n'est pas déjà payée
// // //     if (order.paymentStatus === 'SUCCEEDED') {
// // //       return NextResponse.json(
// // //         { error: 'Cette commande a déjà été payée' },
// // //         { status: 400 }
// // //       );
// // //     }

// // //     // ----------------------------------------
// // //     // 3. CRÉER OU RÉCUPÉRER LE CLIENT STRIPE
// // //     // ----------------------------------------
// // //     let stripeCustomerId: string | undefined;

// // //     // Chercher si l'utilisateur a déjà un customer Stripe
// // //     const existingPayment = await db.payment.findFirst({
// // //       where: {
// // //         order: {
// // //           userId: userSession.id
// // //         },
// // //         provider: 'stripe'
// // //       },
// // //       orderBy: {
// // //         createdAt: 'desc'
// // //       }
// // //     });

// // //     // Si l'utilisateur n'a pas encore de customer Stripe, en créer un
// // //     if (!existingPayment) {
// // //       const customer = await stripe.customers.create({
// // //         email: order.user.email || undefined,
// // //         name: order.shippingAddress.fullName,
// // //         phone: order.shippingAddress.phone,
// // //         address: {
// // //           line1: order.shippingAddress.addressLine1,
// // //           line2: order.shippingAddress.addressLine2 || undefined,
// // //           city: order.shippingAddress.city,
// // //           postal_code: order.shippingAddress.postalCode,
// // //           country: order.shippingAddress.country,
// // //         },
// // //         metadata: {
// // //           userId: order.userId,
// // //           clientId: order.user.clientId || ''
// // //         }
// // //       });
      
// // //       stripeCustomerId = customer.id;
// // //     }

// // //     // ----------------------------------------
// // //     // 4. CRÉER LE PAYMENT INTENT
// // //     // ----------------------------------------
// // //     const paymentIntent = await stripe.paymentIntents.create({
// // //       amount: Math.round(amount * 100), // Convertir en centimes
// // //       currency: 'eur',
// // //       customer: stripeCustomerId,
      
// // //       // Métadonnées pour traçabilité
// // //       metadata: {
// // //         orderId: order.id,
// // //         orderNumber: order.orderNumber,
// // //         userId: order.userId,
// // //         clientId: order.user.clientId || '',
// // //         locality: order.locality
// // //       },

// // //       // Description
// // //       description: `Commande ${order.orderNumber}`,

// // //       // Configuration
// // //       automatic_payment_methods: {
// // //         enabled: true,
// // //       },

// // //       // Adresse de facturation
// // //       shipping: {
// // //         name: order.shippingAddress.fullName,
// // //         phone: order.shippingAddress.phone,
// // //         address: {
// // //           line1: order.shippingAddress.addressLine1,
// // //           line2: order.shippingAddress.addressLine2 || undefined,
// // //           city: order.shippingAddress.city,
// // //           postal_code: order.shippingAddress.postalCode,
// // //           country: order.shippingAddress.country,
// // //         }
// // //       }
// // //     });

// // //     // ----------------------------------------
// // //     // 5. ENREGISTRER LE PAIEMENT DANS LA BDD
// // //     // ----------------------------------------
// // //     await db.payment.create({
// // //       data: {
// // //         orderId: order.id,
// // //         amount: amount,
// // //         currency: 'EUR',
// // //         provider: 'stripe',
// // //         providerPaymentId: paymentIntent.id,
// // //         status: 'PENDING',
// // //         method: 'CARD',
// // //         metadata: {
// // //           clientSecret: paymentIntent.client_secret,
// // //           customerId: stripeCustomerId
// // //         }
// // //       }
// // //     });

// // //     // Mettre à jour la commande avec l'ID du payment intent
// // //     await db.order.update({
// // //       where: { id: order.id },
// // //       data: {
// // //         paymentProvider: 'stripe',
// // //         paymentIntentId: paymentIntent.id,
// // //         paymentStatus: 'PROCESSING'
// // //       }
// // //     });

// // //     // Créer l'historique
// // //     await db.orderStatusHistory.create({
// // //       data: {
// // //         orderId: order.id,
// // //         fromStatus: 'PENDING',
// // //         toStatus: 'PENDING',
// // //         changedBy: userSession.id,
// // //         note: 'Paiement Stripe initialisé'
// // //       }
// // //     });

// // //     // ----------------------------------------
// // //     // 6. RÉPONSE
// // //     // ----------------------------------------
// // //     return NextResponse.json({
// // //       success: true,
// // //       clientSecret: paymentIntent.client_secret,
// // //       paymentIntentId: paymentIntent.id
// // //     });

// // //   } catch (error: any) {
// // //     console.error('Erreur création Payment Intent Stripe:', error);
    
// // //     return NextResponse.json(
// // //       { 
// // //         error: 'Erreur lors de l\'initialisation du paiement',
// // //         message: error.message 
// // //       },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }


































// // // import { NextRequest, NextResponse } from 'next/server';
// // // import Stripe from 'stripe';

// // // // ============================================
// // // // INITIALISATION DE STRIPE
// // // // ============================================
// // // // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
// // // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
// // //   apiVersion: '2025-10-29.clover',
// // // });

// // // // ============================================
// // // // FONCTION POST - Créer une session de paiement
// // // // ============================================
// // // export async function POST(req: NextRequest) {
// // //   try {
// // //     // ----------------------------------------
// // //     // 1. RÉCUPÉRATION DES DONNÉES
// // //     // ----------------------------------------
// // //     const { items } = await req.json();

// // //     // Validation : vérifier qu'il y a des articles
// // //     if (!items || items.length === 0) {
// // //       return NextResponse.json(
// // //         { error: 'Le panier est vide' },
// // //         { status: 400 }
// // //       );
// // //     }

// // //     // ----------------------------------------
// // //     // 2. CONSTRUCTION DES URLs COMPLÈTES
// // //     // ----------------------------------------
// // //     // Récupère l'origine (http://localhost:3000 ou ton domaine en prod)
// // //     const origin = req.headers.get('origin') ||
// // //                     req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
// // //                     'http://localhost:3000';
    
// // //     // URLs de succès et d'annulation
// // //     const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
// // //     const cancelUrl = `${origin}/cart`;

// // //     console.log('🔍 Origin:', origin);
// // //     console.log('✅ Success URL:', successUrl);
// // //     console.log('❌ Cancel URL:', cancelUrl);
// // //      console.log('🔍 items:', items);

// // //     const customer = await stripe.customers.create({
// // //       email: 'customers@exemple.com',
// // //       address: {
// // //         city: "PARIS",
// // //         country: "FR",
// // //         postal_code: "75001",
// // //         line1: "rue de la paix",
// // //         state: "GF", 
// // //       },
// // //       name: "Jonathan MDC",
// // //     });

// // //     // ----------------------------------------
// // //     // 3. CRÉATION DES LINE ITEMS
// // //     // ----------------------------------------
// // //     const isProduction = origin.startsWith('https://');

// // //     const lineItems = items.map((item: any) => {

// // //       let imageUrl = null;
// // //       if (isProduction && item.image) {
// // //         imageUrl = item.image;
// // //       }

// // //       return {
// // //         price_data: {
// // //           currency: 'eur',
// // //           product_data: {
// // //             name: item.productName || 'Produit',
// // //             description: item.storage || item.brand || '',
// // //             ...(imageUrl && { images: [imageUrl] }),
// // //           },
// // //           unit_amount: Math.round(item.unitPrice * 100),
// // //         },
// // //         quantity: item.quantity || 1,
// // //       };
// // //     });

// // //     // ----------------------------------------
// // //     // 4. CRÉATION DE LA SESSION STRIPE CHECKOUT
// // //     // ----------------------------------------
// // //     const session = await stripe.checkout.sessions.create({
// // //       payment_method_types: ['card'], // Méthodes de paiement acceptées
// // //       customer: customer.id,
// // //       line_items: lineItems,
// // //       mode: 'payment', // Mode de paiement unique
// // //       success_url: successUrl,
// // //       cancel_url: cancelUrl,
// // //       // shipping_address_collection: {
// // //       //   allowed_countries: ['MQ', 'GF', 'GP'],
// // //       // },
// // //       // phone_number_collection: {
// // //       //   enabled: true,
// // //       // },
// // //       // Métadonnées optionnelles pour tracer la commande
// // //       // metadata: {
// // //       //   orderSource: 'web',
// // //       //   itemCount: items.length.toString(),
// // //       // },
// // //     });

// // //     // ----------------------------------------
// // //     // 5. RÉPONSE AU CLIENT
// // //     // ----------------------------------------
// // //     return NextResponse.json({ 
// // //       sessionId: session.id,
// // //       url: session.url // Important : l'URL de la page Stripe
// // //     });

// // //   } catch (error: any) {
// // //     // ----------------------------------------
// // //     // GESTION DES ERREURS
// // //     // ----------------------------------------
// // //     console.error('Erreur Stripe:', error);
    
// // //     return NextResponse.json(
// // //       { error: error.message || 'Erreur lors de la création de la session Stripe' },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }