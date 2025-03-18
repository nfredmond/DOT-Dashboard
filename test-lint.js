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

// Function to fix unused variables by prefixing them with _
function fixUnusedVariables(filePath) {
  try {
    const content = readFile(filePath);
    
    // Extract the filename from the path
    const fileName = path.basename(filePath);
    console.log(`Fixing unused variables in: ${fileName}`);
    
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

    // Filter for unused variable issues
    const unusedVarMessages = lintResults[0]?.messages?.filter(
      msg => msg.ruleId === '@typescript-eslint/no-unused-vars'
    );

    if (!unusedVarMessages || unusedVarMessages.length === 0) {
      console.log(`No unused variables found in ${fileName}`);
      return;
    }

    // Sort issues by position (line and column) in descending order
    // to avoid changing positions when making multiple replacements
    unusedVarMessages.sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line;
      return b.column - a.column;
    });

    // Apply fixes one by one
    let fixedContent = content;
    for (const message of unusedVarMessages) {
      // Extract variable name from the message
      const varNameMatch = message.message.match(/'([^']+)' is (defined but never used|assigned a value but never used)/);
      
      if (varNameMatch) {
        const varName = varNameMatch[1];
        
        // Skip if already prefixed with underscore
        if (varName.startsWith('_')) continue;
        
        // Get the line content
        const lines = fixedContent.split('\n');
        const line = lines[message.line - 1];
        
        // Check if it's a variable declaration, function parameter, or destructuring
        let newLine;
        
        // For function parameters
        if (line.includes('(') && line.includes(')')) {
          newLine = line.substring(0, message.column - 1) + 
                   '_' + line.substring(message.column - 1);
        } 
        // For variable declarations
        else if (line.includes('const') || line.includes('let') || line.includes('var')) {
          newLine = line.substring(0, message.column - 1) + 
                   '_' + line.substring(message.column - 1);
        }
        // For destructuring
        else if (line.includes('{') && line.includes('}')) {
          newLine = line.substring(0, message.column - 1) + 
                   '_' + line.substring(message.column - 1);
        }
        else {
          console.log(`Could not fix: ${varName} at line ${message.line}, column ${message.column}`);
          continue;
        }
        
        lines[message.line - 1] = newLine;
        fixedContent = lines.join('\n');
      }
    }
    
    if (fixedContent !== content) {
      writeFile(filePath, fixedContent);
      console.log(`Fixed unused variables in ${fileName}`);
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
  // Get list of files with linting errors
  console.log('Getting files with linting errors...');
  
  let errorFiles = [];
  try {
    const output = execSync('npx eslint --ext .ts,.tsx,.js,.jsx src --format json', { encoding: 'utf8' });
    const results = JSON.parse(output);
    errorFiles = results.filter(result => result.errorCount > 0 || result.warningCount > 0)
                        .map(result => result.filePath);
  } catch (e) {
    // ESLint returns non-zero exit code when it finds errors
    try {
      const results = JSON.parse(e.stdout);
      errorFiles = results.filter(result => result.errorCount > 0 || result.warningCount > 0)
                          .map(result => result.filePath);
    } catch (jsonError) {
      console.error('Error parsing ESLint output:', jsonError);
      console.log('Manual fallback: processing all TypeScript files in src directory');
      
      // Fallback: Get all TypeScript files
      const srcDir = path.join(__dirname, 'src');
      const getAllFiles = function(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(function(file) {
          const filePath = path.join(dirPath, file);
          
          if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            arrayOfFiles.push(filePath);
          }
        });
        
        return arrayOfFiles;
      };
      
      errorFiles = getAllFiles(srcDir);
    }
  }
  
  if (errorFiles.length === 0) {
    console.log('No files with linting errors found.');
    return;
  }
  
  console.log(`Found ${errorFiles.length} files with linting errors.`);
  
  // Fix unused variables in each file
  let fixedCount = 0;
  for (const filePath of errorFiles) {
    if (fixUnusedVariables(filePath)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed unused variables in ${fixedCount} out of ${errorFiles.length} files.`);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});