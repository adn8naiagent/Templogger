#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = '/home/runner/workspace/server/storage.ts';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix unused parameter issues by prefixing with underscore
  const fixes = [
    // Line 67: email parameter
    { pattern: /^(\s*export\s+async\s+function\s+insertUser\s*\(\s*)email(\s*:\s*string)/, replacement: '$1_email$2' },
    
    // Line 69: userData parameter 
    { pattern: /^(\s*export\s+async\s+function\s+updateUser\s*\(\s*\w+\s*:\s*\w+\s*,\s*)userData(\s*:\s*\w+)/, replacement: '$1_userData$2' },
    
    // Line 70: userData parameter
    { pattern: /^(\s*export\s+async\s+function\s+updateUserPreferences\s*\(\s*\w+\s*:\s*\w+\s*,\s*)userData(\s*:\s*\w+)/, replacement: '$1_userData$2' },
    
    // Line 77: fridgeData parameter
    { pattern: /^(\s*export\s+async\s+function\s+insertFridge\s*\(\s*\w+\s*:\s*\w+\s*,\s*)fridgeData(\s*:\s*\w+)/, replacement: '$1_fridgeData$2' },
    
    // Line 84: labelData parameter
    { pattern: /^(\s*export\s+async\s+function\s+insertLabel\s*\(\s*)labelData(\s*:\s*\w+)/, replacement: '$1_labelData$2' },
    
    // Line 91: logData parameter
    { pattern: /^(\s*export\s+async\s+function\s+insertTemperatureLog\s*\(\s*)logData(\s*:\s*\w+)/, replacement: '$1_logData$2' },
    
    // Line 97: timeWindowData parameter
    { pattern: /^(\s*export\s+async\s+function\s+insertTimeWindow\s*\(\s*)timeWindowData(\s*:\s*\w+)/, replacement: '$1_timeWindowData$2' },
    
    // Line 103: startDate and endDate parameters  
    { pattern: /^(\s*export\s+async\s+function\s+getTemperatureLogsByDateRange\s*\(\s*\w+\s*:\s*\w+\s*,\s*)startDate(\s*:\s*\w+\s*,\s*)endDate(\s*:\s*\w+)/, replacement: '$1_startDate$2_endDate$3' },
    
    // Line 107: date parameter
    { pattern: /^(\s*export\s+async\s+function\s+getTemperatureLogsByDate\s*\(\s*\w+\s*:\s*\w+\s*,\s*)date(\s*:\s*\w+)/, replacement: '$1_date$2' }
  ];
  
  // Apply each fix
  for (const fix of fixes) {
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      return line.replace(fix.pattern, fix.replacement);
    });
    content = updatedLines.join('\n');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed parameter prefixes in ${filePath}`);
} catch (error) {
  console.error('Error processing file:', error);
}