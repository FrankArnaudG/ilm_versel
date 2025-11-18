// app/api/chronopost/shipping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { db } from '@/lib/db';
import { CHRONOPOST_CONFIG, getChronopostCredentials } from '@/lib/chronopost/config';
import { currentUser } from '@/lib/auth';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

// ==========================================
// 🆕 FONCTION DE LOGGING POUR VALIDATION
// ==========================================
async function logForValidation(
  type: 'request' | 'response' | 'label',
  data: string,
  productType: string, // 'chrono-express' ou 'chrono-relais'
  orderId: string
) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = type === 'label' ? 'txt' : 'xml';
    const filename = `${productType}_${type}_${orderId}_${timestamp}.${extension}`;
    
    // Créer le dossier validation_logs à la racine du projet
    const logDir = join(process.cwd(), 'validation_logs', productType);
    await mkdir(logDir, { recursive: true });
    
    const filepath = join(logDir, filename);
    await writeFile(filepath, data, 'utf8');
    
    console.log(`✅ [VALIDATION] Logged ${type}: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`❌ [VALIDATION] Erreur logging ${type}:`, error);
    // Ne pas bloquer l'exécution si le logging échoue
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { orderId } = requestBody;

    const user = await currentUser();

     if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Nous avons du mal a vous identifier'
      }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId manquant'
      }, { status: 400 });
    }

    console.log('📦 Début génération étiquette Chronopost pour commande:', orderId);

    // ----------------------------------------
    // ÉTAPE 1 : RÉCUPÉRER LES DONNÉES DE LA COMMANDE
    // ----------------------------------------
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        billingAddress: true,
        store: true,
        items: {
          include: {
            article: {
              include: {
                variant: true,
                model: true,
                color: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Commande introuvable'
      }, { status: 404 });
    }

    // Vérifier si l'étiquette existe déjà
    if (order.chronopostSkybillNumber) {
      console.log('⚠️ Étiquette déjà générée pour cette commande');
      return NextResponse.json({
        success: true,
        skybillNumber: order.chronopostSkybillNumber,
        message: 'Étiquette déjà générée'
      });
    }

    console.log('✅ Commande récupérée:', order.orderNumber);

    // ----------------------------------------
    // ÉTAPE 2 : VÉRIFIER LES SNAPSHOTS D'ADRESSES
    // ----------------------------------------
    // 🆕 Utiliser les snapshots au lieu des relations
    if (!order.shippingFullName || !order.shippingAddressLine1 || !order.shippingCity) {
      console.log('Adresse de livraison incomplète dans la commande')
    }

    if (!order.billingFullName || !order.billingAddressLine1 || !order.billingCity) {
      console.log('Adresse de facturation incomplète dans la commande')
    }


    // ----------------------------------------
    // ÉTAPE 2 : RÉCUPÉRER LES CREDENTIALS CHRONOPOST
    // ----------------------------------------
    const locality = order.locality; // "Martinique", "Guadeloupe", "Guyane"
    const credentials = getChronopostCredentials(locality);
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
    // ÉTAPE 4 : PRÉPARER LES ADRESSES
    // ----------------------------------------
    const storeAddr = order.store;

    // Adresse expéditeur (entrepôt/store)
    const shipperCity = storeAddr.city || '';
    const shipperZipCode = storeAddr.address.match(/\d{5}/)?.[0] || '';
    const shipperAddress1 = storeAddr.address.split(',')[0] || '';
    const shipperAddress2 = storeAddr.address.split(',')[1]?.trim() || '';

    // Adresse destinataire
    // 🆕 Utiliser les snapshots de l'adresse de livraison
    // const recipientCivility = order.shippingCivility || 'M';
    const recipientName = order.shippingFullName || '';
    const recipientPhone = order.shippingPhone || '';
    const recipientAddress1 = order.shippingAddressLine1 || '';
    const recipientAddress2 = order.shippingAddressLine2 || '';
    const recipientCity = order.shippingCity || '';
    const recipientZipCode = order.shippingPostalCode || '';
    const recipientCountry = order.shippingCountry || countryCode;

    // 🆕 Utiliser les snapshots de l'adresse de facturation (pour customerValue)
    const billingCivility = order.billingCivility || 'M';
    const billingName = order.billingFullName || '';
    const billingPhone = order.billingPhone || '';
    const billingAddress1 = order.billingAddressLine1 || '';
    const billingAddress2 = order.billingAddressLine2 || '';
    const billingCity = order.billingCity || '';
    const billingZipCode = order.billingPostalCode || '';
    // const billingCountry = order.billingCountry || countryCode;

    const totalWeight = order.totalWeight;
    const totalLength = order.totalLength;
    const totalWidth = order.totalWidth;
    const totalHeight = order.totalHeight

console.log('🔑 totalHeight:', {
      totalWeight,
      totalLength,
      totalWidth,
      totalHeight
    });
    // ----------------------------------------
    // ÉTAPE 5 : CONSTRUIRE LA REQUÊTE SOAP
    // ----------------------------------------

    // shipperValue: Celui qui envoie le colis
    // customerValue: Celui qui paie ou passe la commande
    // recipientValue: Celui qui reçoit le colis
       
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cxf="http://cxf.shipping.soap.chronopost.fr/">
   <soapenv:Header/>
   <soapenv:Body>
      <cxf:shippingMultiParcelV4>
          <headerValue>
            <accountNumber>19869502</accountNumber>
            <idEmit>CHRFR</idEmit>
            <identWebPro></identWebPro>
            <subAccount></subAccount>
         </headerValue>

         <shipperValue>
            <shipperAdress1>${shipperAddress1}</shipperAdress1>
            <shipperAdress2>${shipperAddress2}</shipperAdress2>
            <shipperCity>${shipperCity}</shipperCity>
            <shipperCivility>M</shipperCivility>
            <shipperContactName>SERVICE EXPEDITION</shipperContactName>
            <shipperCountry>${countryCode}</shipperCountry>
            <shipperCountryName>${locality.toUpperCase()}</shipperCountryName>
            <shipperEmail>${storeAddr.email}</shipperEmail>
            <shipperMobilePhone></shipperMobilePhone>
            <shipperName>${storeAddr.name || 'ECOCOM'}</shipperName>
            <shipperName2> </shipperName2>
            <shipperPhone>${storeAddr.phone}</shipperPhone>
            <shipperPreAlert>0</shipperPreAlert>
            <shipperZipCode>${shipperZipCode}</shipperZipCode>
         </shipperValue>
         
         <customerValue>
            <customerAdress1>${billingAddress1}</customerAdress1>
            <customerAdress2>${billingAddress2}</customerAdress2>
            <customerCity>${billingCity}</customerCity>
            <customerCivility>${billingCivility === 'MME' ? 'E' : 'M'}</customerCivility>
            <customerContactName>SERVICE CLIENT</customerContactName>
            <customerCountry>${countryCode}</customerCountry>
            <customerCountryName>${locality.toUpperCase()}</customerCountryName>
            <customerEmail>${user.email}</customerEmail>
            <customerMobilePhone></customerMobilePhone>
            <customerName>${billingName}</customerName>
            <customerName2> </customerName2>
            <customerPhone>${billingPhone}</customerPhone>
            <customerPreAlert></customerPreAlert>
            <customerZipCode>${billingZipCode}</customerZipCode>
            <printAsSender></printAsSender>
         </customerValue>
         
         <recipientValue>
            <recipientAdress1>${recipientAddress1}</recipientAdress1>
            <recipientAdress2>${recipientAddress2}</recipientAdress2>
            <recipientCity>${recipientCity}</recipientCity>
            <recipientContactName>${recipientName}</recipientContactName>
            <recipientCountry>${recipientCountry}</recipientCountry>
            <recipientCountryName>${locality}</recipientCountryName>
            <recipientEmail> </recipientEmail>
            <recipientMobilePhone></recipientMobilePhone>
            <recipientName>${recipientName}</recipientName>
            <recipientName2> </recipientName2>
            <recipientPhone>${recipientPhone}</recipientPhone>
            <recipientPreAlert>0</recipientPreAlert>
            <recipientZipCode>${recipientZipCode}</recipientZipCode> 
         </recipientValue>
         
         <refValue>
            <recipientRef>COMMANDE ${order.orderNumber}</recipientRef>
            <shipperRef>REF EXP ${order.orderNumber}</shipperRef>
         </refValue>
         
         <skybillValue>
            <bulkNumber>1</bulkNumber>
            <codCurrency> </codCurrency>
            <codValue> </codValue>
            <content1>Produits electroniques</content1>
            <content2> </content2>
            <content3> </content3>
            <content4> </content4>
            <content5> </content5>
            <customsCurrency> </customsCurrency>
            <customsValue> </customsValue>
            <evtCode>DC</evtCode>
            <insuredCurrency> </insuredCurrency>
            <insuredValue> </insuredValue>
            <latitude> </latitude>
            <longitude> </longitude>
            <masterSkybillNumber> </masterSkybillNumber>
            <objectType>MAR</objectType>
            <portCurrency> </portCurrency>
            <portValue> </portValue>
            <productCode>${CHRONOPOST_CONFIG.productCode}</productCode>
            <qualite></qualite>
            <service>0</service>
            <shipDate></shipDate>
            <shipHour></shipHour>
            <skybillRank>1</skybillRank>
            <source></source>
            <weight>${totalWeight}</weight>
            <weightUnit>KGM</weightUnit>
            <height>${totalHeight}</height>
            <length>${totalLength}</length>
            <width>${totalWidth}</width>
            <alternateProductCode></alternateProductCode>
         </skybillValue>
         
         <skybillParamsValue>
            <duplicata>N</duplicata>
            <mode>PDF</mode>
            <withReservation>0</withReservation>
         </skybillParamsValue>
         
         <password>255562</password>
         <modeRetour>2</modeRetour>
         <numberOfParcel>1</numberOfParcel>
         <version>2.0</version>
         <multiParcel>N</multiParcel>
       </cxf:shippingMultiParcelV4>
   </soapenv:Body>
</soapenv:Envelope>`;
  
// 🆕 LOGGER LA REQUÊTE POUR VALIDATION
    await logForValidation('request', soapRequest, 'chrono-express', orderId);

    console.log('📤 Envoi de la requête SOAP à Chronopost...');

    // ----------------------------------------
    // ÉTAPE 6 : APPELER L'API CHRONOPOST
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
      // const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, response.statusText);
      throw new Error(`Chronopost API error: ${response.status}`);
    }

    const xmlResponse = await response.text();
    console.log('📥 Réponse XML reçue');

    // 🆕 LOGGER LA RÉPONSE POUR VALIDATION
    await logForValidation('response', xmlResponse, 'chrono-express', orderId);

    // ----------------------------------------
    // ÉTAPE 7 : PARSER LA RÉPONSE XML
    // ----------------------------------------
    const parsed = await parseStringPromise(xmlResponse, { 
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [(name) => name.replace(/^.*:/, '')]
    });

    const envelope = parsed.Envelope;
    const soapBody = envelope?.Body;
    const responseData = soapBody?.shippingMultiParcelV4Response;
    const returnData = responseData?.return;

    if (!returnData) {
      console.error('❌ Structure XML invalide');
      throw new Error('Structure de réponse XML invalide');
    }

    // ----------------------------------------
    // ÉTAPE 8 : VÉRIFIER LES ERREURS CHRONOPOST
    // ----------------------------------------
    const errorCode = returnData.errorCode || '0';
    const errorMessage = returnData.errorMessage || '';

    if (errorCode !== '0') {
      console.error('❌ Erreur Chronopost:', errorCode, errorMessage);
      
      // Sauvegarder l'erreur en DB
      await db.order.update({
        where: { id: orderId },
        data: {
          chronopostError: `Code ${errorCode}: ${errorMessage}`,
          chronopostRetries: { increment: 1 }
        }
      });

      // Construire l'URL complète
      // const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      //           `http://localhost:${process.env.PORT || 3000}`;
      // // Notifier l'admin
      // // await fetch(`${baseUrl}/api/notifications/admin-chronopost`, {
      // //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'error',
      //     orderId: order.id,
      //     orderNumber: order.orderNumber,
      //     error: `${errorCode}: ${errorMessage}`
      //   })
      // }).catch(err => console.error('Erreur notification admin:', err));

      return NextResponse.json({
        success: false,
        error: `Erreur Chronopost: ${errorMessage}`,
        errorCode: errorCode
      }, { status: 400 });
    }

    // ----------------------------------------
    // ÉTAPE 9 : EXTRAIRE LES DONNÉES
    // ----------------------------------------
    const resultMultiParcelValue = returnData.resultMultiParcelValue;
    
    if (!resultMultiParcelValue) {
      throw new Error('Données de l\'étiquette non trouvées');
    }

    const skybillNumber = resultMultiParcelValue.skybillNumber;
    const pdfEtiquette = resultMultiParcelValue.pdfEtiquette;

    if (!pdfEtiquette) {
      throw new Error('Étiquette PDF non générée');
    }

    // 🆕 LOGGER L'ÉTIQUETTE BASE64 POUR VALIDATION
    await logForValidation('label', pdfEtiquette, 'chrono-express', orderId);


    console.log('✅ Étiquette générée avec succès');
    console.log('📦 Numéro de suivi:', skybillNumber);

    // ----------------------------------------
    // ÉTAPE 10 : SAUVEGARDER EN BASE DE DONNÉES
    // ----------------------------------------
    await db.order.update({
      where: { id: orderId },
      data: {
        chronopostLabel: pdfEtiquette,
        chronopostSkybillNumber: skybillNumber,
        chronopostAccount: credentials.accountNumber,
        chronopostProductCode: CHRONOPOST_CONFIG.productCode,
        labelGeneratedAt: new Date(),
        chronopostError: null, // Réinitialiser l'erreur si génération réussie
        shippingStatus: 'PROCESSING'
      }
    });

    console.log('💾 Étiquette sauvegardée en base de données');

    // ----------------------------------------
    // ÉTAPE 11 : NOTIFIER L'ADMIN
    // ----------------------------------------
    // try {

    //   // Construire l'URL complète
    //   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    //             `http://localhost:${process.env.PORT || 3000}`

    //   await fetch(`${baseUrl}/api/notifications/admin-chronopost`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       type: 'success',
    //       orderId: order.id,
    //       orderNumber: order.orderNumber,
    //       skybillNumber: skybillNumber,
    //       locality: locality
    //     })
    //   });
    //   console.log('📧 Admin notifié par email');
    // } catch (emailError) {
    //   console.error('⚠️ Erreur notification admin:', emailError);
    //   // Ne pas bloquer si l'email échoue
    // }

    // ----------------------------------------
    // ÉTAPE 12 : RÉPONSE (SANS LE PDF)
    // ----------------------------------------
    return NextResponse.json({
      success: true,
      message: 'Étiquette générée avec succès',
      skybillNumber: skybillNumber,
      // ⚠️ NE PAS RENVOYER LE PDF AU CLIENT
      // pdfEtiquette: pdfEtiquette, // COMMENTÉ VOLONTAIREMENT
    });

  } catch (error: unknown) {
    console.error('❌ Erreur lors de la création de l\'étiquette:', error);

    // ✅ Type guard pour vérifier que error est une Error
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    // Sauvegarder l'erreur en DB
    try {
      const { orderId } = await request.json();
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: {
            chronopostError: errorMessage,
            chronopostRetries: { increment: 1 }
          }
        });
      }
    } catch (dbError) {
      console.error('Erreur sauvegarde erreur en DB:', dbError);
    }

    return NextResponse.json({
      success: false,
      error: errorMessage || 'Erreur lors de la création de l\'étiquette',
    }, { status: 500 });
  }
}








