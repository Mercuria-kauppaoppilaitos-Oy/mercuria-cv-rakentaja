export const cvSteps = ['Perustiedot', 'Esittely', 'Työkokemus', 'Koulutus', 'Osaaminen', 'Lisäosiot', 'Viimeistele'] as const;
export type CvStep = typeof cvSteps[number];
