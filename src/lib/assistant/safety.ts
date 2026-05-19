import { normalizeAssistantText } from '@/lib/assistant/normalize';

export type AssistantSafetyResult =
  | { blocked: false }
  | { blocked: true; response: string };

const allowedTopicPatterns = [
  /\b(the stack|stack tool|bonus plan|planner|calculator|tracker|compare|comparison)\b/i,
  /\b(credit card|card|cards|issuer|annual fee|apr|statement credit|foreign transaction)\b/i,
  /\b(bank|banking|checking|savings|apy|deposit|direct deposit|account bonus)\b/i,
  /\b(reward|rewards|cashback|cash back|points|miles|redemption|redeem|transfer partner)\b/i,
  /\b(welcome offer|sign[-\s]?up bonus|signup bonus|bonus offer|minimum spend)\b/i,
  /\b(grocer(?:y|ies)|dining|restaurant|travel|hotel|airline|gas|streaming|utilities)\b/i,
  /\b(amex|american express|chase|capital one|citi|discover|bilt|wells fargo|us bank|u\.s\. bank|barclays|bank of america|sofi|fidelity|paypal|venmo|robinhood)\b/i,
  /\b(platinum|sapphire|venture x|freedom|custom cash|double cash|autograph|active cash)\b/i
];

const piiPatterns = [
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
  /\b(?:\d[ -]?){13,19}\b/,
  /\b(?:account|routing|ssn|social security)\b.*\d{4,}/i
];

const credentialPatterns = [
  /\b(?:password|passcode|api key|access token|auth token|bearer token|private key|secret key|seed phrase|recovery phrase)\b/i,
  /\b(?:my|here(?:'s| is)|the)\s+(?:secret|token|key)\b/i
];

const unsafeIntentPatterns = [
  /\bfake\b.*\b(income|identity|document|statement|pay stub|address)\b/i,
  /\bmisrepresent\b.*\b(income|employment|address|business)\b/i,
  /\bsynthetic identity\b/i,
  /\bsteal\b.*\b(card|account|identity|ssn)\b/i,
  /\bbypass\b.*\b(issuer|bank|verification|identity|kyc|fraud)\b/i,
  /\bliquidat(e|ing)\b.*\b(gift cards?|money orders?)\b/i,
  /\bmanufactured spend(ing)?\b/i
];

const injectionPatterns = [
  /\bignore\b.*\b(previous|prior|above|system|developer)\b.*\b(instruction|instructions|message|messages|prompt|prompts|rules)\b/i,
  /\b(system|developer)\s+(prompt|message|instructions?)\b/i,
  /\b(reveal|show|print|repeat|dump|leak)\b.*\b(system|developer)\b.*\b(prompt|message|instructions?)\b/i,
  /\b(jailbreak|dan mode|do anything now|bypass safety|bypass guardrails)\b/i,
  /\bpretend\b.*\b(unrestricted|uncensored|no rules|not bound)\b/i,
  /\b(write|create|generate|build)\b.*\b(malware|phishing|ransomware|keylogger|credential stealer)\b/i,
  /\bsteal\b.*\b(credentials?|passwords?|tokens?|api keys?)\b/i
];

export function checkAssistantSafety(text: string): AssistantSafetyResult {
  const normalized = normalizeAssistantText(text);

  if (piiPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      blocked: true,
      response:
        'For privacy, do not send SSNs, full card numbers, account numbers, passwords, or other sensitive identifiers here. I can still help with general card, banking, and planning questions if you remove those details.'
    };
  }

  if (credentialPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      blocked: true,
      response:
        'For privacy, do not send passwords, passcodes, API keys, tokens, private keys, seed phrases, or other credentials here. Remove those details and I can still help with general Stack planning.'
    };
  }

  if (unsafeIntentPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      blocked: true,
      response:
        'I cannot help with fraud, identity abuse, false application details, or ways to bypass bank and issuer rules. I can help compare legitimate offers, plan normal spend, or choose a Stack tool instead.'
    };
  }

  if (injectionPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      blocked: true,
      response:
        'I cannot help override system rules, reveal hidden prompts, or assist with malware, phishing, credential theft, or other abusive requests. I can still help with legitimate Stack card, banking, and rewards questions.'
    };
  }

  if (!allowedTopicPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      blocked: true,
      response:
        'I can only help with The Stack topics: credit cards, banking bonuses, rewards, points, card benefits, and Stack planning tools.'
    };
  }

  return { blocked: false };
}
