import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getStoreIdByLocality } from '@/lib/locality';
import { PaymentMethod } from '@prisma/client';

interface CartItem {
  variantId: string;
  colorId: string;
  quantity: number;
  designation: string;
  price: number;
  image?: string;
  locality: string;
  colorName?: string;
}
// ============================================
// FONCTION POUR GÉNÉRER UN CLIENT ID UNIQUE
// ============================================
async function generateClientId(): Promise<string> {
  const year = new Date().getFullYear();
  let clientId = '';
  let isUnique = false;

  while (!isUnique) {
    // Génère 6 chiffres aléatoires
    const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 100000-999999

    clientId = `CLT-${year}-${randomNumber}`;

    // Vérifie l'unicité dans la base de données
    const existingUser = await db.user.findUnique({
      where: {
        clientId: clientId
      }
    });

    isUnique = !existingUser;
  }

  return clientId;
}

// ============================================
// FONCTION POUR GÉNÉRER UN NUMÉRO DE COMMANDE
// ============================================
async function generateOrderNumber(): Promise<string> {
  let orderNumber = '';
  let isUnique = false;

  while (!isUnique) {
    // Génère 3 chiffres aléatoires pour la première partie
    const part1 = Math.floor(Math.random() * 900) + 100; // 100-999
    
    // Génère 8 chiffres aléatoires pour la deuxième partie
    const part2 = Math.floor(Math.random() * 90000000) + 10000000; // 10000000-99999999
    
    // Génère 8 chiffres aléatoires pour la troisième partie
    const part3 = Math.floor(Math.random() * 90000000) + 10000000; // 10000000-99999999

    orderNumber = `${part1}-${part2}-${part3}`;

    // Vérifie l'unicité dans la base de données
    const existingOrder = await db.order.findUnique({
      where: {
        orderNumber: orderNumber
      }
    });

    isUnique = !existingOrder;
  }

  return orderNumber;
}

async function generateRecepisseNumber(): Promise<string> {
  let recepisseNumber = '';
  let isUnique = false;

  // Caractères possibles pour la génération aléatoire
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  while (!isUnique) {
    let result = '';
    
    // Génère 10 caractères aléatoires (alphanumériques)
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    recepisseNumber = result;

    // Vérifie l'unicité dans la base de données
    const existingOrder = await db.order.findFirst({
      where: {
        recepisseNumber: {
          equals: recepisseNumber
        }
      }
    });

    isUnique = !existingOrder;
  }

  return recepisseNumber;
}

// ============================================
// FONCTION POUR CRÉER OU SAUVEGARDER UNE ADRESSE
// ============================================
async function createOrGetAddress(
  userId: string,
  addressData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
  },
  civility: 'MR' | 'MME' = 'MR'
) {
  const fullName = `${addressData.firstName} ${addressData.lastName}`;

  const existingAddress = await db.address.findFirst({
    where: {
      userId,
      fullName,
      addressLine1: addressData.addressLine1,
      postalCode: addressData.postalCode,
      city: addressData.city,
      country: addressData.country
    }
  });

  if (existingAddress) {
    return existingAddress;
  }

  return await db.address.create({
    data: {
      userId,
      label: 'Adresse de commande',
      civility,
      fullName,
      phone: addressData.phone,
      country: addressData.country,
      city: addressData.city,
      postalCode: addressData.postalCode,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2 || null,
      isDefaultShipping: false,
      isDefaultBilling: false
    }
  });
}

