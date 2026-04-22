type BankingImagePresentation = {
  fit?: 'contain' | 'cover';
  position?: string;
  scale?: number;
  imgClassName?: string;
  compactImgClassName?: string;
  miniImgClassName?: string;
  microImgClassName?: string;
};

const darkPlaque = 'bg-black/10 px-7 py-4'
const darkPlaqueWide = 'bg-black/10 px-8 py-4'
const lightPlaque =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-7 py-4'
const lightPlaqueWide =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-8 py-4'
const lightPlaqueNarrow =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-5 py-4'
const compactDarkPlaque = 'bg-black/10 px-3 py-2'
const compactLightPlaque =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-3 py-2'
const compactLightPlaqueNarrow =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-2 py-2'
const miniDarkPlaque = 'bg-black/10 px-2 py-2'
const miniLightPlaque =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-2 py-2'
const miniLightPlaqueNarrow =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-1.5 py-2'
const microDarkPlaque = 'bg-black/10 px-1.5 py-1.5'
const microLightPlaque =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-1.5 py-1.5'
const microLightPlaqueNarrow =
  'bg-[linear-gradient(180deg,rgba(248,246,240,0.96),rgba(235,231,221,0.92))] px-1 py-1.5'
const chaseWhitePlaque = 'bg-white px-4 py-2'
const compactChaseWhitePlaque = 'bg-white px-2.5 py-1.5'
const miniChaseWhitePlaque = 'bg-white px-2 py-1'
const microChaseWhitePlaque = 'bg-white px-1 py-0.5'

const darkBankImagePresentation = {
  imgClassName: darkPlaque,
  compactImgClassName: compactDarkPlaque,
  miniImgClassName: miniDarkPlaque,
  microImgClassName: microDarkPlaque
} as const;

const darkWideBankImagePresentation = {
  imgClassName: darkPlaqueWide,
  compactImgClassName: compactDarkPlaque,
  miniImgClassName: miniDarkPlaque,
  microImgClassName: microDarkPlaque
} as const;

const lightBankImagePresentation = {
  imgClassName: lightPlaque,
  compactImgClassName: compactLightPlaque,
  miniImgClassName: miniLightPlaque,
  microImgClassName: microLightPlaque
} as const;

const lightWideBankImagePresentation = {
  imgClassName: lightPlaqueWide,
  compactImgClassName: compactLightPlaque,
  miniImgClassName: miniLightPlaque,
  microImgClassName: microLightPlaque
} as const;

const lightNarrowBankImagePresentation = {
  imgClassName: lightPlaqueNarrow,
  compactImgClassName: compactLightPlaqueNarrow,
  miniImgClassName: miniLightPlaqueNarrow,
  microImgClassName: microLightPlaqueNarrow
} as const;

const chaseWhiteBankImagePresentation = {
  imgClassName: chaseWhitePlaque,
  compactImgClassName: compactChaseWhitePlaque,
  miniImgClassName: miniChaseWhitePlaque,
  microImgClassName: microChaseWhitePlaque
} as const;

const bareBankImagePresentation = {
  imgClassName: 'bg-transparent p-0',
  compactImgClassName: 'bg-transparent p-0',
  miniImgClassName: 'bg-transparent p-0',
  microImgClassName: 'bg-transparent p-0'
} as const;

const presentationByBankName: Record<string, BankingImagePresentation> = {
  'alliant credit union': {
    ...lightWideBankImagePresentation,
    scale: 1.08
  },
  'bank of america': {
    ...lightBankImagePresentation,
    scale: 1.14
  },
  bmo: {
    ...lightBankImagePresentation,
    scale: 1.02
  },
  'capital one': {
    ...lightBankImagePresentation,
    scale: 1.12
  },
  chase: {
    ...chaseWhiteBankImagePresentation,
    scale: 1.08
  },
  chime: {
    ...darkBankImagePresentation,
    scale: 1.14
  },
  'coastal credit union': {
    ...bareBankImagePresentation,
    scale: 1.04
  },
  citibank: {
    ...bareBankImagePresentation,
    scale: 1.02
  },
  'etrade from morgan stanley private bank': {
    ...darkWideBankImagePresentation,
    scale: 1.1
  },
  'harbor federal': {
    ...bareBankImagePresentation,
    scale: 1.04
  },
  'huntington bank': {
    ...darkWideBankImagePresentation,
    scale: 1.28
  },
  keybank: {
    ...lightWideBankImagePresentation,
    scale: 1.14
  },
  'marcus by goldman sachs': {
    ...lightWideBankImagePresentation,
    scale: 1.08
  },
  pnc: {
    ...darkBankImagePresentation,
    scale: 1.14
  },
  sofi: {
    ...darkBankImagePresentation,
    scale: 1.12
  },
  'td bank': {
    ...darkWideBankImagePresentation,
    scale: 1.22
  },
  truist: {
    ...lightWideBankImagePresentation,
    scale: 1.04
  },
  'u.s. bank': {
    ...lightNarrowBankImagePresentation,
    scale: 1.08
  },
  'wells fargo': {
    ...bareBankImagePresentation,
    scale: 1
  }
};

function normalizeBankName(bankName: string) {
  return bankName
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBankingImagePresentation(bankName: string): BankingImagePresentation | null {
  return presentationByBankName[normalizeBankName(bankName)] ?? null;
}
