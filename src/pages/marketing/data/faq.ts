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
