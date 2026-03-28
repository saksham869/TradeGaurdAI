import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes that don't need Clerk auth
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)', // Clerk webhook
  '/api/cron(.*)',           // Cron endpoints protect themselves via Bearer Token
])

export default clerkMiddleware((auth, request) => {
  if (!process.env.CLERK_SECRET_KEY) {
     return; // Bypass auth for preview mode
  }

  const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk(.*)', // Clerk webhook
    '/api/cron(.*)',           // Cron endpoints protect themselves via Bearer Token
  ])

  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|pdf)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