// ============================================
// POST - CRÉER UNE COMMANDE
// ============================================
export async function POST(req: NextRequest) {
  try {
    // ----------------------------------------
    // 1. RÉCUPÉRATION DES DONNÉES
    // ----------------------------------------
    const { items, shippingAddress, billingAddress, paymentMethod, amounts } = await req.json();

    const userSession = await currentUser();
    
    if (!userSession?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = userSession.id;

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !billingAddress) {
      return NextResponse.json(
        { error: 'Adresses manquantes' },
        { status: 400 }
      );
    }

    console.log('✅ Données reçues:', {
      itemsCount: items.length,
      paymentMethod,
      totalAmount: amounts.totalAmount
    });

    // ----------------------------------------
    // 2. VÉRIFIER/GÉNÉRER LE CLIENT ID
    // ----------------------------------------
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { clientId: true }
    });

    let clientId = user?.clientId;

    if (!clientId) {
      clientId = await generateClientId();
      
      await db.user.update({
        where: { id: userId },
        data: { clientId }
      });

      console.log(`✅ Nouveau Client ID: ${clientId}`);
    }

    // ----------------------------------------
    // 3. CRÉER OU RÉCUPÉRER LES ADRESSES
    // ----------------------------------------
    const shippingAddressRecord = await createOrGetAddress(
      userId,
      shippingAddress,
      shippingAddress.civility || 'MR'
    );

    const billingAddressRecord = await createOrGetAddress(
      userId,
      billingAddress,
      billingAddress.civility || 'MR'
    );

    // ----------------------------------------
    // 4. DÉTERMINER LA BOUTIQUE ET LOCALITÉ
    // ----------------------------------------
    const localities = [...new Set(items.map((item: CartItem) => item.locality))];
    
    if (localities.length > 1) {
      return NextResponse.json(
        { error: 'Tous les articles doivent être de la même localité' },
        { status: 400 }
      );
    }
    
    const locality: string = localities[0] as string;

    const storeId = getStoreIdByLocality(locality);
    
    const store = await db.store.findFirst({
      where: {
        status: 'ACTIVE',
        id: storeId
      }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Boutique non disponible pour cette localité' },
        { status: 400 }
      );
    }
    
    // ----------------------------------------
    // 5. GÉNÉRER LE NUMÉRO DE COMMANDE
    // ----------------------------------------
    const orderNumber = await generateOrderNumber();
    const recepisseNumber = await generateRecepisseNumber();

    // ----------------------------------------
    // 6. CRÉER LA COMMANDE DANS UNE TRANSACTION
    // ----------------------------------------
    console.log('🔄 Début de la transaction...');
    
    const order = await db.$transaction(async (tx) => {
      
      // Créer la commande
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          recepisseNumber,
          userId,
          shippingAddressId: shippingAddressRecord.id,
          billingAddressId: billingAddressRecord.id,
          storeId: store.id,
          locality,

          // 🆕 Snapshot de l'adresse de livraison
          shippingCivility: shippingAddressRecord.civility,
          shippingFullName: shippingAddressRecord.fullName,
          shippingPhone: shippingAddressRecord.phone,
          shippingCountry: shippingAddressRecord.country,
          shippingCity: shippingAddressRecord.city,
          shippingPostalCode: shippingAddressRecord.postalCode,
          shippingAddressLine1: shippingAddressRecord.addressLine1,
          shippingAddressLine2: shippingAddressRecord.addressLine2,
          
          // 🆕 Snapshot de l'adresse de facturation
          billingCivility: billingAddressRecord.civility,
          billingFullName: billingAddressRecord.fullName,
          billingPhone: billingAddressRecord.phone,
          billingCountry: billingAddressRecord.country,
          billingCity: billingAddressRecord.city,
          billingPostalCode: billingAddressRecord.postalCode,
          billingAddressLine1: billingAddressRecord.addressLine1,
          billingAddressLine2: billingAddressRecord.addressLine2,
          
          subtotal: amounts.subtotal,
          shippingCost: amounts.shippingCost,
          taxAmount: amounts.taxAmount,
          discountAmount: 0,
          totalAmount: amounts.totalAmount,
          
          status: 'PENDING',
          paymentStatus: 'PENDING',
          shippingStatus: 'PENDING',
          
          paymentMethod: paymentMethod as PaymentMethod,
          
          customerNote: null,
          internalNote: `Commande créée automatiquement. Client ID: ${clientId}`,
        },
        include: {
          shippingAddress: true,
          billingAddress: true,
          store: true
        }
      });

      // Créer les items de commande
      for (const item of items) {
        console.log(`🔍 Traitement: ${item.designation} (qty: ${item.quantity})`);
        
        // Chercher des articles disponibles
        const availableArticles = await tx.article.findMany({
          where: {
            variantId: item.variantId,
            colorId: item.colorId,
            storeId: store.id,
            status: 'IN_STOCK'
          },
          include: {
            model: true,
            color: true,
            variant: true
          },
          take: item.quantity,
          orderBy: {
            createdAt: 'asc' // FIFO
          }
        });

        // ⚠️ VÉRIFICATION CRITIQUE DU STOCK
        if (availableArticles.length < item.quantity) {
          const productName = availableArticles[0]?.model?.designation || item.designation || 'Produit';
          const variantName = availableArticles[0]?.variant?.variantReference || item.variantId;
          const colorName = item.colorName || item.colorId;
        
          const details = [productName, variantName, colorName].filter(Boolean).join(' - ');
          
          throw new Error(
            `Stock insuffisant pour ${details}. Demandé: ${item.quantity}, Disponible: ${availableArticles.length}`
          );
        }

        // Traiter chaque article individuellement
        for (const article of availableArticles) {
          // Créer un OrderItem pour cet article
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              articleId: article.id,
              productModelId: article.modelId,
              variantId: article.variantId,
              colorId: article.colorId || '',
              
              productName: article.model.designation,
              brand: article.model.brand,
              colorName: article.color?.colorName || 'N/A',
              colorHex: article.color?.hexaColor || '#000000',
              storage: article.variant.variantAttribute || 'N/A',
              imageUrl: item.image || '',
              
              quantity: 1, // 1 article physique
              unitPrice: item.price,
              totalPrice: item.price,
              
              taxRate: article.variant.tva,
              taxAmount: (item.price * parseFloat(article.variant.tva.toString())) / 100
            }
          });

          // Réserver l'article
          await tx.article.update({
            where: { id: article.id },
            data: { status: 'RESERVED' }
          });

          console.log(`✅ Article ${article.articleNumber} réservé`);
        }

        // Mettre à jour les stocks de la variante
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            availableStock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity }
          }
        });
      }
      
      // Créer l'historique de statut
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: 'PENDING',
          changedBy: userId,
          note: 'Commande créée'
        }
      });

      console.log('✅ Transaction terminée avec succès');
      return newOrder;
    });

    // ----------------------------------------
    // 7. RÉPONSE
    // ----------------------------------------
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });

} catch (error: unknown) {
    // ✅ Type guard pour extraire le message d'erreur de façon sécurisée
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    console.error('❌ Erreur création commande:', errorMessage);
    
    // Si c'est une erreur de stock, renvoyer un message clair
    if (errorMessage.includes('Stock insuffisant')) {
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage
        },
        { status: 400 }
      );
    }
    
    // Autres erreurs
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la création de la commande',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}


// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db';
// import { currentUser } from '@/lib/auth';

// // ============================================
// // FONCTION POUR GÉNÉRER UN CLIENT ID UNIQUE
// // ============================================
// async function generateClientId(): Promise<string> {
//   const year = new Date().getFullYear();
  
//   // Récupérer le dernier clientId de l'année en cours
//   const lastUser = await db.user.findFirst({
//     where: {
//       clientId: {
//         startsWith: `CLT-${year}-`
//       }
//     },
//     orderBy: {
//       clientId: 'desc'
//     },
//     select: {
//       clientId: true
//     }
//   });

//   let nextNumber = 1;
  
//   if (lastUser?.clientId) {
//     // Extraire le numéro du dernier clientId (ex: CLT-2025-000042 -> 42)
//     const lastNumber = parseInt(lastUser.clientId.split('-')[2]);
//     nextNumber = lastNumber + 1;
//   }

//   // Formater avec des zéros (ex: CLT-2025-000001)
//   return `CLT-${year}-${nextNumber.toString().padStart(6, '0')}`;
// }

// // ============================================
// // FONCTION POUR GÉNÉRER UN NUMÉRO DE COMMANDE
// // ============================================
// async function generateOrderNumber(): Promise<string> {
//   const year = new Date().getFullYear();
  
//   // Récupérer la dernière commande de l'année en cours
//   const lastOrder = await db.order.findFirst({
//     where: {
//       orderNumber: {
//         startsWith: `ORD-${year}-`
//       }
//     },
//     orderBy: {
//       orderNumber: 'desc'
//     },
//     select: {
//       orderNumber: true
//     }
//   });

//   let nextNumber = 1;
  
//   if (lastOrder?.orderNumber) {
//     // Extraire le numéro (ex: ORD-2025-000042 -> 42)
//     const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
//     nextNumber = lastNumber + 1;
//   }

//   // Formater (ex: ORD-2025-000001)
//   return `ORD-${year}-${nextNumber.toString().padStart(6, '0')}`;
// }

// // ============================================
// // FONCTION POUR CRÉER OU SAUVEGARDER UNE ADRESSE
// // ============================================
// async function createOrGetAddress(
//   userId: string,
//   addressData: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     addressLine1: string;
//     addressLine2?: string;
//     city: string;
//     postalCode: string;
//     country: string;
//   },
//   civility: 'MR' | 'MME' = 'MR'
// ) {
//   const fullName = `${addressData.firstName} ${addressData.lastName}`;

