type BankingImagePresentation = {
  fit?: 'contain' | 'cover';
  position?: string;
  scale?: number;
  imgClassName?: string;
};

const presentationByBankName: Record<string, BankingImagePresentation> = {
  'alliant credit union': {
    imgClassName: 'bg-black/10 px-8 py-5',
    scale: 1.12
  },
  'bank of america': {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.2
  },
  bmo: {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.08
  },
  'capital one': {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.18
  },
  chase: {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.18
  },
  chime: {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.14
  },
  citibank: {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.14
  },
  'etrade from morgan stanley private bank': {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.1
  },
  'huntington bank': {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.28
  },
  keybank: {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.22
  },
  'marcus by goldman sachs': {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.14
  },
  pnc: {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.14
  },
  sofi: {
    imgClassName: 'bg-black/10 px-7 py-4',
    scale: 1.12
  },
  'td bank': {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.22
  },
  truist: {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.08
  },
  'u.s. bank': {
    imgClassName: 'bg-black/10 px-5 py-4',
    scale: 1.12
  },
  'wells fargo': {
    imgClassName: 'bg-black/10 px-8 py-4',
    scale: 1.18
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
