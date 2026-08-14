import { WhatsAppIcon } from '@/pages/marketing/components/WhatsAppIcon';
import { WHATSAPP_URL } from '@/pages/marketing/data/contact';

// Sits above the mobile bottom tab bar (which is hidden from md up, where the
// bottom offset drops to a plain margin) so it never overlaps that bar's tap targets.
export function WhatsAppSupportButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with support on WhatsApp"
      title="Chat with support on WhatsApp"
      className="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-background transition-transform hover:scale-105 md:right-6 md:bottom-6 md:h-14 md:w-14"
    >
      <WhatsAppIcon className="h-6 w-6 md:h-7 md:w-7" />
    </a>
  );
}
