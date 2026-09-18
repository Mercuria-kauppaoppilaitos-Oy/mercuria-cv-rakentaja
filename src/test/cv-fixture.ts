import { createEmptyCv } from '../features/cv/cv-model';
/** Synthetic short regression CV; not copied from a user's browser draft. */
export function createShortCvFixture() {
  const data = createEmptyCv();
  data.personalDetails = { firstName: 'Olivia', lastName: 'Osaaja', professionalTitle: 'Liiketoiminnan opiskelija', email: 'olivia@example.com', phone: '040 123 4567', city: 'Vantaa', linkedIn: '' };
  data.summary = 'Olen huolellinen liiketoiminnan opiskelija. Etsin harjoittelupaikkaa, jossa voin käyttää asiakaspalveluosaamistani ja oppia taloushallintoa.';
  data.workExperience = [
    { id: 'short-work-1', title: 'Myymäläharjoittelija', employer: 'Esimerkkikauppa', location: '', startDate: '2026-09', endDate: '2026-11', isCurrent: false, description: 'Hyllytys\nSiisteys\nPalvelin asiakkaita kassalla.' },
    { id: 'short-work-2', title: 'Kesätyöntekijä', employer: 'Esimerkki Oy', location: '', startDate: '2026-06', endDate: '2026-08', isCurrent: false, description: 'Käsittelin tilauksia.\nAutoin asiakkaita ja huolehdin tuotteiden esillepanosta.' },
  ];
  data.education = [{ id: 'short-education', qualification: 'Liiketoiminnan perustutkinto', institution: 'Esimerkkioppilaitos', location: '', startDate: '2024-08', endDate: '2027-05', isCurrent: false, description: 'Asiakaspalvelu ja taloushallinto.' }];
  data.skills = [{ id: 'short-skill-1', name: 'Asiakaspalvelu' }, { id: 'short-skill-2', name: 'Tiimityö' }, { id: 'short-skill-3', name: 'Huolellisuus' }];
  data.digitalSkills = [{ id: 'short-digital-1', name: 'Microsoft 365', proficiency: 'Hyvä' }, { id: 'short-digital-2', name: 'Procountor', proficiency: 'Perusteet' }];
  data.languages = [{ id: 'short-language-1', name: 'Suomi', proficiency: 'Äidinkieli' }, { id: 'short-language-2', name: 'Englanti', proficiency: 'Hyvä' }];
  return data;
}
/** Synthetic, long CV shared by HTML and real PDF text-extraction tests. */
export function createLongCvFixture() {
  const data = createEmptyCv();
  data.personalDetails = { firstName: 'Åsa-Maria', lastName: 'Ääkkönen-Östergård Pitkänimi', professionalTitle: 'Asiakaspalvelun ja verkkokaupan ammattilainen', email: 'test@example.com', phone: '040 000 0000', city: 'Vantaa', linkedIn: 'https://www.linkedin.com/in/test-fixture' };
  data.summary = ['Ääkköset: ä ö å Ä Ö Å', 'Esimerkki: Päivi Määttä, Jyväskylä, työpäällikkö', ...Array(18).fill('Olen huolellinen, yhteistyökykyinen ja palveluhenkinen. Ääkköset ä, ö ja å säilyvät tekstissä.')].join('\n');
  data.workExperience = Array.from({ length: 8 }, (_, index) => ({ id: `work-${index}`, title: `Myyjä ja työharjoittelija ${index + 1}`, employer: 'Esimerkki Oy', location: 'Helsinki', startDate: '2023-08', endDate: '2024-05', isCurrent: false, description: 'Palvelin asiakkaita\nKäsittelin verkkokaupan tilauksia\nTuotin sosiaalisen median sisältöä' }));
  data.education = Array.from({ length: 3 }, (_, index) => ({ id: `education-${index}`, qualification: `Liiketoiminnan koulutus ${index + 1}`, institution: 'Esimerkkioppilaitos', location: 'Vantaa', startDate: '2021-08', endDate: '2023-05', isCurrent: false, description: 'Asiakaspalvelu, myyntityö ja verkkokauppa' }));
  data.skills = [{ id: 'skill', name: 'Asiakaspalvelu ja myyntityö' }];
  data.digitalSkills = [{ id: 'digital', name: 'Microsoft Excel', proficiency: 'Hyvä' }];
  data.languages = [{ id: 'language', name: 'Englanti', proficiency: 'Sujuva' }];
  data.certifications = [{ id: 'certificate', name: 'Hygieniapassi', issuer: 'Esimerkkijärjestäjä', issuedDate: '2025', expiryDate: 'Voimassa toistaiseksi' }];
  data.references = [{ id: 'reference', name: 'Testi Suosittelija', title: 'Esihenkilö', organization: 'Esimerkki Oy', email: 'reference@example.com', phone: '040 000 0001' }];
  return data;
}
