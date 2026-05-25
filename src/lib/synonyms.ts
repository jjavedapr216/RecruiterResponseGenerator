export interface FieldDef {
  id: string;
  label: string;
  synonyms: string[];
  sensitive: boolean;
}

export const FIELDS: FieldDef[] = [
  {
    id: 'full_name',
    label: 'Full Name',
    sensitive: false,
    synonyms: [
      'full name', 'full legal name', 'candidate name', 'complete name',
      'legal name', 'complete legal name', 'candidate legal name',
      'candidate full name', 'candidate full legal name',
      'full legal name', 'candidate complete name',
    ],
  },
  {
    id: 'first_name',
    label: 'First Name',
    sensitive: false,
    synonyms: ['first name', 'given name', 'fname', 'candidate first name', 'first'],
  },
  {
    id: 'middle_name',
    label: 'Middle Name',
    sensitive: false,
    synonyms: ['middle name', 'middle initial', 'middle'],
  },
  {
    id: 'last_name',
    label: 'Last Name',
    sensitive: false,
    synonyms: ['last name', 'surname', 'family name', 'lname', 'candidate last name', 'last'],
  },
  {
    id: 'phone',
    label: 'Phone Number',
    sensitive: false,
    synonyms: [
      'phone number', 'contact number', 'cell', 'mobile', 'phone',
      'cell number', 'mobile number', 'home phone', 'personal number',
      'alternative contact number', 'candidate phone number', 'contact no',
      'phone #', 'contact mobile', 'contact number mobile',
      'personal number whatsapp', 'whatsapp', 'alternative contact',
    ],
  },
  {
    id: 'email',
    label: 'Email',
    sensitive: false,
    synonyms: [
      'email', 'email id', 'email address', 'e-mail', 'mail id',
      'candidate email', 'personal email', 'candidate email id',
      'please list the candidate email address',
      'candidate email address', 'email id (mandatory)',
    ],
  },
  {
    id: 'ssn_last4',
    label: 'Last 4 SSN',
    sensitive: true,
    synonyms: [
      'last 4 ssn', 'last 4 digits of ssn', 'last four ssn',
      'last four digits of ssn', 'last 4 digit ssn', 'ssn last 4',
      'last 4-digit ssn', 'last 4 digits', 'last four digits',
      '4 digit ssn', 'last 4 digits of ssn number', 'ssn last four',
      'last four ssn digits', 'last 4 ssn number', 'last 4 digit of ssn',
      'ssn (last 4)', 'last four digit ssn', 'last 4 digit',
      'ssn number', 'ssn', 'social security number', 'social security',
    ],
  },
  {
    id: 'passport',
    label: 'Passport Number',
    sensitive: true,
    synonyms: [
      'passport number', 'passport no', 'passport', 'passport no.',
      'passport num', 'passport #', 'passport number*', 'passport no:',
    ],
  },
  {
    id: 'visa_status',
    label: 'Visa / Work Authorization',
    sensitive: false,
    synonyms: [
      'visa status', 'work authorization', 'immigration status', 'work status',
      'us work authorization', 'authorization', 'visa', 'work permit',
      'visa type', 'work auth', 'visa and work authorization',
      'work authorization status', 'current visa', 'visa type and status',
      'visa status and validity', 'work authorization (must)',
      'what is your us work authorization', 'work status',
    ],
  },
  {
    id: 'location',
    label: 'Current Location',
    sensitive: false,
    synonyms: [
      'current location', 'city/state', 'location', 'present location',
      'current city', 'candidate location', 'current location with zip',
      'city/state & zip', 'city/state/zip', 'present location city/state',
      'current location (city/state)', 'where is the candidate',
      'city, state & zip', 'current location zipcode',
      'present location [city, state & zip code]', 'city state',
      'location city state', 'current location city/state',
      'candidate location city/state', 'where is candidate located',
    ],
  },
  {
    id: 'availability',
    label: 'Availability',
    sensitive: false,
    synonyms: [
      'availability', 'notice period', 'when can you start', 'available',
      'start date', 'availability to start', 'availability upon offer',
      'availability to join', 'how soon can you start',
      'available for new project', 'joining availability',
      'how soon after an offer', 'when would you be fine to start',
      'availability to join notice period',
      'how soon after an offer can your candidate start',
      'when can you start',
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn URL',
    sensitive: false,
    synonyms: [
      'linkedin', 'linkedin url', 'linkedin profile', 'linkedin link',
      'linkedin profile id', 'linkedin profile url', 'linkedin url (mandatory)',
      'linkedin profile id:-', 'linkedin url:', 'linkedin (mandatory)',
      // common misspellings / shorthand recruiters use
      'linked id', 'linked in id', 'linked in url', 'linked in profile',
      'linked in', 'linkedinid', 'linkedin id',
    ],
  },
  {
    id: 'dob',
    label: 'Date of Birth',
    sensitive: true,
    synonyms: [
      'date of birth', 'dob', 'birthday', 'birth date',
      'date of birth (mm/dd)', 'dob(mmdd)', 'date of birth mm/dd',
      'dob (mmdd)', 'date of birth:', 'dob:', 'dob mmdd',
    ],
  },
  {
    id: 'relocation',
    label: 'Willing to Relocate',
    sensitive: false,
    synonyms: [
      'willing to relocate', 'relocation', 'willing to travel or relocate',
      'willing to travel', 'relocate', 'open to relocation',
      'are you willing to relocate', 'interested to relocate',
      'willing to relocate (yes/no)',
    ],
  },
  {
    id: 'education',
    label: 'Education',
    sensitive: false,
    synonyms: [
      'education', 'qualification', 'education qualification',
      'education details', 'highest qualification', 'educational background',
      'degree', 'education and year of passing',
      'education (list both masters & bachelors with year of passing & university name)',
      'education details and passed out year', 'education qualification:',
      'education [ year of graduation / university name ]',
      'education details and passed out year',
    ],
  },
  {
    id: 'total_exp',
    label: 'Total Experience',
    sensitive: false,
    synonyms: [
      'total experience', 'years of experience', 'total exp',
      'it experience', 'total years of experience', 'total it experience',
      'years of exp', 'experience', 'total it exp',
    ],
  },
  {
    id: 'relevant_exp',
    label: 'Relevant Experience',
    sensitive: false,
    synonyms: [
      'relevant experience', 'relevant exp', 'years of relevant experience',
    ],
  },
  {
    id: 'usa_exp',
    label: 'Experience in USA',
    sensitive: false,
    synonyms: [
      'total exp in usa', 'experience in usa', 'usa experience',
      'years in usa', 'experience in us', 'us experience',
      'years of experience in the usa', 'total exp in usa',
      'years of experience in us',
    ],
  },
  {
    id: 'rate',
    label: 'Expected Rate',
    sensitive: false,
    synonyms: [
      'expected rate', 'pay rate', 'hourly rate', 'rate expectation',
      'buy rate', 'expected rate/salary', 'rate', 'salary expectation',
      'expected salary', 'rate/salary',
    ],
  },
  {
    id: 'skype',
    label: 'Skype ID',
    sensitive: false,
    synonyms: ['skype id', 'skype', 'skype id:-', 'skype id:'],
  },
  {
    id: 'i140',
    label: 'I-140 Approved',
    sensitive: false,
    synonyms: [
      'i-140', 'i140', 'approved i-140', 'i140 approved',
      'do you have an approved i-140', 'i-140 approval',
      'is your i140 got approved', 'i-140 approved',
    ],
  },
  {
    id: 'usa_entry',
    label: 'Year Entered USA',
    sensitive: false,
    synonyms: [
      'year came to usa', 'which year came to usa', 'year entry to us',
      'in which year did you enter usa', 'year of entry',
      'when did you first start working on h1b',
      'in which year did you enter usa and on which visa',
      'which year entry to usa', 'year of entry to usa',
      'when did step into us visa', 'step into us with visa',
      'when did associate step into us', 'when step into usa',
      'when enter usa visa', 'when did you step into usa',
      'year step into usa', 'when did enter us',
    ],
  },
  {
    id: 'reason_change',
    label: 'Reason for Change',
    sensitive: false,
    synonyms: [
      'reason for change', 'reason for looking', 'why looking',
      'reason for job change', 'reason for leaving',
      'reason for looking new project',
    ],
  },
  {
    id: 'employer',
    label: 'Employer / Sponsor',
    sensitive: false,
    synonyms: [
      'employer', 'current employer', 'sponsor', 'employer details',
      'staffing company', 'c2c company', 'c2c company details',
    ],
  },
  {
    id: 'references',
    label: 'Professional References',
    sensitive: false,
    synonyms: [
      'references', 'professional references', 'managerial references',
      'reference', 'project references', 'client managerial references',
      'two professional references', 'professional references from two projects',
      'professional references (mandatory)',
    ],
  },
  {
    id: 'visa_expiry',
    label: 'Visa Expiry Date',
    sensitive: false,
    synonyms: [
      'visa expiry', 'expiry date', 'visa validity', 'visa expiration',
      'visa expiry date', 'validity of visa', 'visa expiry date:',
    ],
  },
  {
    id: 'background_check',
    label: 'Background Check / Drug Test',
    sensitive: false,
    synonyms: [
      'background check', 'bgc', 'drug test', 'bgc and drug test',
      'willing to take bgc and drug test', 'drug test and bgc',
    ],
  },
  {
    id: 'contract_to_hire',
    label: 'Contract to Hire',
    sensitive: false,
    synonyms: ['contract to hire', 'c2h', 'contract-to-hire', 'contract to hire (y/n)'],
  },
  {
    id: 'communication_skills',
    label: 'Communication Skills',
    sensitive: false,
    synonyms: ['communication skills', 'communication', 'english proficiency'],
  },
  {
    id: 'interview_availability',
    label: 'Interview Availability',
    sensitive: false,
    synonyms: [
      'interview availability', 'best time for interview', 'interview schedule',
      'best time to reach for a tech screen', 'tech screen availability',
      'when are you available for interview',
    ],
  },
];
