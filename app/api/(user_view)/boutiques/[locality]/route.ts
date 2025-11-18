// ============================================
// app/api/(user_view)/boutiques/[locality]/route.ts
// GET - Liste des boutiques physiques par département
// POST - Créer une nouvelle boutique physique (SUPER_ADMIN uniquement)
// ============================================

import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string }> }
) {
  try {
    const { locality } = await params;

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!locality) {
      return NextResponse.json({ 
        message: 'Localité requise' 
      }, { status: 400 });
    }

    // Valider que la localité est valide
    const validLocalities = ['Martinique', 'Guadeloupe', 'Guyane'];
    if (!validLocalities.includes(locality)) {
      return NextResponse.json({ 
        message: 'Localité non reconnue' 
      }, { status: 400 });
    }

    // ============================================
    // RÉCUPÉRATION DES BOUTIQUES
    // ============================================
    const boutiques = await db.offlineStoreLocation.findMany({
      where: {
        departement: locality
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: boutiques
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des boutiques:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors de la récupération des boutiques',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string }> }
) {
  try {
    const { locality } = await params;
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
    if (!locality) {
      return NextResponse.json({ 
        message: 'Localité requise' 
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
        message: "Vous n'êtes pas autorisé à créer une boutique physique. Seul un SUPER_ADMIN peut effectuer cette action." 
      }, { status: 403 });
    }

    // ============================================
    // VALIDATION DES DONNÉES
    // ============================================
    if (!nom || !adresse || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        message: 'Champs obligatoires manquants (nom, adresse, latitude, longitude)' 
      }, { status: 400 });
    }

    // Valider les coordonnées
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

    // ============================================
    // CRÉATION DE LA BOUTIQUE
    // ============================================
    const nouvelleBoutique = await db.offlineStoreLocation.create({
      data: {
        nom,
        departement: locality,
        adresse,
        latitude: lat,
        longitude: lng,
        telephone: telephone || null,
        google_map_link: google_map_link || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Boutique créée avec succès',
      data: nouvelleBoutique
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la boutique:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors de la création de la boutique',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

