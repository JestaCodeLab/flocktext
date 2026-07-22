import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

const LENGTH = 6;

// Six-box verification code input shared by OtpPage and ForgotPasswordPage's
// verify-code step, so both stay in sync. Handles auto-advance on entry,
// auto-back-and-clear on backspace into an empty box, and pasting a full code
// (from SMS autofill or a copied message) across all boxes at once.
export function OtpInput({ digits, onChange, disabled }: { digits: string[]; onChange: (digits: string[]) => void; disabled?: boolean }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, char: string) {
    const next = [...digits];
    next[index] = char;
    onChange(next);
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, char);
    if (char && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      setDigit(index - 1, '');
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    let i = index;
    for (const char of pasted) {
      if (i >= LENGTH) break;
      next[i] = char;
      i += 1;
    }
    onChange(next);
    inputs.current[Math.min(i, LENGTH - 1)]?.focus();
  }

  return (
    <div className="mb-6 flex gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-2xl border border-border bg-background py-3 text-center text-[22px] font-bold text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/50 disabled:opacity-60"
        />
      ))}
    </div>
  );
}
