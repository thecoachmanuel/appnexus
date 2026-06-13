import jwt from 'jsonwebtoken';
import { User } from './models/User';
import connectToDatabase from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as any;
  if (!decoded || !decoded.id) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(decoded.id).select('-password');
  return user;
}
