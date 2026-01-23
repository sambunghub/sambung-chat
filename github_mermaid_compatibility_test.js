#!/usr/bin/env node

import fs from 'fs';

// Read architecture.md
const content = fs.readFileSync('./architecture.md', 'utf-8');

// Extract all mermaid diagrams
const diagrams = [];
let inDiagram = false;
let currentDiagram = [];
let diagramStartLine = 0;
let diagramCount = 0;

const lines = content.split('\n');
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
      lines: currentDiagram,
    });
  } else if (inDiagram) {
    currentDiagram.push(line);
  }
});

console.log('🔍 GITHUB MERMAID COMPATIBILITY TEST\n');
console.log('='.repeat(80));
console.log(`\n📊 Testing ${diagrams.length} diagrams for GitHub compatibility...\n`);

// GitHub's Mermaid supports these diagram types (as of 2024):
const supportedTypes = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'gitGraph',
  'gantt',
  'pie',
  'journey',
  'mindmap',
  'timeline',
  'sankey',
  'block',
];

// GitHub does NOT support these features:
const unsupportedFeatures = [
  'requirementDiagram',
  'c4Context',
  'c4Container',
  'c4Component',
  'c4Deployment',
  'c4Dynamic',
  'packet beta',
  'rlBlock beta',
  'architecture beta',
  'netconf beta',
];

let compatibilityIssues = [];

diagrams.forEach((diagram, index) => {
  const content = diagram.content;

  // Check if diagram type is supported
  const typeMatch = content.match(
    /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gitGraph|gantt|pie|journey|mindmap|timeline|sankey|block)/m
  );

  if (!typeMatch) {
    compatibilityIssues.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: 'Unknown or unsupported diagram type',
      severity: 'error',
    });
    return;
  }

  const diagramType = typeMatch[1];

  if (!supportedTypes.includes(diagramType)) {
    compatibilityIssues.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: `Diagram type "${diagramType}" may not be supported on GitHub`,
      severity: 'warning',
    });
  }

  // Check for potentially unsupported features
  unsupportedFeatures.forEach((feature) => {
    if (content.toLowerCase().includes(feature.toLowerCase())) {
      compatibilityIssues.push({
        diagram: diagram.number,
        line: diagram.startLine,
        issue: `May contain unsupported feature: ${feature}`,
        severity: 'warning',
      });
    }
  });

  // Check for complex features that might have limited support
  if (content.includes('mindmap') && !content.includes('mindmap beta')) {
    // Mindmap is relatively new
    compatibilityIssues.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: 'Mindmap diagrams are relatively new in Mermaid, may have limited GitHub support',
      severity: 'info',
    });
  }

  // Check for very complex styling that might not render perfectly
  const classDefCount = (content.match(/classDef/g) || []).length;
  if (classDefCount > 10) {
    compatibilityIssues.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: `Contains ${classDefCount} classDef statements - complex styling may not render perfectly`,
      severity: 'info',
    });
  }

  // Check for emoji usage (should be fine but worth noting)
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 20) {
    compatibilityIssues.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: `Contains ${emojiCount} emojis - GitHub supports emojis but rendering may vary`,
      severity: 'info',
    });
  }
});

// Check specific syntax issues
const syntaxChecks = [];

diagrams.forEach((diagram) => {
  const content = diagram.content;

  // Check for proper closing of code blocks
  if (!content.endsWith('end') && !content.match(/```$/m)) {
    // This is expected since we strip the closing ```
  }

  // Check for balanced parentheses and brackets
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    syntaxChecks.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
      severity: 'error',
    });
  }

  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    syntaxChecks.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: `Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`,
      severity: 'error',
    });
  }

  // Check for proper subgraph closure
  // In Mermaid flowcharts, each subgraph must have exactly one 'end' statement
  // We need to count them more carefully by parsing the structure
  const subgraphCount = (content.match(/subgraph/g) || []).length;

  // Count 'end' statements that are on their own line (possibly with whitespace)
  const endCount = (content.match(/^\s*end\s*$/gm) || []).length;

  // For flowchart/graph diagrams, subgraphs need matching ends
  // For other diagram types, 'end' is used differently (like in stateDiagram)
  const isFlowchart = /^(flowchart|graph)/m.test(content);

  if (isFlowchart && subgraphCount > endCount) {
    syntaxChecks.push({
      diagram: diagram.number,
      line: diagram.startLine,
      issue: `Unclosed subgraph: ${subgraphCount} subgraphs, ${endCount} end statements`,
      severity: 'error',
    });
  }
});

// Combine all issues
const allIssues = [...compatibilityIssues, ...syntaxChecks];
const errors = allIssues.filter((i) => i.severity === 'error');
const warnings = allIssues.filter((i) => i.severity === 'warning' || i.severity === 'info');

// Print results
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ ALL DIAGRAMS ARE GITHUB-COMPATIBLE!\n');
  console.log('Summary:');
  console.log(`  • Total diagrams: ${diagrams.length}`);
  console.log(`  • All use supported Mermaid diagram types`);
  console.log(`  • No syntax errors detected`);
  console.log(`  • All features are compatible with GitHub\'s Mermaid renderer\n`);
} else {
  if (errors.length > 0) {
    console.log(`❌ ERRORS (${errors.length}):`);
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. Diagram #${err.diagram} (line ${err.line}): ${err.issue}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach((warn, i) => {
      console.log(`  ${i + 1}. Diagram #${warn.diagram} (line ${warn.line}): ${warn.issue}`);
    });
    console.log('');
  }
}

// Diagram type breakdown
console.log('📋 DIAGRAM TYPE BREAKDOWN:\n');
const typeCounts = {};
diagrams.forEach((diagram) => {
  const typeMatch = diagram.content.match(
    /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gitGraph|gantt|pie|journey|mindmap|timeline|sankey|block)/m
  );
  if (typeMatch) {
    const type = typeMatch[1];
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
});

Object.entries(typeCounts)
  .sort()
  .forEach(([type, count]) => {
    const supported = supportedTypes.includes(type) ? '✅' : '❌';
    console.log(`  ${supported} ${type}: ${count} diagrams`);
  });

console.log('\n' + '='.repeat(80));
console.log('\n💡 GITHUB MERMAID SUPPORT NOTES:\n');
console.log('• GitHub uses Mermaid.js v10.x for rendering');
console.log('• All standard diagram types are fully supported');
console.log('• Emojis and UTF-8 characters work correctly');
console.log('• Complex styling with classDef is supported');
console.log('• Large diagrams may take longer to render but will work');
console.log('• For best results, keep diagrams under 200 lines\n');

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  totalDiagrams: diagrams.length,
  githubCompatible: errors.length === 0,
  errors: errors.length,
  warnings: warnings.length,
  diagramTypes: typeCounts,
  issues: allIssues,
};

fs.writeFileSync('./github-compatibility-report.json', JSON.stringify(report, null, 2));
console.log('📄 Full report saved to: github-compatibility-report.json\n');
console.log('='.repeat(80) + '\n');

process.exit(errors.length > 0 ? 1 : 0);
