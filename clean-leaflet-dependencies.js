/**
 * Script to help clean up remaining Leaflet dependencies after migrating to Mapbox GL JS
 * 
 * Usage: node clean-leaflet-dependencies.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Files that should be removed
const filesToRemove = [
  'src/types/react-leaflet.d.ts',
  'src/types/react-leaflet-cluster.d.ts',
  'src/lib/leaflet-marker-fix.ts',
  'src/lib/leaflet-extensions.ts',
  'src/lib/leaflet-fix.ts',
  'src/lib/patched-modules/react-leaflet-cluster.js',
  'src/hooks/useLeaflet.ts',
  'src/styles/leaflet-styles.ts',
  'src/styles/leaflet-styles.js',
  'src/components/LeafletErrorBoundary.tsx',
  'README-leaflet.md',
  'LEAFLET_TROUBLESHOOTING.md',
  'public/leaflet-fallback.css',
  'public/leaflet-preload.js',
];

// Dependencies that should be removed from package.json
const dependenciesToRemove = [
  'leaflet',
  'leaflet-draw',
  'react-leaflet',
  '@react-leaflet/core',
  'leaflet-defaulticon-compatibility',
  'react-leaflet-cluster',
  'leaflet.markercluster',
];

// Directories to scan for Leaflet imports
const dirsToScan = [
  'src',
  'pages',
  'app',
];

console.log('Planning Manager Leaflet Cleanup Tool');
console.log('====================================');

// Helper to recursively scan directories for files with given extensions
function findFilesWithExtensions(dir, extensions) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        results = results.concat(findFilesWithExtensions(filePath, extensions));
      } else {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(filePath);
        }
      }
    });
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err);
  }
  
  return results;
}

// 1. Find files with Leaflet imports
console.log('\n1. Finding files with Leaflet imports...');

const findLeafletImports = () => {
  const filesWithImports = [];
  const extensions = ['.tsx', '.ts', '.jsx', '.js'];
  
  // Get all files with target extensions
  dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = findFilesWithExtensions(dir, extensions);
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for Leaflet imports
          if (content.match(/import.*['"]leaflet/) || 
              content.match(/import.*['"]react-leaflet/) ||
              content.match(/import.*['"]leaflet\./) || 
              content.match(/import.*['"]leaflet-/)) {
            filesWithImports.push(file);
          }
        } catch (err) {
          console.error(`Error reading file ${file}:`, err);
        }
      });
    }
  });
  
  console.log(`Found ${filesWithImports.length} files with Leaflet imports:`);
  filesWithImports.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  return filesWithImports;
};

// 2. Check for files that should be removed
const checkFilesToRemove = () => {
  console.log('\n2. Checking for files that should be removed...');
  
  const existingFiles = filesToRemove.filter(file => {
    try {
      return fs.existsSync(file);
    } catch (err) {
      return false;
    }
  });
  
  console.log(`Found ${existingFiles.length} files that should be removed:`);
  existingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  return existingFiles;
};

// 3. Check package.json for Leaflet dependencies
const checkPackageJson = () => {
  console.log('\n3. Checking package.json for Leaflet dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const foundDeps = dependenciesToRemove.filter(dep => dependencies[dep]);
    
    console.log(`Found ${foundDeps.length} Leaflet dependencies in package.json:`);
    foundDeps.forEach(dep => {
      console.log(`  - ${dep}: ${dependencies[dep]}`);
    });
    
    return foundDeps;
  } catch (err) {
    console.error('Error reading package.json:', err);
    return [];
  }
};

// 4. Check next.config.js for Leaflet transpilation
const checkNextConfig = () => {
  console.log('\n4. Checking next.config.js for Leaflet transpilation...');
  
  try {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    const hasLeafletTranspilation = nextConfig.includes('leaflet');
    
    if (hasLeafletTranspilation) {
      console.log('  - next.config.js contains Leaflet transpilation configuration.');
    } else {
      console.log('  - No Leaflet transpilation found in next.config.js.');
    }
    
    return hasLeafletTranspilation;
  } catch (err) {
    console.error('Error reading next.config.js:', err);
    return false;
  }
};

// Main execution
function main() {
  try {
    const filesWithImports = findLeafletImports();
    const filesToDelete = checkFilesToRemove();
    const depsToRemove = checkPackageJson();
    const hasNextConfig = checkNextConfig();
    
    console.log('\n5. Recommendations:');
    
    if (filesToDelete.length > 0) {
      console.log('\nRemove the following files:');
      console.log(`Remove-Item ${filesToDelete.join(', ')}`);
    }
    
    if (depsToRemove.length > 0) {
      console.log('\nRemove the following dependencies:');
      console.log(`npm uninstall ${depsToRemove.join(' ')}`);
    }
    
    if (hasNextConfig) {
      console.log('\nEdit next.config.js to remove Leaflet transpilation config');
      console.log('Open next.config.js and remove any entries related to Leaflet');
    }
    
    if (filesWithImports.length > 0) {
      console.log('\nThe following files have Leaflet imports that should be updated or removed:');
      filesWithImports.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    
    console.log('\nDone! Please review the recommendations above to complete the Leaflet cleanup.');
    console.log('After cleanup, run the application and verify that everything works correctly.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 