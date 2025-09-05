import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel = 'Удалить', cancelLabel = 'Отмена', onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" role="dialog" aria-modal>
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-card-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

