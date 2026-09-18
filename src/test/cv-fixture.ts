import { createEmptyCv } from '../features/cv/cv-model';
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
