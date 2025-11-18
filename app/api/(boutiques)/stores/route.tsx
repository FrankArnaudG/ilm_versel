// ============================================
// POST /api/stores - Créer une boutique
// ============================================

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const { user_id,
      role, // Rôle avec lequel l'utilisateur effectue l'action
      store_name, store_code, store_country, store_city, store_department, store_address, store_phone, store_email, store_currency, store_timezone, store_status, store_openingDate, store_managerEmail, store_company } = await request.json();

    if (!user_id) {
        return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier l'utilisateur(celui qui creer la boutique)
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

    if (!store_code || !store_name || !store_country || !store_city || !store_address) {
      return NextResponse.json({ 
        message: 'Champs obligatoires manquants (code, name, country, city, address)' 
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

    // Vérifier les permissions de création
    const canCreate = hasPermission(role as Role, 'stores.create');
    
    if (!canCreate) {
      return NextResponse.json({ 
        message: "Vous n’êtes pas autorisé à mener ce type d’action." 
      }, { status: 403 });
    }

    // Vérifier que le code boutique n'existe pas déjà
    const existingStore = await db.store.findUnique({
      where: { code: store_code }
    });

    if (existingStore) {
      return NextResponse.json({ 
        message: `Une boutique avec le code ${store_code} existe déjà` 
      }, { status: 409 });
    }

    // // Vérifier les permissions (Seul SUPER_ADMIN peut créer des boutiques)
    // if (!hasPermission(user.role, 'stores.create')) {
    //   return NextResponse.json({ message: 'Vous n’êtes pas autorisé à mener ce type d’action.' }, { status: 403 });
    // }

    // Récupérer les informations du manager de la boutique en creation
    const is_store_manager = await db.user.findUnique({
        where: {
          email: store_managerEmail
        }
    });

    // Le manager existe til?
    if (!is_store_manager) {
        return NextResponse.json(
            { message: 'Le manager spécifié n\'existe pas' },
            { status: 403 }
        );
    }

    // 
    if (is_store_manager.role !== 'STORE_MANAGER') {
        return NextResponse.json(
            { message: 'L\'utilisateur spécifié n\'a pas le rôle de Manager' },
            { status: 403 }
        );
    }

    // Vérifier si ce manager gère déjà une boutique
    const managerStore = await db.store.findUnique({
      where: {
        managerId: is_store_manager.id
      }
    });

    if (managerStore) {
      return NextResponse.json(
        { 
          message: `Ce manager est déjà assigné à la boutique "${managerStore.name}".` 
        },
        { status: 400 }
      );
    }


    // Créer la boutique
    const newStore = await db.store.create({
      data: {
        code: store_code,
        name: store_name,
        country: store_country,
        city: store_city,
        department: store_department,
        address: store_address,
        phone: store_phone,
        email: store_email,
        currency: store_currency,
        timezone: store_timezone,
        status: store_status,
        company: store_company,
        openingDate: store_openingDate ? new Date(store_openingDate) : null,
        managerId: is_store_manager.id,
        createdById: user.id,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Si un manager est assigné, mettre à jour son storeId
    if (is_store_manager) {
      await db.user.update({
        where: { 
          id: is_store_manager.id
        },
        data: {
          storeId: newStore.id
        },
      });
    }

    // Logger l'activité
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'create',
        entityType: 'store',
        entityId: newStore.id,
        description: `Création de la boutique ${store_name} (${newStore.code})`,
        newValues: newStore,
      },
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    // TODO: Envoyer notification au manager (si assigné)
    // TODO: Envoyer email de bienvenue au manager

    return NextResponse.json({
      success: true,
      message: `Boutique ${store_name} créée avec succès`,
      storeId: newStore.id
    });

  } catch (error) {
    console.error('Erreur lors de la création de la boutique:', error);
    
    return NextResponse.json(
      { message: 'Erreur interne du serveur: survenu lors de la création de la boutique' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/stores - Liste des boutiques
// ============================================
export async function GET(request: Request) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const userRole_or_userSecondaryRole = searchParams.get('role'); // Peut être le rôle principal ou secondaire
    // const { user_id } = await request.json();

    if (!user_id || !userRole_or_userSecondaryRole) {
        return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier l'utilisateur(celui qui veux voir la liste des boutiques)
    const user = await db.user.findUnique({
        where: {
            id: user_id
        },
        include: {
          store: true, // Inclure les infos de la boutique si l'utilisateur en gère une
          secondaryRoles: true // Inclure les rôles secondaires
        }
    });

    if (!user) {
        return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier si le statut de l'utilisateur est actif
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

     // Vérifier que le rôle fourni appartient bien à l'utilisateur
    const userRoles = [user.role, ...user.secondaryRoles.map(sr => sr.role)];
    const isRoleValid = userRoles.includes(userRole_or_userSecondaryRole as Role);

    if (!isRoleValid) {
      return NextResponse.json({ 
        message: "Accès refusé" 
      }, { status: 403 });
    }

    // Vérifier si le rôle secondaire n'est pas expiré (si c'est un rôle secondaire)
    if (userRole_or_userSecondaryRole !== user.role) {
      const secondaryRole = user.secondaryRoles.find(sr => sr.role === userRole_or_userSecondaryRole);
      if (secondaryRole?.expiresAt && new Date(secondaryRole.expiresAt) < new Date()) {
        return NextResponse.json({ 
          message: 'Ce rôle secondaire a expiré' 
        }, { status: 403 });
      }
    }

    // Vérifier les permissions avec le rôle spécifié
    const canViewAll = hasPermission(userRole_or_userSecondaryRole as Role, 'stores.view_all');
    const canViewOwn = hasPermission(userRole_or_userSecondaryRole as Role, 'stores.view_own');

    // Si aucune permission
    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ message: "Vous n'êtes pas autorisé à voir cette page." }, { status: 403 });
    }


    // Si peut voir toutes les boutiques
    if (canViewAll) {
      const canViewAllStores = await db.store.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          _count: {
            select: {
              employees: true
            }
          }
        }
      });

      if (!canViewAllStores) {
        return NextResponse.json({ 
          message: "Boutique introuvable." 
        }, { status: 404 });
      }
      // Mettre à jour la date de dernière connexion
      await db.user.update({
        where: { id: user_id },
        data: { lastLogin: new Date() }
      });

      return NextResponse.json({ stores: canViewAllStores, count: canViewAllStores.length, accessLevel: 'all' }, { status: 200 });
    }

    // Si peut voir uniquement sa boutique
    if (canViewOwn) {
      if (!user.storeId) {
        return NextResponse.json({ 
          message: "Vous n'êtes associé à aucune boutique." 
        }, { status: 400 });
      }

      const canViewOwnStore = await db.store.findUnique({
        where: {
          id: user.storeId
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          _count: {
            select: {
              employees: true
            }
          }
        }
      });

      if (!canViewOwnStore) {
        return NextResponse.json({ 
          message: "Boutique introuvable." 
        }, { status: 404 });
      }

      // Mettre à jour la date de dernière connexion
      await db.user.update({
        where: { id: user_id },
        data: { lastLogin: new Date() }
      });

      return NextResponse.json({ canViewOwnStore }, { status: 200 });
    }

    // Cas par défaut (ne devrait jamais arriver)
    return NextResponse.json({ 
      message: "Votre permissions rencontre un soucis." 
    }, { status: 403 });

    
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des boutiques' },
      { status: 500 }
    );
  }
}
