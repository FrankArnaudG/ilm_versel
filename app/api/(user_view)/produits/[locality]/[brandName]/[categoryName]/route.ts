// ============================================
// app/api/produits/[locality]/[brandName]/[categoryName]/route.ts
// GET - Liste des modèles filtrés par localité, marque et catégorie
// ============================================

import { db } from "@/lib/db";
import { getStoreIdByLocality } from "@/lib/locality";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string; brandName: string; categoryName?: string }> }
) {
  try {
    const { locality, brandName, categoryName } = await params;

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!brandName || !locality) {
      return NextResponse.json({ 
        message: 'Marque et localité sont requises' 
      }, { status: 400 });
    }

    // ============================================
    // DÉTERMINATION DE localityId (storeId)
    // ============================================
    const storeId = getStoreIdByLocality(locality);

    // ============================================
    // RÉCUPÉRATION DES MODÈLES AVEC VARIANTES
    // ============================================
    const productModels = await db.productModel.findMany({
      where: {
        brand: brandName,
        ...(categoryName && { category: categoryName }),
        status: 'ACTIVE',
        variants: {
          some: {
            storeId: storeId,
            availableStock: { gt: 0 }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        // Couleurs avec images
        colors: {
          include: {
            images: {
              orderBy: { displayOrder: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        
        // Variantes de cette boutique uniquement
        variants: {
          where: {
            storeId: storeId,
            availableStock: { gt: 0 }
          },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true
              }
            },
          },
          orderBy: [
            { variantAttribute: 'asc' },
            { pvTTC: 'asc' }
          ]
        },
        
        // ✅ CORRIGÉ : Articles avec variante complète
        articles: {
          where: {
            storeId: storeId,
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
            variant: true  // ✅ Inclure toute la variante au lieu de select
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // ============================================
    // FILTRER LES MODÈLES SANS VARIANTES/ARTICLES
    // ============================================
    const filteredModels = productModels.filter(model => 
      (model.variants && model.variants.length > 0) || 
      (model.articles && model.articles.length > 0)
    );

    // ============================================
    // ENRICHIR LES ARTICLES AVEC LES PRIX ET CONVERTIR LES DECIMALS
    // ============================================
    const enrichedModels = filteredModels.map(model => ({
      ...model,
      // ✅ Convertir averageRating de Decimal en number
      averageRating: model.averageRating ? parseFloat(model.averageRating.toString()) : null,
      articles: model.articles?.map(article => ({
        ...article,
        // ✅ Ajouter les prix depuis la variante
        pvTTC: article.variant?.pvTTC ? article.variant.pvTTC.toString() : "0",
        pvTTC_FCFA: article.variant?.pvTTC_FCFA ? article.variant.pvTTC_FCFA.toString() : "0",
        oldPrice: article.variant?.oldPrice ? article.variant.oldPrice.toString() : "0",
        oldPrice_FCFA: article.variant?.oldPrice_FCFA ? article.variant.oldPrice_FCFA.toString() : "0",
        pamp: article.variant?.pamp ? article.variant.pamp.toString() : "0",
        pamp_FCFA: article.variant?.pamp_FCFA ? article.variant.pamp_FCFA.toString() : "0",
        tva: article.variant?.tva ? article.variant.tva.toString() : "18",
        margin: article.variant?.margin ? article.variant.margin.toString() : "0",
        marginFCFA: article.variant?.marginFCFA ? article.variant.marginFCFA.toString() : "0",
        marginPercent: article.variant?.marginPercent ? article.variant.marginPercent.toString() : "0",
        useFCFA: article.variant?.useFCFA || false
      }))
    }));

    // ============================================
    // STATISTIQUES POUR LE FRONTEND (optionnel)
    // ============================================
    const statistics = {
      totalModels: enrichedModels.length,
      totalVariants: enrichedModels.reduce((sum, model) => sum + (model.variants?.length || 0), 0),
      totalArticles: enrichedModels.reduce((sum, model) => sum + (model.articles?.length || 0), 0),
      
      // Prix min/max pour aider les filtres frontend
      priceRange: (() => {
        const allPrices: number[] = [];
        enrichedModels.forEach(model => {
          model.variants?.forEach(variant => {
            allPrices.push(parseFloat(variant.pvTTC.toString()));
          });
        });
        
        return allPrices.length > 0 ? {
          min: Math.min(...allPrices),
          max: Math.max(...allPrices)
        } : { min: 0, max: 0 };
      })(),
      
      // Couleurs disponibles
      availableColors: Array.from(
        new Set(
          enrichedModels.flatMap(model => 
            model.colors?.map(c => c.colorName) || []
          )
        )
      ),
      
      // ✅ CORRIGÉ : Stockages disponibles (filtrer les null avant le tri)
      availableStorages: Array.from(
        new Set(
          enrichedModels.flatMap(model => 
            model.variants
              ?.map(v => v.variantAttribute)
              .filter((attr): attr is string => attr !== null && attr !== undefined) || []
          )
        )
      ).sort((a, b) => {
        // a et b sont maintenant garantis d'être des strings
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
      
      // Types d'attributs disponibles
      availableAttributeTypes: Array.from(
        new Set(
          enrichedModels.flatMap(model => 
            model.variants
              ?.map(v => v.attributeType)
              .filter((type): type is NonNullable<typeof type> => type !== null && type !== undefined) || []
          )
        )
      )
    };

    // ============================================
    // RÉPONSE
    // ============================================
    return NextResponse.json({
      success: true,
      productModel: enrichedModels,
      statistics,
      filters: {
        locality,
        brand: brandName,
        category: categoryName || null,
        storeId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erreur récupération produits:', error);
    
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