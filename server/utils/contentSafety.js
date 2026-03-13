const BLOCKED_PATTERNS = [
  /\b(nude|porn|xxx|escort)\b/i,
  /\b(hate|kill|terror|bomb)\b/i,
  /\b(fake\s+id|stolen\s+card|drugs?)\b/i,
];

const REVIEW_PATTERNS = [
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bpay\s+outside\b/i,
  /\bupi\s+id\b/i,
  /\bguaranteed\s+income\b/i,
  /\bno\s+experience\s+needed\s+high\s+salary\b/i,
];

const safeText = (value) => (typeof value === "string" ? value.trim() : "");

export const analyzeTextSafety = (values = []) => {
  const text = values
    .map((value) => safeText(value))
    .filter(Boolean)
    .join(" ")
    .slice(0, 4000);

  if (!text) {
    return {
      blocked: false,
      reviewRecommended: false,
      blockedFlags: [],
      reviewFlags: [],
    };
  }

  const blockedFlags = BLOCKED_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).map((pattern) => pattern.source);
  const reviewFlags = REVIEW_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).map((pattern) => pattern.source);

  return {
    blocked: blockedFlags.length > 0,
    reviewRecommended: reviewFlags.length > 0,
    blockedFlags,
    reviewFlags,
  };
};
