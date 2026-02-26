import type { DefaultSession } from 'next-auth';
import type { AppUserRole } from '@/utils/userRole';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: AppUserRole;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: AppUserRole;
    appUserId?: string;
  }
}
