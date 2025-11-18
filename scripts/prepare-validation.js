// scripts/prepare-validation.js
// Script pour préparer le dossier de validation Chronopost
// Exécuter avec: node scripts/prepare-validation.js

const fs = require('fs');
const path = require('path');

const VALIDATION_DIR = path.join(process.cwd(), 'validation_logs');
const OUTPUT_DIR = path.join(process.cwd(), 'validation_chronopost');

console.log('🚀 Préparation du dossier de validation Chronopost...\n');

// Créer le dossier de sortie
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Traiter Chrono Express
const chronoExpressDir = path.join(VALIDATION_DIR, 'chrono-express');
if (fs.existsSync(chronoExpressDir)) {
  console.log('📦 Traitement Chrono Express...');
  
  const outputExpressDir = path.join(OUTPUT_DIR, 'chrono_express');
  if (!fs.existsSync(outputExpressDir)) {
    fs.mkdirSync(outputExpressDir, { recursive: true });
  }
  
  const files = fs.readdirSync(chronoExpressDir);
  
  // Trouver les derniers fichiers générés
  const requestFile = files
    .filter(f => f.includes('_request_'))
    .sort()
    .reverse()[0];
  
  const responseFile = files
    .filter(f => f.includes('_response_'))
    .sort()
    .reverse()[0];
  
  const labelFile = files
    .filter(f => f.includes('_label_'))
    .sort()
    .reverse()[0];
  
  if (requestFile) {
    fs.copyFileSync(
      path.join(chronoExpressDir, requestFile),
      path.join(outputExpressDir, 'request.xml')
    );
    console.log('  ✅ request.xml copié');
  }
  
  if (responseFile) {
    fs.copyFileSync(
      path.join(chronoExpressDir, responseFile),
      path.join(outputExpressDir, 'response.xml')
    );
    console.log('  ✅ response.xml copié');
  }
  
  if (labelFile) {
    // Convertir le base64 en PDF
    const base64Content = fs.readFileSync(
      path.join(chronoExpressDir, labelFile),
      'utf8'
    );
    
    const pdfBuffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(
      path.join(outputExpressDir, 'etiquette.pdf'),
      pdfBuffer
    );
    console.log('  ✅ etiquette.pdf généré');
  }
}

// Traiter Chrono Relais (si vous l'utilisez)
const chronoRelaisDir = path.join(VALIDATION_DIR, 'chrono-relais');
if (fs.existsSync(chronoRelaisDir)) {
  console.log('\n📦 Traitement Chrono Relais...');
  
  const outputRelaisDir = path.join(OUTPUT_DIR, 'chrono_relais');
  if (!fs.existsSync(outputRelaisDir)) {
    fs.mkdirSync(outputRelaisDir, { recursive: true });
  }
  
  // Même logique pour les relais
  const files = fs.readdirSync(chronoRelaisDir);
  
  const searchRequestFile = files
    .filter(f => f.includes('search_request'))
    .sort()
    .reverse()[0];
  
  const searchResponseFile = files
    .filter(f => f.includes('search_response'))
    .sort()
    .reverse()[0];
    
  const shippingRequestFile = files
    .filter(f => f.includes('shipping_request'))
    .sort()
    .reverse()[0];
  
  const shippingResponseFile = files
    .filter(f => f.includes('shipping_response'))
    .sort()
    .reverse()[0];
  
  const labelFile = files
    .filter(f => f.includes('_label_'))
    .sort()
    .reverse()[0];
  
  if (searchRequestFile) {
    fs.copyFileSync(
      path.join(chronoRelaisDir, searchRequestFile),
      path.join(outputRelaisDir, 'search_request.xml')
    );
    console.log('  ✅ search_request.xml copié');
  }
  
  if (searchResponseFile) {
    fs.copyFileSync(
      path.join(chronoRelaisDir, searchResponseFile),
      path.join(outputRelaisDir, 'search_response.xml')
    );
    console.log('  ✅ search_response.xml copié');
  }
  
  if (shippingRequestFile) {
    fs.copyFileSync(
      path.join(chronoRelaisDir, shippingRequestFile),
      path.join(outputRelaisDir, 'shipping_request.xml')
    );
    console.log('  ✅ shipping_request.xml copié');
  }
  
  if (shippingResponseFile) {
    fs.copyFileSync(
      path.join(chronoRelaisDir, shippingResponseFile),
      path.join(outputRelaisDir, 'shipping_response.xml')
    );
    console.log('  ✅ shipping_response.xml copié');
  }
  
  if (labelFile) {
    const base64Content = fs.readFileSync(
      path.join(chronoRelaisDir, labelFile),
      'utf8'
    );
    
    const pdfBuffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(
      path.join(outputRelaisDir, 'etiquette.pdf'),
      pdfBuffer
    );
    console.log('  ✅ etiquette.pdf généré');
  }
}

console.log('\n✅ Dossier de validation prêt dans: validation_chronopost/');
console.log('📧 Vous pouvez maintenant zipper ce dossier et l\'envoyer à Chronopost\n');