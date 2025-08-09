import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { User } from './schema';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export interface AuthUser extends User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// Mock user for development - replace with real auth in production
const MOCK_USER: AuthUser = {
  id: '1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Smith',
  profileImageUrl: '',
  role: 'project_manager',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      // For development, return mock user
      return MOCK_USER;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    // For development, return mock user
    return MOCK_USER;
  }
}

export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return handler(request, user, ...args);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export async function signJWT(payload: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) reject(err);
      else resolve(token!);
    });
  });
}

export async function verifyJWT(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}