export const PRODUCT_CONDITIONS = {
  NEW: 'new',
  LIKE_NEW: 'like-new',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
} as const;

export const PRODUCT_CONDITIONS_ARRAY = Object.values(PRODUCT_CONDITIONS);

export const PRODUCT_CONDITIONS_LABELS: Record<string, string> = {
  new: 'Brand New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export const PRODUCT_STATUSES = {
  ACTIVE: 'active',
  SOLD: 'sold',
  RESERVED: 'reserved',
  DRAFT: 'draft',
  REMOVED: 'removed',
} as const;

export const PRODUCT_STATUSES_ARRAY = Object.values(PRODUCT_STATUSES);

export const DELIVERY_OPTIONS = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  BOTH: 'both',
} as const;

export const DELIVERY_OPTIONS_ARRAY = Object.values(DELIVERY_OPTIONS);

export const DELIVERY_OPTIONS_LABELS: Record<string, string> = {
  pickup: 'Campus Pickup',
  delivery: 'Delivery Available',
  both: 'Pickup or Delivery',
};

export const PRODUCT_LIMITS = {
  MAX_IMAGES: 5,
  MAX_TITLE_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_PRICE: 0.5,
  MAX_PRICE: 100000,
  MAX_TAGS: 10,
  DEFAULT_PAGE_SIZE: 20,
} as const;

// Common campus pickup locations at UMaT
export const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Esther Hall',
  'Independence Hall',
  'Unity Hall',
  'Queens Hall',
  'Engineering Block',
  'Science Block',
  'Library',
  'Student Center',
  'Cafeteria',
  'Sports Complex',
  'Admin Block',
  'ICT Center',
  'Tarkwa Market',
] as const;
