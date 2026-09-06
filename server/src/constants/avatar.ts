// Relative paths — served by the Next.js client from client/public/avatars/.
// Kept relative (not absolute) so they resolve correctly against whichever
// origin renders them, the same way an uploaded Cloudinary URL would.
export const DEFAULT_MALE_AVATAR = "/avatars/default-male.png";
export const DEFAULT_FEMALE_AVATAR = "/avatars/default-female.png";

// The default picture every account is created with.
// Must match the `picture` field's @default(...) in prisma/schema.prisma
export const DEFAULT_PROFILE_PICTURE = DEFAULT_MALE_AVATAR;

export const DEFAULT_AVATARS = [DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR];

export type AvatarGender = "male" | "female";

export function resolveDefaultAvatar(gender: AvatarGender): string {
  return gender === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR;
}

// True if the given picture URL is one of our own default avatars
// (as opposed to a Cloudinary upload or an OAuth provider's photo).
export function isDefaultAvatar(picture?: string | null): boolean {
  if (!picture) return false;
  return DEFAULT_AVATARS.some((p) => picture.includes(p));
}
