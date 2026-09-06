// Served from client/public/avatars/ — keep these in sync with
// server/src/constants/avatar.ts on the backend.
export const DEFAULT_MALE_AVATAR = "/avatars/default-male.png";
export const DEFAULT_FEMALE_AVATAR = "/avatars/default-female.png";

// The picture every account is created with.
export const DEFAULT_PROFILE_PICTURE = DEFAULT_MALE_AVATAR;

export type AvatarGender = "male" | "female";

export function resolveDefaultAvatar(gender: AvatarGender): string {
  return gender === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR;
}

export function isDefaultAvatar(picture?: string | null): boolean {
  if (!picture) return false;
  return picture.includes(DEFAULT_MALE_AVATAR) || picture.includes(DEFAULT_FEMALE_AVATAR);
}
