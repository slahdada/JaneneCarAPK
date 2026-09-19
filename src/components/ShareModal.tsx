import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Rental } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatTelephone } from '../utils/validation';
import {
  X,
  Mail,
  Share2,
  FileText,
  Printer,
  Download,
  Send,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  fileName: string;
  generatePdf: () => jsPDF;
  // Specific rental metadata for contracts to prepopulate WhatsApp/Email text recaps
  rental?: Rental;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  fileName,
  generatePdf,
  rental,
}) => {
  const [recipientPhone, setRecipientPhone] = useState(() => {
    if (rental && rental.telephone) {
      return rental.telephone.replace(/\s+/g, '');
    }
    return '';
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Generate text recap for sharing
  const getShareText = (): string => {
    let text = `✨ *JANEN_CAR - PARTAGE DE DOCUMENT* ✨\n\n`;
    text += `Bonjour,\n`;
    text += `Veuillez trouver ci-dessous le récapitulatif de votre document : *${documentTitle}*.\n\n`;

    if (rental) {
      const amt = rental.montantTotal ?? (rental.prixParJour ? rental.nombreJours * rental.prixParJour : 0);
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📄 *CONTRAT DE LOCATION N° ${rental.numero}*\n`;
      text += `👤 *Client :* ${rental.chauffeur}\n`;
      text += `📞 *Téléphone :* ${formatTelephone(rental.telephone)}\n`;
      text += `🚗 *Véhicule :* ${rental.marque} ${rental.modele}\n`;
      text += `🏷️ *Immatriculation :* ${rental.matricule}\n`;
      text += `📅 *Départ :* ${formatDisplayDate(rental.dateDepart)}\n`;
      text += `📅 *Retour :* ${formatDisplayDate(rental.dateRetour)}\n`;
      text += `⏱️ *Durée :* ${rental.nombreJours} jours\n`;
      text += `💰 *Montant Total :* ${amt} TND\n`;
      text += `📈 *Statut actuel :* ${rental.statut}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    } else {
      text += `📊 *Détails du document :*\n`;
      text += `• *Nom :* ${documentTitle}\n`;
      text += `• *Date d'édition :* ${new Date().toLocaleDateString('fr-FR')}\n`;
      text += `• *Généré via :* Plateforme de Gestion Janen_Car (Tunis, Tunisie)\n\n`;
    }

    text += `👉 Vous pouvez enregistrer le fichier officiel au format PDF ou l'imprimer directement.\n`;
    text += `Merci pour votre confiance !\n`;
    text += `📧 contact@janenecar.com | 🌐 www.janenecar.com`;
    return text;
  };

  // 2. Share physical file via native OS Web Share API
  const handleNativeShare = async () => {
    try {
      const doc = generatePdf();
      const blob = doc.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: documentTitle,
          text: `Veuillez trouver ci-joint le document : ${documentTitle}.`,
        });
      } else {
        // Fallback: copy description to clipboard and download
        triggerCopyText();
        handleDownload();
        alert(
          "Le partage de fichier réel n'est pas supporté par votre navigateur. Le fichier PDF a été téléchargé automatiquement et le résumé a été copié dans votre presse-papiers pour que vous puissiez le coller dans vos messages."
        );
      }
    } catch (error) {
      console.warn('Native share error:', error);
      // Fallback
      handleDownload();
    }
  };

  // 3. Share text/link recap via WhatsApp
  const handleWhatsAppShare = () => {
    // pre-download the file so the user has the actual file saved
    handleDownload();
    
    const text = encodeURIComponent(getShareText());
    let url = `https://wa.me/`;
    if (recipientPhone) {
      // Nettoyer les caractères spéciaux et ajouter l'indicatif tunisien par défaut s'il n'y a pas d'indicatif
      let cleanPhone = recipientPhone.replace(/[^0-9+]/g, '');
      if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('216') && cleanPhone.length === 8) {
        cleanPhone = '216' + cleanPhone;
      }
      url += `${cleanPhone}?text=${text}`;
    } else {
      url += `?text=${text}`;
    }
    window.open(url, '_blank');
  };

  // 4. Share recap via Email client (mailto)
  const handleEmailShare = () => {
    // pre-download the file so the user has the actual file saved
    handleDownload();
    
    const subject = encodeURIComponent(`Janen_Car - ${documentTitle}`);
    const body = encodeURIComponent(getShareText() + `\n\n(Le fichier PDF officiel a été téléchargé automatiquement sur votre appareil, veuillez simplement le joindre à cet e-mail)`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // 5. Download helper
  const handleDownload = () => {
    const doc = generatePdf();
    doc.save(fileName);
  };

  // 6. Direct Print helper
  const handlePrint = () => {
    try {
      const doc = generatePdf();
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

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
            window.open(blobUrl, '_blank');
          }
        }, 300);
      };

      setTimeout(() => {
        document.body.removeChild(printIframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error('Error during printing:', err);
      handleDownload();
    }
  };

  // 7. Copy summary text
  const triggerCopyText = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Partager et Exporter
              </h3>
              <p className="text-xs text-slate-500">
                Envoyer par WhatsApp, Mail ou exporter en PDF / Papier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Document Preview Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 shrink-0">
              <FileText className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                Document PDF Prêt
              </span>
              <h4 className="font-bold text-slate-900 text-sm truncate mt-1">
                {documentTitle}
              </h4>
              <p className="text-xs text-slate-500 font-mono truncate">
                {fileName}
              </p>
            </div>
          </div>

          {/* Quick Download / Print Row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Enregistrer PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer papier</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Canaux de partage direct
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Option 1: WhatsApp Share Section */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-white shadow-3xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Partager sur WhatsApp</span>
            </div>
            <p className="text-xs text-slate-500">
              Cliquer sur envoyer va <strong>télécharger le PDF</strong> automatiquement et ouvrir WhatsApp pour que vous puissiez facilement lui glisser-déposer le document avec un résumé clair.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                  N° :
                </span>
                <input
                  type="text"
                  placeholder="Ex: 98123456"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer</span>
              </button>
            </div>
          </div>

          {/* Option 2: Email & General Share Buttons */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 text-center">
              💡 Partager par E-mail télécharge également le PDF automatiquement afin de pouvoir le joindre facilement.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleEmailShare}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Partager par E-mail</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                title="Ouvre le menu de partage natif de votre smartphone ou PC (choix WhatsApp, Gmail, Drive, AirDrop, etc.)"
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Menu de Partage du Téléphone</span>
              </button>
            </div>
          </div>

          {/* Option 3: Copy Text Recap */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Pratique pour d'autres messageries</span>
            <button
              onClick={triggerCopyText}
              className={`font-semibold cursor-pointer transition-colors ${
                copied ? 'text-emerald-600 flex items-center gap-1 font-bold' : 'text-blue-600 hover:underline'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 inline" />
                  <span>Copié dans le presse-papiers !</span>
                </>
              ) : (
                'Copier le résumé textuel'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
