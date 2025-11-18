// lib/pdf/InvoiceTemplate.tsx

import React, { ReactElement } from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// ==================== TYPES ====================

interface InvoiceData {
  // Informations facture
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  
  // Informations entreprise
  company: {
    name: string;
    legalName: string;
    siren: string;
    vatNumber: string;
    address: string[];
    logoUrl?: string;
  };
  
  // Client
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      postalCode: string;
      city: string;
      country: string;
    };
  };
  
  // Articles
  items: Array<{
    itemNumber: string;
    reference: string;
    description: string;
    brand: string;
    storage?: string;
    colorName: string;
    quantity: number;
    unitPriceHT: number;
    totalHT: number;
    vatRate: number;
  }>;
  
  // Totaux
  totals: {
    subtotalHT: number;
    shippingCostHT: number;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    vatDetails: Array<{
      rate: number;
      baseHT: number;
      vatAmount: number;
    }>;
  };
  
  // Informations supplémentaires
  locality: string;
  customerReference?: string;
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // En-tête avec logo et titre FACTURE
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: 'contain',
  },
  invoiceTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  
  // Informations entreprise (en haut à gauche)
  companySection: {
    marginBottom: 30,
    fontSize: 10,
    lineHeight: 1.4,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 9,
    marginBottom: 1,
  },
  
  // Bloc d'informations facture et commande
  invoiceInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 40,
  },
  invoiceInfoBox: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 10,
  },
  infoLabel: {
    width: 130,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  
  // Adresses (côte à côte)
  addressesSection: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
  },
  addressBox: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  addressName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  // Tableau des articles
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #cccccc',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontSize: 9,
  },
  
  // Colonnes du tableau (largeurs fixes comme dans l'exemple)
  colRef: { width: 80, paddingRight: 5 },
  colDescription: { flex: 1, paddingRight: 5 },
  colQty: { width: 40, textAlign: 'right', paddingRight: 5 },
  colUnitPrice: { width: 80, textAlign: 'right', paddingRight: 5 },
  colTotal: { width: 80, textAlign: 'right', paddingRight: 5 },
  colVat: { width: 50, textAlign: 'right' },
  
  descriptionBold: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  descriptionDetail: {
    fontSize: 8,
    color: '#666666',
  },
  
  // Section totaux (à droite)
  totalsSection: {
    marginLeft: 'auto',
    width: '45%',
    marginTop: 20,
  },
  
  // Tableau récapitulatif TVA
  vatTable: {
    marginBottom: 15,
    border: '1 solid #000000',
  },
  vatTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: 'bold',
    borderBottom: '1 solid #000000',
  },
  vatTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    borderBottom: '1 solid #cccccc',
  },
  vatColRate: { flex: 1 },
  vatColBase: { flex: 1, textAlign: 'right' },
  vatColAmount: { flex: 1, textAlign: 'right' },
  
  // Lignes de totaux
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  totalRowBold: {
    fontWeight: 'bold',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  // Notes en bas
  notesSection: {
    marginTop: 40,
    paddingTop: 15,
    borderTop: '1 solid #cccccc',
  },
  notesText: {
    fontSize: 8,
    lineHeight: 1.4,
    textAlign: 'center',
  },
  
  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
    paddingTop: 10,
  },
});

// ==================== COMPOSANT PDF ====================

