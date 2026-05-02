import type { CardRecord } from '@/lib/cards/schema';

export type CardVisualTheme = {
  accentRgb: string;
  accentTextRgb: string;
};

type CardVisualThemeSource = Pick<CardRecord, 'slug' | 'issuer' | 'name'>;

const defaultCardVisualTheme: CardVisualTheme = {
  accentRgb: '255 255 255',
  accentTextRgb: '255 255 255'
};

const cardVisualThemeBySlug: Record<string, CardVisualTheme> = {
  'alaska-airlines-visa-signature': {
    accentRgb: '15 127 134',
    accentTextRgb: '113 215 219'
  },
  'amex-blue-business-cash': {
    accentRgb: '75 150 220',
    accentTextRgb: '132 202 255'
  },
  'amex-blue-business-plus': {
    accentRgb: '77 149 220',
    accentTextRgb: '132 202 255'
  },
  'amex-blue-cash-everyday': {
    accentRgb: '83 172 230',
    accentTextRgb: '136 211 255'
  },
  'amex-blue-cash-preferred': {
    accentRgb: '55 102 202',
    accentTextRgb: '130 177 255'
  },
  'amex-business-gold-card': {
    accentRgb: '212 168 83',
    accentTextRgb: '236 196 105'
  },
  'amex-business-green-rewards': {
    accentRgb: '116 157 119',
    accentTextRgb: '181 226 184'
  },
  'amex-business-platinum-card': {
    accentRgb: '214 229 255',
    accentTextRgb: '225 235 255'
  },
  'amex-green-card': {
    accentRgb: '107 153 111',
    accentTextRgb: '195 235 205'
  },
  'amex-gold-card': {
    accentRgb: '212 168 83',
    accentTextRgb: '236 196 105'
  },
  'amex-hilton-honors-business': {
    accentRgb: '42 110 185',
    accentTextRgb: '121 184 255'
  },
  'amex-platinum-card': {
    accentRgb: '214 229 255',
    accentTextRgb: '225 235 255'
  },
  'apple-card': {
    accentRgb: '216 218 222',
    accentTextRgb: '242 244 247'
  },
  'bank-of-america-business-advantage-customized-cash-rewards': {
    accentRgb: '198 26 50',
    accentTextRgb: '255 117 136'
  },
  'bank-of-america-business-advantage-travel-rewards': {
    accentRgb: '40 91 172',
    accentTextRgb: '118 176 255'
  },
  'bank-of-america-business-advantage-unlimited-cash-rewards': {
    accentRgb: '198 26 50',
    accentTextRgb: '255 117 136'
  },
  'bank-of-america-customized-cash-rewards': {
    accentRgb: '198 26 50',
    accentTextRgb: '255 117 136'
  },
  'bank-of-america-premium-rewards': {
    accentRgb: '166 111 57',
    accentTextRgb: '231 184 111'
  },
  'bank-of-america-premium-rewards-elite': {
    accentRgb: '58 64 75',
    accentTextRgb: '184 194 211'
  },
  'bank-of-america-travel-rewards': {
    accentRgb: '40 91 172',
    accentTextRgb: '118 176 255'
  },
  'bank-of-america-unlimited-cash-rewards': {
    accentRgb: '198 26 50',
    accentTextRgb: '255 117 136'
  },
  'barclays-aadvantage-aviator-red': {
    accentRgb: '165 18 37',
    accentTextRgb: '255 107 124'
  },
  'barclays-jetblue-card': {
    accentRgb: '25 130 220',
    accentTextRgb: '111 196 255'
  },
  'barclays-jetblue-plus': {
    accentRgb: '14 47 110',
    accentTextRgb: '111 196 255'
  },
  'barclays-wyndham-earner-plus': {
    accentRgb: '0 160 223',
    accentTextRgb: '93 210 255'
  },
  'bilt-mastercard': {
    accentRgb: '45 115 215',
    accentTextRgb: '126 184 255'
  },
  'capital-one-quicksilver': {
    accentRgb: '185 199 214',
    accentTextRgb: '224 233 242'
  },
  'capital-one-savor-rewards': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'capital-one-spark-1-5x-miles-select': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'capital-one-spark-2-cash': {
    accentRgb: '216 181 108',
    accentTextRgb: '246 211 137'
  },
  'capital-one-spark-2x-miles': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'capital-one-spark-cash-plus': {
    accentRgb: '216 181 108',
    accentTextRgb: '246 211 137'
  },
  'capital-one-spark-cash-select': {
    accentRgb: '216 181 108',
    accentTextRgb: '246 211 137'
  },
  'capital-one-venture-rewards': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'capital-one-venture-x': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'capital-one-venture-x-business': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'capital-one-ventureone-rewards': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  'chase-freedom-flex': {
    accentRgb: '37 184 207',
    accentTextRgb: '102 220 238'
  },
  'chase-freedom-unlimited': {
    accentRgb: '78 148 255',
    accentTextRgb: '140 194 255'
  },
  'chase-ihg-one-rewards-premier': {
    accentRgb: '97 54 129',
    accentTextRgb: '202 148 235'
  },
  'chase-ihg-one-rewards-premier-business': {
    accentRgb: '97 54 129',
    accentTextRgb: '202 148 235'
  },
  'chase-ihg-one-rewards-traveler': {
    accentRgb: '97 54 129',
    accentTextRgb: '202 148 235'
  },
  'chase-ink-business-cash': {
    accentRgb: '40 128 215',
    accentTextRgb: '116 190 255'
  },
  'chase-ink-business-preferred': {
    accentRgb: '48 91 180',
    accentTextRgb: '126 171 255'
  },
  'chase-ink-business-premier': {
    accentRgb: '216 181 108',
    accentTextRgb: '246 211 137'
  },
  'chase-ink-business-unlimited': {
    accentRgb: '100 131 168',
    accentTextRgb: '172 202 238'
  },
  'chase-marriott-bonvoy-boundless': {
    accentRgb: '120 74 82',
    accentTextRgb: '218 151 163'
  },
  'chase-sapphire-preferred': {
    accentRgb: '85 124 225',
    accentTextRgb: '145 179 255'
  },
  'chase-sapphire-reserve': {
    accentRgb: '90 224 255',
    accentTextRgb: '90 224 255'
  },
  'chase-southwest-rapid-rewards-plus': {
    accentRgb: '36 103 200',
    accentTextRgb: '119 178 255'
  },
  'chase-southwest-rapid-rewards-premier': {
    accentRgb: '36 103 200',
    accentTextRgb: '119 178 255'
  },
  'chase-southwest-rapid-rewards-priority': {
    accentRgb: '36 103 200',
    accentTextRgb: '119 178 255'
  },
  'chase-united-business': {
    accentRgb: '21 89 168',
    accentTextRgb: '104 175 255'
  },
  'chase-united-club': {
    accentRgb: '21 89 168',
    accentTextRgb: '104 175 255'
  },
  'chase-united-club-business': {
    accentRgb: '21 89 168',
    accentTextRgb: '104 175 255'
  },
  'chase-united-explorer': {
    accentRgb: '21 89 168',
    accentTextRgb: '104 175 255'
  },
  'chase-united-gateway': {
    accentRgb: '21 89 168',
    accentTextRgb: '104 175 255'
  },
  'chase-united-quest': {
    accentRgb: '21 89 168',
    accentTextRgb: '104 175 255'
  },
  'chase-world-of-hyatt': {
    accentRgb: '52 116 185',
    accentTextRgb: '125 190 255'
  },
  'chase-world-of-hyatt-business': {
    accentRgb: '52 116 185',
    accentTextRgb: '125 190 255'
  },
  'citi-aadvantage-business': {
    accentRgb: '34 77 153',
    accentTextRgb: '121 176 255'
  },
  'citi-aadvantage-executive': {
    accentRgb: '34 77 153',
    accentTextRgb: '121 176 255'
  },
  'citi-aadvantage-platinum-select': {
    accentRgb: '34 77 153',
    accentTextRgb: '121 176 255'
  },
  'citi-custom-cash-card': {
    accentRgb: '38 153 144',
    accentTextRgb: '103 222 212'
  },
  'citi-double-cash-card': {
    accentRgb: '42 116 205',
    accentTextRgb: '122 187 255'
  },
  'citi-strata-card': {
    accentRgb: '82 118 210',
    accentTextRgb: '148 187 255'
  },
  'citi-strata-premier-card': {
    accentRgb: '82 118 210',
    accentTextRgb: '148 187 255'
  },
  'discover-it-cash-back': {
    accentRgb: '245 130 32',
    accentTextRgb: '255 171 86'
  },
  'discover-it-miles': {
    accentRgb: '245 130 32',
    accentTextRgb: '255 171 86'
  },
  'fidelity-rewards-visa-signature': {
    accentRgb: '47 107 47',
    accentTextRgb: '132 213 132'
  },
  'paypal-cashback-mastercard': {
    accentRgb: '0 156 222',
    accentTextRgb: '92 210 255'
  },
  'robinhood-gold-card': {
    accentRgb: '0 200 5',
    accentTextRgb: '104 245 108'
  },
  'sofi-unlimited-2-credit-card': {
    accentRgb: '35 190 188',
    accentTextRgb: '108 230 228'
  },
  'us-bank-altitude-connect': {
    accentRgb: '68 118 185',
    accentTextRgb: '133 190 255'
  },
  'us-bank-altitude-go': {
    accentRgb: '212 72 48',
    accentTextRgb: '255 136 112'
  },
  'us-bank-altitude-reserve': {
    accentRgb: '126 136 150',
    accentTextRgb: '205 214 226'
  },
  'us-bank-business-altitude-power': {
    accentRgb: '68 118 185',
    accentTextRgb: '133 190 255'
  },
  'us-bank-business-leverage': {
    accentRgb: '83 91 104',
    accentTextRgb: '187 198 214'
  },
  'us-bank-business-shield': {
    accentRgb: '58 93 130',
    accentTextRgb: '130 190 240'
  },
  'us-bank-cash-plus-visa-signature': {
    accentRgb: '44 118 190',
    accentTextRgb: '122 193 255'
  },
  'us-bank-shopper-cash-rewards': {
    accentRgb: '85 124 210',
    accentTextRgb: '145 184 255'
  },
  'us-bank-smartly-visa-signature': {
    accentRgb: '70 85 100',
    accentTextRgb: '190 205 220'
  },
  'us-bank-triple-cash-rewards-business': {
    accentRgb: '44 118 190',
    accentTextRgb: '122 193 255'
  },
  'venmo-credit-card': {
    accentRgb: '17 140 223',
    accentTextRgb: '93 199 255'
  },
  'wells-fargo-active-cash': {
    accentRgb: '183 37 37',
    accentTextRgb: '255 112 112'
  },
  'wells-fargo-autograph': {
    accentRgb: '184 73 48',
    accentTextRgb: '255 139 112'
  },
  'wells-fargo-autograph-journey': {
    accentRgb: '184 73 48',
    accentTextRgb: '255 139 112'
  }
};

