const levels = { error: 0, warn: 1, info: 2, debug: 3 }
const envLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info')
const currentLevel = levels[envLevel] ?? levels.info

const shouldLog = (level) => levels[level] <= currentLevel

export const error = (...args) => {
  if (shouldLog('error')) console.error(...args)
}

export const warn = (...args) => {
  if (shouldLog('warn')) console.warn(...args)
}

export const info = (...args) => {
  if (shouldLog('info')) console.log(...args)
}

export const debug = (...args) => {
  if (shouldLog('debug')) console.debug(...args)
}

export default { error, warn, info, debug }