//   // Chercher si l'adresse existe déjà
//   const existingAddress = await db.address.findFirst({
//     where: {
//       userId,
//       fullName,
//       addressLine1: addressData.addressLine1,
//       postalCode: addressData.postalCode,
//       city: addressData.city,
//       country: addressData.country
//     }
//   });

//   if (existingAddress) {
//     return existingAddress;
//   }

//   // Créer une nouvelle adresse
//   return await db.address.create({
//     data: {
//       userId,
//       label: 'Adresse de commande',
//       civility,
//       fullName,
//       phone: addressData.phone,
//       country: addressData.country,
//       city: addressData.city,
//       postalCode: addressData.postalCode,
//       addressLine1: addressData.addressLine1,
//       addressLine2: addressData.addressLine2 || null,
//       isDefaultShipping: false,
//       isDefaultBilling: false
//     }
//   });
// }

// // ============================================
// // POST - CRÉER UNE COMMANDE
// // ============================================
// export async function POST(req: NextRequest) {
//   try {
//     // ----------------------------------------
//     // 1. RÉCUPÉRATION DES DONNÉES
//     // ----------------------------------------
//     const { items, shippingAddress, billingAddress, paymentMethod, amounts } = await req.json();

//     const userSession = await currentUser();
    
//     if (!userSession?.id) {
//       return NextResponse.json(
//         { error: 'Non authentifié' },
//         { status: 401 }
//       );
//     }

//     const userId = userSession.id;

    
//     // Validation
//     if (!items || items.length === 0) {
//       console.error('Validation échouée: Panier vide');
//       return NextResponse.json(
//         { error: 'Panier vide' },
//         { status: 400 }
//       );
//     }

//     if (!shippingAddress || !billingAddress) {
//       console.error('Validation échouée: Adresses manquantes');
//       console.log('shippingAddress:', shippingAddress);
//       console.log('billingAddress:', billingAddress);
//       return NextResponse.json(
//         { error: 'Adresses manquantes' },
//         { status: 400 }
//       );
//     }

//       console.log('okkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
//       console.log('items:', items);
//       console.log('billingAddress:', billingAddress);
//       console.log('shippingAddress:', shippingAddress);

//     console.log('✅ Données reçues:');
//     console.log('- Items:', items.length);
//     console.log('- PaymentMethod:', paymentMethod);
//     console.log('- Amounts:', amounts);

//     // ----------------------------------------
//     // 2. VÉRIFIER/GÉNÉRER LE CLIENT ID
//     // ----------------------------------------
//     console.log('🔍 Étape 2: Vérification du Client ID...');
    
//     const user = await db.user.findUnique({
//       where: { id: userId },
//       select: { clientId: true }
//     });

//     let clientId = user?.clientId;

//     // Si l'utilisateur n'a pas de clientId, en générer un
//     if (!clientId) {
//       clientId = await generateClientId();
      
//       await db.user.update({
//         where: { id: userId },
//         data: { clientId }
//       });

//       console.log(`✅ Nouveau Client ID créé: ${clientId} pour l'utilisateur ${userId}`);
//     } 

//     // ----------------------------------------
//     // 3. CRÉER OU RÉCUPÉRER LES ADRESSES
//     // ----------------------------------------
//     console.log('Étape 3: Création/récupération des adresses...');
    
//     const shippingAddressRecord = await createOrGetAddress(
//       userId,
//       shippingAddress,
//       shippingAddress.civility || 'MR'
//     );
//     console.log(`Adresse de livraison: ${shippingAddressRecord.id}`);

//     const billingAddressRecord = await createOrGetAddress(
//       userId,
//       billingAddress,
//       billingAddress.civility || 'MR'
//     );
//     console.log(`✅ Adresse de facturation: ${billingAddressRecord.id}`);

//     // ----------------------------------------
//     // 4. DÉTERMINER LA BOUTIQUE ET LOCALITÉ
//     // ----------------------------------------
//     console.log('🏪 Étape 4: Recherche de la boutique...');
    
//     // const locality = getLocality(shippingAddress.country);
//     // console.log('   Localité:', locality);
//     // Vérifier que tous les items ont la même locality
//     const localities = [...new Set(items.map((item: any) => item.locality))];
//     if (localities.length > 1) {
//       return NextResponse.json(
//         { error: 'Tous les articles doivent être de la même localité' },
//         { status: 400 }
//       );
//     }
//     const locality: string = localities[0] as string;