// // app/api/chronopost/shipping/route.ts
// import { CHRONOPOST_CONFIG, getChronopostCredentials } from '@/lib/chronopost/config';
// import { db } from '@/lib/db';
// import { NextRequest, NextResponse } from 'next/server';
// import { parseStringPromise } from 'xml2js';

// export async function POST(request: NextRequest) {
//   try {
//     const { orderId, sessionId } = await request.json();

//     if (!orderId) {
//       return NextResponse.json({
//         success: false,
//         error: 'orderId manquant'
//       }, { status: 400 });
//     }

//     console.log('📦 Début génération étiquette Chronopost pour commande:', orderId);

//     // ----------------------------------------
//     // ÉTAPE 1 : RÉCUPÉRER LES DONNÉES DE LA COMMANDE
//     // ----------------------------------------

//     const order = await db.order.findUnique({
//       where: { id: orderId },
//       include: {
//         shippingAddress: true,
//         billingAddress: true,
//         store: true,
//         items: {
//           include: {
//             article: {
//               include: {
//                 variant: true,
//                 model: true,
//                 color: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!order) {
//       return NextResponse.json({
//         success: false,
//         error: 'Commande introuvable'
//       }, { status: 404 });
//     }

//     // Vérifier si l'étiquette existe déjà
//     if (order.chronopostSkybillNumber) {
//       console.log('⚠️ Étiquette déjà générée pour cette commande');
//       return NextResponse.json({
//         success: true,
//         skybillNumber: order.chronopostSkybillNumber,
//         message: 'Étiquette déjà générée'
//       });
//     }

