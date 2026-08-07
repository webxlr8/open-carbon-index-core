type Category =
  | "analytics"
  | "ads"
  | "cdn"
  | "font"
  | "social"
  | "chat"
  | "other";

const RULES: ReadonlyArray<readonly [RegExp, Category]> = [
  [
    /google-analytics|googletagmanager|segment\.com|mixpanel|amplitude|hotjar|plausible|fathom/i,
    "analytics",
  ],
  [
    /doubleclick|googlesyndication|adservice|adnxs|criteo|taboola|outbrain/i,
    "ads",
  ],
  [/cloudflare|cloudfront|fastly|akamai|jsdelivr|unpkg/i, "cdn"],
  [/gstatic|googleapis|typekit|fontawesome|usefontawesome/i, "font"],
  [
    /facebook\.net|fbcdn|connect\.facebook|twitter\.com|linkedin\.com|instagram\.com|tiktok/i,
    "social",
  ],
  [/intercom|drift|hubspot|zdchat|livechat|crisp/i, "chat"],
];

export function categorize(host: string): Category {
  const h = host.toLowerCase();
  for (const [re, cat] of RULES) if (re.test(h)) return cat;
  return "other";
}
