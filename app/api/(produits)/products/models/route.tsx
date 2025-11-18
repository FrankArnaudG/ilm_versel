import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { ProductStatus, Role, VariantAttributeType } from "@prisma/client";
import { NextResponse } from "next/server";

interface ProductImageInput {
  url: string;
  fileName?: string;
  displayOrder?: number;
}

interface ProductColorInput {
  colorName: string;
  hexaColor: string;
  images?: ProductImageInput[];
}

// Ajouter cette interface en haut du fichier avec les autres interfaces
interface WhereConditions {
  category?: string;
  brand?: string;
  status?: ProductStatus;
  OR?: Array<{
    designation?: { contains: string; mode: 'insensitive' };
    brand?: { contains: string; mode: 'insensitive' };
    reference?: { contains: string; mode: 'insensitive' };
  }>;
}

// type ProductSpecifications = Record<string, string | number | boolean>;


// interface ProductVariantInput {
//   name: string;
//   useFCFA?: boolean;
//   pvTTC?: number;
//   pamp?: number;
//   oldPrice?: number;
//   margin?: number;
//   tva?: number;
//   pvTTC_FCFA?: number;
//   pamp_FCFA?: number;
//   oldPrice_FCFA?: number;
//   marginFCFA?: number;
//   specifications?: ProductSpecifications; // ou un type plus spécifique
// }

interface ProductVariantInput {
  storeId: string;                        // Boutique concernée
  variantAttribute?: string;              // "256GB", "45mm", "20000mAh", etc.
  attributeType?: VariantAttributeType;   // STORAGE_RAM, SIZE, CAPACITY, etc.
  
  // Prix en EUR
  useFCFA?: boolean;
  pvTTC?: number;
  pamp?: number;
  oldPrice?: number;
  margin?: number;
  tva?: number;
  
  // Prix en FCFA
  pvTTC_FCFA?: number;
  pamp_FCFA?: number;
  oldPrice_FCFA?: number;
  marginFCFA?: number;
  marginPercent?: number;
}


interface RecommendedProductInput {
  recommendedProductId: string;
  priority?: number;
  relationType?: 'ACCESSORY' | 'COMPLEMENTARY' | 'UPGRADE' | 'ALTERNATIVE' | 'BUNDLE';
  bundleDiscount?: number | null;
  bundlePrice?: number | null;
  description?: string | null;
}