//     // ============================================
//     // DÉTERMINATION DE localityId (storeId)
//     // ============================================
//     let storeId: string;

//     if (locality === 'Martinique') {
//       storeId = 'cmhnnz9gk000exdr0q25cpqcu';
//     } else if (locality === 'Guadeloupe') {
//       storeId = 'cmhkfvgu6000txdbcf560322v';
//     } else if (locality === 'Guyane') {
//       storeId = 'cmhnnvf7n000axdr0gbfcf0yr';
//     } else {
//       return NextResponse.json({ 
//         message: 'Localité non reconnue' 
//       }, { status: 400 });
//     }
    
//     // Récupérer la boutique correspondante (ou une boutique par défaut)
//     let store = await db.store.findFirst({
//       where: {
//         status: 'ACTIVE',
//         id: storeId
//       }
//     });

//     if (!store) {
//       return NextResponse.json(
//         { message: 'Votre boutique rencontre des soucis' },
//         { status: 400 }
//       );
//     }
    
//     // ----------------------------------------
//     // 5. GÉNÉRER LE NUMÉRO DE COMMANDE
//     // ----------------------------------------
//     const orderNumber = await generateOrderNumber();

//     // ----------------------------------------
//     // 6. CRÉER LA COMMANDE DANS UNE TRANSACTION
//     // ----------------------------------------
//     console.log('🔄 Début de la transaction pour créer la commande...');
    
//     const order = await db.$transaction(async (tx) => {
      
//       // Créer la commande
//       const newOrder = await tx.order.create({
//         data: {
//           orderNumber,
//           userId,
//           shippingAddressId: shippingAddressRecord.id,
//           billingAddressId: billingAddressRecord.id,
//           storeId: store.id,
//           locality,
          
//           // Montants
//           subtotal: amounts.subtotal,
//           shippingCost: amounts.shippingCost,
//           taxAmount: amounts.taxAmount,
//           discountAmount: 0,
//           totalAmount: amounts.totalAmount,
          
//           // Statuts
//           status: 'PENDING',
//           paymentStatus: 'PENDING',
//           shippingStatus: 'PENDING',
          
//           // Paiement
//           paymentMethod: paymentMethod as any,
          
//           // Notes
//           customerNote: null,
//           internalNote: `Commande créée automatiquement. Client ID: ${clientId}`,
//         },
//         include: {
//           shippingAddress: true,
//           billingAddress: true,
//           store: true
//         }
//       });

//       // Créer les items de commande
//       for (const item of items) {
//         console.log(`🔍 Traitement de l'item du panier:`, {
//           variantId: item.variantId,
//           colorId: item.colorId,
//           quantity: item.quantity,
//           designation: item.designation
//         });
        
//         // ⚠️ IMPORTANT : item.id dans le panier n'est PAS l'ID d'un article physique
//         // C'est une combinaison générée : variantId-colorId-timestamp
//         // Il faut donc chercher des articles disponibles avec ces critères
        
//         // Chercher des articles disponibles avec cette variante et couleur
//         const availableArticles = await tx.article.findMany({
//           where: {
//             variantId: item.variantId,
//             colorId: item.colorId,
//             storeId: store.id, // Dans la bonne boutique
//             status: 'IN_STOCK' // Disponibles en stock
//           },
//           include: {
//             model: true,
//             color: true,
//             variant: true
//           },
//           take: item.quantity, // Prendre le nombre nécessaire
//           orderBy: {
//             createdAt: 'asc' // FIFO : First In, First Out
//           }
//         });

//         console.log(`📦 Articles trouvés en stock: ${availableArticles.length} / ${item.quantity} demandés`);

//         // Vérifier qu'on a assez d'articles
//         if (availableArticles.length < item.quantity) {
//           const productName = availableArticles[0]?.model.designation || item.designation;
//           console.error(`Stock insuffisant pour ${productName}`);
//           console.error(`   Demandé: ${item.quantity}, Disponible: ${availableArticles.length}`);
//           throw new Error(
//             `Stock insuffisant pour ${productName} ${item.variantId}. ` +
//             `Demandé: ${item.quantity}, Disponible: ${availableArticles.length}`
//           );
//         }

