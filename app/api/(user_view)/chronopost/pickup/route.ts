import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseStringPromise } from 'xml2js';
import { CHRONOPOST_CONFIG, getChronopostCredentials } from '@/lib/chronopost/config';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId manquant'
      }, { status: 400 });
    }

    console.log('📞 Demande d\'enlèvement Chronopost pour commande:', orderId);

    // ----------------------------------------
    // ÉTAPE 1 : RÉCUPÉRER LA COMMANDE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Commande introuvable'
      }, { status: 404 });
    }

    // Vérifier qu'une étiquette existe
    if (!order.chronopostSkybillNumber) {
      return NextResponse.json({
        success: false,
        error: 'Aucune étiquette générée pour cette commande'
      }, { status: 400 });
    }

    // Vérifier qu'un enlèvement n'a pas déjà été demandé
    if (order.pickupRequested) {
      return NextResponse.json({
        success: false,
        error: 'Un enlèvement a déjà été demandé pour cette commande'
      }, { status: 400 });
    }

    // ----------------------------------------
    // ÉTAPE 2 : RÉCUPÉRER LES CREDENTIALS
    // ----------------------------------------
    const credentials = getChronopostCredentials(order.locality);

    // ----------------------------------------
    // ÉTAPE 2 : RÉCUPÉRER LES CREDENTIALS CHRONOPOST
    // ----------------------------------------
    const locality = order.locality; // "Martinique", "Guadeloupe", "Guyane"
    const countryCode = CHRONOPOST_CONFIG.countryCodes[locality as keyof typeof CHRONOPOST_CONFIG.countryCodes];

    if (!countryCode) {
      throw new Error(`Code pays introuvable pour la localité: ${locality}`);
    }

    console.log('🔑 Credentials:', {
      locality,
      accountNumber: credentials.accountNumber,
      countryCode
    });

    // ----------------------------------------
    // ÉTAPE 3 : PRÉPARER LA DATE D'ENLÈVEMENT
    // ----------------------------------------
    const now = new Date();
    const pickupDate = new Date(now);
    
    // Si après 15h, planifier pour le lendemain
    if (now.getHours() >= 15) {
      pickupDate.setDate(pickupDate.getDate() + 1);
    }
    
    // Éviter le weekend
    if (pickupDate.getDay() === 0) { // Dimanche
      pickupDate.setDate(pickupDate.getDate() + 1);
    } else if (pickupDate.getDay() === 6) { // Samedi
      pickupDate.setDate(pickupDate.getDate() + 2);
    }

    const pickupDateStr = pickupDate.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // ----------------------------------------
    // ÉTAPE 4 : CONSTRUIRE LA REQUÊTE SOAP
    // ----------------------------------------
    const store = order.store;
    const shipperCity = store.city || '';
    const shipperZipCode = store.address.match(/\d{5}/)?.[0] || store.storeZipCode || '';
    const shipperAddress1 = store.address.split(',')[0] || '';
    const shipperAddress2 = store.address2 || '';

    // Adresse destinataire
    // 🆕 Utiliser les snapshots de l'adresse de livraison
    // const recipientCivility = order.shippingCivility || 'M';
    // const recipientName = order.shippingFullName || '';
    // const recipientPhone = order.shippingPhone || '';
    // const recipientAddress1 = order.shippingAddressLine1 || '';
    // const recipientAddress2 = order.shippingAddressLine2 || '';
    // const recipientCity = order.shippingCity || '';
    // const recipientZipCode = order.shippingPostalCode || '';
    // const recipientCountry = order.shippingCountry || '';

    // 🆕 Utiliser les snapshots de l'adresse de facturation (pour customerValue)
    const billingCivility = order.billingCivility || 'M';
    const billingName = order.billingFullName || '';
    const billingPhone = order.billingPhone || '';
    const billingAddress1 = order.billingAddressLine1 || '';
    const billingAddress2 = order.billingAddressLine2 || '';
    const billingCity = order.billingCity || '';
    const billingZipCode = order.billingPostalCode || '';
    // const billingCountry = order.billingCountry || '';

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cxf="http://cxf.shipping.soap.chronopost.fr/">
   <soapenv:Header/>
   <soapenv:Body>
      <cxf:creerEnlevementNational>
         <headerValue>
            <accountNumber>19869502</accountNumber>
            <idEmit>CHRFR</idEmit>
            <subAccount></subAccount>
         </headerValue>
         
         <shipper>
            <shipperAdress1>${shipperAddress1}</shipperAdress1>
            <shipperAdress2>${shipperAddress2}</shipperAdress2>
            <shipperCity>${shipperCity}</shipperCity>
            <shipperCivility>M</shipperCivility>
            <shipperContactName>SERVICE EXPEDITION</shipperContactName>
            <shipperCountry>${countryCode}</shipperCountry>
            <shipperEmail>${store.email}</shipperEmail>
            <shipperMobilePhone></shipperMobilePhone>
            <shipperName>${store.name}</shipperName>
            <shipperPhone>${store.phone}</shipperPhone>
            <shipperZipCode>${shipperZipCode}</shipperZipCode>
         </shipper>
         
         <customer>
            <customerAdress1>${billingAddress1}</customerAdress1>
            <customerAdress2>${billingAddress2}</customerAdress2>
            <customerCity>${billingCity}</customerCity>
            <customerCivility>${billingCivility === 'MME' ? 'E' : 'M'}</customerCivility>
            <customerContactName>SERVICE CLIENT</customerContactName>
            <customerCountry>${countryCode}</customerCountry>
            <customerCountryName>${locality.toUpperCase()}</customerCountryName>
            <customerEmail></customerEmail>
            <customerMobilePhone></customerMobilePhone>
            <customerName>${billingName}</customerName>
            <customerPhone>${billingPhone}</customerPhone>
            <customerZipCode>${billingZipCode}</customerZipCode>
         </customer>
         
         <pickupInformationValue>
            <pickupDate>${pickupDateStr}</pickupDate>
            <pickupLocationInformations>
               <parcelsNumber>${order.items.length}</parcelsNumber>
            </pickupLocationInformations>
         </pickupInformationValue>
         
         <skybillValue>
            <skybillNumber>${order.chronopostSkybillNumber}</skybillNumber>
         </skybillValue>
         
         <password>255562</password>
      </cxf:creerEnlevementNational>
   </soapenv:Body>
</soapenv:Envelope>`;

    console.log('📤 Envoi de la demande d\'enlèvement à Chronopost...');

    // ----------------------------------------
    // ÉTAPE 5 : APPELER L'API CHRONOPOST
    // ----------------------------------------
    const response = await fetch('https://ws.chronopost.fr/shipping-cxf/ShippingServiceWS', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': ''
      },
      body: soapRequest
    });

    if (!response.ok) {
      throw new Error(`Chronopost API error: ${response.status}`);
    }

    const xmlResponse = await response.text();
    console.log('📥 Réponse reçue');

    // ----------------------------------------
    // ÉTAPE 6 : PARSER LA RÉPONSE
    // ----------------------------------------
    const parsed = await parseStringPromise(xmlResponse, { 
      explicitArray: false,
      tagNameProcessors: [(name) => name.replace(/^.*:/, '')]
    });

    const returnData = parsed?.Envelope?.Body?.creerEnlevementNationalResponse?.return;

    if (!returnData) {
      throw new Error('Structure de réponse invalide');
    }

    const errorCode = returnData.errorCode || '0';
    const errorMessage = returnData.errorMessage || '';

    if (errorCode !== '0') {
      console.error('❌ Erreur Chronopost:', errorCode, errorMessage);
      return NextResponse.json({
        success: false,
        error: `Erreur Chronopost: ${errorMessage}`,
        errorCode
      }, { status: 400 });
    }

    console.log('✅ Enlèvement demandé avec succès');

    // ----------------------------------------
    // ÉTAPE 7 : METTRE À JOUR LA COMMANDE
    // ----------------------------------------
    await db.order.update({
      where: { id: orderId },
      data: {
        pickupRequested: true,
        pickupRequestedAt: new Date(),
        shippingStatus: 'READY'
      }
    });

    // ----------------------------------------
    // ÉTAPE 8 : NOTIFIER L'ADMIN
    // ----------------------------------------
    try {
      // Construire l'URL complète
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${baseUrl}/api/notifications/admin-chronopost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pickup',
          orderId: order.id,
          orderNumber: order.orderNumber,
          pickupDate: pickupDateStr,
          skybillNumber: order.chronopostSkybillNumber
        })
      });
    } catch (emailError) {
      console.error('⚠️ Erreur notification admin:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Enlèvement demandé avec succès',
      pickupDate: pickupDateStr
    });

  } catch (error) {
    console.error('❌ Erreur demande enlèvement:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la demande d\'enlèvement'
    }, { status: 500 });
  }
}