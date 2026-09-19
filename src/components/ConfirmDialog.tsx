import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation requise',
  message = 'Cette action supprimera définitivement cet élément. Cette opération est irréversible.',
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  isDangerous = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div
        id="confirm-dialog-container"
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          {isDangerous ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p id="confirm-dialog-description" className="text-sm leading-6 text-slate-600 dark:text-slate-300 mb-6">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            id="btn-confirm-cancel"
            type="button"
            onClick={onClose}
            className="ui-btn-secondary flex-1 justify-center"
          >
            {cancelText}
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-500/30'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
