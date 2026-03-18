import { createRemoteJWKSet, jwtVerify } from 'jose';
import ApiError from './ApiError';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string | string[];
  role?: string;
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export const verifySupabaseToken = async (token: string): Promise<SupabaseJwtPayload> => {
  const issuer = process.env.SUPABASE_URL;
  if (!issuer) {
    throw ApiError.badRequest('SUPABASE_URL is not configured on server.');
  }

  const jwks = createRemoteJWKSet(new URL(`${issuer}/auth/v1/.well-known/jwks.json`));

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: 'authenticated',
    });

    return payload as SupabaseJwtPayload;
  } catch {
    throw ApiError.unauthorized('Invalid Supabase token.');
  }
};
