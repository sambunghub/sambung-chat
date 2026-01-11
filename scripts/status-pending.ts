#!/usr/bin/env bun
/**
 * Show pending tasks grouped by priority
 *
 * Usage:
 *   bun run scripts/status-pending.ts
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
  status: string;
  blocked?: boolean;
}

interface Config {
  phases: Array<{ tasks: Task[] }>;
}

function main() {
  const config: Config = JSON.parse(readFileSync(STATUS_CONFIG, 'utf-8'));
  const allTasks = config.phases.flatMap((p) => p.tasks);

  // Filter pending and not blocked
  const pending = allTasks.filter((t) => t.status !== 'completed' && !t.blocked);

  // Group by priority
  const byPriority = {
    P0: pending.filter((t) => t.priority === 'P0'),
    P1: pending.filter((t) => t.priority === 'P1'),
    P2: pending.filter((t) => t.priority === 'P2'),
  };

  console.log(`\n📋 Pending Tasks (${pending.length} total)\n`);

  for (const [priority, tasks] of Object.entries(byPriority)) {
    if (tasks.length === 0) continue;

    const priorityLabel = {
      P0: '🚨 CRITICAL (P0)',
      P1: '⭐ HIGH (P1)',
      P2: '📌 MEDIUM (P2)',
    }[priority];

    console.log(`${priorityLabel}\n${'─'.repeat(40)}`);

    tasks
      .sort((a, b) => a.week - b.week)
      .forEach((task) => {
        console.log(`  Week ${task.week}: ${task.title}`);
        console.log(`            ID: ${task.id}\n`);
      });
  }

  console.log(`\n💡 Run "bun run status:update" to update progress\n`);
}

main().catch(console.error);
