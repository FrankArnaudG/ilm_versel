// ============================================
// POST /api/products/articles - Créer un ou plusieurs articles
// ============================================

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { EUR_TO_FCFA_RATE } from "@/lib/types";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

interface ArticleInput {
  article_number: string;
  reference: string;
  model_reference?: string;
  description?: string;
  model_id: string;
  variant_id: string;
  color_id: string;
  // stockage_ram: string;
  
  // // Prix
  // pv_ttc?: number;
  // pamp?: number;
  // old_price?: number;
  // tva?: number;
  
  // pv_ttc_fcfa?: number;
  // pamp_fcfa?: number;
  // old_price_fcfa?: number;
  
  // margin?: number;
  // margin_fcfa?: number;
  // margin_percent?: number;
  
  specifications?: Record<string, string>;
  condition: 'NEW' | 'LIKE_NEW' | 'REFURBISHED';
  // quantity?: number;
  status?: string;
  
}



export async function POST(request: Request) {
  try {
    const {
      user_id,
      role, // Rôle avec lequel l'utilisateur effectue l'action

      // Informations de l'entrée en stock (communes à tous les articles)
      document_file,
      document_type,
      document_refs,
      
      // Informations d'import
      import_source,   // ('MANUAL' ou 'EXCEL')
      excel_file_name, // (optionnel si EXCEL)

      // Informations communes
      supplier_id,     // Même fournisseur pour tous les articles
      store_id,        // Même boutique pour tous les articles
      purchase_date,   // Même date d'achat pour tous les articles

      // Liste des articles à créer
      articles,        // Array d'ArticleInput
      
    } = await request.json();

    if (!user_id) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier l'utilisateur (celui qui crée les articles)
    const user = await db.user.findUnique({
      where: {
        id: user_id
      },
      include: {
        secondaryRoles: true,
        store: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier les champs obligatoires
    if (!store_id || !supplier_id || !articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ 
        message: 'Champs obligatoires manquants (store_id, supplier_id, articles)' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur est actif
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

    // Vérifier que le rôle fourni appartient bien à l'utilisateur
    const userRoles: Role[] = [user.role, ...user.secondaryRoles.map(sr => sr.role)];
    const isRoleValid = userRoles.includes(role as Role);

    if (!isRoleValid) {
      return NextResponse.json({ 
        message: "Votre rôle est introuvable" 
      }, { status: 403 });
    }

    // Vérifier si le rôle secondaire n'est pas expiré
    if (role !== user.role) {
      const secondaryRole = user.secondaryRoles.find(sr => sr.role === role);
      if (secondaryRole?.expiresAt && new Date(secondaryRole.expiresAt) < new Date()) {
        return NextResponse.json({ 
          message: 'Ce rôle secondaire a expiré' 
        }, { status: 403 });
      }
    }

    // Vérifier les permissions de création d'articles
    const canCreate = hasPermission(role as Role, 'articles.create');
    
    if (!canCreate) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à créer des articles." 
      }, { status: 403 });
    }

    // Vérifier document_refs (max 5)
    if (document_refs && Array.isArray(document_refs) && document_refs.length > 5) {
      return NextResponse.json({ 
        message: 'Maximum 5 références de document autorisées' 
      }, { status: 400 });
    }

    // Vérifier que la boutique existe
    const store = await db.store.findUnique({
      where: { id: store_id }
    });

    if (!store) {
      return NextResponse.json({ 
        message: 'La boutique spécifiée n\'existe pas' 
      }, { status: 404 });
    }

    // Vérifier le fournisseur
    const supplier = await db.supplier.findUnique({
      where: { id: supplier_id }
    });

    if (!supplier) {
      return NextResponse.json({ 
        message: 'Le fournisseur spécifié n\'existe pas' 
      }, { status: 404 });
    }

    // Vérifier que tous les numéros d'articles sont uniques dans la requête
    const articleNumbers = articles.map((a: ArticleInput) => a.article_number);
    const uniqueArticleNumbers = new Set(articleNumbers);
    
    if (articleNumbers.length !== uniqueArticleNumbers.size) {
      return NextResponse.json({ 
        message: 'Les numéros d\'articles doivent être uniques dans la même entrée' 
      }, { status: 400 });
    }

    // Vérifier que les numéros d'articles n'existent pas déjà en base
    const existingArticles = await db.article.findMany({
      where: {
        articleNumber: {
          in: articleNumbers
        }
      }
    });

    if (existingArticles.length > 0) {
      const existingNumbers = existingArticles.map(a => a.articleNumber).join(', ');
      return NextResponse.json({ 
        message: `Les numéros d'articles suivants existent déjà: ${existingNumbers}` 
      }, { status: 409 });
    }

    // Récupérer tous les model_ids uniques
    const modelIds = [...new Set(articles.map((a: ArticleInput) => a.model_id))];
    const models = await db.productModel.findMany({
      where: { id: { in: modelIds } }
    });

    if (models.length !== modelIds.length) {
      const foundModelIds = models.map(m => m.id);
      const missingModelIds = modelIds.filter(id => !foundModelIds.includes(id));
      return NextResponse.json({ 
        message: `Les modèles suivants n'existent pas: ${missingModelIds.join(', ')}` 
      }, { status: 404 });
    }

    // Récupérer tous les color_ids uniques
    const colorIds = [...new Set(articles.map((a: ArticleInput) => a.color_id))];
    const colors = await db.productColor.findMany({
      where: { id: { in: colorIds } }
    });

    if (colors.length !== colorIds.length) {
      const foundColorIds = colors.map(c => c.id);
      const missingColorIds = colorIds.filter(id => !foundColorIds.includes(id));
      return NextResponse.json({ 
        message: `Les couleurs suivantes n'existent pas: ${missingColorIds.join(', ')}` 
      }, { status: 404 });
    }

    // Vérifier tous les variant_ids uniques
    const variantIds = [...new Set(articles.map((a: ArticleInput) => a.variant_id))];
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds } }
    });

    if (variants.length !== variantIds.length) {
      const foundVariantIds = variants.map(v => v.id);
      const missingVariantIds = variantIds.filter(id => !foundVariantIds.includes(id));
      return NextResponse.json({ 
        message: `Les variantes suivantes n'existent pas: ${missingVariantIds.join(', ')}` 
      }, { status: 404 });
    }

    // ============================================
    // CRÉATION DE L'ENTRÉE EN STOCK
    // ============================================

    const stockEntry = await db.stockEntry.create({
      data: {
        // Relations obligatoires
        storeId: store_id,
        supplierId: supplier_id,

        // Document
        documentFile: document_file,
        documentType: document_type,
        documentRefs: document_refs || [],

        // Dates
        purchaseDate: purchase_date ? new Date(purchase_date) : new Date(),
        receivedDate: new Date(),
        
        // Import
        importSource: import_source || 'MANUAL',
        excelFileName: excel_file_name,
        
        // Statistiques
        // totalArticles: articles.length,

        // Statistiques - MODIFICATION: sera mis à jour après création des articles
        totalArticles: 0,

        // Statut
        status: 'PENDING',
        
        // Audit
        createdById: user.id,
      },
      include: {
        supplier: true,
        store: true,
        createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
    });

    // ============================================
    // CRÉATION DES ARTICLES + MISE À JOUR DES VARIANTES
    // ============================================

    const createdArticles = [];
    const errors = [];

    // Compteur des articles créés par variante
    const variantArticleCount = new Map<string, number>();


    for (let i = 0; i < articles.length; i++) {
      const articleData = articles[i];

      try {

        // Créer l'article
        const newArticle = await db.article.create({
          data: {
            articleNumber: articleData.article_number,
            articleReference: articleData.reference,
            modelReference: articleData.model_reference,
            description: articleData.description,
            modelId: articleData.model_id,
            storeId: store_id,
            entryId: stockEntry.id, // Même entryId pour tous les articles
            colorId: articleData.color_id,
            // stockage_ram: articleData.stockage_ram,
            supplierId: supplier_id,
            variantId: articleData.variant_id,
            

            

            // // Indicateur de devise
            // useFCFA: useFCFA,
            
            // // Prix en Euro
            // pvTTC: finalPvTTC,
            // pamp: finalPamp,
            // oldPrice: finalOldPrice,
            // tva: finalTva,
            
            // // Prix en FCFA
            // pvTTC_FCFA: finalPvTTC_FCFA,
            // pamp_FCFA: finalPamp_FCFA,
            // oldPrice_FCFA: finalOldPrice_FCFA,
            
            // // Marges
            // margin: articleData.margin ? parseFloat(articleData.margin.toString()) : 0,
            // marginFCFA: articleData.margin_fcfa ? parseFloat(articleData.margin_fcfa.toString()) : 0,
            // marginPercent: articleData.margin_percent ? parseFloat(articleData.margin_percent.toString()) : 0,
            
            specifications: articleData.specifications || {},
            articleCondition: articleData.condition,
            
            status: articleData.status || 'DRAFT',
          },
          include: {
            model: {
              select: {
                id: true,
                designation: true,
                reference: true,
                brand: true
              }
            },
            color: {
              select: {
                id: true,
                colorName: true,
                hexaColor: true
              }
            },
            supplier: {
              select: {
                id: true,
                name: true,
                contactName: true
              }
            },
            store: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true
              }
            },
          }
        });

        createdArticles.push(newArticle);

        // Compter les articles par variante
        const count = variantArticleCount.get(articleData.variant_id) || 0;
        variantArticleCount.set(articleData.variant_id, count + 1);

      } catch (error) {
        console.error(`Erreur lors de la création de l'article ${articleData.article_number}:`, error);
        errors.push({
          article_number: articleData.article_number,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    // Si aucun article n'a pu être créé, supprimer l'entrée en stock
    if (createdArticles.length === 0) {
      await db.stockEntry.delete({
        where: { id: stockEntry.id }
      });

      return NextResponse.json({
        success: false,
        message: 'Aucun article n\'a pu être créé',
        errors: errors
      }, { status: 400 });
    }

    // ============================================
    // MISE À JOUR DES STATISTIQUES DES VARIANTES
    // ============================================

    // Récupérer les valeurs actuelles avant mise à jour
    const variantsBeforeUpdate = await db.productVariant.findMany({
      where: {
        id: {
          in: Array.from(variantArticleCount.keys())
        }
      },
      select: {
        id: true,
        totalStock: true,
        availableStock: true,
        reservedStock: true,
        soldStock: true
      }
    });

    const variantUpdatePromises = Array.from(variantArticleCount.entries()).map(
      async ([variantId, articleCount]) => {
        return db.productVariant.update({
          where: { id: variantId },
          data: {
            totalStock: {
              increment: articleCount
            },
            availableStock: {
              increment: articleCount
            }
          }
        });
      }
    );

    await Promise.all(variantUpdatePromises);

    // Mettre à jour le nombre total d'articles dans l'entrée en stock
    await db.stockEntry.update({
      where: { 
        id: stockEntry.id
       },
      data: { 
        totalArticles: createdArticles.length
       }
    });

    // Logger l'activité
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'create',
        entityType: 'stock_entry',
        entityId: stockEntry.id,
        description: `Création de ${createdArticles.length} article(s) pour la boutique ${store.name} (Entrée #${stockEntry.id})`,
        oldValues: {
          variants: variantsBeforeUpdate.map(v => ({
            variantId: v.id,
            totalStock: v.totalStock,
            availableStock: v.availableStock,
            reservedStock: v.reservedStock,
            soldStock: v.soldStock
          }))
        },
        newValues: {
          stockEntryId: stockEntry.id,
          articlesCount: createdArticles.length,
          articleNumbers: createdArticles.map(a => a.articleNumber),
          variantsUpdated: Array.from(variantArticleCount.entries()).map(([id, count]) => ({
            variantId: id,
            articlesAdded: count
          }))
        },
      },
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    // TODO: Créer des mouvements de stock pour chaque article
    // TODO: Mettre à jour le stock de la boutique
    // TODO: Envoyer notification au manager de la boutique

    return NextResponse.json({
      success: true,
      message: `${createdArticles.length} article(s) créé(s) avec succès`,
      stockEntry: {
        id: stockEntry.id,
        totalArticles: createdArticles.length,
        status: stockEntry.status
      },
      articles: createdArticles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur lors de la création des articles:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur interne du serveur lors de la création des articles',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/products/articles - Liste des articles (filtrage côté client)
// ============================================

// export async function GET(request: Request) {
//   try {
//     // Récupérer les paramètres de requête
//     const { searchParams } = new URL(request.url);
//     const user_id = searchParams.get('user_id');
//     const role = searchParams.get('role'); // Rôle principal ou secondaire
//     const store_id = searchParams.get('store_id'); // pour SUPER_ADMIN qui veut voir une boutique spécifique

//     // Validation des paramètres obligatoires
//     if (!user_id || !role) {
//       return NextResponse.json({ 
//         message: 'Accès refusé' 
//       }, { status: 403 });
//     }

//     // Vérifier l'utilisateur
//     const user = await db.user.findUnique({
//       where: { id: user_id },
//       include: {
//         store: true,
//         secondaryRoles: true
//       }
//     });

//     if (!user) {
//       return NextResponse.json({ 
//         message: 'Accès refusé' 
//       }, { status: 403 });
//     }

//     // Vérifier que l'utilisateur est actif
//     if (user.status !== 'ACTIVE') {
//       return NextResponse.json({ 
//         message: 'Compte utilisateur inactif ou suspendu' 
//       }, { status: 403 });
//     }

//     // Vérifier que le rôle fourni appartient bien à l'utilisateur
//     const userRoles: Role[] = [user.role, ...user.secondaryRoles.map(sr => sr.role)];
//     const isRoleValid = userRoles.includes(role as Role);

//     if (!isRoleValid) {
//       return NextResponse.json({ 
//         message: "Accès refusé" 
//       }, { status: 403 });
//     }

//     // Vérifier si le rôle secondaire n'est pas expiré
//     if (role !== user.role) {
//       const secondaryRole = user.secondaryRoles.find(sr => sr.role === role);
//       if (secondaryRole?.expiresAt && new Date(secondaryRole.expiresAt) < new Date()) {
//         return NextResponse.json({ 
//           message: 'Ce rôle secondaire a expiré' 
//         }, { status: 403 });
//       }
//     }

//     // Vérifier les permissions
//     const canViewAll = hasPermission(role as Role, 'articles.view_all');
//     const canViewOwn = hasPermission(role as Role, 'articles.view_store');

//     if (!canViewAll && !canViewOwn) {
//       return NextResponse.json({ 
//         message: "Vous n'êtes pas autorisé à consulter les articles" 
//       }, { status: 403 });
//     }

//     // Déterminer quelle boutique charger
//     let targetStoreId = null;
    
//     if (canViewAll) {
//       // SUPER_ADMIN peut spécifier une boutique ou voir tout
//       targetStoreId = store_id || null;
//     } else if (canViewOwn) {
//       // Les autres rôles ne voient que leur boutique
//       if (!user.storeId) {
//         return NextResponse.json({ 
//           message: "Vous n'êtes associé à aucune boutique" 
//         }, { status: 400 });
//       }
//       targetStoreId = user.storeId;
//     }

//     // Construire la requête
//     const whereClause: any = {};
//     if (targetStoreId) {
//       whereClause.storeId = targetStoreId;
//     }

//     // Récupérer TOUS les articles (le filtrage se fera côté client)
//     const articles = await db.article.findMany({
//       where: whereClause,
//       orderBy: {
//         createdAt: 'desc'
//       },
//       include: {
//         model: true,
//         color: true,
//         store: true,
//         supplier: true,
//       }
//     });

//     // Mettre à jour la date de dernière connexion
//     await db.user.update({
//       where: { id: user_id },
//       data: { lastLogin: new Date() }
//     });

//     // Retourner les articles bruts (sans statistiques - calculées côté client si nécessaire)
//     return NextResponse.json({
//       success: true,
//       articles,
//       count: articles.length,
//       accessLevel: canViewAll ? 'all' : 'own',
//       storeId: targetStoreId
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Erreur lors de la récupération des articles:', error);
    
//     return NextResponse.json(
//       { 
//         success: false,
//         message: 'Erreur interne du serveur lors de la récupération des articles',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }