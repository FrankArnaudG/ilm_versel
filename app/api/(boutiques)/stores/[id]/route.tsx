// ============================================
// GET /api/stores/[id] - Détails d'une boutique
// ============================================

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { Role, StoreStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');

    // Validation des paramètres
    if (!user_id || !role) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ 
        message: 'Cette boutique n\'existe pas' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 404 });
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
        message: "Accès refusé" 
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

    // Vérifier les permissions
    const canViewAll = hasPermission(role as Role, 'stores.view_all');
    const canViewOwn = hasPermission(role as Role, 'stores.view_own');

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à voir les détails des boutiques." 
      }, { status: 403 });
    }

    // Récupérer la boutique avec toutes les informations détaillées
    const store = await db.store.findUnique({
      where: { id: storeId },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
            status: true,
            lastLogin: true
          }
        },
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
            status: true,
            lastLogin: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            employees: true,
            // products: true,
            // stockMovements: true,
            // orders: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        message: 'Boutique introuvable' 
      }, { status: 404 });
    }

    // Vérifier les permissions spécifiques selon le rôle
    if (canViewOwn && !canViewAll) {
      // L'utilisateur peut voir seulement sa propre boutique
      if (user.storeId !== storeId) {
        return NextResponse.json({ 
          message: "Vous n'êtes pas autorisé à voir cette boutique." 
        }, { status: 403 });
      }
    }

    // Préparer les statistiques additionnelles
    const statistics = {
      totalEmployees: store._count.employees,
      activeEmployees: store.employees.filter(e => e.status === 'ACTIVE').length,
      // totalProducts: store._count.products,
      // totalOrders: store._count.orders,
      // totalStockMovements: store._count.stockMovements
    };

    // Logger l'activité de consultation
    await db.activityLog.create({
      data: {
        userId: user_id,
        action: 'view',
        entityType: 'store',
        entityId: storeId,
        description: `Consultation des détails de la boutique ${store.name} (${store.code})`
      }
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    return NextResponse.json({ 
      store,
      statistics,
      accessLevel: canViewAll ? 'all' : 'own'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching store details:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des détails de la boutique' },
      { status: 500 }
    );
  }
}


// ============================================
// PUT /api/stores/[id] - Modifier une boutique
// ============================================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    
    // Récupérer les données du body
    const body = await request.json();
    const {
      user_id,
      role,
      store_name,
      store_code,
      store_country,
      store_city,
      store_department,
      store_address,
      store_phone,
      store_email,
      store_currency,
      store_timezone,
      store_status,
      store_openingDate,
      store_managerEmail,
      store_company
    } = body;

    // Validation des paramètres
    if (!user_id || !role) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ 
        message: 'ID de boutique manquant' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 404 });
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

    // Vérifier les permissions de modification
    const canEdit = hasPermission(role as Role, 'stores.update');
    
    if (!canEdit) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à memer cette action." 
      }, { status: 403 });
    }

    // Vérifier que la boutique existe
    const existingStore = await db.store.findUnique({
      where: { id: storeId },
      include: {
        manager: true
      }
    });

    if (!existingStore) {
      return NextResponse.json({ 
        message: 'Boutique introuvable' 
      }, { status: 404 });
    }

    // Contrôle d'accès spécifique selon le rôle
    const canEditAll = hasPermission(role as Role, 'stores.update_all');
    const canEditOwn = hasPermission(role as Role, 'stores.update_own');

    if (canEditOwn && !canEditAll) {
      // L'utilisateur peut modifier seulement sa propre boutique
      if (user.storeId !== storeId) {
        return NextResponse.json({ 
          message: "Vous ne pouvez modifier que votre propre boutique." 
        }, { status: 403 });
      }
    }

    // Vérifier que le code boutique n'est pas déjà utilisé (si modifié)
    if (store_code && store_code !== existingStore.code) {
      const codeExists = await db.store.findUnique({
        where: { code: store_code }
      });

      if (codeExists) {
        return NextResponse.json({ 
          message: `Une boutique avec le code ${store_code} existe déjà` 
        }, { status: 409 });
      }
    }

    // Gérer le changement de manager
    let newManagerId = existingStore.managerId;
    
    if (store_managerEmail && store_managerEmail !== existingStore.manager?.email) {
      const newManager = await db.user.findUnique({
        where: { email: store_managerEmail }
      });

      if (!newManager) {
        return NextResponse.json({ 
          message: 'Le manager spécifié est introuvable' 
        }, { status: 404 });
      }

      // Vérifier que c'est bien un manager
      if (newManager.role !== 'STORE_MANAGER') {
        return NextResponse.json({ 
          message: "L'utilisateur spécifié n'a pas le rôle de Manager" 
        }, { status: 403 });
      }

      // Vérifier que le nouveau manager n'est pas déjà assigné à une autre boutique
      const managerStore = await db.store.findUnique({
        where: { managerId: newManager.id }
      });

      if (managerStore && managerStore.id !== storeId) {
        return NextResponse.json({ 
          message: `Ce manager est déjà assigné à la boutique "${managerStore.name}"` 
        }, { status: 409 });
      }

      newManagerId = newManager.id;

      // Dissocier l'ancien manager (si existant)
      if (existingStore.managerId) {
        await db.user.update({
          where: { id: existingStore.managerId },
          data: { storeId: null }
        });
      }
    }

    // Sauvegarder les anciennes valeurs pour le log
    const oldValues = {
      name: existingStore.name,
      code: existingStore.code,
      city: existingStore.city,
      country: existingStore.country,
      status: existingStore.status,
      managerId: existingStore.managerId
    };

    // Mettre à jour la boutique
    const updatedStore = await db.store.update({
      where: { id: storeId },
      data: {
        name: store_name || existingStore.name,
        code: store_code || existingStore.code,
        country: store_country || existingStore.country,
        city: store_city || existingStore.city,
        department: store_department || existingStore.department,
        address: store_address || existingStore.address,
        phone: store_phone !== undefined ? store_phone : existingStore.phone,
        email: store_email !== undefined ? store_email : existingStore.email,
        currency: store_currency || existingStore.currency,
        timezone: store_timezone || existingStore.timezone,
        status: (store_status as StoreStatus) || existingStore.status,
        openingDate: store_openingDate ? new Date(store_openingDate) : existingStore.openingDate,
        company: store_company !== undefined ? store_company : existingStore.company,
        managerId: newManagerId
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

    // Associer le nouveau manager à la boutique
    if (newManagerId && newManagerId !== existingStore.managerId) {
      await db.user.update({
        where: { id: newManagerId },
        data: { storeId: updatedStore.id }
      });
    }

    // Sauvegarder les nouvelles valeurs
    const newValues = {
      name: updatedStore.name,
      code: updatedStore.code,
      city: updatedStore.city,
      country: updatedStore.country,
      status: updatedStore.status,
      managerId: updatedStore.managerId
    };

    // Logger l'activité
    await db.activityLog.create({
      data: {
        userId: user_id,
        action: 'update',
        entityType: 'store',
        entityId: storeId,
        description: `Modification de la boutique ${updatedStore.name} (${updatedStore.code})`,
        oldValues: oldValues,
        newValues: newValues
      }
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    return NextResponse.json({ 
      success: true,
      message: `Boutique ${updatedStore.name} modifiée avec succès`,
      store: updatedStore
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating store:', error);

    return NextResponse.json(
      { message: 'Erreur lors de la modification de la boutique' },
      { status: 500 }
    );
  }
}




// ============================================
// DELETE /api/stores/[id] - Supprimer une boutique
// IMPORTANT: Seul le rôle PRINCIPAL peut supprimer
// ============================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    
    // Récupérer les données du body
    const { user_id, role } = await request.json();

    // Validation des paramètres
    if (!user_id || !role) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ 
        message: 'ID de boutique manquant' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 404 });
    }

    // Vérifier que l'utilisateur est actif
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

    // ⚠️ RESTRICTION IMPORTANTE: Seul le rôle PRINCIPAL peut supprimer
    if (role !== user.role) {
      return NextResponse.json({ 
        message: 'La suppression nécessite votre rôle principal. Les rôles secondaires ne peuvent pas effectuer cette action.' 
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

    // Vérifier les permissions de suppression avec le rôle principal
    const canDelete = hasPermission(user.role, 'stores.delete');
    
    if (!canDelete) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à supprimer des boutiques." 
      }, { status: 403 });
    }

    // Vérifier que la boutique existe
    const existingStore = await db.store.findUnique({
      where: { id: storeId },
      include: {
        manager: true,
        employees: true,
        _count: {
          select: {
            employees: true,
            // products: true,
            // orders: true,
            // stockMovements: true
          }
        }
      }
    });

    if (!existingStore) {
      return NextResponse.json({ 
        message: 'Boutique introuvable' 
      }, { status: 404 });
    }

    // Vérifications de sécurité avant suppression
    
    // 1. Vérifier s'il y a des employés actifs
    const activeEmployees = existingStore.employees.filter(e => e.status === 'ACTIVE');
    if (activeEmployees.length > 0) {
      return NextResponse.json({ 
        message: `Impossible de supprimer cette boutique. Elle a ${activeEmployees.length} employé(s) actif(s). Veuillez d'abord réassigner ou désactiver les employés.` 
      }, { status: 400 });
    }

    // 2. Vérifier s'il y a des produits en stock
    // if (existingStore._count.products > 0) {
    //   return NextResponse.json({ 
    //     message: `Impossible de supprimer cette boutique. Elle contient ${existingStore._count.products} produit(s) en stock.` 
    //   }, { status: 400 });
    // }

    // 3. Vérifier s'il y a des commandes en cours
    // if (existingStore._count.orders > 0) {
    //   return NextResponse.json({ 
    //     message: `Impossible de supprimer cette boutique. Elle a ${existingStore._count.orders} commande(s) associée(s).` 
    //   }, { status: 400 });
    // }

    // Sauvegarder les informations pour le log avant suppression
    const storeInfo = {
      id: existingStore.id,
      code: existingStore.code,
      name: existingStore.name,
      city: existingStore.city,
      country: existingStore.country,
      managerId: existingStore.managerId,
      employeesCount: existingStore._count.employees
    };

    // Dissocier le manager de la boutique
    if (existingStore.managerId) {
      await db.user.update({
        where: { id: existingStore.managerId },
        data: { storeId: null }
      });
    }

    // Dissocier tous les employés de la boutique
    await db.user.updateMany({
      where: { storeId: storeId },
      data: { storeId: null }
    });

    // Supprimer la boutique
    await db.store.delete({
      where: { id: storeId }
    });

    // Logger l'activité de suppression
    await db.activityLog.create({
      data: {
        userId: user_id,
        action: 'delete',
        entityType: 'store',
        entityId: storeId,
        description: `Suppression de la boutique ${storeInfo.name} (${storeInfo.code}) - ${storeInfo.city}, ${storeInfo.country}`,
        oldValues: storeInfo,
        newValues: ''
      }
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    return NextResponse.json({ 
      success: true,
      message: `La boutique "${storeInfo.name}" a été supprimée avec succès`
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting store:', error);

    return NextResponse.json(
      { message: 'Erreur lors de la suppression de la boutique' },
      { status: 500 }
    );
  }
}
