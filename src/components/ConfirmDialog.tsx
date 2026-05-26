import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-scrim data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-secondary-bg rounded-xl border border-border-primary p-6 shadow-dialog data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-white text-xl font-bold mb-3">{title}</Dialog.Title>
          <Dialog.Description className="text-text-secondary mb-6">{message}</Dialog.Description>

          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
