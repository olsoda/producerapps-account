'use client';

import { useState, cloneElement } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ContactFormRenderer from '@/components/ContactFormRenderer';
import { Tables } from '@/types_db';

interface ContactFormModalProps {
  pageContactForm: Tables<'page_contact_forms'>;
  contactForm: Tables<'contact_forms'>;
  page: any;
  player: any;
  previewShowSuccess?: boolean;
  trigger: React.ReactElement;
}

export default function ContactFormModal({
  pageContactForm,
  contactForm,
  page,
  player,
  previewShowSuccess,
  trigger
}: ContactFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);

  // Clone the trigger element and add onClick handler
  const triggerWithClick = cloneElement(trigger, {
    onClick: openModal,
    style: { cursor: 'pointer', ...trigger.props.style }
  });

  return (
    <>
      {triggerWithClick}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          <ContactFormRenderer
            page={page}
            player={player}
            pageContactForm={pageContactForm}
            contactForm={contactForm}
            previewShowSuccess={previewShowSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
