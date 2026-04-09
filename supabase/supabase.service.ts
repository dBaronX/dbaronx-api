import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

export type AuthenticatedDbUser = {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
  is_active: boolean | null;
};

@Injectable()
export class SupabaseService {
  private readonly adminClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!url) {
      throw new Error('SUPABASE_URL is missing');
    }

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
    }

    if (!anonKey) {
      throw new Error('SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    }

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.anonClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  get admin(): SupabaseClient {
    return this.adminClient;
  }

  get anon(): SupabaseClient {
    return this.anonClient;
  }

  extractBearerToken(authorization?: string): string {
    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    return token;
  }

  async getSupabaseUserFromToken(token: string): Promise<User> {
    const { data, error } = await this.anonClient.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired Supabase token');
    }

    return data.user;
  }

  async getDbUserByAuthUserId(authUserId: string): Promise<AuthenticatedDbUser> {
    const { data, error } = await this.adminClient
      .from('users')
      .select('id, auth_user_id, email, full_name, role, status, is_active')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !data) {
      throw new UnauthorizedException('User not found in public.users');
    }

    return data as AuthenticatedDbUser;
  }

  async getAuthenticatedUser(authorization?: string): Promise<{
    supabaseUser: User;
    dbUser: AuthenticatedDbUser;
  }> {
    const token = this.extractBearerToken(authorization);
    const supabaseUser = await this.getSupabaseUserFromToken(token);
    const dbUser = await this.getDbUserByAuthUserId(supabaseUser.id);

    if (!dbUser.is_active || dbUser.status !== 'active') {
      throw new UnauthorizedException('User account is inactive');
    }

    return { supabaseUser, dbUser };
  }

  ensureData<T>(data: T | null, error: unknown, message: string): T {
    if (error || data == null) {
      throw new InternalServerErrorException(message);
    }
    return data;
  }
}