//         // Traiter chaque article individuellement
//         for (const article of availableArticles) {
//           console.log(`📊 Article trouvé: ${article.articleNumber} - Statut: ${article.status}`);

//           console.log(`📊 Article trouvé: ${article.articleNumber} - Statut: ${article.status}`);

//           // Créer un OrderItem pour cet article
//           await tx.orderItem.create({
//             data: {
//               orderId: newOrder.id,
//               articleId: article.id,
//               productModelId: article.modelId,
//               variantId: article.variantId,
//               colorId: article.colorId || '',
              
//               // Snapshot des données
//               productName: article.model.designation,
//               brand: article.model.brand,
//               colorName: article.color?.colorName || 'N/A',
//               colorHex: article.color?.hexaColor || '#000000',
//               storage: article.variant.variantAttribute || 'N/A',
//               imageUrl: item.image || '',
              
//               // Prix - ⚠️ IMPORTANT : quantity = 1 car c'est 1 article physique
//               quantity: 1,
//               unitPrice: item.price,
//               totalPrice: item.price, // Prix pour CET article
              
//               // TVA
//               taxRate: article.variant.tva,
//               taxAmount: (item.price * parseFloat(article.variant.tva.toString())) / 100
//             }
//           });

//           console.log(`✅ OrderItem créé pour l'article ${article.articleNumber}`);

//           // Réserver l'article
//           await tx.article.update({
//             where: { id: article.id },
//             data: { status: 'RESERVED' }
//           });

//           console.log(`🔒 Article ${article.articleNumber} réservé`);
//         }

//         // Mettre à jour les stocks de la variante (une seule fois pour tous les articles)
//         await tx.productVariant.update({
//           where: { id: item.variantId },
//           data: {
//             availableStock: { decrement: item.quantity },
//             reservedStock: { increment: item.quantity }
//           }
//         });

//         console.log(`📊 Stocks de la variante mis à jour (-${item.quantity} disponible, +${item.quantity} réservé)`);
//       }

//       console.log('📝 Création de l\'historique de statut...');
      
//       // Créer l'historique de statut
//       await tx.orderStatusHistory.create({
//         data: {
//           orderId: newOrder.id,
//           fromStatus: null,
//           toStatus: 'PENDING',
//           changedBy: userId,
//           note: 'Commande créée'
//         }
//       });

//       console.log('✅ Transaction terminée avec succès');
//       return newOrder;
//     });

//     // ----------------------------------------
//     // 7. RÉPONSE
//     // ----------------------------------------
//     return NextResponse.json({
//       success: true,
//       order: {
//         id: order.id,
//         orderNumber: order.orderNumber,
//         clientId,
//         totalAmount: order.totalAmount,
//         status: order.status
//       }
//     });

//   } catch (error: any) {
//     console.error('❌ Erreur création commande:', error);
//     console.error('❌ Stack:', error.stack);
    
//     return NextResponse.json(
//       { 
//         success: false,
//         error: 'Erreur lors de la création de la commande',
//         message: error.message,
//         details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//       },
//       { status: 500 }
//     );
//   }
// }







// import { currentUser } from '@/lib/auth';
// import { db } from '@/lib/db';
// import { NextRequest, NextResponse } from 'next/server';

// // ============================================
// // FONCTION POUR GÉNÉRER UN CLIENT ID UNIQUE
// // ============================================
// async function generateClientId(): Promise<string> {
//   const year = new Date().getFullYear();
  
//   // Récupérer le dernier clientId de l'année en cours
//   const lastUser = await db.user.findFirst({
//     where: {
//       clientId: {
//         startsWith: `CLT-${year}-`
//       }
//     },
//     orderBy: {
//       clientId: 'desc'
//     },
//     select: {
//       clientId: true
//     }
//   });

//   let nextNumber = 1;
  
//   if (lastUser?.clientId) {
//     // Extraire le numéro du dernier clientId (ex: CLT-2025-000042 -> 42)
//     const lastNumber = parseInt(lastUser.clientId.split('-')[2]);
//     nextNumber = lastNumber + 1;
//   }

//   // Formater avec des zéros (ex: CLT-2025-000001)
//   return `CLT-${year}-${nextNumber.toString().padStart(6, '0')}`;
// }

// // ============================================
// // FONCTION POUR GÉNÉRER UN NUMÉRO DE COMMANDE
// // ============================================
// async function generateOrderNumber(): Promise<string> {
//   const year = new Date().getFullYear();
  