//     console.log('✅ Commande récupérée:', order.orderNumber);

//     // ----------------------------------------
//     // ÉTAPE 2 : RÉCUPÉRER LES CREDENTIALS CHRONOPOST
//     // ----------------------------------------
//     const locality = order.locality; // "Martinique", "Guadeloupe", "Guyane"
//     const credentials = getChronopostCredentials(locality);
//     const countryCode = CHRONOPOST_CONFIG.countryCodes[locality as keyof typeof CHRONOPOST_CONFIG.countryCodes];

//     if (!countryCode) {
//       throw new Error(`Code pays introuvable pour la localité: ${locality}`);
//     }

//     console.log('🔑 Credentials:', {
//       locality,
//       accountNumber: credentials.accountNumber,
//       countryCode
//     });

//     // ----------------------------------------
//     // ÉTAPE 3 : CALCULER LE POIDS ET DIMENSIONS TOTAUX
//     // ----------------------------------------
//     let totalWeight = 0;
//     let maxLength = 0;
//     let maxWidth = 0;
//     let maxHeight = 0;

//     for (const item of order.items) {
//       if (item.article?.variant) {
//         const variant = item.article.variant;
        
//         // Additionner les poids
//         if (variant.weight) {
//           totalWeight += parseFloat(variant.weight.toString()) * item.quantity;
//         }

