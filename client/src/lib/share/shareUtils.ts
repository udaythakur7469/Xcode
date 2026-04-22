import { SocialPlatform } from "@/types/share";

// ── Deep link URL builder ─────────────────────────────────────────────────
// Builds the shareable deep link for a post using the URL format established
// in the deep linking implementation.

export const buildPostShareUrl = (
  problemTitle: string,
  postId: string,
): string => {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/problems/problem-detail`
      : "";
  const params = new URLSearchParams({
    title: problemTitle,
    tab: "discussion",
    post: postId,
  });
  return `${base}?${params.toString()}`;
};

// ── Social share URL builders ─────────────────────────────────────────────

const SOCIAL_URL_BUILDERS: Record<
  SocialPlatform,
  (url: string, title: string) => string
> = {
  linkedin: (url) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  twitter: (url, title) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: (url) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  whatsapp: (url) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  telegram: (url) => `https://t.me/share/url?url=${encodeURIComponent(url)}`,
  reddit: (url, title) =>
    `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
};

export const buildSocialUrl = (
  platform: SocialPlatform,
  shareUrl: string,
  title: string,
): string => SOCIAL_URL_BUILDERS[platform](shareUrl, title);

// ── Popup opener ─────────────────────────────────────────────────────────
// Opens social share URLs in a centered popup window.

export const openSharePopup = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

// ── Clipboard ─────────────────────────────────────────────────────────────

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};
