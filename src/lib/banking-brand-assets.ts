const KEYBANK_FAVICON_URL =
  'https://www.key.com/etc.clientlibs/keybank-foundation/clientlibs/clientlib-base/resources/icons/favicon.ico';
const ALLIANT_FAVICON_URL = 'https://www.alliantcreditunion.org/resources/favicon.ico';
const CHIME_FAVICON_URL = 'https://www.chime.com/img/favicon.png';
const ALLIANT_LOGO_URL = 'https://www.alliantcreditunion.org/assets/dist/images/logo.png';
const AXOS_LOGO_URL = 'https://www.axos.com/images/3CCtw3l5s6XOgqEqwI1AHd/axos-logo.svg';
const BANK_OF_AMERICA_LOGO_URL =
  'https://www1.bac-assets.com/homepage/spa-assets/images/assets-images-global-logos-bac-logo-v2-CSX3648cbbb.svg';
const BMO_LOGO_URL = 'https://www.bmo.com/dist/images/logos/bmo-blue-on-transparent-en.svg';
const CAPITAL_ONE_LOGO_URL = '/bank-logos/capital-one.svg';
const CHASE_LOGO_URL =
  'https://www.chase.com/content/dam/unified-assets/logo/chase/chase-logo/additional-file-formats/logo_chase_headerfooter.svg';
const CITI_LOGO_URL = '/bank-logos/citi.svg';
const ETRADE_LOGO_URL =
  'https://cdn2.etrade.net/1/26022716140.0/aempros/content/dam/etrade/retail/en_US/images/global/logos/etrade-from-morgan-stanley-logo-dark-theme.svg';
const HUNTINGTON_LOGO_URL =
  'https://www.huntington.com/-/media/Project/huntington/hcom/logo.svg?h=34&hash=C30EA1B787772E50AB6A58FFB6AB51F3&iar=0&rev=4e84f6b1d5ba431f90d0f8adb3200280&w=231';
const KEYBANK_LOGO_URL =
  'https://www.key.com/content/experience-fragments/kco/system/navigation/headers/key-at-work/master/_jcr_content/header/logo.coreimg.svg/1733170379196/kb-logo.svg';
const MARCUS_LOGO_URL =
  'https://www.goldmansachs.com/images/migrated/our-firm/history/moments/150th-multimedia/2016-marcus/marcus.png';
const PNC_LOGO_URL = 'https://www.pnc.com/content/dam/pnc-com/images/universal/pnc-logos/pnc_logo_rev.svg';
const SOFI_LOGO_URL = 'https://d32ijn7u0aqfv4.cloudfront.net/git/svgs/sofi-logo.svg';
const TD_LOGO_URL = 'https://www.td.com/content/dam/tdb/images/navigation-header-and-footer/td-logo-desktop.png';
const US_BANK_LOGO_URL = '/bank-logos/us-bank.svg';
const WELLS_FARGO_LOGO_URL =
  'https://www17.wellsfargomedia.com/assets/images/rwd/wf_logo_220x23.png';

const LOW_FIDELITY_BANK_IMAGE_TOKENS = [
  'favicon',
  'apple-touch-icon',
  'logo-personal.svg'
] as const;

const bankingBrandImageUrlByBankName: Record<string, string> = {
  'alliant credit union': ALLIANT_LOGO_URL,
  axos: AXOS_LOGO_URL,
  'bank of america': BANK_OF_AMERICA_LOGO_URL,
  bmo: BMO_LOGO_URL,
  'capital one': CAPITAL_ONE_LOGO_URL,
  chase: CHASE_LOGO_URL,
  chime:
    'https://chime-mobile-assets.prod-ext.chmfin.com/prod/images/ck.logo.chime.chime_green.medium.registered.dark%403x.png',
  'coastal credit union': '/bank-logos/coastal-credit-union.svg',
  citibank: CITI_LOGO_URL,
  'etrade from morgan stanley private bank': ETRADE_LOGO_URL,
  'harbor federal': '/bank-logos/harbor-federal.svg',
  'huntington bank': HUNTINGTON_LOGO_URL,
  keybank: KEYBANK_LOGO_URL,
  'marcus by goldman sachs': MARCUS_LOGO_URL,
  pnc: PNC_LOGO_URL,
  sofi: SOFI_LOGO_URL,
  'td bank': TD_LOGO_URL,
  truist: 'https://static.truist.com/content/dam/global-images/truist-logo-purple.svg',
  'u.s. bank': US_BANK_LOGO_URL,
  'wells fargo': WELLS_FARGO_LOGO_URL
};

function normalizeBankName(bankName: string) {
  return bankName
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isKnownBrokenBankImageUrl(bankName: string, imageUrl: string) {
  const normalizedBankName = normalizeBankName(bankName);
  const normalizedImageUrl = imageUrl.trim();

  return (
    (normalizedBankName === 'keybank' && normalizedImageUrl === KEYBANK_FAVICON_URL) ||
    (normalizedBankName === 'alliant credit union' && normalizedImageUrl === ALLIANT_FAVICON_URL) ||
    (normalizedBankName === 'chime' && normalizedImageUrl === CHIME_FAVICON_URL)
  );
}

function isLowFidelityBankImageUrl(imageUrl: string) {
  const normalizedImageUrl = imageUrl.trim().toLowerCase();
  if (!normalizedImageUrl) return false;
  if (normalizedImageUrl.endsWith('.ico')) return true;

  return LOW_FIDELITY_BANK_IMAGE_TOKENS.some((token) => normalizedImageUrl.includes(token));
}

export function resolveBankingBrandImageUrl(bankName: string, imageUrl?: string | null) {
  const normalizedBankName = normalizeBankName(bankName);
  const curatedImageUrl = bankingBrandImageUrlByBankName[normalizedBankName];

  if (imageUrl) {
    const normalizedImageUrl = imageUrl.trim();

    if (isKnownBrokenBankImageUrl(bankName, normalizedImageUrl)) {
      return curatedImageUrl;
    }

    if (
      curatedImageUrl &&
      normalizedImageUrl !== curatedImageUrl &&
      isLowFidelityBankImageUrl(normalizedImageUrl)
    ) {
      return curatedImageUrl;
    }

    return normalizedImageUrl;
  }

  return curatedImageUrl;
}
