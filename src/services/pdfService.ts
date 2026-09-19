import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Rental, Vehicle, Driver } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatTelephone } from '../utils/validation';

/**
 * Service d'export PDF et d'impression professionnelle pour Janen_Car
 */

// Couleurs de marque Janen_Car
const BRAND_PRIMARY = [37, 99, 235] as [number, number, number]; // Blue 600
const BRAND_DARK = [15, 23, 42] as [number, number, number]; // Slate 900
const BRAND_ACCENT = [16, 185, 129] as [number, number, number]; // Emerald 500
const TEXT_MUTED = [100, 116, 139] as [number, number, number]; // Slate 500

/**
 * 1. CONTRAT DE LOCATION OFFICIEL JANEN_CAR (PDF)
 */
/**
 * Dessine un schéma vectoriel de voiture simplifié pour le contrôle des dommages (scratches / dents)
 */
function drawCarSchema(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(100, 116, 139); // slate-500
  doc.setLineWidth(0.3);
  
  // Side view (Vue de profil)
  // Body top
  doc.line(x + 5, y + 15, x + 15, y + 10);
  doc.line(x + 15, y + 10, x + 30, y + 10);
  doc.line(x + 30, y + 10, x + 40, y + 15);
  // Hood and trunk
  doc.line(x + 5, y + 15, x + 1, y + 15);
  doc.line(x + 40, y + 15, x + 44, y + 15);
  // Bumpers down
  doc.line(x + 1, y + 15, x + 1, y + 20);
  doc.line(x + 44, y + 15, x + 44, y + 20);
  // Bottom line (connecting wheels)
  doc.line(x + 1, y + 20, x + 8, y + 20);
  doc.line(x + 14, y + 20, x + 31, y + 20);
  doc.line(x + 37, y + 20, x + 44, y + 20);
  // Wheels (ellipse)
  doc.ellipse(x + 11, y + 20, 3, 3);
  doc.ellipse(x + 34, y + 20, 3, 3);
  
  // Top view (Vue de dessus)
  const tx = x + 50;
  doc.rect(tx, y + 6, 35, 16, 'S');
  // Windshield
  doc.line(tx + 8, y + 6, tx + 10, y + 10);
  doc.line(tx + 8, y + 22, tx + 10, y + 18);
  doc.line(tx + 10, y + 10, tx + 10, y + 18);
  // Rear window
  doc.line(tx + 27, y + 6, tx + 25, y + 10);
  doc.line(tx + 27, y + 22, tx + 25, y + 18);
  doc.line(tx + 25, y + 10, tx + 25, y + 18);
  // Cabin sides
  doc.line(tx + 10, y + 10, tx + 25, y + 10);
  doc.line(tx + 10, y + 18, tx + 25, y + 18);
}

