/**
 * Script to update CAMP references to GreenChAMP in markdown files
 * 
 * This script finds and replaces references to CAMP with GreenChAMP
 * in documentation files (.md)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get list of markdown files with CAMP references
function findFilesWithCAMPReferences() {
  try {
    const result = execSync('findstr /S /M /C:"CAMP" *.md').toString();
    return result.split('\r\n').filter(file => file.trim() && !file.includes('node_modules'));
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Update references in markdown files
function updateReferences(content) {
  return content
    // Update main references while preserving "GreenChAMP" if already present
    .replace(/CAMP\b(?!\s*\(Green DOT)/g, 'GreenChAMP')
    .replace(/GreenCHAMP\b/g, 'GreenChAMP')
    .replace(/CAMP Model/g, 'GreenChAMP Model')
    .replace(/CAMP model/g, 'GreenChAMP model')
    .replace(/CAMP integration/gi, 'GreenChAMP integration')
    .replace(/CAMP_TrendNavigator/g, 'GreenChAMP_TrendNavigator')
    .replace(/CAMP features/g, 'GreenChAMP features')
    .replace(/CAMP and TrendNavigator/g, 'GreenChAMP and TrendNavigator')
    // Add the full name where appropriate
    .replace(/GreenChAMP\b(?! \(Green DOT)/g, 'GreenChAMP (Green DOT Chained Activity Modelling Process)')
    // Only keep the first full mention in each section
    .replace(/GreenChAMP \(Green DOT Chained Activity Modelling Process\) \(Green DOT Chained Activity Modelling Process\)/g, 
             'GreenChAMP (Green DOT Chained Activity Modelling Process)');
}

// Process each file
function processFile(filePath) {
  try {
    console.log(`Processing ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Update references
    const updatedContent = updateReferences(content);
    
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
  console.log(`Found ${files.length} markdown files with CAMP references`);
  
  files.forEach(processFile);
  
  console.log('Completed updating documentation files');
}

main(); 