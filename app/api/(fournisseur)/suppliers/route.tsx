import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { 
      user_id,
      role, // Rôle avec lequel l'utilisateur effectue l'action
      
      // Informations du fournisseur
      name,
      contactName,
      phone,
      email,
      address,
      country
    } = await request.json();

    // ===========================
    // 1. VÉRIFICATIONS DE BASE
    // ===========================

    if (!user_id) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier l'utilisateur qui crée le fournisseur
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

    // Vérifier les permissions
    const canCreate = hasPermission(role as Role, 'suppliers.create');
    
    if (!canCreate) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à créer des fournisseurs." 
      }, { status: 403 });
    }

    // ===========================
    // 3. VALIDATION DES DONNÉES
    // ===========================

    if (!name || !contactName) {
      return NextResponse.json({ 
        message: 'Champs obligatoires manquants (name, contactName)' 
      }, { status: 400 });
    }

    // Normaliser le nom du fournisseur (trim et capitalisation)
    const normalizedName = name.trim();

    // Vérifier que le nom n'existe pas déjà (insensible à la casse)
    const existingSupplier = await db.supplier.findFirst({
      where: { 
        name: {
          equals: normalizedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingSupplier) {
      return NextResponse.json({ 
        message: `Un fournisseur avec le nom "${normalizedName}" existe déjà` 
      }, { status: 409 });
    }

    // Validation de l'email si fourni
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          message: 'Format d\'email invalide' 
        }, { status: 400 });
      }

      // Vérifier que l'email n'est pas déjà utilisé
      const existingEmail = await db.supplier.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive'
          }
        }
      });

      if (existingEmail) {
        return NextResponse.json({ 
          message: `L'email ${email} est déjà utilisé par un autre fournisseur` 
        }, { status: 409 });
      }
    }

    // Validation du téléphone si fourni
    if (phone) {
      // Format basique: au moins 8 chiffres
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        return NextResponse.json({ 
          message: 'Format de téléphone invalide (minimum 8 chiffres)' 
        }, { status: 400 });
      }
    }

    // ===========================
    // 4. CRÉATION DU FOURNISSEUR
    // ===========================

    const newSupplier = await db.supplier.create({
      data: {
        name: normalizedName,
        contactName: contactName.trim(),
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        address: address?.trim() || null,
        country: country?.trim() || null
      }
    });

    // ===========================
    // 5. LOGGER L'ACTIVITÉ
    // ===========================

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'create',
        entityType: 'supplier',
        entityId: newSupplier.id,
        description: `Création du fournisseur ${normalizedName} (Contact: ${contactName})`,
        newValues: {
          id: newSupplier.id,
          name: newSupplier.name,
          contactName: newSupplier.contactName,
          phone: newSupplier.phone,
          email: newSupplier.email,
          country: newSupplier.country
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
      message: `Fournisseur ${normalizedName} créé avec succès`,
      supplierId: newSupplier.id,
      data: {
        supplier: newSupplier
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du fournisseur:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur lors de la création du fournisseur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');

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

    if (!role) {
      return NextResponse.json({ 
        message: 'Le rôle est requis' 
      }, { status: 400 });
    }

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

    // Vérifier les permissions
    const canRead = hasPermission(role as Role, 'suppliers.view_all');
    
    if (!canRead) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à consulter les fournisseurs." 
      }, { status: 403 });
    }

    // ===========================
    // 3. RÉCUPÉRATION DES FOURNISSEURS
    // ===========================

    const suppliers = await db.supplier.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        email: true,
        address: true,
        country: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // ===========================
    // 4. LOGGER L'ACTIVITÉ
    // ===========================

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'read',
        entityType: 'supplier',
        description: `Consultation de la liste des fournisseurs (${suppliers.length} résultats)`
      }
    });

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user_id },
      data: { lastLogin: new Date() }
    });

    // ===========================
    // 5. RÉPONSE SUCCESS
    // ===========================

    return NextResponse.json({
      success: true,
      message: `${suppliers.length} fournisseur(s) trouvé(s)`,
      suppliers: suppliers,
      count: suppliers.length
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur lors de la récupération des fournisseurs',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}