export async function POST(request: Request) {
  try {
    const { 
      user_id,
      role, // Rôle avec lequel l'utilisateur effectue l'action
      
      // Informations de base du modèle
      designation,
      brand,
      reference,
      category,
      family,
      subFamily,
      description,
      status,
      specifications, // JSON des specs générales
      
      // Couleurs disponibles
      colors, // Array: [{ colorName, hexaColor, images: [{ url, fileName, displayOrder }] }]
      
      // Variantes de stockage
      variants, // // Array de ProductVariantInput: [{ name, useFCFA, pvTTC, pamp, oldPrice, margin, tva, pvTTC_FCFA, pamp_FCFA, oldPrice_FCFA, marginFCFA, specifications }]
      
      // Produits recommandés (optionnel)
      recommendedProducts // Array: [{ recommendedProductId, priority, relationType, bundleDiscount, bundlePrice, description }]
    } = await request.json();

    // ===========================
    // 1. VÉRIFICATIONS DE BASE
    // ===========================

    if (!user_id) {
      return NextResponse.json({ message: 'Accès refusé1' }, { status: 403 });
    }

    // Vérifier l'utilisateur qui crée le modèle
    const user = await db.user.findUnique({
      where: { id: user_id },
      include: {
        secondaryRoles: true,
        store: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Accès refusé2' }, { status: 403 });
    }

    // Vérifier que l'utilisateur est actif
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

    // ===========================
    // 2. VÉRIFICATION DES RÔLES
    // ===========================

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

    // Vérifier les permissions de création de produits
    const canCreate = hasPermission(role as Role, 'products.create');
    
    if (!canCreate) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à créer des modèles de produits." 
      }, { status: 403 });
    }

    // ===========================
    // 3. VALIDATION DES DONNÉES
    // ===========================

    if (!designation || !brand || !reference || !category) {
      return NextResponse.json({ 
        message: 'Champs obligatoires manquants (designation, brand, reference, category)' 
      }, { status: 400 });
    }

    // Vérifier que la référence n'existe pas déjà
    const existingModel = await db.productModel.findUnique({
      where: { reference }
    });

    if (existingModel) {
      return NextResponse.json({ 
        message: `Un modèle avec la référence ${reference} existe déjà` 
      }, { status: 409 });
    }

    // Vérifier qu'il y a au moins une couleur
    if (!colors || colors.length === 0) {
      return NextResponse.json({ 
        message: 'Au moins une couleur doit être définie' 
      }, { status: 400 });
    }

    // // Vérifier qu'il y a au moins une variante
    // if (!variants || variants.length === 0) {
    //   return NextResponse.json({ 
    //     message: 'Au moins une variante doit être définie' 
    //   }, { status: 400 });
    // }



    // VALIDATION DES VARIANTES
    if (variants && variants.length > 0) {
      console.log('🔍 Validation des variantes...');
      
      for (const variant of variants) {
        console.log('📌 Vérification variante:', {
          storeId: variant.storeId,
          variantAttribute: variant.variantAttribute,
          colorId: variant.colorId
        });

        // Vérifier que le storeId existe
        if (!variant.storeId) {
          return NextResponse.json({ 
            message: 'Chaque variante doit avoir un storeId' 
          }, { status: 400 });
        }

        const storeExists = await db.store.findUnique({
          where: { id: variant.storeId }
        });

        if (!storeExists) {
          console.error('❌ Boutique introuvable:', variant.storeId);
          return NextResponse.json({ 
            message: `La boutique avec l'ID "${variant.storeId}" n'existe pas. Veuillez vérifier les IDs de vos boutiques.` 
          }, { status: 400 });
        }

        console.log('✅ Boutique valide:', storeExists.name);
      }
    }

    // ===========================
    // 4. CRÉATION DU MODÈLE
    // ===========================

    const newModel = await db.productModel.create({
      data: {
        designation,
        brand,
        reference,
        category,
        family: family || null,
        subFamily: subFamily || null,
        description: description || null,
        status: status || 'DRAFT',
        specifications: specifications || null,
        createdById: user.id,

        // Créer les couleurs avec leurs images
        colors: {
          create: colors.map((color: ProductColorInput) => ({
            colorName: color.colorName,
            hexaColor: color.hexaColor,
            images: {
              create: (color.images || []).map((img: ProductImageInput, index: number) => ({
                url: img.url,
                fileName: img.fileName || null,
                displayOrder: img.displayOrder ?? index
              }))
            }
          }))
        },

        // Créer les variantes avec prix
        ...(variants && variants.length > 0 && {
          variants: {
            create: await Promise.all(variants.map(async (variant: ProductVariantInput) => {
              // Générer une référence unique pour la variante
              const variantRef = `${reference}-${variant.storeId}-${variant.variantAttribute || 'NONE'}`;
              
              return {
                storeId: variant.storeId,
                variantAttribute: variant.variantAttribute || null,
                attributeType: variant.attributeType || 'NONE',
                variantReference: variantRef,
                
                // Prix EUR
                useFCFA: variant.useFCFA || false,
                pvTTC: variant.pvTTC || 0,
                pamp: variant.pamp || 0,
                oldPrice: variant.oldPrice || 0,
                tva: variant.tva || 18,
                margin: variant.margin || 0,
                
                // Prix FCFA
                pvTTC_FCFA: variant.pvTTC_FCFA || 0,
                pamp_FCFA: variant.pamp_FCFA || 0,
                oldPrice_FCFA: variant.oldPrice_FCFA || 0,
                marginFCFA: variant.marginFCFA || 0,
                marginPercent: variant.marginPercent || 0,
                
                // Statistiques initiales
                totalStock: 0,
                availableStock: 0,
                reservedStock: 0,
                soldStock: 0
              };
            }))
          }
        }),

        // Créer les produits recommandés (optionnel)
        ...(recommendedProducts && recommendedProducts.length > 0 && {
          recommendedProducts: {
            create: recommendedProducts.map((rec: RecommendedProductInput) => ({
              recommendedProductId: rec.recommendedProductId,
              priority: rec.priority || 5,
              relationType: rec.relationType || 'ACCESSORY',
              bundleDiscount: rec.bundleDiscount || null,
              bundlePrice: rec.bundlePrice || null,
              description: rec.description || null,
              createdById: user.id
            }))
          }
        })
      },
      include: {
        colors: {
          include: {
            images: {
              orderBy: {
                displayOrder: 'asc'
              }
            }
          }
        },
        variants: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
          }
        },
        recommendedProducts: {
          include: {
            recommendedProduct: {
              select: {
                id: true,
                designation: true,
                brand: true,
                reference: true
              }
            }
          }
        }
      }
    });

    // ===========================
    // 5. LOGGER L'ACTIVITÉ
    // ===========================

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'create',
        entityType: 'product_model',
        entityId: newModel.id,
        description: `Création du modèle de produit ${designation} (${reference})`,
        newValues: {
          modelId: newModel.id,
          designation: newModel.designation,
          brand: newModel.brand,
          reference: newModel.reference,
          category: newModel.category,
          colorsCount: newModel.colors.length,
          variantsCount: newModel.variants.length,
          status: newModel.status
        }
      }
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    // ===========================
    // 6. RÉPONSE SUCCESS
    // ===========================

    return NextResponse.json({
      success: true,
      message: `Modèle de produit ${designation} créé avec succès`,
      modelId: newModel.id,
      data: {
        model: newModel,
        summary: {
          colorsCount: newModel.colors.length,
          variantsCount: newModel.variants.length,
          recommendedProductsCount: newModel.recommendedProducts.length,
          totalImagesCount: newModel.colors.reduce((sum, color) => sum + color.images.length, 0)
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du modèle de produit:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur lors de la création du modèle de produit',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');

    // Paramètres de filtrage optionnels
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const storeId = searchParams.get('storeId');

    // ===========================
    // 1. VÉRIFICATIONS DE BASE
    // ===========================

    if (!user_id) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier l'utilisateur
    const user = await db.user.findUnique({
      where: { id: user_id },
      include: {
        secondaryRoles: true,
        store: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que l'utilisateur est actif
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

    // ===========================
    // 2. VÉRIFICATION DES RÔLES
    // ===========================

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

    // Vérifier les permissions de visualisation
    const canViewAll = hasPermission(role as Role, 'products.view_all');
    
    if (!canViewAll) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à consulter les modèles de produits." 
      }, { status: 403 });
    }

    // ===========================
    // 3. CONSTRUCTION DES FILTRES
    // ===========================

    const whereConditions: WhereConditions  = {};

    // Filtre par catégorie
    if (category && category !== 'all') {
      whereConditions.category = category;
    }

    // Filtre par marque
    if (brand && brand !== 'all') {
      whereConditions.brand = brand;
    }

    // Filtre par statut
    if (status && status !== 'all') {
      // Vérifier que le statut est valide avant de l'assigner
      const validStatuses: ProductStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED', 'DESTOCKING_ACTIVE', 'DESTOCKING_END_OF_LIFE', 'INACTIVE'];
      if (validStatuses.includes(status as ProductStatus)) {
        whereConditions.status = status as ProductStatus;
      }
    }

    // Filtre par recherche (nom, marque, référence)
    if (search) {
      whereConditions.OR = [
        { designation: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } }
      ];
    }

    // ===========================
    // 4. RÉCUPÉRATION DES MODÈLES
    // ===========================

    const models = await db.productModel.findMany({
      where: whereConditions,
      include: {
        colors: {
          include: {
            images: {
              orderBy: {
                displayOrder: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        // ✅ NOUVEAU : Inclure les variantes
        variants: {
            where: storeId ? { storeId } : undefined, // Filtrer par boutique si fourni
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
              { store: { name: 'asc' } },
              { variantAttribute: 'asc' }
            ]
          }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // ===========================
    // 5. STATISTIQUES
    // ===========================

    const statistics = {
      totalModels: models.length,
      byCategory: await db.productModel.groupBy({
        by: ['category'],
        _count: true,
        where: whereConditions
      }),
      byBrand: await db.productModel.groupBy({
        by: ['brand'],
        _count: true,
        where: whereConditions
      }),
      byStatus: await db.productModel.groupBy({
        by: ['status'],
        _count: true,
        where: whereConditions
      }),
      //Statistiques sur les variantes
      totalVariants: await db.productVariant.count({
        where: storeId ? { storeId } : undefined
      }),
      totalStock: await db.productVariant.aggregate({
        where: storeId ? { storeId } : undefined,
        _sum: {
          availableStock: true,
          reservedStock: true,
          soldStock: true
        }
      })
    };

    // ===========================
    // 6. LOGGER L'ACTIVITÉ
    // ===========================

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'view',
        entityType: 'product_model',
        entityId: null,
        description: `Consultation de la liste des modèles de produits (${models.length} résultats)`,
      }
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    // ===========================
    // 7. RÉPONSE SUCCESS
    // ===========================

    return NextResponse.json({
      success: true,
      models,
      statistics,
      filters: {
        category: category || 'all',
        brand: brand || 'all',
        status: status || 'all',
        storeId: storeId || 'all',
        search: search || ''
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des modèles:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur lors de la récupération des modèles',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}