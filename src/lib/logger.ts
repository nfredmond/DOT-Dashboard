// Logger utility to replace console statements
const isDevEnvironment = process.env.NODE_ENV === 'development';

const logger = {
  log: (...args: any[]) => {
    if (isDevEnvironment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevEnvironment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDevEnvironment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevEnvironment) {
      console.debug(...args);
    }
  }
};

export default logger; 