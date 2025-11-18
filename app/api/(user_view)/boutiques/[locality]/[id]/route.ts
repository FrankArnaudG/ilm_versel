// ============================================
// app/api/(user_view)/boutiques/[locality]/[id]/route.ts
// PUT - Modifier une boutique physique (SUPER_ADMIN uniquement)
// DELETE - Supprimer une boutique physique (SUPER_ADMIN uniquement)
// ============================================

import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface UpdateOfflineStoreData {
  nom?: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  telephone?: string | null;
  google_map_link?: string | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string; id: string }> }
) {
  try {
    const { locality, id } = await params;
    const body = await request.json();
    const { 
      user_id,
      role,
      nom,
      adresse,
      latitude,
      longitude,
      telephone,
      google_map_link
    } = body;

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!locality || !id) {
      return NextResponse.json({ 
        message: 'Localité et ID requis' 
      }, { status: 400 });
    }

    const validLocalities = ['Martinique', 'Guadeloupe', 'Guyane'];
    if (!validLocalities.includes(locality)) {
      return NextResponse.json({ 
        message: 'Localité non reconnue' 
      }, { status: 400 });
    }

    if (!user_id || !role) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 403 });
    }

    // ============================================
    // VÉRIFICATION DE L'UTILISATEUR
    // ============================================
    const user = await db.user.findUnique({
      where: { id: user_id },
      include: {
        secondaryRoles: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 403 });
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

    // ============================================
    // VÉRIFICATION DES PERMISSIONS (SUPER_ADMIN uniquement)
    // ============================================
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à modifier une boutique physique. Seul un SUPER_ADMIN peut effectuer cette action." 
      }, { status: 403 });
    }

    // ============================================
    // VÉRIFICATION DE L'EXISTENCE DE LA BOUTIQUE
    // ============================================
    const boutiqueExistante = await db.offlineStoreLocation.findUnique({
      where: { id }
    });

    if (!boutiqueExistante) {
      return NextResponse.json({ 
        message: 'Boutique non trouvée' 
      }, { status: 404 });
    }

    // Vérifier que la boutique appartient au bon département
    if (boutiqueExistante.departement !== locality) {
      return NextResponse.json({ 
        message: 'La boutique n\'appartient pas à ce département' 
      }, { status: 400 });
    }

    // ============================================
    // VALIDATION DES DONNÉES
    // ============================================
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ 
          message: 'Les coordonnées doivent être des nombres valides' 
        }, { status: 400 });
      }

      if (lat < -90 || lat > 90) {
        return NextResponse.json({ 
          message: 'La latitude doit être entre -90 et 90' 
        }, { status: 400 });
      }

      if (lng < -180 || lng > 180) {
        return NextResponse.json({ 
          message: 'La longitude doit être entre -180 et 180' 
        }, { status: 400 });
      }
    }

    // ============================================
    // MISE À JOUR DE LA BOUTIQUE
    // ============================================
    const dataToUpdate: UpdateOfflineStoreData  = {};
    
    if (nom !== undefined) dataToUpdate.nom = nom;
    if (adresse !== undefined) dataToUpdate.adresse = adresse;
    if (latitude !== undefined) dataToUpdate.latitude = parseFloat(latitude);
    if (longitude !== undefined) dataToUpdate.longitude = parseFloat(longitude);
    if (telephone !== undefined) dataToUpdate.telephone = telephone || null;
    if (google_map_link !== undefined) dataToUpdate.google_map_link = google_map_link || null;

    const boutiqueModifiee = await db.offlineStoreLocation.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({
      success: true,
      message: 'Boutique modifiée avec succès',
      data: boutiqueModifiee
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la modification de la boutique:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors de la modification de la boutique',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string; id: string }> }
) {
  try {
    const { locality, id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!locality || !id) {
      return NextResponse.json({ 
        message: 'Localité et ID requis' 
      }, { status: 400 });
    }

    const validLocalities = ['Martinique', 'Guadeloupe', 'Guyane'];
    if (!validLocalities.includes(locality)) {
      return NextResponse.json({ 
        message: 'Localité non reconnue' 
      }, { status: 400 });
    }

    if (!user_id || !role) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 403 });
    }

    // ============================================
    // VÉRIFICATION DE L'UTILISATEUR
    // ============================================
    const user = await db.user.findUnique({
      where: { id: user_id },
      include: {
        secondaryRoles: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 403 });
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

    // ============================================
    // VÉRIFICATION DES PERMISSIONS (SUPER_ADMIN uniquement)
    // ============================================
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à supprimer une boutique physique. Seul un SUPER_ADMIN peut effectuer cette action." 
      }, { status: 403 });
    }

    // ============================================
    // VÉRIFICATION DE L'EXISTENCE DE LA BOUTIQUE
    // ============================================
    const boutiqueExistante = await db.offlineStoreLocation.findUnique({
      where: { id }
    });

    if (!boutiqueExistante) {
      return NextResponse.json({ 
        message: 'Boutique non trouvée' 
      }, { status: 404 });
    }

    // Vérifier que la boutique appartient au bon département
    if (boutiqueExistante.departement !== locality) {
      return NextResponse.json({ 
        message: 'La boutique n\'appartient pas à ce département' 
      }, { status: 400 });
    }

    // ============================================
    // SUPPRESSION DE LA BOUTIQUE
    // ============================================
    await db.offlineStoreLocation.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Boutique supprimée avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la suppression de la boutique:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors de la suppression de la boutique',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

