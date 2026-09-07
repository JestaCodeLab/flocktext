export interface FaqItem {
  question: string;
  answer: string;
}

// Answered by the 4 questions both /businesses and /churches share verbatim -
// each page prepends its own audience-specific question ahead of these.
export const sharedFaqs: FaqItem[] = [
  {
    question: 'Can I schedule SMS messages in advance?',
    answer:
      'Yes. Set your message content, choose a date and time, and FlockText will send it automatically — no need to be online when it goes out.',
  },
  {
    question: 'Does FlockText support automated birthday messages?',
    answer:
      'Yes. Add birthdates to your contacts and FlockText will automatically send a personalized message on the day, with no manual work required each year.',
  },
  {
    question: 'Which networks does FlockText support?',
    answer:
      "FlockText delivers directly across Ghana's major networks — MTN, Vodafone, and AirtelTigo — for fast, reliable delivery.",
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes — new accounts start with 10 free SMS credits to test the platform before you commit.',
  },
];

export const businessFaqs: FaqItem[] = [
  {
    question: "What's the best bulk SMS app for small businesses in Ghana?",
    answer:
      'The right tool depends on your needs, but look for local network coverage (MTN, Vodafone, AirtelTigo), scheduling, contact management, and real-time delivery tracking — all of which FlockText provides out of the box.',
  },
  ...sharedFaqs,
];

export const churchFaqs: FaqItem[] = [
  {
    question: 'How do I send bulk SMS to church members in Ghana?',
    answer:
      "Import your congregation's phone numbers into FlockText, group them by ministry or department if needed, then compose and send your message — or schedule it for a future date. Delivery reports let you confirm who received it.",
  },
  ...sharedFaqs,
];

export const schoolsFaqs: FaqItem[] = [
  {
    question: 'How do schools and institutions in Ghana send bulk SMS to students and parents?',
    answer:
      'Import student, parent, and staff phone numbers into FlockText, group them by class, department, or level, then compose and send — or schedule a message for later, like a fee reminder ahead of term or an exam timetable release. Delivery reports confirm who received it.',
  },
  ...sharedFaqs,
];

export const agencyFaqs: FaqItem[] = [
  {
    question: 'Can I manage bulk SMS for multiple clients from one FlockText account?',
    answer:
      "Yes. Create a separate organization for each client — each with its own contacts, Sender ID, SMS balance, campaigns, and reports — and switch between them from one login. No juggling separate accounts.",
  },
  {
    question: "Can my clients see each other's data?",
    answer:
      "No. Every client organization is fully separate — contacts, messaging history, delivery reports, and SMS balance never mix between clients.",
  },
  {
    question: 'Can I give a client access to their own organization?',
    answer:
      "Yes. Invite a client's team into their organization and they'll only see that organization — not your agency's other clients.",
  },
  ...sharedFaqs,
];

export function toFaqJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