//         // Prendre les dimensions max
//         if (variant.length) {
//           maxLength = Math.max(maxLength, parseFloat(variant.length.toString()));
//         }
//         if (variant.width) {
//           maxWidth = Math.max(maxWidth, parseFloat(variant.width.toString()));
//         }
//         if (variant.height) {
//           maxHeight = Math.max(maxHeight, parseFloat(variant.height.toString()));
//         }
//       }
//     }

//     // Valeurs par défaut si non renseignées
//     if (totalWeight === 0) totalWeight = 1; // 1 kg minimum
//     if (maxLength === 0) maxLength = 30;
//     if (maxWidth === 0) maxWidth = 20;
//     if (maxHeight === 0) maxHeight = 10;

//     console.log('📊 Dimensions calculées:', {
//       weight: totalWeight,
//       length: maxLength,
//       width: maxWidth,
//       height: maxHeight
//     });

//     // ----------------------------------------
//     // ÉTAPE 4 : PRÉPARER LES ADRESSES
//     // ----------------------------------------
//     const shippingAddr = order.shippingAddress;
//     const storeAddr = order.store;

//     // Adresse expéditeur (entrepôt)
//     const shipperCity = storeAddr.city || 'CAYENNE';
//     const shipperZipCode = storeAddr.address.match(/\d{5}/)?.[0] || '97300';
//     const shipperAddress1 = storeAddr.address.split(',')[0] || 'IMMEUBLE BOURDIN';
//     const shipperAddress2 = storeAddr.address.split(',')[1]?.trim() || '8 RUE DU CAPITAINE BERNARD';

