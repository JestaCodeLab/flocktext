import { Mail, MessageCircle, Phone } from 'lucide-react';
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY, SUPPORT_EMAIL, WHATSAPP_URL } from '@/pages/marketing/data/contact';
import { Seo } from '@/pages/marketing/components/Seo';
import { LegalLayout, LegalSection } from '@/pages/marketing/components/LegalLayout';
import { routeSeo } from '@/pages/marketing/data/seo';

const faqs = [
  {
    question: 'How do I create an account?',
    answer:
      'Download the FlockText app or visit our website and tap "Sign up". You\'ll set up your organization, register a sender ID, and add your first contacts during onboarding.',
  },
  {
    question: 'How do birthday messages work?',
    answer:
      'Add birthdays to your contacts and turn on birthday automation in Contacts → Birthdays. FlockText automatically sends a message to each contact on their birthday using the template you choose.',
  },
  {
    question: 'Why wasn’t my message delivered?',
    answer:
      'Delivery depends on mobile network operators outside our control. Check the delivery report for the message in Reports — it shows a per-recipient status (delivered, failed, or pending) along with the reason where available.',
  },
  {
    question: 'How do SMS credits work?',
    answer:
      'You buy SMS credits up front on the Pricing page and spend them as you send messages — there’s no subscription. Your remaining balance is shown in Wallet.',
  },
  {
    question: 'How do I register a sender ID?',
    answer:
      'Go to Settings in the dashboard and submit a sender ID for approval. Approval times vary by network operator; you can send using a shared default sender ID while you wait.',
  },
  {
    question: 'How do I delete my account or data?',
    answer: (
      <>
        Email us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-2">
          {SUPPORT_EMAIL}
        </a>{' '}
        from your account’s registered address and we’ll delete your account and associated contact data, as
        described in our{' '}
        <a href="/privacy" className="text-foreground underline underline-offset-2">
          Privacy Policy
        </a>
        .
      </>
    ),
  },
];

export function SupportPage() {
  return (
    <>
      <Seo {...routeSeo['/support']} />

      <LegalLayout
        eyebrow="Help"
        title="Support"
        subtitle="Get help with your FlockText account, messages, and billing. Our team typically responds within one business day."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20"
          >
            <Mail className="size-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Email</span>
            <span className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</span>
          </a>
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20"
          >
            <Phone className="size-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Phone</span>
            <span className="text-xs text-muted-foreground">{CONTACT_PHONE_DISPLAY}</span>
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20"
          >
            <MessageCircle className="size-5 text-success" />
            <span className="text-sm font-semibold text-foreground">WhatsApp</span>
            <span className="text-xs text-muted-foreground">Chat with support</span>
          </a>
        </div>

        <LegalSection title="Frequently asked questions">
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <div className="text-sm font-semibold text-foreground">{faq.question}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
