import type { FaqItem } from '@/pages/marketing/data/faq';

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mx-auto mt-14 max-w-3xl space-y-3">
      {items.map((item) => (
        <div key={item.question} className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
          <div className="text-base font-bold text-foreground">{item.question}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
