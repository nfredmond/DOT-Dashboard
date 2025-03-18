const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to read a file
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Function to write a file
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Determine if we need to add logger import to the file
function addLoggerImport(content, filePath) {
  // Skip if already has logger import
  if (content.includes("import logger from") || 
      content.includes("import { logger }") || 
      content.includes("const logger =")) {
    return content;
  }
  
  // Skip if it's a .js file that doesn't use imports
  if (filePath.endsWith('.js') && !content.includes('import ')) {
    return content;
  }
  
  // Determine the right import statement based on file type and content
  let importStatement = "";
  
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    importStatement = "import logger from '../lib/logger';\n";
    
    // Check if the path needs to be adjusted based on directory depth
    const relPath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'lib'));
    const depth = path.dirname(filePath).split(path.sep).length - path.join(__dirname, 'src').split(path.sep).length;
    
    if (depth > 0) {
      const prefix = '../'.repeat(depth);
      importStatement = `import logger from '${prefix}lib/logger';\n`;
    }
  } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    importStatement = "const logger = require('../lib/logger').default;\n";
  }
  
  // Find a good place to add the import
  const lines = content.split('\n');
  let importIndex = -1;
  
  // Look for the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].includes('from ')) {
      importIndex = i;
    }
  }
  
  if (importIndex >= 0) {
    lines.splice(importIndex + 1, 0, importStatement);
    return lines.join('\n');
  } else {
    // Add at the beginning
    return importStatement + content;
  }
}

// Create logger utility file if it doesn't exist
function createLoggerUtility() {
  const loggerPath = path.join(__dirname, 'src', 'lib', 'logger.ts');
  if (!fs.existsSync(loggerPath)) {
    const loggerDir = path.dirname(loggerPath);
    if (!fs.existsSync(loggerDir)) {
      fs.mkdirSync(loggerDir, { recursive: true });
    }
    
    const loggerContent = `// Logger utility to replace console statements
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
`;
    writeFile(loggerPath, loggerContent);
    console.log(`Created logger utility at ${loggerPath}`);
  }
}

// Function to fix console warnings by replacing them with logger
function fixConsoleWarnings(filePath) {
  try {
    const content = readFile(filePath);
    
    // Extract the filename from the path
    const fileName = path.basename(filePath);
    console.log(`Fixing console statements in: ${fileName}`);
    
    // Get linting errors for this file
    let lintOutput;
    try {
      lintOutput = execSync(`npx eslint "${filePath}" --format json`, { encoding: 'utf8' });
    } catch (e) {
      // ESLint returns non-zero exit code when it finds errors
      lintOutput = e.stdout;
    }
    
    // Parse lint output
    let lintResults;
    try {
      lintResults = JSON.parse(lintOutput);
    } catch (e) {
      console.log(`Error parsing lint results for ${fileName}: ${e.message}`);
      return;
    }

    if (!lintResults || lintResults.length === 0) {
      console.log(`No lint issues found in ${fileName}`);
      return;
    }

    // Filter for console warnings
    const consoleWarnings = lintResults[0]?.messages?.filter(
      msg => msg.ruleId === 'no-console'
    );

    if (!consoleWarnings || consoleWarnings.length === 0) {
      console.log(`No console warnings found in ${fileName}`);
      return;
    }

    console.log(`Found ${consoleWarnings.length} console warnings in ${fileName}`);

    // Replace console statements with logger
    let fixedContent = content;
    
    // First replace the console calls
    fixedContent = fixedContent.replace(/console\.log\(/g, 'logger.log(');
    fixedContent = fixedContent.replace(/console\.warn\(/g, 'logger.warn(');
    fixedContent = fixedContent.replace(/console\.error\(/g, 'logger.error(');
    fixedContent = fixedContent.replace(/console\.info\(/g, 'logger.info(');
    fixedContent = fixedContent.replace(/console\.debug\(/g, 'logger.debug(');
    
    // Then add the logger import if needed
    fixedContent = addLoggerImport(fixedContent, filePath);
    
    if (fixedContent !== content) {
      writeFile(filePath, fixedContent);
      console.log(`Fixed console warnings in ${fileName}`);
      return true;
    } else {
      console.log(`No changes required for ${fileName}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function to process files
async function main() {
  // Create logger utility if it doesn't exist
  createLoggerUtility();
  
  // Get list of files with linting errors
  console.log('Getting files with linting errors...');
  
  let errorFiles = [];
  try {
    const output = execSync('npx eslint --ext .ts,.tsx,.js,.jsx src --format json', { encoding: 'utf8' });
    const results = JSON.parse(output);
    errorFiles = results.filter(result => {
      return result.messages && result.messages.some(msg => msg.ruleId === 'no-console');
    }).map(result => result.filePath);
  } catch (e) {
    // ESLint returns non-zero exit code when it finds errors
    try {
      const results = JSON.parse(e.stdout);
      errorFiles = results.filter(result => {
        return result.messages && result.messages.some(msg => msg.ruleId === 'no-console');
      }).map(result => result.filePath);
    } catch (jsonError) {
      console.error('Error parsing ESLint output:', jsonError);
      console.log('Manual fallback: processing all files in src directory');
      
      // Fallback: Get all relevant files
      const srcDir = path.join(__dirname, 'src');
      const getAllFiles = function(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(function(file) {
          const filePath = path.join(dirPath, file);
          
          if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
            arrayOfFiles.push(filePath);
          }
        });
        
        return arrayOfFiles;
      };
      
      errorFiles = getAllFiles(srcDir);
    }
  }
  
  if (errorFiles.length === 0) {
    console.log('No files with console warnings found.');
    return;
  }
  
  console.log(`Found ${errorFiles.length} files with console warnings.`);
  
  // Fix console warnings in each file
  let fixedCount = 0;
  for (const filePath of errorFiles) {
    if (fixConsoleWarnings(filePath)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed console warnings in ${fixedCount} out of ${errorFiles.length} files.`);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 