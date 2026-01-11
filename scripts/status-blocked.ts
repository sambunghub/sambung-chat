#!/usr/bin/env bun
/**
 * Show blocked tasks with reasons
 *
 * Usage:
 *   bun run scripts/status-blocked.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const STATUS_CONFIG = join(PROJECT_ROOT, 'plan-reference/.status/config.json');

interface Task {
  id: string;
  title: string;
  week: number;
  priority: string;
  blocked?: boolean;
  status: string;
  dependencies?: string[];
  description?: string;
}

interface Config {
  phases: Array<{ tasks: Task[] }>;
}

function main() {
  const config: Config = JSON.parse(readFileSync(STATUS_CONFIG, 'utf-8'));
  const allTasks = config.phases.flatMap((p) => p.tasks);

  // Filter blocked tasks
  const blocked = allTasks.filter((t) => t.blocked || t.status === 'blocked');

  if (blocked.length === 0) {
    console.log('\n✅ No blocked tasks!\n');
    return;
  }

  console.log(`\n🚫 Blocked Tasks (${blocked.length} total)\n`);
  console.log('═'.repeat(60));

  blocked
    .sort((a, b) => a.week - b.week)
    .forEach((task) => {
      const priorityIcon = task.priority === 'P0' ? '🚨' : task.priority === 'P1' ? '⭐' : '📌';
      console.log(`\n${priorityIcon} ${task.title}`);
      console.log(`   Week: ${task.week} | Priority: ${task.priority} | ID: ${task.id}`);

      if (task.dependencies?.length) {
        console.log(`   Dependencies: ${task.dependencies.join(', ')}`);
      }

      if (task.description) {
        console.log(`   Description: ${task.description}`);
      }

      if (task.blocked) {
        console.log(`   Status: ⚠️  BLOCKED`);
      }
    });

  console.log(`\n\n💡 Resolve blockers to unblock dependent tasks`);
  console.log(`💡 Run "bun run status:update" to refresh status\n`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
