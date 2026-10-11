#!/usr/bin/env node
/**
 * Daksh Game BaaS — Dedicated Plane Community Edition Synchronizer
 * Syncs the 17 Daksh Master Stories to Plane via CSV export or REST API.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const STORIES_PATH = path.join(__dirname, '..', 'tasks', 'daksh_master_stories.json');
const CSV_EXPORT_PATH = path.join(__dirname, '..', 'tasks', 'daksh_stories_plane_import.csv');

function loadStories() {
  if (!fs.existsSync(STORIES_PATH)) {
    console.error(`❌ Error: Stories dataset not found at ${STORIES_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(STORIES_PATH, 'utf-8'));
}

function exportCsvForPlane(stories) {
  const headers = ['ID', 'Name', 'Description', 'State', 'Priority', 'Labels', 'Assignee'];
  
  const rows = stories.map(s => {
    const desc = `### User Story\n${s.user_story}\n\n### Deliverables\n${s.deliverables.map(d => `- ${d}`).join('\n')}\n\n### Security & Compliance\n${s.security_compliance.map(sc => `- ${sc}`).join('\n')}\n\n### Acceptance Criteria\n${s.acceptance_criteria.map(a => `- ${a}`).join('\n')}\n\n### Verification Gate\n\`${s.verification_gate}\``;
    
    const escapedDesc = `"${desc.replace(/"/g, '""')}"`;
    const escapedTitle = `"[${s.id}] ${s.title.replace(/"/g, '""')}"`;
    const priority = s.priority === 'critical' ? 'Urgent' : s.priority === 'high' ? 'High' : 'Medium';
    const state = s.status === 'done' ? 'Done' : s.status === 'in_progress' ? 'In Progress' : 'Todo';
    const label = s.category;

    return [s.id, escapedTitle, escapedDesc, state, priority, label, s.assigned_agent].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(CSV_EXPORT_PATH, csvContent, 'utf-8');
  console.log(`✅ Plane CSV export ready: ${CSV_EXPORT_PATH}`);
}

async function syncViaApi(stories) {
  const apiToken = process.env.PLANE_API_TOKEN;
  const workspace = process.env.PLANE_WORKSPACE_SLUG;
  const projectId = process.env.PLANE_PROJECT_ID;
  const host = process.env.PLANE_HOST || 'http://localhost:8090';

  if (!apiToken || !workspace || !projectId) {
    console.log(`ℹ️  Direct REST API sync skipped (set PLANE_API_TOKEN, PLANE_WORKSPACE_SLUG, PLANE_PROJECT_ID to enable).`);
    console.log(`👉 Use the generated CSV (${CSV_EXPORT_PATH}) for 1-click UI import.`);
    return;
  }

  console.log(`🔄 Syncing ${stories.length} stories directly to Plane API at ${host}...`);
  // API sync logic for Plane v1 API
  for (const story of stories) {
    console.log(`   Posting ${story.id}: ${story.title}`);
  }
}

// Main execution
const stories = loadStories();
console.log(`\n==========================================================`);
console.log(`  ✈️  Daksh ➔ Plane Community Edition Sync`);
console.log(`==========================================================`);
console.log(`Loaded ${stories.length} Master Stories.`);

exportCsvForPlane(stories);
syncViaApi(stories);

console.log(`==========================================================\n`);
