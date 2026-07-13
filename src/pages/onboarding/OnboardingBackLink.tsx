import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function OnboardingBackLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </Link>
  );
}
