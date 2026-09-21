import '../../test/pdf-input-probe';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { addEntry, selectStep } from '../../test/navigation';
import { getMonthYears, MonthPicker } from './MonthPicker';
import { createEmptyCv, createEmptyWorkExperience, createEmptyEducation } from './cv-model';
import { draftStorageKey } from './draft-storage';

it('valitsee kuukauden ja vuoden näppäimistöjärjestyksessä, tallentaa YYYY-MM:n ja tyhjentää valinnan', async () => {
  const user = userEvent.setup(); render(<App />);
  await addEntry(user, 'Lisää työkokemus');
  const month = screen.getByLabelText('Aloituskuukausi');
  const year = screen.getByLabelText('Aloituskuukausi: vuosi');
  month.focus();
  await user.selectOptions(month, '09');
  await user.tab(); expect(year).toHaveFocus();
  await user.selectOptions(year, '2026');
  await waitFor(() => expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).data.workExperience[0].startDate).toBe('2026-09'));
  await selectStep(user, 'Esittely'); await selectStep(user, 'Työkokemus');
  expect(screen.getByLabelText('Aloituskuukausi')).toHaveValue('09');
  expect(screen.getByLabelText('Aloituskuukausi: vuosi')).toHaveValue('2026');
  screen.getByLabelText('Aloituskuukausi: vuosi').focus();
  await user.tab(); expect(screen.getByRole('button', { name: 'Tyhjennä aloituskuukausi' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByLabelText('Aloituskuukausi')).toHaveValue('');
  expect(screen.getByLabelText('Aloituskuukausi: vuosi')).toHaveValue('');
  await waitFor(() => expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).data.workExperience[0].startDate).toBe(''));
});

it('jatkuvat opinnot estävät molemmat päättymisvalinnat ja säilyttävät arvioidun ajan', async () => {
  const user = userEvent.setup(); render(<App />);
  await addEntry(user, 'Lisää koulutus');
  const label = 'Valmistumiskuukausi tai arvioitu valmistumiskuukausi';
  await user.selectOptions(screen.getByLabelText(label), '05');
  await user.selectOptions(screen.getByLabelText(`${label}: vuosi`), '2028');
  await user.click(screen.getByLabelText('Opinnot jatkuvat'));
  expect(screen.getByLabelText(label)).toBeDisabled();
  expect(screen.getByLabelText(`${label}: vuosi`)).toBeDisabled();
  await user.click(screen.getByLabelText('Opinnot jatkuvat'));
  expect(screen.getByLabelText(label)).toHaveValue('05');
  expect(screen.getByLabelText(`${label}: vuosi`)).toHaveValue('2028');
});

afterEach(() => vi.useRealTimers());
it('vuosirajat vaihtuvat ajon ajan mukaan vuodenvaihteessa ja lista on laskeva', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 11, 31, 12));
  const before = getMonthYears();
  expect(before[0]).toBe('2031'); expect(before.at(-1)).toBe('1990'); expect(before).toHaveLength(42);
  expect(before).toEqual([...before].sort((a, b) => Number(b) - Number(a)));
  vi.setSystemTime(new Date(2027, 0, 1, 12));
  expect(getMonthYears()[0]).toBe('2032'); expect(getMonthYears().at(-1)).toBe('1990');
});
it.each(['1985', '2099'])('vanha vuosi %s säilyy lisävaihtoehtona ilman muutostapahtumaa', (year) => {
  const change = vi.fn(); render(<MonthPicker id="date" label="Ajankohta" value={year + '-09'} onChange={change} />);
  expect(screen.getByLabelText('Ajankohta: vuosi')).toHaveValue(year);
  expect(screen.getByLabelText('Ajankohta')).toHaveValue('09');
  expect(change).not.toHaveBeenCalled();
});
it.each(['workExperience', 'education'] as const)('vanhat %s-ajankohdat palautuvat koskemattomina', async (kind) => {
  const data = createEmptyCv();
  if (kind === 'workExperience') data.workExperience = [{ ...createEmptyWorkExperience(), startDate: '1985-09', endDate: '2099-05' }];
  else data.education = [{ ...createEmptyEducation(), startDate: '1985-09', endDate: '2099-05' }];
  sessionStorage.setItem(draftStorageKey, JSON.stringify({ schemaVersion: 4, persistent: false, data }));
  const user = userEvent.setup(); render(<App />); await selectStep(user, kind === 'education' ? 'Koulutus' : 'Työkokemus');
  expect(screen.getByLabelText('Aloituskuukausi: vuosi')).toHaveValue('1985');
  const end = kind === 'education' ? 'Valmistumiskuukausi tai arvioitu valmistumiskuukausi' : 'Päättymiskuukausi';
  expect(screen.getByLabelText(end + ': vuosi')).toHaveValue('2099');
  window.dispatchEvent(new Event('pagehide'));
  expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).data[kind][0]).toMatchObject({ startDate: '1985-09', endDate: '2099-05' });
});
