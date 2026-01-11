#!/usr/bin/env bun
/**
 * SambungChat Status Update Script
 *
 * Automatically updates STATUS.md based on:
 * 1. File system changes (files exist/not exist)
 * 2. Task completion tracking
 * 3. Progress calculations
 *
 * Usage:
 *   bun run scripts/update-status.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Task {
  id: string;
  title: string;
  week: number;
  priority: string;
  status: string;
  category: string;
  files?: string[];
  blocked?: boolean;
  dependencies?: string[];
  completedAt?: string;
  description?: string;
}

interface Phase {
  id: string;
  name: string;
  weeks: number;
  status: string;
  tasks: Task[];
}

interface Config {
  project: string;
  version: string;
  currentPhase: string;
  currentWeek: number;
  phases: Phase[];
}

const PROJECT_ROOT = process.cwd();
const STATUS_CONFIG = join(PROJECT_ROOT, 'plan-reference/.status/config.json');
const STATUS_OUTPUT = join(PROJECT_ROOT, 'plan-reference/STATUS.md');

// Status icons
const ICONS = {
  completed: '✅',
  'in-progress': '🔄',
  pending: '⏳',
  blocked: '⚠️',
};

// Priority colors (for markdown)
function getStatusBadge(task: Task): string {
  if (task.status === 'completed') return ICONS.completed;
  if (task.blocked) return ICONS.blocked;
  if (task.status === 'in-progress') return ICONS['in-progress'];
  return ICONS.pending;
}

function checkFilesExist(files: string[]): boolean {
  if (!files || files.length === 0) return false;
  return files.every((file) => existsSync(join(PROJECT_ROOT, file)));
}

function updateTaskStatus(task: Task): Task {
  // Skip if already completed
  if (task.status === 'completed') return task;

  // Check if files exist
  if (task.files && task.files.length > 0) {
    const allExist = checkFilesExist(task.files);
    if (allExist) {
      return {
        ...task,
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
      };
    }
  }

  // Check if blocked
  if (task.blocked) {
    return { ...task, status: 'blocked' };
  }

  return task;
}

function calculateProgress(tasks: Task[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

function generateStatusMarkdown(config: Config): string {
  const allTasks = config.phases.flatMap((p) => p.tasks);
  const progress = calculateProgress(allTasks);
  const completed = allTasks.filter((t) => t.status === 'completed');
  const inProgress = allTasks.filter((t) => t.status === 'in-progress');
  const blocked = allTasks.filter((t) => t.blocked || t.status === 'blocked');

  // Progress by category
  const categories = {
    Infrastructure: allTasks.filter((t) => t.category === 'infrastructure'),
    Backend: allTasks.filter((t) => t.category === 'backend'),
    Frontend: allTasks.filter((t) => t.category === 'frontend'),
    Testing: allTasks.filter((t) => t.category === 'testing'),
    Security: allTasks.filter((t) => t.category === 'security'),
    Docs: allTasks.filter((t) => t.category === 'docs'),
    Release: allTasks.filter((t) => t.category === 'release'),
    Bugfix: allTasks.filter((t) => t.category === 'bugfix'),
    Feature: allTasks.filter((t) => t.category === 'feature'),
    Quality: allTasks.filter((t) => t.category === 'quality'),
    Content: allTasks.filter((t) => t.category === 'content'),
  };

  const recentActivity = completed
    .filter((t) => t.completedAt)
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

  return `# SambungChat Development Status

**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Current Phase:** Phase 1 - MVP Foundation
**Current Week:** ${config.currentWeek}
**Overall Progress:** ${progress.percentage}% (${progress.completed}/${progress.total} tasks completed)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total Tasks** | ${progress.total} |
| **Completed** | ${progress.completed} |
| **In Progress** | ${inProgress.length} |
| **Pending** | ${allTasks.filter((t) => t.status === 'pending').length} |
| **Blocked** | ${blocked.length} |
| **P0 Blockers** | ${allTasks.filter((t) => t.priority === 'P0' && t.status !== 'completed').length} |

---

## Phase 1: MVP Foundation (Weeks 1-12)

**Target Release:** v0.1.0
**Target Date:** March 31, 2026

---

${config.phases
  .flatMap((phase) => {
    const tasksByWeek = new Map<number, Task[]>();
    phase.tasks.forEach((task) => {
      if (!tasksByWeek.has(task.week)) tasksByWeek.set(task.week, []);
      tasksByWeek.get(task.week)!.push(task);
    });

    const weekRanges = [
      [1, 2, 'Repository Setup & Infrastructure'],
      [3, 4, 'Authentication & Layout'],
      [5, 6, 'Chat Backend'],
      [7, 8, 'API Keys & Chat UI'],
      [9, 10, 'Chat Features & Prompts'],
      [11, 11, 'Settings & API Key UI'],
      [12, 12, 'Polish & Release'],
    ];

    return weekRanges.map(([start, end, title]) => {
      const weekTasks: Task[] = [];
      for (let w = start; w <= end; w++) {
        weekTasks.push(...(tasksByWeek.get(w) || []));
      }

      const weekProgress = calculateProgress(weekTasks);
      const headerIcon =
        weekProgress.percentage === 100 ? '✅' : weekProgress.percentage > 0 ? '🔄' : '⏳';

      return `### Week ${start}${end > start ? '-' + end : ''}: ${title} ${headerIcon} ${weekProgress.percentage}%

| Task | Status | Priority | Dependencies | Notes |
|------|--------|----------|--------------|-------|
${weekTasks
  .map(
    (task) =>
      `| ${task.title} | ${getStatusBadge(task)} ${task.status === 'completed' && task.completedAt ? '' : task.status} | ${task.priority} | ${task.dependencies?.join(', ') || '-'} | ${task.description || ''} |`
  )
  .join('\n')}

---
`;
    });
  })
  .join('\n')}

## Blockers

### P0 - Critical Blockers (Must Resolve)

${allTasks
  .filter((t) => t.priority === 'P0' && t.status !== 'completed')
  .map(
    (task) => `| ID | Task | Blocked Since | Reason | Action Required |
|----|------|--------------|--------|----------------|
| \`${task.id}\` | ${task.title} | Week ${task.week} | ${task.blocked ? 'Blocked' : 'Pending'} | ${task.description || ''} |`
  )
  .join('\n\n')}

---

## Priority Breakdown

| Priority | Count | Description |
|----------|-------|-------------|
| P0 - Critical | ${allTasks.filter((t) => t.priority === 'P0').length} | Legal, release, infrastructure |
| P1 - High | ${allTasks.filter((t) => t.priority === 'P1').length} | Core features, security, UX |
| P2 - Medium | ${allTasks.filter((t) => t.priority === 'P2').length} | Nice-to-have, optimization |

---

## Progress by Category

| Category | Completed | Total | Progress |
|----------|-----------|-------|----------|
${Object.entries(categories)
  .map(([cat, tasks]) => {
    const catProgress = calculateProgress(tasks);
    if (catProgress.total === 0) return '';
    return `| ${cat} | ${catProgress.completed} | ${catProgress.total} | ${catProgress.percentage}% |`;
  })
  .filter(Boolean)
  .join('\n')}

---

## Recent Activity

${recentActivity
  .slice(0, 10)
  .map(
    (task) => `### ${task.completedAt}
- ${ICONS.completed} ${task.title}`
  )
  .join('\n')}

---

## Next Steps (Priority Order)

${allTasks
  .filter((t) => t.status === 'pending' && !t.blocked)
  .sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2 };
    return (
      priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder]
    );
  })
  .slice(0, 10)
  .map((task, i) => `${i + 1}. **[${task.priority}]** ${task.title}`)
  .join('\n')}

---

## Generated from

This file is auto-generated from \`.status/config.json\`.

To update:
\`\`\`bash
bun run status:update
\`\`\`

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
`;
}

async function main() {
  console.log('🔄 Updating status...');

  // Read config
  const configContent = readFileSync(STATUS_CONFIG, 'utf-8');
  const config: Config = JSON.parse(configContent);

  // Update task statuses based on file existence
  config.phases.forEach((phase) => {
    phase.tasks = phase.tasks.map(updateTaskStatus);
  });

  // Recalculate overall progress
  const allTasks = config.phases.flatMap((p) => p.tasks);
  const progress = calculateProgress(allTasks);
  config.overallProgress = progress.percentage / 100;

  // Write updated config
  writeFileSync(STATUS_CONFIG, JSON.stringify(config, null, 2));

  // Generate STATUS.md
  const markdown = generateStatusMarkdown(config);
  writeFileSync(STATUS_OUTPUT, markdown);

  console.log('✅ Status updated!');
  console.log(
    `   Progress: ${progress.percentage}% (${progress.completed}/${progress.total} tasks)`
  );
  console.log(`   Completed: ${allTasks.filter((t) => t.status === 'completed').length}`);
  console.log(`   Blocked: ${allTasks.filter((t) => t.blocked || t.status === 'blocked').length}`);
  console.log(`\n📄 ${STATUS_OUTPUT}`);
}

main().catch(console.error);
