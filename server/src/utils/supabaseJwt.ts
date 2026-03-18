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
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw ApiError.badRequest('SUPABASE_URL is not configured on server.');
  }

  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const authIssuer = `${baseUrl}/auth/v1`;
  const allowedIssuers = [authIssuer, baseUrl];
  const jwks = createRemoteJWKSet(new URL(`${authIssuer}/.well-known/jwks.json`));

  for (const issuer of allowedIssuers) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: 'authenticated',
      });

      return payload as SupabaseJwtPayload;
    } catch {
      // Try the next accepted issuer variant.
    }
  }

  throw ApiError.unauthorized('Invalid Supabase token.');
};
