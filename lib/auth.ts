import { auth, currentUser } from '@clerk/nextjs/server'

export async function getSession() {
  return auth()
}

export async function getCurrentUser() {
  return currentUser()
}

export async function getUserId() {
  if (!process.env.CLERK_SECRET_KEY) {
     return 'user_v1_prototype'; // Fallback mockup client
  }
  const { userId } = auth()
  return userId
}

export async function requireAuth() {
  if (!process.env.CLERK_SECRET_KEY) return 'user_v1_prototype';
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}