//     // Adresse destinataire
//     const recipientCity = shippingAddr.city;
//     const recipientZipCode = shippingAddr.postalCode;
//     const recipientAddress1 = shippingAddr.addressLine1;
//     const recipientAddress2 = shippingAddr.addressLine2 || '';
//     const recipientName = shippingAddr.fullName;
//     const recipientPhone = shippingAddr.phone;

//     // ----------------------------------------
//     // ÉTAPE 5 : CONSTRUIRE LA REQUÊTE SOAP
//     // ----------------------------------------
    
//     const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
// <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cxf="http://cxf.shipping.soap.chronopost.fr/">
//    <soapenv:Header/>
//    <soapenv:Body>
//       <cxf:shippingMultiParcelV4>
//           <headerValue>
//             <accountNumber>19869502</accountNumber>
//             <idEmit>CHRFR</idEmit>
//             <identWebPro></identWebPro>
//             <subAccount></subAccount>
//          </headerValue>

//          <shipperValue>
//             <shipperAdress1>IMMEUBLE BOURDIN</shipperAdress1>
//             <shipperAdress2>8 RUE DU CAPITAINE BERNARD</shipperAdress2>
//             <shipperCity>CAYENNE</shipperCity>
//             <shipperCivility>M</shipperCivility>
//             <shipperContactName>SERVICE EXPEDITION</shipperContactName>
//             <shipperCountry>GF</shipperCountry>
//             <shipperCountryName>GUYANE</shipperCountryName>
//             <shipperEmail>expediteur@ecocom.fr</shipperEmail>
//             <shipperMobilePhone></shipperMobilePhone>
//             <shipperName>ECOCOM</shipperName>
//             <shipperName2> </shipperName2>
//             <shipperPhone>0594123456</shipperPhone>
//             <shipperPreAlert>0</shipperPreAlert>
//             <shipperZipCode>97300</shipperZipCode>
//          </shipperValue>
         
