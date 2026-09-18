export type SkillTarget = 'skills' | 'digitalSkills' | 'languages' | 'certifications';
export type SkillConcept = { name: string; aliases: string[]; target: SkillTarget; example?: boolean };
export const skillConcepts: SkillConcept[] = [
  { name: 'Excel', aliases: ['Microsoft Excel', 'Exceliä', 'Excelin', 'Excelissä'], target: 'digitalSkills' },
  { name: 'Microsoft 365', aliases: ['M365', 'Office 365', 'Office365', 'Microsoft365'], target: 'digitalSkills' },
  { name: 'Asiakaspalvelu', aliases: ['asiakaspalvelua', 'asiakaspalvelun', 'asiakaspalvelussa', 'asiakaspalvelusta', 'asiakkaiden palveleminen', 'asiakkaiden palvelemisesta', 'asiakas palvelu'], target: 'skills', example: true },
  { name: 'Kassatyö', aliases: ['kassatyötä', 'kassatyön', 'kassalla työskentely', 'kassalla työskentelystä'], target: 'skills', example: true },
  { name: 'Myynti', aliases: ['myyntityö', 'myyntityötä', 'myyntityön', 'myynnin', 'myyntiä'], target: 'skills', example: true },
  { name: 'Sosiaalinen media', aliases: ['some', 'sosiaalisen median'], target: 'digitalSkills' },
  { name: 'Verkkokauppa', aliases: ['e-commerce', 'verkkokaupan', 'verkkokauppaa'], target: 'digitalSkills' },
  { name: 'ERP', aliases: ['toiminnanohjausjärjestelmä', 'toiminnanohjausjärjestelmän'], target: 'digitalSkills' },
  { name: 'CRM', aliases: ['asiakkuudenhallinta', 'asiakkuudenhallintajärjestelmä'], target: 'digitalSkills' },
  { name: 'Hygieniapassi', aliases: ['hygieniapätevyys', 'hygieniapassin', 'hygieniapassia'], target: 'certifications' },
  { name: 'Englanti', aliases: ['englannin kieli', 'englannin kielen', 'englannin kieltä', 'englantia', 'englannin taito', 'englannin osaamista'], target: 'languages' },
  { name: 'Ruotsi', aliases: ['ruotsin kieli', 'ruotsin kielen', 'ruotsin kieltä', 'ruotsia', 'ruotsin taito', 'ruotsin osaamista'], target: 'languages' },
  { name: 'Suomi', aliases: ['suomen kieli', 'suomen kielen', 'suomen kieltä', 'suomea', 'suomen taito', 'suomen osaamista'], target: 'languages' },
  { name: 'Työturvallisuuskortti', aliases: ['työturvallisuuskortin', 'työturvallisuuskorttia'], target: 'certifications' },
  { name: 'B-ajokortti', aliases: ['B ajokortti', 'B-ajokortin', 'B ajokortin'], target: 'certifications' },
  { name: 'Tiimityö', aliases: ['tiimityötä', 'tiimityön', 'tiimityötaidot', 'yhteistyötaidot'], target: 'skills', example: true },
];
