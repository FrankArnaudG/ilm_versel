// app/api/payments/notifications/send-invoice/route.ts

import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.AUTH_RESEND_KEY);

function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'public/assets/logo_ilm.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return logoBuffer.toString('base64');
  } catch {
    console.warn('Logo non trouvé');
    return '';
  }
}

export async function POST(req: NextRequest) {

  try {
    const { orderId, sessionId } = await req.json();
    console.log('API Email appelée:', { orderId, sessionId });

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

    if (!order.user.email) {
      return NextResponse.json(
        { success: false, error: 'Email client manquant' },
        { status: 400 }
      );
    }

    console.log('Commande:', order.orderNumber);
    console.log('Client:', order.user.email);

    let invoicePDFBase64: string | null = null;
    let invoiceNumber: string | null = null;
    let invoiceFilename: string | null = null;

    try {
      console.log('Génération de la facture PDF...');
      const baseUrl = process.env.ILM_URL || 'http://localhost:3000';
      const generateResponse = await fetch(
        `${baseUrl}/api/orders/${orderId}/generate-invoice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (generateResponse.ok) {
        const pdfData = await generateResponse.json();
        if (pdfData.success && pdfData.pdfBase64) {
          invoicePDFBase64 = pdfData.pdfBase64;
          invoiceNumber = pdfData.invoiceNumber;
          invoiceFilename = pdfData.filename;
          console.log('Facture PDF générée:', invoiceNumber);
        }
      }
    } catch (pdfError) {
      console.error('Erreur génération PDF:', pdfError);
    }

    const logoBase64 = getLogoBase64();
    const downloadUrl = `${process.env.ILM_URL || 'http://localhost:3000'}/api/orders/${orderId}/invoice`;
    const trackingUrl = `${process.env.ILM_URL || 'http://localhost:3000'}/account/orders/${orderId}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #f3f4f6; }
    .email-container {
      background-color: #ffffff;
      margin: 20px auto;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(128, 0, 128, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #800080 0%, #a020a0 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo-container { margin-bottom: 20px; }
    .logo-container img { max-width: 180px; height: auto; }
    .header-title {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 20px 0 10px 0;
    }
    .header-subtitle { color: rgba(255, 255, 255, 0.95); font-size: 18px; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .email-content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .greeting strong { color: #800080; font-weight: 600; }
    .order-box {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border: 2px solid #800080;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
      position: relative;
    }
    .order-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #800080 0%, #a020a0 100%);
    }
    .order-label {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .order-number {
      font-size: 28px;
      font-weight: 800;
      color: #800080;
      letter-spacing: 1px;
      margin: 10px 0;
    }
    .invoice-label { font-size: 14px; color: #6b7280; margin-top: 10px; }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 35px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #800080;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-icon { font-size: 24px; }
    .items-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 25px 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .items-table thead { background: linear-gradient(135deg, #800080 0%, #a020a0 100%); }
    .items-table th {
      padding: 15px;
      text-align: left;
      font-size: 13px;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .items-table tbody tr { background: #ffffff; }
    .items-table tbody tr:nth-child(even) { background: #f9fafb; }
    .items-table td {
      padding: 18px 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tbody tr:last-child td { border-bottom: none; }
    .item-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 5px;
      font-size: 15px;
    }
    .item-details { font-size: 13px; color: #6b7280; }
    .item-quantity {
      text-align: center;
      font-weight: 600;
      color: #800080;
      font-size: 16px;
    }
    .item-price {
      text-align: right;
      font-weight: 700;
      color: #1f2937;
      font-size: 16px;
    }
    .totals-section {
      margin-top: 25px;
      padding: 25px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 15px;
      color: #374151;
    }
    .total-row strong { font-weight: 600; }
    .total-row-final {
      margin-top: 15px;
      padding-top: 20px;
      border-top: 2px solid #800080;
      font-size: 22px;
      font-weight: 800;
      color: #800080;
    }
    .free-shipping { color: #10b981; font-weight: 600; }
    .invoice-download {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
    }
    .invoice-download-icon { font-size: 40px; margin-bottom: 10px; }
    .invoice-download-title {
      font-size: 18px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 15px;
    }
    .download-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
    }
    .invoice-note { font-size: 13px; color: #6b7280; margin-top: 12px; }
    .address-box {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-left: 4px solid #800080;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .address-title {
      font-size: 14px;
      font-weight: 700;
      color: #800080;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .address-content {
      font-size: 15px;
      color: #374151;
      line-height: 1.8;
    }
    .address-content strong {
      color: #1f2937;
      display: block;
      margin-bottom: 5px;
    }
    .next-steps {
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
      border-left: 4px solid #800080;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
    }
    .next-steps-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .next-steps ul { list-style: none; padding: 0; margin: 0; }
    .next-steps li {
      padding: 12px 0;
      color: #374151;
      font-size: 15px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .next-steps li::before {
      content: '✓';
      background: #800080;
      color: #ffffff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .next-steps strong { color: #800080; font-weight: 600; }
    .cta-section { text-align: center; margin: 35px 0; padding: 25px 0; }
    .cta-button {
      display: inline-block;
      padding: 16px 36px;
      background: linear-gradient(135deg, #800080 0%, #a020a0 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 8px;
      box-shadow: 0 4px 6px rgba(128, 0, 128, 0.3);
    }
    .cta-button-secondary {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      color: #1f2937;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-footer {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      color: #6b7280;
      padding: 35px 30px;
      text-align: center;
    }
    .reassurance {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 25px;
      background: #f9fafb;
      border-radius: 12px;
      flex-wrap: wrap;
      gap: 20px;
    }
    .reassurance-item { text-align: center; flex: 1; min-width: 150px; }
    .reassurance-icon { font-size: 36px; margin-bottom: 10px; }
    .reassurance-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .reassurance-text { font-size: 12px; color: #6b7280; }
    
    .footer-brand {
      font-size: 20px;
      font-weight: 700;
      color: #800080;
      margin-bottom: 10px;
    }
    .footer-tagline { font-size: 14px; color: #d1d5db; margin-bottom: 20px; }
    .footer-social { margin: 20px 0; }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: #ffffff;
      text-decoration: none;
      font-size: 24px;
    }
    .footer-legal {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #374151;
    }
    .footer-legal-title {
      font-size: 12px;
      font-weight: 600;
      color: #d1d5db;
      margin-bottom: 10px;
    }
    .footer-legal-text {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
      margin: 5px 0;
    }
    .footer-disclaimer {
      font-size: 11px;
      color: #6b7280;
      margin-top: 20px;
      font-style: italic;
    }
    @media only screen and (max-width: 600px) {
      .email-content { padding: 25px 20px; }
      .header-title { font-size: 26px; }
      .order-number { font-size: 22px; }
      .items-table th, .items-table td { padding: 12px 8px; font-size: 13px; }
      .cta-button { display: block; margin: 10px 0; }
      .reassurance { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        ${logoBase64 ? `<div class="logo-container"><img src="data:image/png;base64,${logoBase64}" alt="I Love Mobile" /></div>` : '<div class="footer-brand" style="font-size: 32px; margin-bottom: 0;">I Love Mobile</div>'}
        <div class="success-icon">✅</div>
        <h1 class="header-title">Paiement confirmé !</h1>
        <p class="header-subtitle">Merci pour votre confiance</p>
      </div>
      <div class="email-content">
        <p class="greeting">Bonjour <strong>${order.shippingAddress.fullName}</strong>,</p>
        <p class="greeting">Nous sommes ravis de confirmer que votre paiement a été reçu avec succès ! 🎉<br>Votre commande est maintenant en cours de préparation.</p>
        <div class="order-box">
          <div class="order-label">Numéro de commande</div>
          <div class="order-number">${order.orderNumber}</div>
          ${invoiceNumber ? `<div class="invoice-label">Facture N° <strong>${invoiceNumber}</strong></div>` : ''}
        </div>
        <div class="reassurance">
          <div class="reassurance-item">
            <div class="reassurance-icon">🚚</div>
            <div class="reassurance-title">Livraison gratuite</div>
            <div class="reassurance-text">${order.locality}</div>
          </div>
          <div class="reassurance-item">
            <div class="reassurance-icon">🔒</div>
            <div class="reassurance-title">Paiement sécurisé</div>
            <div class="reassurance-text">Transaction protégée</div>
          </div>
          <div class="reassurance-item">
            <div class="reassurance-icon">📦</div>
            <div class="reassurance-title">Suivi en temps réel</div>
            <div class="reassurance-text">Restez informé</div>
          </div>
        </div>
        <h2 class="section-title"><span class="section-icon"></span>Résumé de votre commande</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align: center; width: 80px;">Quantité</th>
              <th style="text-align: right; width: 120px;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <div class="item-name">${item.productName}</div>
                  <div class="item-details">${item.brand} • ${item.storage} • ${item.colorName}</div>
                </td>
                <td class="item-quantity">${item.quantity}</td>
                <td class="item-price">${item.totalPrice.toNumber().toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals-section">
          <div class="total-row">
            <span>Sous-total</span>
            <strong>${order.subtotal.toNumber().toFixed(2)} €</strong>
          </div>
          <div class="total-row">
            <span>Frais de livraison</span>
            <strong class="${order.shippingCost.toNumber() === 0 ? 'free-shipping' : ''}">${order.shippingCost.toNumber() === 0 ? 'Offerts 🎁' : order.shippingCost.toNumber().toFixed(2) + ' €'}</strong>
          </div>
          <div class="total-row">
            <span>TVA (${(order.taxAmount.toNumber() / order.subtotal.toNumber() * 100).toFixed(0)}%)</span>
            <strong>${order.taxAmount.toNumber().toFixed(2)} €</strong>
          </div>
          <div class="total-row total-row-final">
            <span>TOTAL TTC </span>
            <span>${order.totalAmount.toNumber().toFixed(2)} €</span>
          </div>
        </div>
        ${invoicePDFBase64 ? `
          <div class="invoice-download">
            <div class="invoice-download-icon">📄</div>
            <div class="invoice-download-title">Votre facture est prête</div>
            <a href="${downloadUrl}" class="download-button">📥 Télécharger la facture PDF</a>
            <p class="invoice-note">Vous pouvez également la retrouver dans votre espace client</p>
          </div>
        ` : ''}
        <h2 class="section-title"><span class="section-icon">📍</span>Adresse de livraison</h2>
        <div class="address-box">
          <div class="address-title"><span>🚚</span> Livraison</div>
          <div class="address-content">
            <strong>${order.shippingAddress.fullName}</strong>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
            ${order.shippingAddress.country}<br>
            <span style="color: #800080;">📞 ${order.shippingAddress.phone}</span>
          </div>
        </div>
        <div class="next-steps">
          <h3 class="next-steps-title"><span></span> Prochaines étapes</h3>
          <ul>
            <li><div><strong>Préparation :</strong> Votre commande est actuellement en cours de préparation dans nos entrepôts</div></li>
            <li><div><strong>Livraison :</strong> Livraison gratuite en ${order.locality} sous 24 à 48 heures ouvrés</div></li>
            <li><div><strong>Réception :</strong> Votre colis sera remis en main propre ou déposé à l'adresse indiquée</div></li>
          </ul>
        </div>
        <div class="cta-section">
          <a href="${process.env.ILM_URL || 'http://localhost:3000'}" class="cta-button cta-button-secondary">Retour à la boutique</a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.8;">
          Des questions sur votre commande ?<br>
          Consultez notre <a href="${process.env.ILM_URL || 'http://localhost:3000'}/faq" style="color: #800080; text-decoration: none; font-weight: 600;">FAQ</a> ou contactez-nous via nos réseaux sociaux
        </p>
      </div>
      <div class="email-footer">
        <div class="footer-brand">I Love Mobile</div>
        <div class="footer-tagline">Votre spécialiste en téléphonie mobile</div>
        <div class="footer-social">
          <a href="https://www.facebook.com/ilovemobile" class="social-link" title="Facebook">📘</a>
          <a href="https://www.tiktok.com/@ilovemobile" class="social-link" title="TikTok">🎵</a>
        </div>
        <div class="footer-legal">
          <div class="footer-legal-title">Informations légales</div>
          <p class="footer-legal-text">
            <strong>ECOCOM GUYANE</strong> • SIREN: 791956998 • TVA: FR51791956998<br>
            Immeuble Bourdin, 8 Rue du Capitaine Bernard, 97300 Cayenne
          </p>
          <p class="footer-legal-text">
            <strong>ECOCOM MARTINIQUE</strong> • SIREN: 812384188 • TVA: FR28812384188<br>
            Centre Commercial La Galleria, 97232 Le Lamentin
          </p>
          <p class="footer-legal-text">
            <strong>ECOGWADA GUADELOUPE</strong> • SIREN: 812553022 • TVA: FR93812553022<br>
            CC Cœur de Jarry Houëlbourg, ZI de Jarry, 97122 Baie-Mahault
          </p>
        </div>
        <p class="footer-disclaimer">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.<br>
          Pour toute question, contactez-nous via nos réseaux sociaux.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailText = `
I LOVE MOBILE - PAIEMENT CONFIRMÉ !

Bonjour ${order.shippingAddress.fullName},

Nous sommes ravis de confirmer que votre paiement a été reçu avec succès !

NUMÉRO DE COMMANDE : ${order.orderNumber}
${invoiceNumber ? `FACTURE N° : ${invoiceNumber}` : ''}

RÉSUMÉ DE VOTRE COMMANDE

${order.items.map(item => `• ${item.productName}
  ${item.brand} - ${item.storage} - ${item.colorName}
  Quantité : ${item.quantity} × ${item.totalPrice.toNumber().toFixed(2)} €`).join('\n\n')}

DÉTAIL DES MONTANTS

Sous-total : ${order.subtotal.toNumber().toFixed(2)} €
Frais de livraison : ${order.shippingCost.toNumber() === 0 ? 'OFFERTS' : order.shippingCost.toNumber().toFixed(2) + ' €'}
TVA : ${order.taxAmount.toNumber().toFixed(2)} €
TOTAL TTC : ${order.totalAmount.toNumber().toFixed(2)} €

ADRESSE DE LIVRAISON

${order.shippingAddress.fullName}
${order.shippingAddress.addressLine1}
${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '\n' : ''}${order.shippingAddress.postalCode} ${order.shippingAddress.city}
${order.shippingAddress.country}
Tél : ${order.shippingAddress.phone}

PROCHAINES ÉTAPES

✓ Préparation : Votre commande est en cours de préparation
✓ Expédition : Vous recevrez un email avec le numéro de suivi
✓ Livraison : Gratuite en ${order.locality} sous 3 à 5 jours ouvrés
✓ Réception : Remise en main propre ou dépôt à votre adresse

LIENS UTILES

Suivre ma commande : ${trackingUrl}
${invoicePDFBase64 ? `Télécharger la facture : ${downloadUrl}` : ''}
Retour à la boutique : ${process.env.ILM_URL || 'http://localhost:3000'}

Contactez-nous :
Facebook : https://www.facebook.com/ilovemobile
TikTok : https://www.tiktok.com/@ilovemobile

Cordialement,
L'équipe I Love Mobile

INFORMATIONS LÉGALES

ECOCOM GUYANE - SIREN: 791956998 - TVA: FR51791956998
Immeuble Bourdin, 8 Rue du Capitaine Bernard, 97300 Cayenne

ECOCOM MARTINIQUE - SIREN: 812384188 - TVA: FR28812384188
Centre Commercial La Galleria, 97232 Le Lamentin

ECOGWADA GUADELOUPE - SIREN: 812553022 - TVA: FR93812553022
CC Cœur de Jarry Houëlbourg, ZI de Jarry, 97122 Baie-Mahault

© ${new Date().getFullYear()} I Love Mobile - Tous droits réservés
    `;

    // ----------------------------------------
    // 5. ENVOYER L'EMAIL VIA RESEND
    // ----------------------------------------
    const emailFrom = 'onboarding@resend.dev';
    
    console.log('📨 Envoi email depuis:', emailFrom);
    console.log('📨 Envoi email vers:', order.user.email);

    // Préparer les attachments
    const attachments = invoicePDFBase64 ? [
      {
        filename: invoiceFilename || `Facture_${order.orderNumber}.pdf`,
        content: invoicePDFBase64,
      }
    ] : undefined;

    const { data, error } = await resend.emails.send({
      from: `I Love Mobile <${emailFrom}>`,
      to: order.user.email,
      subject: `✅ Commande ${order.orderNumber} confirmée${invoiceNumber ? ` - Facture ${invoiceNumber}` : ''}`,
      html: emailHtml,
      text: emailText,
      attachments,
      tags: [
        { name: 'category', value: 'order_confirmation' },
        { name: 'order_id', value: orderId }
      ]
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de l\'envoi de l\'email',
          details: error 
        },
        { status: 500 }
      );
    }

    console.log('✅ Email envoyé avec succès !');
    console.log('📧 ID email:', data?.id);
    console.log(`${invoicePDFBase64 ? '📎 Facture PDF jointe' : '📧 Email envoyé sans facture PDF'}`);

    // ----------------------------------------
    // 6. RÉPONSE
    // ----------------------------------------
    return NextResponse.json({ 
      success: true,
      emailId: data?.id,
      invoiceGenerated: !!invoicePDFBase64,
      invoiceNumber: invoiceNumber,
      message: invoicePDFBase64 
        ? 'Email de confirmation avec facture envoyé' 
        : 'Email de confirmation envoyé (sans facture PDF)'
    });

  } catch (error) {
    console.error('❌ Erreur API email:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}