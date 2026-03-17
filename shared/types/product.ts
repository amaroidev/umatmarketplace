export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like-new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ProductStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RESERVED = 'reserved',
  DRAFT = 'draft',
  REMOVED = 'removed',
}

export enum DeliveryOption {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  BOTH = 'both',
}

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string; // Category ID or populated ICategory
  seller: string; // User ID or populated IUser
  images: IProductImage[];
  condition: ProductCondition;
  status: ProductStatus;
  deliveryOption: DeliveryOption;
  pickupLocation: string;
  tags: string[];
  views: number;
  isFeatured: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProductPopulated extends Omit<IProduct, 'category' | 'seller'> {
  category: {
    _id: string;
    name: string;
    slug: string;
    icon: string;
  };
  seller: {
    _id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    location?: string;
  };
}

export interface ICreateProductPayload {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ProductCondition;
  deliveryOption: DeliveryOption;
  pickupLocation?: string;
  tags?: string[];
}

export interface IUpdateProductPayload {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  deliveryOption?: DeliveryOption;
  pickupLocation?: string;
  tags?: string[];
}

export interface IProductFilters {
  category?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  search?: string;
  deliveryOption?: DeliveryOption;
  sort?: string;
  page?: number;
  limit?: number;
}
