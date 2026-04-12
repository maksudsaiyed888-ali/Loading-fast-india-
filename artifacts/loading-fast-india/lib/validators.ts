const INDIA_STATE_CODES = [
  'AP','AR','AS','BR','CG','GA','GJ','HR','HP','JH','KA','KL','MP','MH',
  'MN','ML','MZ','NL','OD','PB','RJ','SK','TN','TS','TR','UP','UK','WB',
  'AN','CH','DH','DD','DL','JK','LA','LD','PY',
];

const STATE_CODE_PATTERN = INDIA_STATE_CODES.join('|');

/**
 * Driving License validation (Indian Govt standard)
 * Format: SS DD YYYY NNNNNNN  (total 15 chars, spaces optional)
 * SS   = State code (2 uppercase letters, valid Indian state/UT)
 * DD   = RTO code (2 digits)
 * YYYY = Issue year (1980–2099)
 * NNNNNNN = 7-digit serial number
 * Examples: RJ14 2023 0000001 | MH12 2020 1234567 | DL4C 2018 0000012
 */
const DL_REGEX = /^([A-Z]{2})(\d{2})((?:19|20)\d{2})(\d{7})$/;

export function validateDrivingLicense(raw: string): { valid: boolean; error: string } {
  const num = raw.replace(/[\s-]/g, '').toUpperCase();

  if (!num) {
    return { valid: false, error: 'लाइसेंस नंबर आवश्यक है' };
  }

  const match = num.match(DL_REGEX);
  if (!match) {
    return {
      valid: false,
      error: `लाइसेंस फॉर्मेट गलत है। सही फॉर्मेट: SS DD YYYY NNNNNNN\nजैसे: RJ14 2023 0000001`,
    };
  }

  const stateCode = match[1];
  if (!INDIA_STATE_CODES.includes(stateCode)) {
    return {
      valid: false,
      error: `"${stateCode}" कोई मान्य राज्य कोड नहीं है। जैसे: RJ, MH, GJ, UP, DL`,
    };
  }

  const year = Number(match[3]);
  const currentYear = new Date().getFullYear();
  if (year < 1980 || year > currentYear) {
    return {
      valid: false,
      error: `वर्ष ${year} मान्य नहीं है (1980 से ${currentYear} के बीच होना चाहिए)`,
    };
  }

  return { valid: true, error: '' };
}

export function formatDLInput(raw: string): string {
  const digits = raw.replace(/[^A-Za-z0-9]/gi, '').toUpperCase().slice(0, 15);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
}

/**
 * RC Book Number (Vehicle Registration Number) — Indian Govt standard
 * Format: SS DD [ALPHA] NNNN  (spaces optional)
 * SS    = State code (2 uppercase letters)
 * DD    = District/RTO code (1–2 digits)
 * ALPHA = Series letters (1–3 uppercase letters)
 * NNNN  = 1–4 digit serial number
 * Examples: RJ14CA0001 | MH12AB1234 | GJ01BQ9999 | DL3CAC0001
 * Bharat series also supported: BH01AA1234
 */
const RC_REGEX = /^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/;

export function validateRCBook(raw: string): { valid: boolean; error: string } {
  const num = raw.replace(/[\s-]/g, '').toUpperCase();

  if (!num) {
    return { valid: false, error: 'RC Book नंबर आवश्यक है' };
  }

  const match = num.match(RC_REGEX);
  if (!match) {
    return {
      valid: false,
      error: `RC नंबर फॉर्मेट गलत है। सही फॉर्मेट: SS DD AA NNNN\nजैसे: RJ14CA0001 या MH12AB1234`,
    };
  }

  const stateCode = match[1];
  const validBH = stateCode === 'BH';
  if (!INDIA_STATE_CODES.includes(stateCode) && !validBH) {
    return {
      valid: false,
      error: `"${stateCode}" कोई मान्य राज्य कोड नहीं है। जैसे: RJ, MH, GJ, UP, DL`,
    };
  }

  return { valid: true, error: '' };
}

export function formatRCInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/gi, '').toUpperCase().slice(0, 11);
}

/**
 * License Expiry Date — DD/MM/YYYY
 */
const DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function validateLicenseExpiry(raw: string): { valid: boolean; error: string } {
  if (!raw.trim()) return { valid: false, error: 'एक्सपायरी तारीख आवश्यक है' };

  if (!DATE_REGEX.test(raw.trim())) {
    return { valid: false, error: 'तारीख का फॉर्मेट: DD/MM/YYYY (जैसे: 31/12/2030)' };
  }

  const [, dd, mm, yyyy] = raw.match(DATE_REGEX)!;
  const day = Number(dd), month = Number(mm), year = Number(yyyy);

  if (month < 1 || month > 12) return { valid: false, error: 'महीना 01–12 के बीच होना चाहिए' };
  if (day < 1 || day > 31) return { valid: false, error: 'तारीख 01–31 के बीच होना चाहिए' };

  const expiryDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiryDate < today) {
    return { valid: false, error: 'लाइसेंस एक्सपायर हो चुका है — नई तारीख डालें' };
  }

  return { valid: true, error: '' };
}

export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
