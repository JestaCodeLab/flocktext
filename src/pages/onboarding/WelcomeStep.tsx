import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function WelcomeStep() {
  const navigate = useNavigate();
  const name = useAuthStore((s) => s.session?.user.name);

  return (
    <div>
      <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="mb-1.5 text-[26px] font-bold">Welcome{name ? `, ${name.split(' ')[0]}` : ''}</div>
      <div className="mb-8 text-sm leading-relaxed text-muted-foreground">
        Let's get your church set up on FlockText. This takes about two minutes — you can skip the optional steps and
        finish them later.
      </div>
      <Button className="h-12 w-full rounded-full" size="lg" onClick={() => navigate('/onboarding/organization')}>
        Get started
      </Button>
    </div>
  );
}
