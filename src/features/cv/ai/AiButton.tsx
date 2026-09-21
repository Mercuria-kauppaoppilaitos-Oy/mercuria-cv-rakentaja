import type { ComponentProps } from 'react';

export function AiButton({ children, className = '', ...props }: ComponentProps<'button'>) {
  return <button type="button" className={`ai-button ${className}`} {...props}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <path d="m9 3 2.2 6.8L18 12l-6.8 2.2L9 21l-2.2-6.8L0 12l6.8-2.2L9 3Z" transform="translate(2 0) scale(.9)" />
      <path d="m19 2 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
    </svg>{children}
  </button>;
}