//          <customerValue>
//             <customerAdress1>IMMEUBLE BOURDIN</customerAdress1>
//             <customerAdress2>8 RUE DU CAPITAINE BERNARD</customerAdress2>
//             <customerCity>CAYENNE</customerCity>
//             <customerCivility>M</customerCivility>
//             <customerContactName>SERVICE CLIENT</customerContactName>
//             <customerCountry>GF</customerCountry>
//             <customerCountryName>GUYANE</customerCountryName>
//             <customerEmail>contact@ecocom.fr</customerEmail>
//             <customerMobilePhone></customerMobilePhone>
//             <customerName>ECOCOM</customerName>
//             <customerName2> </customerName2>
//             <customerPhone>0594123456</customerPhone>
//             <customerPreAlert></customerPreAlert>
//             <customerZipCode>97300</customerZipCode>
//             <printAsSender></printAsSender>
//          </customerValue>
         
//          <recipientValue>
//             <recipientAdress1>123 RUE DE TEST</recipientAdress1>
//             <recipientAdress2> </recipientAdress2>
//             <recipientCity>FORT DE FRANCE</recipientCity>
//             <recipientContactName>Jean Dupont</recipientContactName>
//             <recipientCountry>MQ</recipientCountry>
//             <recipientCountryName>Martinique</recipientCountryName>
//             <recipientEmail>client@test.fr</recipientEmail>
//             <recipientMobilePhone></recipientMobilePhone>
//             <recipientName>TEST CLIENT</recipientName>
//             <recipientName2>Jean Dupont</recipientName2>
//             <recipientPhone>+596596123456</recipientPhone>
//             <recipientPreAlert>0</recipientPreAlert>
//             <recipientZipCode>97200</recipientZipCode>
//          </recipientValue>
         
