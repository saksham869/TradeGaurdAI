import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  console.warn('⚠️ UPSTASH_REDIS environment variables are missing. Cache features are disabled.')
}

export const redis = url && token
  ? new Redis({ url, token })
  : {
      get:    async () => null,
      set:    async () => 'OK',
      del:    async () => 0,
      expire: async () => 0,
      incr:   async () => 1,   // budget/rate checks: always "first call", never blocked
    } as unknown as Redis

