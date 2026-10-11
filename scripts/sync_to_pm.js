#!/usr/bin/env node
/**
 * Daksh Game BaaS — AI Project Management Synchronization Utility
 * Syncs master stories between tasks/daksh_master_stories.json and open source PM tools (Plane, Planka, or Daksh Studio).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const STORIES_PATH = path.join(__dirname, '..', 'tasks', 'daksh_master_stories.json');

function loadStories() {
  if (!fs.existsSync(STORIES_PATH)) {
    console.error(`Error: Stories file not found at ${STORIES_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(STORIES_PATH, 'utf-8'));
}

function exportCsvForPlane(stories) {
  const outputPath = path.join(__dirname, '..', 'tasks', 'daksh_stories_plane_import.csv');
  const headers = ['ID', 'Title', 'Description', 'State', 'Priority', 'Labels'];
  
  const rows = stories.map(s => {
    const desc = `User Story: ${s.user_story}\n\nDeliverables:\n${s.deliverables.map(d => `- ${d}`).join('\n')}\n\nAcceptance Criteria:\n${s.acceptance_criteria.map(a => `- ${a}`).join('\n')}\n\nVerification: ${s.verification_gate}`;
    const escapedDesc = `"${desc.replace(/"/g, '""')}"`;
    const escapedTitle = `"${s.title.replace(/"/g, '""')}"`;
    return [s.id, escapedTitle, escapedDesc, s.status, s.priority, s.category].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`✓ CSV export created successfully for Plane/Linear: ${outputPath}`);
}

function printSummary(stories) {
  console.log('\n========================================================');
  console.log('  Daksh Game BaaS — AI Master Stories Status Summary');
  console.log('========================================================\n');
  
  const byStatus = {};
  stories.forEach(s => {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });

  console.log(`Total Stories: ${stories.length}`);
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  - ${status.toUpperCase()}: ${count}`);
  });

  console.log('\nList of Stories:');
  stories.forEach(s => {
    const badge = `[${s.status.toUpperCase()}]`.padEnd(14);
    console.log(`  ${s.id}  ${badge} ${s.title} (${s.category})`);
  });
  console.log('\n========================================================\n');
}

// Execution
const stories = loadStories();
const args = process.argv.slice(2);

if (args.includes('--csv')) {
  exportCsvForPlane(stories);
} else {
  printSummary(stories);
  exportCsvForPlane(stories);
}
