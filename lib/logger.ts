type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export const logger = {
  info: (message: string, meta?: any) => log('info', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  error: (message: string, meta?: any) => log('error', message, meta),
  debug: (message: string, meta?: any) => log('debug', message, meta),
}

function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString()
  const metaString = meta ? ` ${JSON.stringify(meta)}` : ''
  if (level === 'error') {
    console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`)
  } else {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`)
  }
}
