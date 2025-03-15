// This script manually patches problematic modules to work with Next.js
// Run this during postinstall or before build

const fs = require('fs');
const path = require('path');

function patchReactLeafletCluster() {
  try {
    // Path to the original module file
    const originalModulePath = path.resolve('node_modules/react-leaflet-cluster/lib/index.js');
    
    // Path to our patched version
    const patchedModulePath = path.resolve('src/lib/patched-modules/react-leaflet-cluster.js');
    
    // Check if the files exist
    if (!fs.existsSync(originalModulePath)) {
      console.warn('react-leaflet-cluster module not found, skipping patch');
      return;
    }
    
    if (!fs.existsSync(patchedModulePath)) {
      console.warn('Patched module file not found, skipping patch');
      return;
    }
    
    // Read the patched file
    const patchedContent = fs.readFileSync(patchedModulePath, 'utf8');
    
    // Make a backup of the original file if it doesn't exist
    const backupPath = originalModulePath + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(originalModulePath, backupPath);
      console.log('Created backup of original module file');
    }
    
    // Write the patched content to the original file
    fs.writeFileSync(originalModulePath, patchedContent, 'utf8');
    
    console.log('Successfully patched react-leaflet-cluster module');
  } catch (error) {
    console.error('Error patching react-leaflet-cluster:', error);
  }
}

// Run the patches
patchReactLeafletCluster();

// Exit with success
process.exit(0); 