const cardVisualThemeByIssuer: Record<string, CardVisualTheme> = {
  'american express': {
    accentRgb: '15 126 232',
    accentTextRgb: '120 195 255'
  },
  apple: {
    accentRgb: '216 218 222',
    accentTextRgb: '242 244 247'
  },
  'bank of america': {
    accentRgb: '198 26 50',
    accentTextRgb: '255 117 136'
  },
  barclays: {
    accentRgb: '0 160 223',
    accentTextRgb: '93 210 255'
  },
  bilt: {
    accentRgb: '45 115 215',
    accentTextRgb: '126 184 255'
  },
  'capital one': {
    accentRgb: '237 86 60',
    accentTextRgb: '255 135 112'
  },
  chase: {
    accentRgb: '0 94 184',
    accentTextRgb: '112 180 255'
  },
  citi: {
    accentRgb: '42 116 205',
    accentTextRgb: '122 187 255'
  },
  discover: {
    accentRgb: '245 130 32',
    accentTextRgb: '255 171 86'
  },
  fidelity: {
    accentRgb: '47 107 47',
    accentTextRgb: '132 213 132'
  },
  paypal: {
    accentRgb: '0 156 222',
    accentTextRgb: '92 210 255'
  },
  robinhood: {
    accentRgb: '0 200 5',
    accentTextRgb: '104 245 108'
  },
  sofi: {
    accentRgb: '35 190 188',
    accentTextRgb: '108 230 228'
  },
  'u.s. bank': {
    accentRgb: '44 118 190',
    accentTextRgb: '122 193 255'
  },
  venmo: {
    accentRgb: '17 140 223',
    accentTextRgb: '93 199 255'
  },
  'wells fargo': {
    accentRgb: '183 37 37',
    accentTextRgb: '255 112 112'
  }
};

function normalizeThemeKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function getCardVisualTheme(card: CardVisualThemeSource): CardVisualTheme {
  return (
    cardVisualThemeBySlug[card.slug] ??
    cardVisualThemeByIssuer[normalizeThemeKey(card.issuer)] ??
    defaultCardVisualTheme
  );
}
