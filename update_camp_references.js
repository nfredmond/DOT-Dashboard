/**
 * Script to update CAMP references to GreenChAMP in TypeScript files
 * 
 * This script finds and replaces references to CAMP with GreenChAMP
 * in TypeScript files while preserving variable names and functions.
 * 
 * NOTE: This script does not rename files or directories, just the content
 * of the files as requested in the project notes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get list of TypeScript files with CAMP references (Windows compatible)
function findFilesWithCAMPReferences() {
  try {
    const result = execSync('findstr /S /M /C:"CAMP" *.ts *.tsx').toString();
    return result.split('\r\n').filter(file => file.trim() && !file.includes('node_modules'));
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Update comments in files
function updateComments(content) {
  // Replace in comments but not in code/variable names
  return content
    .replace(/\/\*\s*CAMP\s*\(/g, '/* GreenChAMP (')
    .replace(/\/\*\*\s*\*\s*CAMP\s*\(/g, '/**\n * GreenChAMP (')
    .replace(/\/\/\s*CAMP\s*\(/g, '// GreenChAMP (')
    .replace(/\/\/\s*CAMP\s*and/g, '// GreenChAMP and')
    .replace(/\/\*\s*CAMP\s*and/g, '/* GreenChAMP and')
    .replace(/\*\s*CAMP\s*\(/g, '* GreenChAMP (')
    .replace(/\*\s*These\s+types\s+define\s+the\s+data\s+structures\s+for\s+the\s+CAMP\s+travel/g, 
           '* These types define the data structures for the GreenChAMP travel')
    .replace(/\/\/\s*Link\s+to\s+CAMP\s+and/g, '// Link to GreenChAMP and');
}

// Process each file
function processFile(filePath) {
  try {
    console.log(`Processing ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Update only comments but not variable/function names
    const updatedContent = updateComments(content);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function
function main() {
  const files = findFilesWithCAMPReferences();
  console.log(`Found ${files.length} files with CAMP references`);
  
  files.forEach(processFile);
  
  console.log('Completed updating files');
}

main();