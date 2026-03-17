export const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const;

export const ROLES_ARRAY = Object.values(USER_ROLES);
