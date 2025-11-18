// ============================================
// app/api/(user_view)/newsletter/subscribe/route.ts
// POST - Souscrire à la newsletter
// ============================================

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // ============================================
    // VALIDATION
    // ============================================
    if (!email) {
      return NextResponse.json(
        { message: "L'adresse email est requise" },
        { status: 400 }
      );
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // ============================================
    // VÉRIFICATION SI L'EMAIL EXISTE DÉJÀ
    // ============================================
    const existingSubscriber = await db.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { message: "Cet email est déjà inscrit à la newsletter" },
        { status: 409 }
      );
    }

    // ============================================
    // CRÉATION DU SOUSCRIPTEUR
    // ============================================
    const subscriber = await db.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase().trim(),
      },
    });

    return NextResponse.json(
      {
        message: "Inscription à la newsletter réussie",
        subscriber: {
          id: subscriber.id,
          email: subscriber.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription à la newsletter:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de l'inscription",
        error: "Une erreur est survenue lors de l'inscription",
      },
      { status: 500 }
    );
  }
}

