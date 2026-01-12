#!/usr/bin/env node

import fs from 'fs';

// Read architecture.md
const content = fs.readFileSync('./architecture.md', 'utf-8');
const lines = content.split('\n');

// Extract all mermaid diagrams
const diagrams = [];
let inDiagram = false;
let currentDiagram = [];
let diagramStartLine = 0;
let diagramCount = 0;

lines.forEach((line, index) => {
  if (line.trim() === '```mermaid') {
    inDiagram = true;
    diagramStartLine = index + 1;
    currentDiagram = [];
  } else if (inDiagram && line.trim() === '```') {
    inDiagram = false;
    diagramCount++;
    diagrams.push({
      number: diagramCount,
      startLine: diagramStartLine,
      content: currentDiagram.join('\n'),
      lineCount: currentDiagram.length,
    });
  } else if (inDiagram) {
    currentDiagram.push(line);
  }
});

console.log(`\n📊 Found ${diagrams.length} Mermaid diagrams in architecture.md\n`);

// Check each diagram for potential issues
const issues = [];
const warnings = [];

diagrams.forEach((diagram, index) => {
  const content = diagram.content;
  const lines = diagram.content.split('\n');

  // Check 1: Diagram size (too many lines might timeout)
  if (diagram.lineCount > 100) {
    warnings.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Very large (${diagram.lineCount} lines) - May render slowly or timeout`
    );
  }

  // Check 2: Check for very long lines (GitHub has width limits)
  const longLines = lines.filter((line) => line.length > 200);
  if (longLines.length > 0) {
    warnings.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Has ${longLines.length} very long lines (>200 chars) - May overflow horizontally`
    );
  }

  // Check 3: Check for complex nested structures
  const nestingDepth = content.split(/\n/).reduce((max, line) => {
    const depth = line.match(/^\s*/)[0].length / 4;
    return Math.max(max, depth);
  }, 0);
  if (nestingDepth > 10) {
    warnings.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Deep nesting (${nestingDepth} levels) - May be hard to read`
    );
  }

  // Check 4: Check for potential syntax issues
  if (
    !content.match(
      /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|gitGraph|pie|erDiagram|gantt)/m
    )
  ) {
    issues.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Missing valid diagram type declaration`
    );
  }

  // Check 5: Check for unclosed brackets
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Mismatched square brackets [${openBrackets} open, ${closeBrackets} close]`
    );
  }

  // Check 6: Check for unclosed parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Mismatched parentheses [${openParens} open, ${closeParens} close]`
    );
  }

  // Check 7: Check for unclosed subgraphs
  const subgraphStarts = (content.match(/subgraph/g) || []).length;
  const subgraphEnds = (content.match(/end/g) || []).length;
  if (subgraphStarts > subgraphEnds) {
    issues.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Unclosed subgraph [${subgraphStarts} subgraph, ${subgraphEnds} end]`
    );
  }

  // Check 8: Check for unclosed alt/opt/loop blocks
  const controlBlocks = content.match(/(alt|opt|loop|par|region)\s+/g) || [];
  const blockEnds = (content.match(/\bend\b/g) || []).length;
  if (controlBlocks.length > blockEnds && content.includes('sequenceDiagram')) {
    warnings.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Possible unclosed control block [${controlBlocks.length} blocks, ${blockEnds} ends]`
    );
  }

  // Check 9: Check for special characters that might not render
  const specialChars = content.match(/[^\x00-\x7F]/g);
  if (specialChars && specialChars.length > 50) {
    warnings.push(
      `Diagram #${diagram.number} (line ${diagram.startLine}): Many special characters (${specialChars.length}) - Ensure UTF-8 encoding`
    );
  }

  // Check 10: Validate specific diagram types
  if (content.includes('sequenceDiagram')) {
    // Check for proper participant naming
    const participants = content.match(/^(actor|participant)\s+/gm) || [];
    if (participants.length === 0) {
      warnings.push(
        `Diagram #${diagram.number} (line ${diagram.startLine}): Sequence diagram with no participants`
      );
    }
  }

  if (content.includes('classDiagram')) {
    // Check for proper class definitions
    const classes = content.match(/^class\s+\w+/gm) || [];
    if (classes.length === 0) {
      warnings.push(
        `Diagram #${diagram.number} (line ${diagram.startLine}): Class diagram with no classes`
      );
    }
  }
});

// Print results
console.log('🔍 DIAGRAM VALIDATION RESULTS\n');
console.log('='.repeat(80));

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ ALL DIAGRAMS PASSED VALIDATION!\n');
  console.log('All diagrams are syntactically valid and should render correctly on GitHub.');
  console.log('Diagram statistics:');
  console.log(`  • Total diagrams: ${diagrams.length}`);
  console.log(
    `  • Average size: ${Math.round(diagrams.reduce((sum, d) => sum + d.lineCount, 0) / diagrams.length)} lines`
  );
  console.log(`  • Largest diagram: ${Math.max(...diagrams.map((d) => d.lineCount))} lines`);
} else {
  if (issues.length > 0) {
    console.log(`\n❌ CRITICAL ISSUES (${issues.length}):`);
    console.log('These issues must be fixed for diagrams to render correctly:\n');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    console.log('These issues may affect rendering quality but are not critical:\n');
    warnings.forEach((warning, i) => {
      console.log(`${i + 1}. ${warning}`);
    });
  }
}

// List all diagram types
console.log('\n' + '='.repeat(80));
console.log('\n📋 DIAGRAM INVENTORY:\n');

const diagramTypes = {};
diagrams.forEach((diagram) => {
  const typeMatch = diagram.content.match(
    /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|gitGraph|pie|erDiagram|gantt)/m
  );
  if (typeMatch) {
    const type = typeMatch[1];
    diagramTypes[type] = (diagramTypes[type] || 0) + 1;
  }
});

Object.entries(diagramTypes).forEach(([type, count]) => {
  console.log(`  • ${type}: ${count} diagrams`);
});

console.log('\n' + '='.repeat(80));

// Generate a test report
const report = {
  timestamp: new Date().toISOString(),
  totalDiagrams: diagrams.length,
  criticalIssues: issues.length,
  warnings: warnings.length,
  diagramTypes: diagramTypes,
  issues: issues,
  warnings: warnings,
};

fs.writeFileSync('./mermaid-validation-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Full report saved to: mermaid-validation-report.json\n');

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);