export function generateRentalContractPdf(rental: Rental, vehicle?: Vehicle, isBlank: boolean = false): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Contract-only visual system. Business values and calculations are intentionally unchanged.
  const C = {
    blue: BRAND_PRIMARY,
    navy: BRAND_DARK,
    muted: TEXT_MUTED,
    line: [203, 213, 225] as [number, number, number],
    soft: [248, 250, 252] as [number, number, number],
    paleBlue: [239, 246, 255] as [number, number, number],
    red: [220, 38, 38] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };
  const margin = 11;
  const gap = 5;
  const contentW = pageWidth - margin * 2;
  const colW = (contentW - gap) / 2;
  const leftX = margin;
  const rightX = margin + colW + gap;

  const blankLine = '____________________________';
  const val = (value?: string | number, blank = blankLine) => {
    if (isBlank || value === undefined || value === null || value === '') return blank;
    return String(value);
  };
  const money = (value?: number) => val(value !== undefined ? `${value} TND` : undefined, '________ TND');

  const section = (x: number, y: number, w: number, h: number, title: string, subtitle?: string) => {
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 1.8, 1.8, 'FD');
    doc.setFillColor(...C.paleBlue);
    doc.roundedRect(x, y, w, 8, 1.8, 1.8, 'F');
    doc.rect(x, y + 5.5, w, 2.5, 'F');
    doc.setTextColor(...C.blue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.text(title, x + 3, y + 4.1);
    if (subtitle) {
      doc.setTextColor(...C.muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.text(subtitle, x + 3, y + 6.6);
    }
  };

  const field = (x: number, y: number, label: string, value: string, maxW: number, opts?: { accent?: boolean; valueX?: number }) => {
    const valueX = opts?.valueX ?? 33;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(...C.muted);
    doc.text(label, x, y);
    doc.setFont('helvetica', opts?.accent ? 'bold' : 'normal');
    doc.setTextColor(...(opts?.accent ? C.navy : C.navy));
    doc.setFontSize(opts?.accent ? 7.2 : 6.8);
    const lines = doc.splitTextToSize(value, Math.max(12, maxW - valueX));
    doc.text(lines.slice(0, 2), x + valueX, y, { lineHeightFactor: 1.12 });
  };

  const miniField = (x: number, y: number, w: number, label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.7);
    doc.setTextColor(...C.muted);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.navy);
    const lines = doc.splitTextToSize(value, w);
    doc.text(lines.slice(0, 2), x, y + 3.4, { lineHeightFactor: 1.05 });
  };

  // HEADER - restrained administrative style, no page frame.
  doc.setFillColor(...C.blue);
  doc.roundedRect(margin, 10, 5, 27, 1.5, 1.5, 'F');
  doc.setTextColor(...C.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('CAR DEL JANENE', margin + 9, 17);
  doc.setFontSize(9.2);
  doc.setTextColor(...C.blue);
  doc.text('CONTRAT DE LOCATION', margin + 9, 22.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.setFontSize(7.4);
  doc.text('Rental Agreement', margin + 9, 26.2);

  doc.setFillColor(...C.soft);
  doc.setDrawColor(...C.line);
  doc.roundedRect(pageWidth - margin - 44, 10, 44, 15, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(...C.muted);
  doc.text('CONTRAT N° / AGREEMENT NO.', pageWidth - margin - 40, 15);
  doc.setFontSize(12);
  doc.setTextColor(...C.red);
  const contractNum = isBlank ? '0064647' : String(rental.numero).padStart(6, '0');
  doc.text(contractNum, pageWidth - margin - 4, 21.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.1);
  doc.setTextColor(...C.muted);
  doc.text('78, Avenue Habib Bougatfa - Bardo  |  Capital : 100.000 DT  |  Code TVA : 1179846 H/A/M/000', margin + 9, 31.1);
  doc.text('Tél : 71 773 242  |  Fax : 71 773 224  |  Portable : 27 272 770 - 27 272 760 - 27 272 761', margin + 9, 34.2);
  doc.text('www.janenecar.com  |  contact@janenecar.com', margin + 9, 37.3);
  doc.setDrawColor(...C.line);
  doc.line(margin, 40.5, pageWidth - margin, 40.5);

  // LEFT - RENTER
  let yL = 44;
  section(leftX, yL, colW, 73, 'IDENTIFICATION DU LOCATAIRE', 'RENTER INFORMATION');
  const renterX = leftX + 3;
  let fy = yL + 13;
  const rStep = 6.0;
  const birth = (rental.dateNaissance || rental.lieuNaissance)
    ? `${rental.dateNaissance || ''}${rental.lieuNaissance ? ` - ${rental.lieuNaissance}` : ''}` : undefined;
  const issued = (rental.cinDate || rental.cinLieu)
    ? `${rental.cinDate || ''}${rental.cinLieu ? ` - ${rental.cinLieu}` : ''}` : undefined;
  const license = (rental.permisNumero || rental.permisDate || rental.permisLieu)
    ? `${rental.permisNumero || ''}${rental.permisDate ? ` | ${rental.permisDate}` : ''}${rental.permisLieu ? ` | ${rental.permisLieu}` : ''}` : undefined;
  field(renterX, fy, 'Nom et prénom / Name', val(rental.chauffeur), colW - 6, { accent: true }); fy += rStep;
  field(renterX, fy, 'Naissance / Birth', val(birth), colW - 6); fy += rStep;
  field(renterX, fy, 'Nationalité / Nationality', val(rental.nationalite), colW - 6); fy += rStep;
  field(renterX, fy, "Entrée Tunisie / Entry", val(rental.dateEntreeTunisie), colW - 6); fy += rStep;
  field(renterX, fy, 'CIN / Passeport', val(rental.cinOuPasseport), colW - 6); fy += rStep;
  field(renterX, fy, 'Délivré / Issued', val(issued), colW - 6); fy += rStep;
  field(renterX, fy, 'Adresse permanente', val(rental.adressePermanente), colW - 6); fy += rStep;
  field(renterX, fy, 'Adresse en Tunisie', val(rental.adresseTunisie), colW - 6); fy += rStep;
  field(renterX, fy, 'Téléphone / Phone', val(formatTelephone(rental.telephone)), colW - 6); fy += rStep;
  field(renterX, fy, 'Permis / License', val(license), colW - 6);

  // LEFT - ADDITIONAL DRIVER
  yL = 121;
  section(leftX, yL, colW, 45, 'CONDUCTEUR ADDITIONNEL', 'ADDITIONAL DRIVER');
  fy = yL + 13;
  const secCin = (rental.conducteurSecCin || rental.conducteurSecCinDate)
    ? `${rental.conducteurSecCin || ''}${rental.conducteurSecCinDate ? ` | ${rental.conducteurSecCinDate}` : ''}` : undefined;
  const secLicense = (rental.conducteurSecPermis || rental.conducteurSecPermisDate)
    ? `${rental.conducteurSecPermis || ''}${rental.conducteurSecPermisDate ? ` | ${rental.conducteurSecPermisDate}` : ''}` : undefined;
  field(renterX, fy, 'Nom / Name', val(rental.conducteurSecNom), colW - 6); fy += 6.4;
  field(renterX, fy, 'CIN / Passeport', val(secCin), colW - 6); fy += 6.4;
  field(renterX, fy, 'Permis / License', val(secLicense), colW - 6); fy += 6.4;
  field(renterX, fy, 'Adresse / Address', val(rental.conducteurSecAdresse), colW - 6); fy += 6.4;
  field(renterX, fy, 'Téléphone / Phone', val(rental.conducteurSecTelephone), colW - 6);

  // RIGHT - VEHICLE
  let yR = 44;
  section(rightX, yR, colW, 48, 'VÉHICULE', 'VEHICLE');
  const vx = rightX + 3;
  field(vx, yR + 13, 'Marque / Modèle', val(rental.marque ? `${rental.marque} ${rental.modele}` : undefined), colW - 6, { accent: true });
  field(vx, yR + 20, 'Immatriculation', val(rental.matricule), colW - 6, { accent: true });
  doc.setDrawColor(...C.line);
  doc.line(vx, yR + 24, rightX + colW - 3, yR + 24);
  const meterW = (colW - 12) / 2;
  miniField(vx, yR + 29, meterW, 'KILOMÉTRAGE DÉPART / OUT', '________ km');
  miniField(vx + meterW + 6, yR + 29, meterW, 'KILOMÉTRAGE RETOUR / IN', '________ km');
  miniField(vx, yR + 39, colW - 6, 'KILOMÉTRAGE PARCOURU / DRIVEN', '________________ km');

  // RIGHT - RENTAL DETAILS
  yR = 96;
  section(rightX, yR, colW, 55, 'DÉTAILS DE LOCATION', 'RENTAL DETAILS');
  fy = yR + 13;
  field(vx, fy, 'Lieu de départ', 'Bardo, Tunis', colW - 6); fy += 6.2;
  field(vx, fy, 'Départ / Out', val(rental.dateDepart ? `${formatDisplayDate(rental.dateDepart)} à 12h00` : undefined), colW - 6); fy += 6.2;
  field(vx, fy, 'Lieu de retour', 'Bardo, Tunis', colW - 6); fy += 6.2;
  field(vx, fy, 'Retour / In', val(rental.dateRetour ? `${formatDisplayDate(rental.dateRetour)} à 12h00` : undefined), colW - 6); fy += 6.2;
  field(vx, fy, 'Tarif journalier', val(rental.prixParJour ? `${rental.prixParJour} TND / jour` : undefined, '________ TND / jour'), colW - 6, { accent: true });
  // Dedicated duration card to prevent collision with the next section.
  doc.setFillColor(...C.soft);
  doc.roundedRect(vx, yR + 43, colW - 6, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.8); doc.setTextColor(...C.muted);
  doc.text('DURÉE DE LOCATION / RENTAL PERIOD', vx + 2.5, yR + 46.3);
  doc.setFontSize(8); doc.setTextColor(...C.navy);
  doc.text(val(rental.nombreJours ? `${rental.nombreJours} Jours` : undefined, '________ Jours'), rightX + colW - 5, yR + 48.2, { align: 'right' });

  // RIGHT - FINANCIAL SUMMARY
  yR = 155;
  section(rightX, yR, colW, 60, 'RÉCAPITULATIF FINANCIER', 'FINANCIAL SUMMARY');
  const rentNet = rental.prixParJour && rental.nombreJours ? rental.prixParJour * rental.nombreJours : undefined;
  const finalTotalAmount = rental.prixParJour && rental.nombreJours ? (rental.prixParJour * rental.nombreJours) + 3 : undefined;
  let fny = yR + 13;
  const financeRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(6.8); doc.setTextColor(...C.navy);
    doc.text(label, vx, fny);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, rightX + colW - 3, fny, { align: 'right' });
    fny += 5.6;
  };
  financeRow('Location / Rent', money(rentNet));
  financeRow('Autres charges / Other charges', '0 TND');
  financeRow('TVA (19%) / Taxes', 'Incluse');
  financeRow("Timbre d'enreg. / Taxe location", '3.000 TND');
  doc.setDrawColor(...C.line); doc.line(vx, fny - 2, rightX + colW - 3, fny - 2);
  doc.setFillColor(...C.paleBlue); doc.roundedRect(vx, fny, colW - 6, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...C.blue);
  doc.text('TOTAL GÉNÉRAL T.T.C. / TOTAL', vx + 2.5, fny + 4.1);
  doc.setFontSize(10); doc.setTextColor(...C.navy);
  doc.text(money(finalTotalAmount), rightX + colW - 5, fny + 7.3, { align: 'right' });
  fny += 14;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.8); doc.setTextColor(...C.muted);
  doc.text('CAUTION / DEPOSIT', vx, fny);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.6); doc.setTextColor(...C.navy);
  doc.text('Empreinte de Carte / Chèque', vx, fny + 4);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.8); doc.setTextColor(...C.muted);
  doc.text('NIVEAU DE CARBURANT / FUEL LEVEL', vx, fny + 9);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.navy);
  doc.text('[ ] 1/4      [ ] 2/4      [ ] 3/4      [ ] 4/4', vx, fny + 13);

  // BOTTOM - VEHICLE INSPECTION
  const bottomY = 170;
  section(leftX, bottomY, colW, 54, 'ÉTAT EXTÉRIEUR DU VÉHICULE', 'VEHICLE DAMAGE INSPECTION');
  drawCarSchema(doc, leftX + 5, bottomY + 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8); doc.setTextColor(...C.muted);
  doc.text('Observations / Damage notes :', leftX + 3, bottomY + 42);
  doc.setDrawColor(...C.line);
  doc.line(leftX + 3, bottomY + 46, leftX + colW - 3, bottomY + 46);
  doc.line(leftX + 3, bottomY + 50, leftX + colW - 3, bottomY + 50);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.4); doc.setTextColor(...C.red);
  doc.text('Assurance Non Tous Risques / Optionnel', leftX + 3, bottomY + 53);

  // PAYMENT + SIGNATURES across page width.
  const signY = 228;
  section(margin, signY, contentW, 43, 'MODE DE RÈGLEMENT & SIGNATURES', 'PAYMENT METHOD & SIGNATURES');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.navy);
  doc.text('[ ] Espèces / Cash     [ ] Carte / Card     [ ] Chèque / Cheque     [ ] Virement / Transfer', margin + 4, signY + 14);
  doc.setDrawColor(...C.line);
  doc.line(pageWidth / 2, signY + 19, pageWidth / 2, signY + 39);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(...C.navy);
  doc.text('LE LOCATAIRE / RENTER', margin + 4, signY + 24);
  doc.text('CAR DEL JANENE - AGENT / RESPONSABLE', pageWidth / 2 + 4, signY + 24);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6); doc.setTextColor(...C.muted);
  doc.text('Signature précédée de la mention « Lu et approuvé »', margin + 4, signY + 28);
  doc.text('Bardo, le ' + new Date().toLocaleDateString('fr-FR'), pageWidth / 2 + 4, signY + 28);
  doc.setDrawColor(...C.muted);
  doc.line(margin + 4, signY + 38, pageWidth / 2 - 7, signY + 38);
  doc.line(pageWidth / 2 + 4, signY + 38, pageWidth - margin - 4, signY + 38);

  // LEGAL FOOTER - exact existing legal text retained.
  const legalY = 276;
  doc.setDrawColor(...C.line); doc.line(margin, legalY - 3, pageWidth - margin, legalY - 3);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted); doc.setFontSize(5.5);
  doc.text("NOTE IMPORTANTE : Le Kilométrage est limité à 200 Km / Jour. L'excès est facturé à base de 450 millimes / Km.", margin, legalY);
  doc.text("Le Locataire est prié de prendre connaissance des conditions de location de la page de garde. Passer la date de retour prévue, le contrat n'est plus valable.", margin, legalY + 3.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.2); doc.setTextColor(148, 163, 184);
  doc.text('CONTRAT EXÉCUTABLE JANEN_CAR - DOCUMENT CONTRACTUEL ÉDITÉ ET SÉCURISÉ NUMÉRIQUEMENT', pageWidth / 2, pageHeight - 7, { align: 'center' });

  return doc;
}

