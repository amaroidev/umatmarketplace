export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  studentId?: string;
  isVerified: boolean;
  isBanned: boolean;
  location?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole.BUYER | UserRole.SELLER;
  studentId?: string;
  location?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IUpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar?: string;
  studentId?: string;
  location?: string;
  bio?: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}
