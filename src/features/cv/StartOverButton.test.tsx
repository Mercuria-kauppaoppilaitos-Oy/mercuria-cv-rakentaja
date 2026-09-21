import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StartOverButton } from './StartOverButton';

afterEach(() => vi.useRealTimers());
it('requires a second click, retains focus and announces confirmation', () => {
  const reset = vi.fn(); render(<StartOverButton activeStep={0} onReset={reset} />);
  const button = screen.getByRole('button'); button.focus(); fireEvent.click(button);
  expect(reset).not.toHaveBeenCalled(); expect(button).toHaveFocus(); expect(button).toHaveTextContent('Oletko varma?'); expect(screen.getByRole('status')).toHaveTextContent('kahdeksan sekunnin');
  fireEvent.click(button); expect(reset).toHaveBeenCalledTimes(1);
});
it('cancels on Escape, another control, step change and timeout; cleans up on unmount', () => {
  vi.useFakeTimers(); const reset = vi.fn(); const view = render(<><StartOverButton activeStep={0} onReset={reset} /><input aria-label="Muu kenttä" /></>);
  const button = screen.getByRole('button');
  fireEvent.click(button); fireEvent.keyDown(button, { key: 'Escape' }); expect(button).toHaveTextContent('Aloita alusta');
  fireEvent.click(button); fireEvent.click(screen.getByLabelText('Muu kenttä')); expect(button).toHaveTextContent('Aloita alusta');
  fireEvent.click(button); view.rerender(<StartOverButton activeStep={1} onReset={reset} />); expect(button).toHaveTextContent('Aloita alusta');
  fireEvent.click(button); act(() => vi.advanceTimersByTime(8000)); expect(button).toHaveTextContent('Aloita alusta');
  fireEvent.click(button); view.unmount(); expect(vi.getTimerCount()).toBe(0); expect(reset).not.toHaveBeenCalled();
});