/**
 * Télécharger un contrat vierge (prêt à remplir à la main)
 */
export function downloadBlankContractPdf(): void {
  const dummyRental: Rental = {
    id: 'blank',
    numero: 64647,
    marque: '',
    modele: '',
    matricule: '',
    chauffeur: '',
    telephone: '',
    dateDepart: '',
    dateRetour: '',
    nombreJours: 0,
    statut: 'Disponible',
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString()
  };
  const doc = generateRentalContractPdf(dummyRental, undefined, true);
  doc.save('Contrat_Vierge_Pret_A_Remplir_Janen_Car.pdf');
}

/**
 * Télécharger le contrat de location en PDF
 */
export function downloadRentalContractPdf(rental: Rental, vehicle?: Vehicle): void {
  const doc = generateRentalContractPdf(rental, vehicle);
  const cleanMatricule = rental.matricule.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Contrat_Location_Janen_Car_#${rental.numero}_${cleanMatricule}.pdf`);
}

/**
 * Imprimer le contrat de manière 100% fiable :
 * Génère le contrat dans un iframe d'impression avec CSS @page propre, et déclenche l'impression
 */
export function printRentalContract(rental: Rental, vehicle?: Vehicle): void {
  try {
    const doc = generateRentalContractPdf(rental, vehicle);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // Création d'un iframe caché pour l'impression directe du document
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    printIframe.src = blobUrl;

    document.body.appendChild(printIframe);

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          // Si l'impression iframe est restreinte par le navigateur, on ouvre l'URL du PDF
          window.open(blobUrl, '_blank');
        }
      }, 400);
    };

    // Nettoyage après 2 minutes
    setTimeout(() => {
      document.body.removeChild(printIframe);
      URL.revokeObjectURL(blobUrl);
    }, 120000);
  } catch (err) {
    console.error('Erreur lors de l\'impression directe, fallback téléchargement :', err);
    downloadRentalContractPdf(rental, vehicle);
  }
}

