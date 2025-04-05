/**
 * Script to update CAMP references to GreenChAMP in markdown files
 * 
 * This script finds and replaces references to CAMP with GreenChAMP
 * in documentation files (.md)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Current app version and key information
const APP_VERSION = 'v7.2.0';
const APP_UPDATED_DATE = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
const KEY_UPDATES = {
  'leaflet': 'Mapbox GL JS',
  'Leaflet': 'Mapbox GL JS',
  'react-leaflet': 'mapbox-gl',
  'version 6': 'version 7',
  'v6': 'v7',
  'V6': 'V7'
};

// Directories containing documentation
const DOC_DIRECTORIES = [
  '.',
  './docs',
  './docs/api'
];

// File extensions to process
const DOC_EXTENSIONS = [
  '.md',
  '.txt'
];

// Files to exclude (will not be processed)
const EXCLUDE_FILES = [
  'node_modules',
  '.git',
  '.next',
  'combined_documentation.md', // This will be regenerated
  'package-lock.json',
  'Understanding the ERR_INVALID_ARG_TYPE Error in Development.md' // This is a specific error document
];

// Process markdown files
function updateDocumentationFiles() {
  // Get all documentation files
  const docFiles = [];
  
  DOC_DIRECTORIES.forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        // Skip directories in the exclude list
        if (EXCLUDE_FILES.some(exclude => filePath.includes(exclude))) {
          return;
        }
        
        if (stats.isFile() && DOC_EXTENSIONS.some(ext => file.endsWith(ext))) {
          docFiles.push(filePath);
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  });
  
  console.log(`Found ${docFiles.length} documentation files to update.`);
  
  // Update each file
  docFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      
      // Update version and date references
      if (content.includes('version') || content.includes('Version')) {
        content = content.replace(/version \d+\.\d+\.\d+/gi, `version ${APP_VERSION}`);
        content = content.replace(/Version \d+\.\d+\.\d+/gi, `Version ${APP_VERSION}`);
        updated = true;
      }
      
      // Update last updated date if it exists
      if (content.includes('Last updated:') || content.includes('Updated on:')) {
        content = content.replace(/Last updated:.*\d{4}-\d{2}-\d{2}/gi, `Last updated: ${APP_UPDATED_DATE}`);
        content = content.replace(/Updated on:.*\d{4}-\d{2}-\d{2}/gi, `Updated on: ${APP_UPDATED_DATE}`);
        updated = true;
      }
      
      // Apply key term updates
      Object.keys(KEY_UPDATES).forEach(key => {
        const regex = new RegExp(key, 'g');
        if (content.match(regex)) {
          content = content.replace(regex, KEY_UPDATES[key]);
          updated = true;
        }
      });
      
      // Update specific Leaflet to Mapbox information based on migration guide
      if (filePath.includes('README.md') || filePath.includes('MAPBOX_INTEGRATION.md')) {
        // Make sure Mapbox is properly referenced in the main README
        if (!content.includes('Mapbox GL JS')) {
          content = content.replace(
            /## Core Features/,
            `## Core Features\n\n- **Spatial Visualization:** Interactive maps powered by Mapbox GL JS for projects, community feedback, and transportation network analysis`
          );
          updated = true;
        }
      }

      // Add references to the Mapbox integration guide if they don't exist
      if (filePath.endsWith('README.md') && !content.includes('MAPBOX_INTEGRATION.md')) {
        content = content.replace(
          /## Documentation/,
          `## Documentation\n\n- [Mapbox Integration Guide](MAPBOX_INTEGRATION.md)`
        );
        updated = true;
      }
      
      // Save the file if changes were made
      if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      } else {
        console.log(`No updates needed for ${filePath}`);
      }
    } catch (error) {
      console.error(`Error updating file ${filePath}:`, error);
    }
  });
}

// Generate a combined documentation file from all markdown files
function generateCombinedDocumentation() {
  console.log('Generating combined documentation...');
  
  // Get all markdown files
  const mdFiles = [];
  
  DOC_DIRECTORIES.forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        // Skip files in the exclude list
        if (EXCLUDE_FILES.some(exclude => filePath.includes(exclude))) {
          return;
        }
        
        if (fs.statSync(filePath).isFile() && file.endsWith('.md')) {
          mdFiles.push(filePath);
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  });
  
  // Sort files by name for consistent output
  mdFiles.sort();
  
  // Combine all markdown files
  let combinedContent = `# Planning Manager ${APP_VERSION} Documentation\n\nLast updated: ${APP_UPDATED_DATE}\n\n`;
  combinedContent += `This file contains the combined documentation for the Planning Manager ${APP_VERSION} application.\n\n`;
  combinedContent += `## Table of Contents\n\n`;
  
  // Generate table of contents
  mdFiles.forEach(filePath => {
    const filename = path.basename(filePath);
    const name = filename.replace('.md', '').replace(/_/g, ' ');
    
    combinedContent += `- [${name}](#${name.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  
  combinedContent += `\n`;
  
  // Add each file's content
  mdFiles.forEach(filePath => {
    try {
      const filename = path.basename(filePath);
      const name = filename.replace('.md', '').replace(/_/g, ' ');
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Add file heading and content
      combinedContent += `\n\n## ${name}\n\n`;
      
      // Get the content without the first heading (which is usually the same as the filename)
      const contentLines = content.split('\n');
      let startIndex = 0;
      
      if (contentLines[0] && contentLines[0].startsWith('# ')) {
        startIndex = 1;
      }
      
      combinedContent += contentLines.slice(startIndex).join('\n');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  });
  
  // Write the combined file
  fs.writeFileSync('combined_documentation.md', combinedContent, 'utf8');
  console.log('Combined documentation generated: combined_documentation.md');
}

// Main execution
try {
  console.log(`Updating documentation for Planning Manager ${APP_VERSION}...`);
  updateDocumentationFiles();
  generateCombinedDocumentation();
  console.log('Documentation update complete!');
} catch (error) {
  console.error('Error during documentation update:', error);
  process.exit(1);
} 