//   // Récupérer la dernière commande de l'année en cours
//   const lastOrder = await db.order.findFirst({
//     where: {
//       orderNumber: {
//         startsWith: `ORD-${year}-`
//       }
//     },
//     orderBy: {
//       orderNumber: 'desc'
//     },
//     select: {
//       orderNumber: true
//     }
//   });

//   let nextNumber = 1;
  
//   if (lastOrder?.orderNumber) {
//     // Extraire le numéro (ex: ORD-2025-000042 -> 42)
//     const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
//     nextNumber = lastNumber + 1;
//   }

//   // Formater (ex: ORD-2025-000001)
//   return `ORD-${year}-${nextNumber.toString().padStart(6, '0')}`;
// }

// // ============================================
// // FONCTION POUR DÉTERMINER LA LOCALITÉ
// // ============================================
// function getLocality(country: string): string {
//   const localityMap: { [key: string]: string } = {
//     'MQ': 'Martinique',
//     'GP': 'Guadeloupe',
//     'GF': 'Guyane',
//     'FR': 'France Métropolitaine'
//   };
  
//   return localityMap[country] || 'Autre';
// }

// // ============================================
// // FONCTION POUR CRÉER OU SAUVEGARDER UNE ADRESSE
// // ============================================
// async function createOrGetAddress(
//   userId: string,
//   addressData: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     addressLine1: string;
//     addressLine2?: string;
//     city: string;
//     postalCode: string;
//     country: string;
//   },
//   civility: 'MR' | 'MME' = 'MR'
// ) {
//   const fullName = `${addressData.firstName} ${addressData.lastName}`;

//   // Chercher si l'adresse existe déjà
//   const existingAddress = await db.address.findFirst({
//     where: {
//       userId,
//       fullName,
//       addressLine1: addressData.addressLine1,
//       postalCode: addressData.postalCode,
//       city: addressData.city,
//       country: addressData.country
//     }
//   });

//   if (existingAddress) {
//     return existingAddress;
//   }

//   // Créer une nouvelle adresse
//   return await db.address.create({
//     data: {
//       userId,
//       label: 'Adresse de commande',
//       civility,
//       fullName,
//       phone: addressData.phone,
//       country: addressData.country,
//       city: addressData.city,
//       postalCode: addressData.postalCode,
//       addressLine1: addressData.addressLine1,
//       addressLine2: addressData.addressLine2 || null,
//       isDefaultShipping: false,
//       isDefaultBilling: false
//     }
//   });
// }

// // ============================================
// // POST - CRÉER UNE COMMANDE
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

//     const userId = userSession.id;

//     // ----------------------------------------
//     // 1. RÉCUPÉRATION DES DONNÉES
//     // ----------------------------------------
//     const {
//       items,
//       shippingAddress,
//       billingAddress,
//       paymentMethod,
//       amounts
//     } = await req.json();

//     // Validation
//     if (!items || items.length === 0) {
//       return NextResponse.json(
//         { error: 'Panier vide' },
//         { status: 400 }
//       );
//     }

//     if (!shippingAddress || !billingAddress) {
//       return NextResponse.json(
//         { error: 'Adresses manquantes' },
//         { status: 400 }
//       );
//     }

//     // ----------------------------------------
//     // 2. VÉRIFIER/GÉNÉRER LE CLIENT ID
//     // ----------------------------------------
//     const user = await db.user.findUnique({
//       where: { id: userId },
//       select: { clientId: true }
//     });

//     let clientId = user?.clientId;

//     // Si l'utilisateur n'a pas de clientId, en générer un
//     if (!clientId) {
//       clientId = await generateClientId();
      
//       await db.user.update({
//         where: { id: userId },
//         data: { clientId }
//       });

//       console.log(`✅ Nouveau Client ID créé: ${clientId} pour l'utilisateur ${userId}`);
//     }

//     // ----------------------------------------
//     // 3. CRÉER OU RÉCUPÉRER LES ADRESSES
//     // ----------------------------------------
//     const shippingAddressRecord = await createOrGetAddress(
//       userId,
//       shippingAddress,
//       shippingAddress.civility || 'MR'
//     );

//     const billingAddressRecord = await createOrGetAddress(
//       userId,
//       billingAddress,
//       billingAddress.civility || 'MR'
//     );

//     // ----------------------------------------
//     // 4. DÉTERMINER LA BOUTIQUE ET LOCALITÉ
//     // ----------------------------------------
//     const locality = getLocality(shippingAddress.country);
    