/**
 * Partager le contrat de location en format PDF (utilise Web Share API si disponible,
 * sinon télécharge le fichier comme alternative avec alerte explicative).
 */
export async function shareRentalContract(rental: Rental, vehicle?: Vehicle): Promise<boolean> {
  try {
    const doc = generateRentalContractPdf(rental, vehicle);
    const blob = doc.output('blob');
    const cleanMatricule = rental.matricule.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Contrat_Location_Janen_Car_#${rental.numero}_${cleanMatricule}.pdf`;
    
    const file = new File([blob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Contrat de Location Janen_Car #${rental.numero}`,
        text: `Voici le contrat de location #${rental.numero} pour le véhicule ${rental.marque} ${rental.modele}.`,
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.warn('Sharing failed or was aborted:', error);
    return false;
  }
}

/**
 * 2. TABLEAU DE BORD DE GESTION (PDF)
 */
export function exportDashboardPdf(rentals: Rental[], vehicles: Vehicle[], drivers: Driver[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TABLEAU DE BORD DE GESTION — JANEN_CAR', 15, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Synthèse exécutive générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 15, 18);

  const totalVehicles = vehicles.length > 0 ? vehicles.length : rentals.length;
  
  const rentedCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Louée').length
    : rentals.filter((r) => r.statut === 'Louée').length;

  const reservedCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Réservée').length
    : rentals.filter((r) => r.statut === 'Réservée').length;

  const availableCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Disponible').length
    : rentals.filter((r) => r.statut === 'Disponible').length;

  const lateCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'En retard').length
    : rentals.filter((r) => r.statut === 'En retard').length;

  const returnsTodayCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === "Retour aujourd'hui").length
    : rentals.filter((r) => r.statut === "Retour aujourd'hui").length;

  const safeGetRentalAmount = (r: Rental): number => {
    const montant = Number(r.montantTotal);
    if (!isNaN(montant) && r.montantTotal !== undefined && r.montantTotal !== null && montant > 0) {
      return montant;
    }
    const prix = Number(r.prixParJour);
    const jours = Number(r.nombreJours);
    if (!isNaN(prix) && !isNaN(jours) && prix > 0 && jours > 0) {
      return prix * jours;
    }
    return 0;
  };

  const totalRevenue = rentals
    .filter((r) => r.statut === 'Louée' || r.statut === 'Réservée' || r.statut === "Retour aujourd'hui" || r.statut === 'En retard')
    .reduce((sum, r) => sum + safeGetRentalAmount(r), 0);

  // Boîtes d'indicateurs clés
  autoTable(doc, {
    startY: 32,
    margin: { left: 15, right: 15 },
    head: [['Indicateur clé', 'Valeur', 'Observations']],
    body: [
      ['Taille totale de la flotte', `${totalVehicles} véhicules`, 'Véhicules enregistrés'],
      ['Véhicules actuellement loués', `${rentedCount}`, 'En circulation avec contrat actif'],
      ['Véhicules disponibles (stock)', `${availableCount}`, 'Prêts pour nouvelle affectation'],
      ['Réservations confirmées', `${reservedCount}`, 'Départs imminents planifiés'],
      ['Retours attendus aujourd\'hui', `${returnsTodayCount}`, 'Inspection et remise en stock'],
      ['Contrats en retard d\'alerte', `${lateCount}`, lateCount > 0 ? 'ATTENTION : Relance client requise' : 'Aucun retard'],
      ['Chiffre d\'affaires actif estimé', `${totalRevenue.toLocaleString()} TND`, 'Total contrats engagés'],
      ['Chauffeurs enregistrés', `${drivers.length}`, 'Conducteurs et chauffeurs agréés'],
    ],
    theme: 'striped',
    headStyles: { fillColor: BRAND_PRIMARY, fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 100;

  // Table des contrats actifs en cours
  const activeRentals = rentals.filter((r) => r.statut !== 'Disponible');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_DARK);
  doc.text('CONTRATS ACTIFS ET AFFECTATIONS EN COURS', 15, finalY + 10);

  autoTable(doc, {
    startY: finalY + 14,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Véhicule', 'Matricule', 'Chauffeur', 'Statut', 'Période', 'Total TND']],
    body: activeRentals.map((r) => {
      const amt = r.montantTotal ?? (r.prixParJour ? r.nombreJours * r.prixParJour : 0);
      return [
        `#${r.numero}`,
        `${r.marque} ${r.modele}`,
        r.matricule,
        r.chauffeur,
        r.statut,
        `${formatDisplayDate(r.dateDepart)} → ${formatDisplayDate(r.dateRetour)} (${r.nombreJours}j)`,
        amt > 0 ? `${amt} TND` : '—',
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
  });

  doc.save(`Tableau_de_Bord_Janen_Car_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * 3. GESTION DES LOCATIONS (PDF)
 */
export function generateRentalsListPdf(rentals: Rental[]): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('LISTE DES CONTRATS ET GESTION DES LOCATIONS — JANEN_CAR', 15, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Export complet : ${rentals.length} locations — Généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 18);

  const totalAmount = rentals.reduce((acc, r) => {
    return acc + (r.montantTotal ?? (r.prixParJour ? r.nombreJours * r.prixParJour : 0));
  }, 0);

  autoTable(doc, {
    startY: 28,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Véhicule', 'Matricule', 'Chauffeur', 'Téléphone', 'Statut', 'Départ', 'Retour', 'Durée', 'Tarif/j', 'Total (TND)']],
    body: rentals.map((r) => {
      const total = r.montantTotal ?? (r.prixParJour ? r.nombreJours * r.prixParJour : 0);
      return [
        `#${r.numero}`,
        `${r.marque} ${r.modele}`,
        r.matricule,
        r.chauffeur,
        formatTelephone(r.telephone),
        r.statut,
        formatDisplayDate(r.dateDepart),
        formatDisplayDate(r.dateRetour),
        `${r.nombreJours} j`,
        r.prixParJour ? `${r.prixParJour}` : '—',
        total > 0 ? `${total}` : '—',
      ];
    }),
    foot: [
      ['', '', '', '', '', '', '', '', 'TOTAL', '', `${totalAmount.toLocaleString()} TND`],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND_PRIMARY, fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: BRAND_DARK, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 7.5 },
  });

  return doc;
}

export function exportRentalsListPdf(rentals: Rental[]): void {
  const doc = generateRentalsListPdf(rentals);
  doc.save(`Liste_Locations_Janen_Car_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * 4. PARC AUTOMOBILE / INVENTAIRE DE LA FLOTTE (PDF)
 */
export function generateVehiclesListPdf(vehicles: Vehicle[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('INVENTAIRE DU PARC AUTOMOBILE — JANEN_CAR', 15, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total véhicules : ${vehicles.length} — Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 18);

  autoTable(doc, {
    startY: 28,
    margin: { left: 15, right: 15 },
    head: [['Matricule', 'Marque & Modèle', 'Statut', 'Carburant', 'Année', 'Tarif indicatif']],
    body: vehicles.map((v) => [
      v.matricule,
      `${v.marque} ${v.modele}`,
      v.statut,
      v.carburant || 'Essence',
      v.annee ? `${v.annee}` : '—',
      v.prixParJour ? `${v.prixParJour} TND/j` : '—',
    ]),
    theme: 'grid',
    headStyles: { fillColor: BRAND_PRIMARY, fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
  });

  return doc;
}

export function exportVehiclesListPdf(vehicles: Vehicle[]): void {
  const doc = generateVehiclesListPdf(vehicles);
  doc.save(`Parc_Automobile_Janen_Car_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * 5. CHAUFFEURS & CONDUCTEURS (PDF)
 */
export function generateDriversListPdf(drivers: Driver[], rentals: Rental[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('REGISTRE DES CHAUFFEURS & CONDUCTEURS — JANEN_CAR', 15, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total conducteurs : ${drivers.length} — Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 18);

  autoTable(doc, {
    startY: 28,
    margin: { left: 15, right: 15 },
    head: [['Nom & Prénom', 'Téléphone', 'N° CIN', 'N° Permis', 'Statut', 'Véhicule en cours', 'Total locations']],
    body: drivers.map((d) => {
      // Rechercher si le chauffeur a une location en cours
      const currentRental = rentals.find(
        (r) => r.chauffeur?.toLowerCase() === d.nom?.toLowerCase() &&
               (r.statut === 'Louée' || r.statut === 'Réservée' || r.statut === "Retour aujourd'hui" || r.statut === 'En retard')
      );
      return [
        d.nom,
        formatTelephone(d.telephone),
        d.cin || '—',
        d.numeroPermis || '—',
        d.statut || 'Actif',
        currentRental ? `${currentRental.marque} (${currentRental.matricule})` : 'Aucun',
        `${d.totalLocations ?? rentals.filter((r) => r.chauffeur?.toLowerCase() === d.nom?.toLowerCase()).length}`,
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: BRAND_PRIMARY, fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
  });

  return doc;
}

export function exportDriversListPdf(drivers: Driver[], rentals: Rental[]): void {
  const doc = generateDriversListPdf(drivers, rentals);
  doc.save(`Chauffeurs_Janen_Car_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * 6. RAPPORTS & STATISTIQUES FINANCIÈRES (PDF)
 */
export function generateReportsPdf(rentals: Rental[], vehicles: Vehicle[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RAPPORT D\'ACTIVITÉ & STATISTIQUES — JANEN_CAR', 15, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Audit financier & KPIs de la flotte au ${new Date().toLocaleDateString('fr-FR')}`, 15, 18);

  const totalVehicles = vehicles.length > 0 ? vehicles.length : rentals.length;
  
  const rentedCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Louée').length
    : rentals.filter((r) => r.statut === 'Louée').length;

  const reservedCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Réservée').length
    : rentals.filter((r) => r.statut === 'Réservée').length;

  const availableCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Disponible').length
    : rentals.filter((r) => r.statut === 'Disponible').length;

  const maintenanceCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'En maintenance').length
    : rentals.filter((r) => r.statut === 'En maintenance').length;

  const returnsTodayCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === "Retour aujourd'hui").length
    : rentals.filter((r) => r.statut === "Retour aujourd'hui").length;

  const lateCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'En retard').length
    : rentals.filter((r) => r.statut === 'En retard').length;

  const occupiedCount = rentedCount + reservedCount + returnsTodayCount + lateCount;
  const occupancyRate = totalVehicles > 0 ? Math.round((occupiedCount / totalVehicles) * 100) : 0;

  const activeRentals = rentals.filter(
    (r) => r.statut === 'Louée' || r.statut === 'Réservée' || r.statut === "Retour aujourd'hui" || r.statut === 'En retard'
  );

  const safeGetRentalAmount = (r: Rental): number => {
    const montant = Number(r.montantTotal);
    if (!isNaN(montant) && r.montantTotal !== undefined && r.montantTotal !== null && montant > 0) {
      return montant;
    }
    const prix = Number(r.prixParJour);
    const jours = Number(r.nombreJours);
    if (!isNaN(prix) && !isNaN(jours) && prix > 0 && jours > 0) {
      return prix * jours;
    }
    return 0;
  };

  const totalRevenue = activeRentals.reduce((sum, r) => sum + safeGetRentalAmount(r), 0);

  // Synthèse KPI
  autoTable(doc, {
    startY: 32,
    margin: { left: 15, right: 15 },
    head: [['Indicateur de gestion', 'Résultat']],
    body: [
      ['Chiffre d\'affaires actif total', `${totalRevenue.toLocaleString()} TND`],
      ['Taux d\'occupation du parc', `${occupancyRate} %`],
      ['Flotte globale', `${totalVehicles} véhicules`],
      ['Véhicules en circulation (Loués)', `${rentedCount}`],
      ['Réservations enregistrées', `${reservedCount}`],
      ['Véhicules disponibles immédiatement', `${availableCount}`],
      ['Véhicules en révision / maintenance', `${maintenanceCount}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: BRAND_PRIMARY, fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 90;

  // Décomposition financière détaillée
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_DARK);
  doc.text('DÉCOMPOSITION DU CHIFFRE D\'AFFAIRES PAR CONTRAT', 15, finalY + 10);

  autoTable(doc, {
    startY: finalY + 14,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Véhicule', 'Matricule', 'Chauffeur', 'Statut', 'Durée', 'Tarif/j', 'Montant comptabilisé']],
    body: activeRentals.map((r) => {
      const amt = r.montantTotal ?? (r.prixParJour ? r.nombreJours * r.prixParJour : 0);
      return [
        `#${r.numero}`,
        `${r.marque} ${r.modele}`,
        r.matricule,
        r.chauffeur,
        r.statut,
        `${r.nombreJours} j`,
        r.prixParJour ? `${r.prixParJour} TND` : '—',
        amt > 0 ? `${amt.toLocaleString()} TND` : '0 TND',
      ];
    }),
    foot: [
      ['', '', '', '', '', '', 'TOTAL GÉNÉRAL :', `${totalRevenue.toLocaleString()} TND`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: BRAND_DARK, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  });

  return doc;
}

export function exportReportsPdf(rentals: Rental[], vehicles: Vehicle[]): void {
  const doc = generateReportsPdf(rentals, vehicles);
  doc.save(`Rapport_Statistiques_Janen_Car_${new Date().toISOString().slice(0, 10)}.pdf`);
}
