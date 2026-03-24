const KEYBANK_FAVICON_URL =
  'https://www.key.com/etc.clientlibs/keybank-foundation/clientlibs/clientlib-base/resources/icons/favicon.ico';
const ALLIANT_FAVICON_URL = 'https://www.alliantcreditunion.org/resources/favicon.ico';
const CHIME_FAVICON_URL = 'https://www.chime.com/img/favicon.png';

const bankingBrandImageUrlByBankName: Record<string, string> = {
  'bank of america':
    'https://www.bankofamerica.com/homepage/spa-assets/images/assets-images-global-favicon-apple-touch-icon-CSX889b28c.png',
  bmo: 'https://www.bmo.com/dist/favicon/apple-touch-icon.png',
  'capital one': 'https://www.capitalone.com/assets/shell/apple-touch-icon.png',
  chase: 'https://www.chase.com/etc/designs/chase-ux/favicon-152.png',
  chime:
    'https://chime-mobile-assets.prod-ext.chmfin.com/prod/images/ck.logo.chime.chime_green.medium.registered.dark%403x.png',
  citibank: 'https://www.citi.com/cbol-hp-static-assets/assets/favicon.ico',
  'etrade from morgan stanley private bank':
    'https://cdn2.etrade.net/1/21123117210.0/aempros/content/dam/etrade/global/pagemeta/images/apple-touch-icon.png',
  'huntington bank': 'https://www.huntington.com/Presentation/images/apple-touch-icon-180.png',
  'marcus by goldman sachs': 'https://cdn.gs.com/images/goldman-sachs/v1/gs-favicon.ico',
  pnc: 'https://www.pnc.com/etc.clientlibs/pnc-aem-base/clientlibs/clientlib-site/resources/apple-touch-icon.png',
  sofi: 'https://www.sofi.com/favicon.ico',
  'td bank': 'https://www.td.com/etc.clientlibs/tdsite/clientlibs/clientlib-wealth/resources/images/favicon.ico',
  truist: 'https://static.truist.com/content/dam/global-images/truist-logo-purple.svg',
  'u.s. bank':
    'https://www.usbank.com/etc.clientlibs/ecm-global/clientlibs/clientlib-resources/resources/images/svg/logo-personal.svg',
  'wells fargo': 'https://www17.wellsfargomedia.com/assets/images/icons/apple-touch-icon_120x120.png'
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

export function resolveBankingBrandImageUrl(bankName: string, imageUrl?: string | null) {
  if (imageUrl && !isKnownBrokenBankImageUrl(bankName, imageUrl)) return imageUrl;
  return bankingBrandImageUrlByBankName[normalizeBankName(bankName)];
}
