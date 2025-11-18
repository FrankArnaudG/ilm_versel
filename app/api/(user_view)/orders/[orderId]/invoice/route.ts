// app/api/orders/[orderId]/invoice/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

/**
 * Route sécurisée pour télécharger la facture PDF d'une commande
 * Accessible uniquement par le propriétaire de la commande
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const userSession = await currentUser();
    
    if (!userSession?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // ----------------------------------------
    // 1. GÉNÉRER LA FACTURE VIA L'API INTERNE
    // ----------------------------------------
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const generateResponse = await fetch(
      `${baseUrl}/api/orders/${orderId}/generate-invoice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Passer le cookie de session pour l'authentification
          'Cookie': req.headers.get('cookie') || ''
        }
      }
    );

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json();
      throw new Error(errorData.error || 'Erreur lors de la génération de la facture');
    }

    const { success, pdfBase64, filename } = await generateResponse.json();

    if (!success || !pdfBase64) {
      throw new Error('Facture non générée');
    }

    // ----------------------------------------
    // 2. CONVERTIR BASE64 EN BUFFER ET RETOURNER
    // ----------------------------------------
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache 1h
      }
    });

  } catch (error) {
    console.error('❌ Erreur téléchargement facture:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du téléchargement de la facture',
      },
      { status: 500 }
    );
  }
}