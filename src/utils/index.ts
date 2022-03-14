import chalk from 'chalk'

export const indent = (indent: number, str: string) => {
  return `${' '.repeat(indent)}${str}`
}

export const LOG_LOADING_SYMBOL = '✣'
export const LOG_SUCCESS_SYMBOL = '✔'
export const LOG_SKIP_SYMBOL = '➤'
export const LOG_ERROR_SYMBOL = '✖'

export const loading = (indent: number, str: string, color?: string): string => {
  if (color) return `${' '.repeat(indent)}${chalk.hex(color)('✣ ')}${chalk.hex(color)(str)}`
  return `${' '.repeat(indent)}${chalk.blue('✣ ')}${chalk.blue(str)}`
}

export const success = (indent: number, str: string, color?: string): string => {
  if (color) return `${' '.repeat(indent)}${chalk.hex(color)('✔ ')}${chalk.hex(color)(str)}`
  return `${' '.repeat(indent)}${chalk.green('✔ ')}${chalk.green(str)}`
}

export const error = (indent: number, str: string, color?: string): string => {
  if (color) return `${' '.repeat(indent)}${chalk.hex(color)('✖ ')}${chalk.hex(color)(str)}`
  return `${' '.repeat(indent)}${chalk.red('✖ ')}${chalk.red(str)}`
}

export const skip = (indent: number, str: string, color?: string): string => {
  if (color) return `${' '.repeat(indent)}${chalk.hex(color)('➤ ')}${chalk.hex(color)(str)}`
  return `${' '.repeat(indent)}${chalk.gray('➤ ')}${chalk.gray(str)}`
}

export const shorten = (key: string) => {
  if (key.length < 11) return key
  return `${key.slice(0, 4)}...${key.slice(-4, key.length)}`
}
