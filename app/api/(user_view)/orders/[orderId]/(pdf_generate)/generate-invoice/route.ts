// app/api/orders/[orderId]/generate-invoice/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { DocumentProps, renderToBuffer } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { InvoicePDFDocument } from '@/lib/pdf/InvoiceTemplate';
import path from 'path';
import fs from 'fs';
import { JSXElementConstructor, ReactElement } from 'react';

/**
 * Génère une facture PDF pour une commande
 * Retourne le PDF en base64
 */
export async function POST(
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
    // 1. RÉCUPÉRER LA COMMANDE COMPLÈTE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            article: {
              include: {
                model: true,
                color: true,
                variant: true
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
        store: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la commande appartient à l'utilisateur
    if (order.userId !== userSession.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // 2. GÉNÉRER LE NUMÉRO DE FACTURE
    // ----------------------------------------
    const invoiceNumber = generateInvoiceNumber(order.orderNumber);
    const invoiceDate = new Date().toISOString();

    // ----------------------------------------
    // 3. CALCULER LES MONTANTS HT ET TVA
    // ----------------------------------------
    const taxRate = getTaxRate(order.locality);
    
    // Convertir TTC en HT
    const subtotalHT = order.subtotal.toNumber() / (1 + taxRate);
    const shippingCostHT = order.shippingCost.toNumber() / (1 + taxRate);
    const totalHT = subtotalHT + shippingCostHT;
    const totalVAT = order.taxAmount.toNumber();
    const totalTTC = order.totalAmount.toNumber();

    // Calculer les détails de TVA par taux
    const vatDetails = [{
      rate: Number((taxRate * 100).toFixed(1)),
      baseHT: totalHT,
      vatAmount: totalVAT
    }];

    // ----------------------------------------
    // 4. PRÉPARER LES DONNÉES POUR LE PDF
    // ----------------------------------------
    
    // Chemin absolu vers le logo
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo_ilm.png');
    let logoDataUrl = '';
    
    // Convertir le logo en data URL pour l'inclure dans le PDF
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString('base64');
        logoDataUrl = `data:image/png;base64,${logoBase64}`;
      }
    } catch {
      console.warn('⚠️ Logo non trouvé, facture sans logo');
    }

    // Obtenir les informations d'entreprise selon la localité
    const companyInfo = getCompanyInfo(order.locality);

    const invoiceData = {
      invoiceNumber,
      invoiceDate,
      orderNumber: order.orderNumber,
      
      company: {
        name: "I Love Mobile",
        legalName: companyInfo.legalName,
        siren: companyInfo.siren,
        vatNumber: companyInfo.vatNumber,
        address: companyInfo.address,
        logoUrl: logoDataUrl || undefined
      },
      
      customer: {
        fullName: order.shippingAddress.fullName,
        email: order.user.email || '',
        phone: order.shippingAddress.phone,
        address: {
          line1: order.shippingAddress.addressLine1,
          line2: order.shippingAddress.addressLine2 || undefined,
          postalCode: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
          country: order.shippingAddress.country
        }
      },
      
      items: order.items.map((item, index) => {
        const itemTotalTTC = item.totalPrice.toNumber();
        const itemTotalHT = itemTotalTTC / (1 + taxRate);
        const itemUnitPriceHT = itemTotalHT / item.quantity;
        
        return {
          itemNumber: `00${(index + 1) * 10}`.padStart(6, '0'),
          reference: item.article?.articleNumber || '',
          description: item.productName,
          brand: item.brand,
          storage: item.storage || '',
          colorName: item.colorName,
          quantity: item.quantity,
          unitPriceHT: itemUnitPriceHT,
          totalHT: itemTotalHT,
          vatRate: Number((taxRate * 100).toFixed(1)),
        };
      }),
      
      totals: {
        subtotalHT,
        shippingCostHT,
        totalHT,
        totalVAT,
        totalTTC,
        vatDetails
      },
      
      locality: order.locality,
      customerReference: order.user.clientId || undefined
    };

    // ----------------------------------------
    // 5. GÉNÉRER LE PDF
    // ----------------------------------------
    console.log('📄 Génération du PDF de facture...');
    
    type PDFElement = ReactElement<DocumentProps, string | JSXElementConstructor<DocumentProps>>;
    
    const pdfBuffer = await renderToBuffer(
      InvoicePDFDocument({ data: invoiceData }) as PDFElement
    );
    
    console.log('✅ PDF généré avec succès');

    // ----------------------------------------
    // 6. RETOURNER LE PDF EN BASE64
    // ----------------------------------------
    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      invoiceNumber,
      pdfBase64,
      filename: `Facture_${invoiceNumber}.pdf`,
      size: pdfBuffer.length
    });

  } catch (error) {
    console.error('❌ Erreur génération facture PDF:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération de la facture',
      },
      { status: 500 }
    );
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Génère un numéro de facture à partir du numéro de commande
 * Format: INV-2025-000001
 */
function generateInvoiceNumber(orderNumber: string): string {
  // Extraire l'année et le numéro de la commande
  // orderNumber format: ORD-2025-000001
  const parts = orderNumber.split('-');
  if (parts.length === 3) {
    return `INV-${parts[1]}-${parts[2]}`;
  }
  
  // Fallback
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `INV-${year}-${random}`;
}

/**
 * Détermine le taux de TVA selon la localité
 */
function getTaxRate(locality: string): number {
  const localityUpper = locality.toUpperCase();
  
  if (localityUpper.includes('MARTINIQUE')) {
    return 0.085; // 8.5%
  }
  
  if (localityUpper.includes('GUADELOUPE')) {
    return 0.085; // 8.5%
  }
  
  if (localityUpper.includes('GUYANE')) {
    return 0; // 0% - TVA non applicable
  }
  
  // Fallback France métropolitaine
  return 0.20; // 20%
}

/**
 * Retourne les informations d'entreprise selon la localité
 */
function getCompanyInfo(locality: string) {
  const localityUpper = locality.toUpperCase();
  
  if (localityUpper.includes('GUYANE')) {
    return {
      legalName: 'ECOCOM',
      siren: '791956998',
      vatNumber: 'FR51791956998',
      address: [
        'IMMEUBLE BOURDIN',
        '8 RUE DU CAPITAINE BERNARD',
        '97300 CAYENNE'
      ]
    };
  }
  
  if (localityUpper.includes('MARTINIQUE')) {
    return {
      legalName: 'ECOCOMAM',
      siren: '812384188',
      vatNumber: 'FR28812384188',
      address: [
        'CTRE CCIAL LA GALLERIA',
        '97232 LE LAMENTIN'
      ]
    };
  }
  
  if (localityUpper.includes('GUADELOUPE')) {
    return {
      legalName: 'ECOGWADA',
      siren: '812553022',
      vatNumber: 'FR93812553022',
      address: [
        'CCIAL COEUR DE JARRY HOUELBOURG',
        'ZI DE JARRY',
        '97122 BAIE MAHAULT'
      ]
    };
  }
  
  // Fallback (Guadeloupe par défaut)
  return {
    legalName: 'ECOGWADA',
    siren: '812553022',
    vatNumber: 'FR93812553022',
    address: [
      'CCIAL COEUR DE JARRY HOUELBOURG',
      'ZI DE JARRY',
      '97122 BAIE MAHAULT'
    ]
  };
}