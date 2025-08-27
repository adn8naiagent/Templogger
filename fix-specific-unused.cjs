#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Specific unused imports to remove
const UNUSED_IMPORTS_TO_REMOVE = {
  // Component files with unused imports
  'client/src/components/checklists/checklist-calendar.tsx': [
    'useEffect', 'CardDescription', 'CardHeader', 'CardTitle', 'isUnauthorizedError'
  ],
  'client/src/components/checklists/checklist-editor.tsx': [
    'Switch', 'CardHeader', 'CardTitle'
  ],
  'client/src/components/checklists/complete-checklist-modal.tsx': [
    'Input', 'Square', 'isUnauthorizedError'
  ],
  'client/src/components/checklists/schedule-editor.tsx': [
    'Badge', 'CardDescription', 'CardHeader', 'CardTitle', 'Select', 'SelectContent', 
    'SelectItem', 'SelectTrigger', 'SelectValue', 'Calendar', 'Play', 'Square', 'isUnauthorizedError'
  ],
  'client/src/pages/landing.tsx': [],
  'client/src/pages/not-found.tsx': [
    'Card', 'CardContent', 'AlertCircle'
  ],
  'client/src/pages/subscribe/success.tsx': [
    'useQuery', 'Card', 'CardContent', 'CardHeader', 'CardTitle', 'Button', 'CheckCircle', 'Crown', 'ArrowRight', 'Link'
  ]
};

function removeUnusedImports(filePath, unusedImports) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    unusedImports.forEach(importName => {
      // Remove from destructured imports
      const destructuredPattern = new RegExp(`\\s*${importName}\\s*,?`, 'g');
      if (content.includes(`{ ${importName}`)) {
        content = content.replace(new RegExp(`\\{\\s*${importName}\\s*,?`, 'g'), '{');
        content = content.replace(new RegExp(`,\\s*${importName}\\s*,`, 'g'), ',');
        content = content.replace(new RegExp(`,\\s*${importName}\\s*\\}`, 'g'), ' }');
        content = content.replace(new RegExp(`\\{\\s*,\\s*${importName}`, 'g'), '{');
        modified = true;
      }
      
      // Remove standalone imports
      const standalonePattern = new RegExp(`import\\s+${importName}\\s+from\\s+[^;]+;\\s*`, 'g');
      if (standalonePattern.test(content)) {
        content = content.replace(standalonePattern, '');
        modified = true;
      }
    });

    // Clean up empty import statements
    content = content.replace(/import\s+\{\s*\}\s+from\s+[^;]+;\s*/g, '');
    content = content.replace(/import\s+\{\s*,\s*\}/g, 'import {');
    content = content.replace(/\{\s*,/g, '{');
    content = content.replace(/,\s*\}/g, ' }');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process specific files
Object.entries(UNUSED_IMPORTS_TO_REMOVE).forEach(([filePath, imports]) => {
  const fullPath = path.join('.', filePath);
  if (fs.existsSync(fullPath) && imports.length > 0) {
    removeUnusedImports(fullPath, imports);
  }
});

console.log('Done fixing specific unused imports!');