import chalk from 'chalk'

export const loading = (indent: number, str: string): string => {
  return `${' '.repeat(indent)}${chalk.blue('✣ ')}${chalk.blue(str)}`
}

export const success = (indent: number, str: string): string => {
  return `${' '.repeat(indent)}${chalk.green('✔ ')}${chalk.green(str)}`
}

export const error = (indent: number, str: string): string => {
  return `${' '.repeat(indent)}${chalk.red('✖ ')}${chalk.red(str)}`
}

export const skip = (indent: number, str: string): string => {
  return `${' '.repeat(indent)}${chalk.gray('➤ ')}${chalk.gray(str)}`
}