export const InvoicePDFDocument = ({ data }: { data: InvoiceData }): ReactElement => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' €';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* EN-TÊTE : Logo à gauche, FACTURE à droite */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.company.logoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.company.logoUrl} style={styles.logo} />
            )}
          </View>
          <Text style={styles.invoiceTitle}>FACTURE</Text>
        </View>

        {/* INFORMATIONS ENTREPRISE (en haut à gauche) */}
        <View style={styles.companySection}>
          <Text style={styles.companyName}>{data.company.legalName}</Text>
          {data.company.address.map((line, index) => (
            <Text key={index} style={styles.companyDetail}>{line}</Text>
          ))}
          <Text style={styles.companyDetail}>SIREN: {data.company.siren}</Text>
          <Text style={styles.companyDetail}>TVA: {data.company.vatNumber}</Text>
        </View>

        {/* INFORMATIONS FACTURE ET COMMANDE (deux colonnes) */}
        <View style={styles.invoiceInfoSection}>
          <View style={styles.invoiceInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>N° de facture:</Text>
              <Text style={styles.infoValue}>{data.invoiceNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de facture:</Text>
              <Text style={styles.infoValue}>{formatDate(data.invoiceDate)}</Text>
            </View>
          </View>
          
          <View style={styles.invoiceInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>N° de commande:</Text>
              <Text style={styles.infoValue}>{data.orderNumber}</Text>
            </View>
            {data.customerReference && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Référence client:</Text>
                <Text style={styles.infoValue}>{data.customerReference}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ADRESSES CLIENT (Facturation et Livraison côte à côte) */}
        <View style={styles.addressesSection}>
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Adresse de facturation</Text>
            <View style={styles.addressText}>
              <Text style={styles.addressName}>{data.customer.fullName}</Text>
              <Text>{data.customer.address.line1}</Text>
              {data.customer.address.line2 && <Text>{data.customer.address.line2}</Text>}
              <Text>{data.customer.address.postalCode} {data.customer.address.city}</Text>
              <Text>{data.customer.address.country}</Text>
              <Text>Tél: {data.customer.phone}</Text>
              <Text>Email: {data.customer.email}</Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Adresse de livraison</Text>
            <View style={styles.addressText}>
              <Text style={styles.addressName}>{data.customer.fullName}</Text>
              <Text>{data.customer.address.line1}</Text>
              {data.customer.address.line2 && <Text>{data.customer.address.line2}</Text>}
              <Text>{data.customer.address.postalCode} {data.customer.address.city}</Text>
              <Text>{data.customer.address.country}</Text>
            </View>
          </View>
        </View>

        {/* TABLEAU DES ARTICLES */}
        <View style={styles.table}>
          {/* En-tête du tableau */}
          <View style={styles.tableHeader}>
            <Text style={styles.colRef}>Réf.</Text>
            <Text style={styles.colDescription}>Désignation</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnitPrice}>Prix unit. HT</Text>
            <Text style={styles.colTotal}>Total HT</Text>
            <Text style={styles.colVat}>TVA %</Text>
          </View>

          {/* Lignes d'articles */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colRef}>{item.reference}</Text>
              <View style={styles.colDescription}>
                <Text style={styles.descriptionBold}>{item.description}</Text>
                <Text style={styles.descriptionDetail}>
                  {item.brand} - {item.storage} - {item.colorName}
                </Text>
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{formatCurrency(item.unitPriceHT)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.totalHT)}</Text>
              <Text style={styles.colVat}>{item.vatRate.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        {/* SECTION TOTAUX (alignée à droite) */}
        <View style={styles.totalsSection}>
          {/* Tableau récapitulatif TVA */}
          <View style={styles.vatTable}>
            <View style={styles.vatTableHeader}>
              <Text style={styles.vatColRate}>Taux TVA</Text>
              <Text style={styles.vatColBase}>Base HT</Text>
              <Text style={styles.vatColAmount}>Montant TVA</Text>
            </View>
            
            {data.totals.vatDetails.map((vat, index) => (
              <View key={index} style={styles.vatTableRow}>
                <Text style={styles.vatColRate}>{vat.rate.toFixed(1)}%</Text>
                <Text style={styles.vatColBase}>{formatCurrency(vat.baseHT)}</Text>
                <Text style={styles.vatColAmount}>{formatCurrency(vat.vatAmount)}</Text>
              </View>
            ))}
          </View>

          {/* Totaux */}
          <View style={styles.totalRow}>
            <Text>Total HT:</Text>
            <Text>{formatCurrency(data.totals.totalHT)}</Text>
          </View>

          {data.totals.shippingCostHT > 0 && (
            <View style={styles.totalRow}>
              <Text>Frais de livraison HT:</Text>
              <Text>{formatCurrency(data.totals.shippingCostHT)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text>Total TVA:</Text>
            <Text>{formatCurrency(data.totals.totalVAT)}</Text>
          </View>

          {/* Total TTC final */}
          <View style={styles.finalTotalRow}>
            <Text>TOTAL TTC:</Text>
            <Text>{formatCurrency(data.totals.totalTTC)}</Text>
          </View>
        </View>

        {/* NOTES / CONDITIONS */}
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>
            Paiement comptant
          </Text>
          {/* <Text style={styles.notesText}>
            Merci pour votre confiance ! - Livraison gratuite en {data.locality}
          </Text> */}
        </View>

        {/* PIED DE PAGE
        <View style={styles.footer}>
          <Text>Page 1 sur 1</Text>
        </View> */}
      </Page>
    </Document>
  );
};

export default InvoicePDFDocument;