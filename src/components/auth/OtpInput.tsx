import { useRef } from 'react';
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react';

const LENGTH = 6;

// Six-box verification code input shared by OtpPage and ForgotPasswordPage's
// verify-code step, so both stay in sync.
export function OtpInput({ digits, onChange, disabled }: { digits: string[]; onChange: (digits: string[]) => void; disabled?: boolean }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, char: string) {
    const next = [...digits];
    next[index] = char;
    onChange(next);
  }

  // Shared by paste and the onChange fallback below - fills boxes starting at
  // `index` with each digit of `raw`, in order.
  function distributeFrom(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, '');
    const next = [...digits];
    let i = index;
    for (const char of cleaned) {
      if (i >= LENGTH) break;
      next[i] = char;
      i += 1;
    }
    onChange(next);
    inputs.current[Math.min(i, LENGTH - 1)]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, '');
    // A box can end up holding more than one character if a paste slips past
    // onPaste (happens on some mobile browsers) or OS autofill drops the
    // whole code into one field - distribute it instead of keeping only the
    // last character.
    if (cleaned.length > 1) {
      distributeFrom(index, cleaned);
      return;
    }
    setDigit(index, cleaned);
    if (cleaned && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function backspaceToPrevious(index: number) {
    if (index === 0) return false;
    setDigit(index - 1, '');
    inputs.current[index - 1]?.focus();
    return true;
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!digits[index] && backspaceToPrevious(index)) e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  // Mobile virtual keyboards often don't report a usable `key` on keydown for
  // Backspace, so deleting into an already-empty box (which changes nothing,
  // so onChange never fires) can go undetected there. beforeinput reports the
  // delete intent reliably even on mobile - use it as the cross-platform path.
  function handleBeforeInput(index: number, e: FormEvent<HTMLInputElement>) {
    const inputType = (e.nativeEvent as InputEvent).inputType;
    if (inputType === 'deleteContentBackward' && !digits[index] && backspaceToPrevious(index)) {
      e.preventDefault();
    }
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (!pasted.replace(/\D/g, '')) return;
    distributeFrom(index, pasted);
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
          onBeforeInput={(e) => handleBeforeInput(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-2xl border border-border bg-background py-3 text-center text-[22px] font-bold text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/50 disabled:opacity-60"
        />
      ))}
    </div>
  );
}