//          <refValue>
//             <recipientRef>COMMANDE ${orderId}</recipientRef>
//             <shipperRef>REF EXP ${orderId}</shipperRef>
//          </refValue>
         
//          <skybillValue>
//             <bulkNumber>1</bulkNumber>
//             <codCurrency> </codCurrency>
//             <codValue> </codValue>
//             <content1>Telephone smartphone</content1>
//             <content2> </content2>
//             <content3> </content3>
//             <content4> </content4>
//             <content5> </content5>
//             <customsCurrency> </customsCurrency>
//             <customsValue> </customsValue>
//             <evtCode>DC</evtCode>
//             <insuredCurrency> </insuredCurrency>
//             <insuredValue> </insuredValue>
//             <latitude> </latitude>
//             <longitude> </longitude>
//             <masterSkybillNumber> </masterSkybillNumber>
//             <objectType>MAR</objectType>
//             <portCurrency> </portCurrency>
//             <portValue> </portValue>
//             <productCode>17</productCode>
//             <qualite></qualite>
//             <service>0</service>
//             <shipDate></shipDate>
//             <shipHour></shipHour>
//             <skybillRank>1</skybillRank>
//             <source></source>
//             <weight>1</weight>
//             <weightUnit>KGM</weightUnit>
//             <height>1</height>
//             <length>1</length>
//             <width>1</width>
//             <alternateProductCode></alternateProductCode>
//          </skybillValue>
         
//          <skybillParamsValue>
//             <duplicata>N</duplicata>
//             <mode>PDF</mode>
//             <withReservation>0</withReservation>
//          </skybillParamsValue>
         
//          <password>255562</password>
//          <modeRetour>2</modeRetour>
//          <numberOfParcel>1</numberOfParcel>
//          <version>2.0</version>
//          <multiParcel>N</multiParcel>
//        </cxf:shippingMultiParcelV4>
//    </soapenv:Body>
// </soapenv:Envelope>`;
    
//     console.log('📤 Envoi de la requête SOAP à Chronopost...');
    
//     // ✅ CORRECTION : Enlever ?wsdl de l'URL
//     const response = await fetch('https://ws.chronopost.fr/shipping-cxf/ShippingServiceWS', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'text/xml; charset=utf-8',
//         'SOAPAction': ''
//       },
//       body: soapRequest
//     });
    
//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ Erreur HTTP:', response.status, response.statusText);
//       console.error('Réponse erreur:', errorText.substring(0, 1000));
//       throw new Error(`Chronopost API error: ${response.status} ${response.statusText}`);
//     }
    
//     const xmlResponse = await response.text();
//     console.log('📥 Réponse XML reçue');
//     console.log('📄 Longueur:', xmlResponse.length);
//     console.log('📄 Aperçu:', xmlResponse.substring(0, 500));
    
//     // Parser le XML
//     const parsed = await parseStringPromise(xmlResponse, { 
//       explicitArray: false,
//       ignoreAttrs: false,
//       tagNameProcessors: [(name) => name.replace(/^.*:/, '')] // Enlève les namespaces
//     });
    
