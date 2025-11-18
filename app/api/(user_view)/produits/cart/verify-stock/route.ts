import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

interface CartItemToVerify {
  variantId: string;
  colorId: string;
  storeId: string;
  quantity: number;
  designation?: string;
  colorName?: string;
  locality: string;
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucun article à vérifier' 
        },
        { status: 400 }
      );
    }

    // Vérification du stock pour tous les articles
    const verificationPromises = items.map(async (item: CartItemToVerify) => {
      try {
        // Recherche des articles disponibles
        const availableArticles = await db.article.findMany({
          where: {
            variantId: item.variantId,
            colorId: item.colorId,
            storeId: item.storeId,
            status: 'IN_STOCK'
          },
          include: {
            model: true,
            color: true,
            variant: true
          },
        });

        // Calculer le stock disponible
        const available = availableArticles.length;
        const requested = item.quantity;

        // Préparer les informations de l'article
        // const productName = availableArticles[0]?.model.designation || item.designation || 'Produit';
        // const colorName = availableArticles[0]?.color.name || item.colorName || 'Couleur inconnue';
        // const variantName = availableArticles[0]?.variant?.variantReference || '';
        const productName = availableArticles[0]?.model.designation || item.designation || 'Produit';
        const variantName = availableArticles[0]?.variant?.variantReference || item.variantId;
        const colorName = item.colorName || item.colorId;

        // Déterminer le statut
        let status = 'OK';
        let message = null;

        if (available === 0) {
          status = 'OUT_OF_STOCK';
          message = `${productName} (${colorName}) est actuellement indisponible`;
        } else if (available < requested) {
          status = 'INSUFFICIENT_STOCK';
          message = `Stock insuffisant pour ${productName} (${colorName}). Demandé: ${requested}, Disponible: ${available}`;
        }

        return {
          variantId: item.variantId,
          colorId: item.colorId,
          locality: item.locality,
          requested: requested,
          available: available,
          status: status,
          message: message,
          productInfo: {
            designation: productName,
            colorName: colorName,
            variantReference: variantName
          }
        };

      } catch (error) {
        console.error(`Erreur vérification article ${item.variantId}:`, error);
        
        // En cas d'erreur pour un article spécifique, on retourne un statut d'erreur
        return {
          variantId: item.variantId,
          colorId: item.colorId,
          locality: item.locality,
          requested: item.quantity,
          available: 0,
          status: 'ERROR',
          message: `Erreur lors de la vérification de ${item.designation || 'l\'article'}`
        };
      }
    });

    // Attendre toutes les vérifications
    const stockStatus = await Promise.all(verificationPromises);

    // Identifier les problèmes
    const outOfStock = stockStatus.filter(s => s.status === 'OUT_OF_STOCK');
    const insufficientStock = stockStatus.filter(s => s.status === 'INSUFFICIENT_STOCK');
    const errors = stockStatus.filter(s => s.status === 'ERROR');

    // Créer des messages d'avertissement
    const warnings: string[] = [];
    
    if (outOfStock.length > 0) {
      warnings.push(`${outOfStock.length} article(s) indisponible(s)`);
    }
    
    if (insufficientStock.length > 0) {
      warnings.push(`${insufficientStock.length} article(s) avec stock insuffisant`);
    }

    if (errors.length > 0) {
      warnings.push(`${errors.length} article(s) n'ont pas pu être vérifiés`);
    }

    // Déterminer si la commande peut être passée
    const canProceed = outOfStock.length === 0 && insufficientStock.length === 0 && errors.length === 0;

    return NextResponse.json({ 
      success: true,
      canProceed: canProceed,
      stockStatus: stockStatus,
      warnings: warnings.length > 0 ? warnings : undefined,
      summary: {
        total: stockStatus.length,
        available: stockStatus.filter(s => s.status === 'OK').length,
        outOfStock: outOfStock.length,
        insufficientStock: insufficientStock.length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('Erreur vérification stock:', error);
    
    // Retourner le message d'erreur spécifique
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la vérification';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}









// import { db } from '@/lib/db';
// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     const { items } = await request.json();

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           error: 'Aucun article à vérifier' 
//         },
//         { status: 400 }
//       );
//     }

//     // Vérification du stock pour tous les articles
//     const verificationPromises = items.map(async (item: any) => {
//       const locality = item.locality;

//       // // ============================================
//       // // DÉTERMINATION DE localityId (storeId)
//       // // ============================================
//       // let storeId: string;

//       // if (locality === 'Martinique') {
//       //   storeId = 'cmhnnz9gk000exdr0q25cpqcu';
//       // } else if (locality === 'Guadeloupe') {
//       //   storeId = 'cmhkfvgu6000txdbcf560322v';
//       // } else if (locality === 'Guyane') {
//       //   storeId = 'cmhnnvf7n000axdr0gbfcf0yr';
//       // } else {
//       //   throw new Error(`Localité non reconnue: ${locality}`);
//       // }

//       // Recherche des articles disponibles
//       const availableArticles = await db.article.findMany({
//         where: {
//           // la modelID
//           variantId: item.variantId,
//           colorId: item.colorId,
//           storeId: item.storeId,
//           status: 'IN_STOCK'
//         },
//         include: {
//           model: true,
//           color: true,
//           variant: true
//         },
//       });

//       // Vérification de la disponibilité
//       const available = availableArticles.length;
//       const requested = item.quantity;

//       if (available < requested) {
//         const productName = availableArticles[0]?.model.designation || item.designation || 'Produit';
//         const variantName = availableArticles[0]?.variant?.variantReference || item.variantId;
//         const colorName = item.colorName || item.colorId;
        
//         throw new Error(
//           `Stock insuffisant pour ${productName} (couleur ${colorName}). ` +
//           `Demandé: ${requested}, Disponible: ${available}`
//         );
//       }

//       return {
//         variantId: item.variantId,
//         colorId: item.colorId,
//         locality: locality,
//         requested: requested,
//         available: available,
//         status: 'OK'
//       };
//     });

//     // Attendre toutes les vérifications
//     const stockStatus = await Promise.all(verificationPromises);

//     return NextResponse.json({ 
//       success: true, 
//       stockStatus 
//     });

//   } catch (error) {
//     console.error('Erreur vérification stock:', error);
    
//     // Retourner le message d'erreur spécifique
//     const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: errorMessage 
//       },
//       { status: 400 }
//     );
//   }
// }
















// // import { db } from '@/lib/db';
// // import { NextResponse } from 'next/server';

// // export async function POST(request: Request) {
// //     console.log('oaaaaaaaakkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk')

// //   try {

// //     console.log('okkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk')
// //     const { items } = await request.json();

// //     const stockStatus = await Promise.all(
// //       items.map(async (item: any) => {

// //         const locality = item.locality;

// //         // ============================================
// //         // DÉTERMINATION DE localityId (storeId)
// //         // ============================================
// //         let storeId: string;

// //         if (locality === 'Martinique') {
// //           storeId = 'cmhnnz9gk000exdr0q25cpqcu';
// //         } else if (locality === 'Guadeloupe') {
// //           storeId = 'cmhkfvgu6000txdbcf560322v';
// //         } else if (locality === 'Guyane') {
// //           storeId = 'cmhnnvf7n000axdr0gbfcf0yr';
// //         } else {
// //           return NextResponse.json({ 
// //             message: 'Localité non reconnue' 
// //           }, { status: 400 });
// //         }

// //         const availableArticles = await db.article.findMany({
// //           where: {
// //             variantId: item.variantId,
// //             colorId: item.colorId,
// //             storeId: storeId, // Dans la bonne boutique
// //             status: 'IN_STOCK' // Disponibles en stock
// //           },
// //           include: {
// //             model: true,
// //             color: true,
// //             variant: true
// //           },
// //         });

// //         // Vérifier qu'on a assez d'articles
// //         if (availableArticles.length < item.quantity) {
// //           const productName = availableArticles[0]?.model.designation || item.designation;
// //           console.error(`Stock v insuffisant pour ${productName}`);
// //           console.error(`   Demandé: ${item.quantity}, Disponible: ${availableArticles.length}`);
// //           throw new Error(
// //             `Stock insuffisant pour ${productName} ${item.variantId}. ` +
// //             `Demandé: ${item.quantity}, Disponible: ${availableArticles.length}`
// //           );
// //         }

// //       })
// //     );

// //     return NextResponse.json({ 
// //       success: true, 
// //       stockStatus 
// //     });
// //   } catch (error) {
// //     console.error('Erreur vérification stock:', error);
// //     return NextResponse.json(
// //       { success: false, error: 'Erreur lors de la vérification du stock' },
// //       { status: 500 }
// //     );
// //   }
// // }