//     // Récupérer la boutique correspondante (ou une boutique par défaut)
//     const store = await db.store.findFirst({
//       where: {
//         status: 'ACTIVE',
//         country: shippingAddress.country
//       }
//     });

//     if (!store) {
//       return NextResponse.json(
//         { error: 'Aucune boutique disponible pour cette localité' },
//         { status: 400 }
//       );
//     }

//     // ----------------------------------------
//     // 5. GÉNÉRER LE NUMÉRO DE COMMANDE
//     // ----------------------------------------
//     const orderNumber = await generateOrderNumber();

//     // ----------------------------------------
//     // 6. CRÉER LA COMMANDE DANS UNE TRANSACTION
//     // ----------------------------------------
//     const order = await db.$transaction(async (tx) => {
//       // Créer la commande
//       const newOrder = await tx.order.create({
//         data: {
//           orderNumber,
//           userId,
//           shippingAddressId: shippingAddressRecord.id,
//           billingAddressId: billingAddressRecord.id,
//           storeId: store.id,
//           locality,
          
//           // Montants
//           subtotal: amounts.subtotal,
//           shippingCost: amounts.shippingCost,
//           taxAmount: amounts.taxAmount,
//           discountAmount: 0,
//           totalAmount: amounts.totalAmount,
          
//           // Statuts
//           status: 'PENDING',
//           paymentStatus: 'PENDING',
//           shippingStatus: 'PENDING',
          
//           // Paiement
//           paymentMethod: paymentMethod as any,
          
//           // Notes
//           customerNote: null,
//           internalNote: `Commande créée automatiquement. Client ID: ${clientId}`,
//         },
//         include: {
//           shippingAddress: true,
//           billingAddress: true,
//           store: true
//         }
//       });

//       // Créer les items de commande
//       for (const item of items) {
//         // Vérifier que l'article existe et est disponible
//         const article = await tx.article.findUnique({
//           where: { id: item.id },
//           include: {
//             model: true,
//             color: true,
//             variant: true
//           }
//         });

//         if (!article) {
//           throw new Error(`Article ${item.id} introuvable`);
//         }

//         if (article.status !== 'IN_STOCK') {
//           throw new Error(`Article ${article.articleNumber} n'est plus disponible`);
//         }

//         // Créer l'item de commande
//         await tx.orderItem.create({
//           data: {
//             orderId: newOrder.id,
//             articleId: article.id,
//             productModelId: article.modelId,
//             variantId: article.variantId,
//             colorId: article.colorId || '',
            
//             // Snapshot des données
//             productName: article.model.designation,
//             brand: article.model.brand,
//             colorName: article.color?.colorName || 'N/A',
//             colorHex: article.color?.hexaColor || '#000000',
//             storage: article.variant.variantAttribute || 'N/A',
//             imageUrl: item.image || '',
            
//             // Prix
//             quantity: item.quantity,
//             unitPrice: item.price,
//             totalPrice: item.price * item.quantity,
            
//             // TVA
//             taxRate: article.variant.tva,
//             taxAmount: (item.price * item.quantity * parseFloat(article.variant.tva.toString())) / 100
//           }
//         });

//         // Réserver l'article
//         await tx.article.update({
//           where: { id: article.id },
//           data: { status: 'RESERVED' }
//         });

//         // Mettre à jour les stocks de la variante
//         await tx.productVariant.update({
//           where: { id: article.variantId },
//           data: {
//             availableStock: { decrement: 1 },
//             reservedStock: { increment: 1 }
//           }
//         });
//       }

//       // Créer l'historique de statut
//       await tx.orderStatusHistory.create({
//         data: {
//           orderId: newOrder.id,
//           fromStatus: null,
//           toStatus: 'PENDING',
//           changedBy: userId,
//           note: 'Commande créée'
//         }
//       });

//       return newOrder;
//     });

//     // ----------------------------------------
//     // 7. RÉPONSE
//     // ----------------------------------------
//     return NextResponse.json({
//       success: true,
//       order: {
//         id: order.id,
//         orderNumber: order.orderNumber,
//         clientId,
//         totalAmount: order.totalAmount,
//         status: order.status
//       }
//     });

//   } catch (error: any) {
//     console.error('❌ Erreur création commande:', error);
    
//     return NextResponse.json(
//       { 
//         error: 'Erreur lors de la création de la commande',
//         message: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }