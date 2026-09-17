import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type TestUser = ReturnType<typeof userEvent.setup>;
export async function selectStep(user: TestUser, label: string) {
  await user.click(screen.getByRole('button', { name: label }));
}
export async function addEntry(user: TestUser, label: string) {
  const step = label === 'Lisää työkokemus' ? 'Työkokemus'
    : label === 'Lisää koulutus' ? 'Koulutus'
    : label === 'Lisää kortti tai pätevyys' || label === 'Lisää suosittelija' ? 'Lisäosiot' : 'Osaaminen';
  await selectStep(user, step);
  await user.click(screen.getByRole('button', { name: label }));
}
