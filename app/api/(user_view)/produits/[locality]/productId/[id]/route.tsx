// ============================================
// app/api/produits/detail/[locality]/[modelId]/route.ts
// GET - Détails complets d'un modèle avec variantes, couleurs, images pour une boutique spécifique
// ============================================

import { db } from "@/lib/db";
import { getStoreIdByLocality } from "@/lib/locality";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string; id: string }> }
) {
  try {
    const { locality, id } = await params;

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!locality) {
      return NextResponse.json({ 
        message: 'ID de la localité requis' 
      }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ 
        message: 'ID du modèle requis' 
      }, { status: 400 });
    }

    const modelId = id;
 
    // ============================================
    // DÉTERMINATION DE localityId (storeId)
    // ============================================
    const storeId = getStoreIdByLocality(locality);

    // ============================================
    // RÉCUPÉRATION DU MODÈLE AVEC TOUTES SES RELATIONS (FILTRÉ PAR BOUTIQUE)
    // ============================================
    const productModel = await db.productModel.findUnique({
      where: { 
        id: modelId,
        status: 'ACTIVE' // Seulement les produits actifs
      },
      include: {
        // Couleurs avec leurs images
        colors: {
          include: {
            images: {
              orderBy: { displayOrder: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        
        // ✅ VARIANTES FILTRÉES PAR BOUTIQUE
        variants: {
          where: {
            storeId: storeId,                    // ✅ Filtre par boutique
            availableStock: { gt: 0 }            // Seulement celles en stock
          },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
                country: true
              }
            }
          },
          orderBy: [
            { variantAttribute: 'asc' },
            { pvTTC: 'asc' }
          ]
        },
        
        // ✅ ARTICLES FILTRÉS PAR BOUTIQUE
        articles: {
          where: {
            storeId: storeId,                    // ✅ Filtre par boutique
            status: 'IN_STOCK'
          },
          include: {
            color: {
              select: {
                id: true,
                colorName: true,
                hexaColor: true
              }
            },
            variant: {
              select: {
                id: true,
                variantAttribute: true,
                pvTTC: true,
                oldPrice: true,
                availableStock: true
              }
            },
            store: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Limiter pour ne pas surcharger
        },
        
        // ✅ PRODUITS RECOMMANDÉS (FILTRÉS PAR BOUTIQUE)
        recommendedProducts: {
          where: {
            isActive: true,
            // Filtrer pour ne garder que les produits qui ont du stock dans cette boutique
            recommendedProduct: {
              variants: {
                some: {
                  storeId: storeId,              // ✅ Filtre par boutique
                  availableStock: { gt: 0 }
                }
              }
            }
          },
          include: {
            recommendedProduct: {
              select: {
                id: true,
                designation: true,
                brand: true,
                reference: true,
                colors: {
                  include: {
                    images: {
                      take: 1,
                      orderBy: { displayOrder: 'asc' }
                    }
                  },
                  take: 1
                },
                // ✅ Variantes de la boutique uniquement
                variants: {
                  where: {
                    storeId: storeId,            // ✅ Filtre par boutique
                    availableStock: { gt: 0 }
                  },
                  take: 1,
                  orderBy: {
                    pvTTC: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            priority: 'desc'
          },
          take: 6 // Maximum 6 produits recommandés
        }
      }
    });

    // ============================================
    // VÉRIFICATION EXISTENCE
    // ============================================
    if (!productModel) {
      return NextResponse.json({ 
        success: false,
        message: 'Produit non trouvé ou inactif' 
      }, { status: 404 });
    }

    // ============================================
    // ENRICHIR LES ARTICLES AVEC LES PRIX
    // ============================================
    const enrichedArticles = productModel.articles?.map(article => ({
      ...article,
      pvTTC: article.variant?.pvTTC ? article.variant.pvTTC.toString() : "0",
      oldPrice: article.variant?.oldPrice ? article.variant.oldPrice.toString() : "0",
      availableStock: article.variant?.availableStock || 0
    }));

    // ============================================
    // STATISTIQUES ET MÉTADONNÉES (SPÉCIFIQUES À LA BOUTIQUE)
    // ============================================
    const statistics = {
      // Prix (dans cette boutique uniquement)
      priceRange: (() => {
        const prices = productModel.variants?.map(v => parseFloat(v.pvTTC.toString())) || [];
        return prices.length > 0 ? {
          min: Math.min(...prices),
          max: Math.max(...prices)
        } : { min: 0, max: 0 };
      })(),
      
      // Ancien prix (pour réduction)
      oldPriceRange: (() => {
        const oldPrices = productModel.variants
          ?.map(v => parseFloat(v.oldPrice.toString()))
          .filter(p => p > 0) || [];
        return oldPrices.length > 0 ? {
          min: Math.min(...oldPrices),
          max: Math.max(...oldPrices)
        } : null;
      })(),
      
      // Stock total (dans cette boutique)
      totalStock: productModel.variants?.reduce((sum, v) => sum + v.availableStock, 0) || 0,
      
      // Nombre de configurations disponibles (dans cette boutique)
      totalVariants: productModel.variants?.length || 0,
      
      // Couleurs disponibles (qui ont du stock dans cette boutique)
      availableColors: productModel.colors?.map(c => ({
        id: c.id,
        name: c.colorName,
        hex: c.hexaColor,
        hasStock: productModel.articles?.some(a => 
          a.colorId === c.id && a.storeId === storeId
        ) || false
      })).filter(c => c.hasStock) || [],
      
      // Stockages disponibles (uniques et triés, dans cette boutique)
      availableStorages: Array.from(
        new Set(
          productModel.variants
            ?.filter(v => v.storeId === storeId)
            ?.map(v => v.variantAttribute)
            .filter((attr): attr is string => attr !== null && attr !== undefined) || []
        )
      ).sort((a, b) => {
        const toGB = (value: string): number => {
          const num = parseInt(value.replace(/\D/g, ''));
          const unit = value.toUpperCase();
          if (unit.includes('TB') || unit.includes('TO')) {
            return num * 1024;
          }
          return num;
        };
        return toGB(a) - toGB(b);
      }),
      
      // Boutique concernée
      store: productModel.variants?.[0]?.store || null
    };

    // ============================================
    // FORMATER LES PRODUITS RECOMMANDÉS
    // ============================================
    const formattedRecommendedProducts = productModel.recommendedProducts?.map(rec => {
      const product = rec.recommendedProduct;
      const firstImage = product.colors?.[0]?.images?.[0]?.url || null;
      const minPrice = product.variants?.[0]?.pvTTC 
        ? parseFloat(product.variants[0].pvTTC.toString()) 
        : 0;
      
      return {
        id: product.id,
        designation: product.designation,
        brand: product.brand,
        reference: product.reference,
        price: minPrice,
        image: firstImage,
        relationType: rec.relationType,
        bundleDiscount: rec.bundleDiscount ? parseFloat(rec.bundleDiscount.toString()) : null,
        bundlePrice: rec.bundlePrice ? parseFloat(rec.bundlePrice.toString()) : null
      };
    }) || [];

    // ============================================
    // CALCUL DU STOCK RÉEL PAR VARIANTE
    // ============================================
    const variantsWithRealStock = await Promise.all(
      productModel.variants?.map(async (variant) => {
        // Pour chaque variante, calculer le stock par couleur
        const stockByColor = await Promise.all(
          productModel.colors?.map(async (color) => {
            const realStock = await db.article.count({
              where: {
                variantId: variant.id,
                colorId: color.id,
                storeId: storeId,
                status: 'IN_STOCK'
              }
            });
            
            return {
              colorId: color.id,
              stock: realStock
            };
          }) || []
        );
        
        // Stock total de la variante (toutes couleurs confondues)
        const totalRealStock = stockByColor.reduce((sum, item) => sum + item.stock, 0);
        
        return {
          ...variant,
          realAvailableStock: totalRealStock,
          stockByColor: stockByColor.reduce((acc, item) => {
            acc[item.colorId] = item.stock;
            return acc;
          }, {} as Record<string, number>)
        };
      }) || []
    );

    // ============================================
    // RÉPONSE FINALE
    // ============================================
    return NextResponse.json({
      success: true,
      productModel: {
        ...productModel,
        variants: variantsWithRealStock,
        articles: enrichedArticles
      },
      statistics,
      recommendedProducts: formattedRecommendedProducts,
      filters: {
        locality,
        storeId
      },
      meta: {
        fetchedAt: new Date().toISOString(),
        totalImages: productModel.colors?.reduce((sum, c) => sum + (c.images?.length || 0), 0) || 0,
        hasRecommendations: formattedRecommendedProducts.length > 0
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erreur récupération détails produit:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur interne du serveur',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}