//     console.log('🔍 Clés racine:', Object.keys(parsed));
    
//     // ✅ Navigation dans la structure SOAP
//     const envelope = parsed.Envelope;
//     const body = envelope?.Body;
//     const response_data = body?.shippingMultiParcelV4Response;
//     const returnData = response_data?.return;
    
//     if (!returnData) {
//       console.error('❌ Structure invalide');
//       console.log('Parsed:', JSON.stringify(parsed, null, 2).substring(0, 2000));
      
//       return NextResponse.json({
//         success: false,
//         error: 'Structure de réponse XML invalide',
//         debug: {
//           hasEnvelope: !!envelope,
//           hasBody: !!body,
//           hasResponse: !!response_data,
//           hasReturn: !!returnData,
//           keys: Object.keys(parsed)
//         }
//       }, { status: 400 });
//     }
    
//     // Vérifier les erreurs
//     const errorCode = returnData.errorCode || '0';
//     const errorMessage = returnData.errorMessage || '';
    
//     console.log('📋 Code erreur:', errorCode);
    
//     if (errorCode !== '0') {
//       console.error('❌ Erreur Chronopost:', errorCode, errorMessage);
      
//       let detailedError = errorMessage;
//       switch(errorCode) {
//         case '1':
//           detailedError = 'Compte Chronopost invalide ou inactif';
//           break;
//         case '2':
//           detailedError = 'Mot de passe incorrect';
//           break;
//         case '3':
//           detailedError = 'Code produit invalide (essayez 17 pour DOM)';
//           break;
//         case '4':
//           detailedError = 'Adresse expéditeur invalide';
//           break;
//         case '5':
//           detailedError = 'Adresse destinataire invalide';
//           break;
//         case '29':
//           detailedError = 'Service échoué - Vérifiez: codes pays (GF/MQ/GP), code produit (17), poids (>0)';
//           break;
//         default:
//           detailedError = `${errorMessage} (Code: ${errorCode})`;
//       }
      
//       return NextResponse.json({
//         success: false,
//         error: detailedError,
//         errorCode: errorCode,
//         rawError: errorMessage
//       }, { status: 400 });
//     }
    
//     // Extraire les données
//     const resultMultiParcelValue = returnData.resultMultiParcelValue;
    
//     if (!resultMultiParcelValue) {
//       console.error('❌ resultMultiParcelValue non trouvé');
//       return NextResponse.json({
//         success: false,
//         error: 'Données de l\'étiquette non trouvées',
//         debug: returnData
//       }, { status: 400 });
//     }
    
//     const skybillNumber = resultMultiParcelValue.skybillNumber;
//     const pdfEtiquette = resultMultiParcelValue.pdfEtiquette;
    
//     if (!pdfEtiquette) {
//       console.error('❌ PDF non trouvé');
//       return NextResponse.json({
//         success: false,
//         error: 'Étiquette PDF non générée',
//         debug: resultMultiParcelValue
//       }, { status: 400 });
//     }
    
//     console.log('✅ Étiquette générée avec succès');
//     console.log('📦 Numéro de suivi:', skybillNumber);
//     console.log('📄 Taille du PDF:', pdfEtiquette.length, 'caractères');
    
//     return NextResponse.json({
//       success: true,
//       skybillNumber,
//       pdfEtiquette,
//       additionalInfo: {
//         codeDepot: resultMultiParcelValue.codeDepot,
//         codeService: resultMultiParcelValue.codeService,
//         serviceName: resultMultiParcelValue.serviceName,
//         geoPostNumeroColis: resultMultiParcelValue.geoPostNumeroColis
//       },
//       message: 'Étiquette créée avec succès'
//     });
    
//   } catch (error: any) {
//     console.error('❌ Erreur:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Erreur lors de la création de l\'étiquette',
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     }, { status: 500 });
//   }
// }