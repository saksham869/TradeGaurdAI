import PusherClient from 'pusher-js'

const key     = process.env.NEXT_PUBLIC_PUSHER_KEY     ?? ''
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'mt1'

// Export a real Pusher client when keys are configured, otherwise a no-op stub
// that lets CopilotPanel fall back to its built-in polling loop.
export const pusherEnabled = !!key

export const pusherClient: PusherClient = key
  ? new PusherClient(key, { cluster })
  : ({
      subscribe:   () => ({ bind: () => {}, unbind: () => {} }),
      unsubscribe: () => {},
      disconnect:  () => {},
    } as unknown as PusherClient)
