#!/usr/bin/env node
/**
 * Synchronizes detailed Technical Engineering Tasks, Automated Test Cases (TDD),
 * and TDD Lifecycle Gates to each story card in Planka.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const STORIES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tasks', 'daksh_master_stories.json'), 'utf-8'));

function apiRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: 1337,
      path: endpoint,
      method: method,
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({ status: res.statusCode, body: parsed });
          }
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function getTddLifecycleGates(story) {
  return [
    `[TDD-RED] Write failing automated test suite for ${story.id} (${story.title}) covering happy path and edge cases`,
    `[TDD-GREEN] Implement production runtime code and backend handlers: ${story.deliverables[0]}`,
    `[TDD-REFACTOR] Enforce security compliance: ${story.security_compliance[0]}`,
    `[INTEGRATION] Wire client integration & deliverables: ${story.deliverables[1] || story.deliverables[0]}`,
    `[VERIFY-GATE] Run verification gate: "${story.verification_gate}" (Assert 100% green exit code 0)`
  ];
}

async function main() {
  console.log('🔄 Authenticating with Planka API...');
  const loginRes = await apiRequest('POST', '/api/access-tokens', {
    emailOrUsername: 'admin@daksh.io',
    password: 'dakshpassword123'
  });
  const token = loginRes.item;
  console.log('✅ Authenticated as admin@daksh.io');

  console.log('🔄 Fetching boards and cards...');
  const projectsRes = await apiRequest('GET', '/api/projects', null, token);
  const project = projectsRes.items.find(p => p.name === 'Daksh Game BaaS') || projectsRes.items[0];

  const boardRes = await apiRequest('GET', `/api/projects/${project.id}`, null, token);
  const boardId = boardRes.included.boards[0].id;

  const fullBoard = await apiRequest('GET', `/api/boards/${boardId}`, null, token);
  const cards = fullBoard.included.cards || [];
  const existingTaskLists = fullBoard.included.taskLists || [];

  console.log(`🧹 Cleaning up ${existingTaskLists.length} existing task lists...`);
  for (const tl of existingTaskLists) {
    try {
      await apiRequest('DELETE', `/api/task-lists/${tl.id}`, null, token);
    } catch (e) {
      console.warn(`Could not delete task list ${tl.id}:`, e.message || e);
    }
  }

  console.log(`✅ Cleared old task lists. Now populating 3 rich checklists per card across all ${cards.length} cards...`);

  let totalTasksCreated = 0;

  for (const card of cards) {
    const match = card.name.match(/\[(STORY-\d+)\]/);
    if (!match) continue;

    const storyId = match[1];
    const story = STORIES.find(s => s.id === storyId);
    if (!story) continue;

    console.log(`\n==========================================================`);
    console.log(`📌 Card: ${card.name} (${storyId})`);

    // 1. Create "📋 Technical Engineering Tasks" Checklist
    const techListRes = await apiRequest('POST', `/api/cards/${card.id}/task-lists`, {
      name: '📋 Technical Engineering Tasks',
      position: 65536
    }, token);
    const techListId = techListRes.item.id;

    for (let i = 0; i < (story.technical_tasks || []).length; i++) {
      const taskName = story.technical_tasks[i];
      await apiRequest('POST', `/api/task-lists/${techListId}/tasks`, {
        name: taskName,
        position: (i + 1) * 65536
      }, token);
      totalTasksCreated++;
    }
    console.log(`   ✓ Added ${story.technical_tasks.length} Technical Engineering Tasks`);

    // 2. Create "🧪 Automated Test Cases (TDD)" Checklist
    const testListRes = await apiRequest('POST', `/api/cards/${card.id}/task-lists`, {
      name: '🧪 Automated Test Cases (TDD)',
      position: 131072
    }, token);
    const testListId = testListRes.item.id;

    for (let i = 0; i < (story.test_cases || []).length; i++) {
      const testName = story.test_cases[i];
      await apiRequest('POST', `/api/task-lists/${testListId}/tasks`, {
        name: testName,
        position: (i + 1) * 65536
      }, token);
      totalTasksCreated++;
    }
    console.log(`   ✓ Added ${story.test_cases.length} Automated Test Cases`);

    // 3. Create "🚀 TDD Execution Lifecycle Gates" Checklist
    const gateListRes = await apiRequest('POST', `/api/cards/${card.id}/task-lists`, {
      name: '🚀 TDD Execution Lifecycle Gates',
      position: 196608
    }, token);
    const gateListId = gateListRes.item.id;

    const gates = getTddLifecycleGates(story);
    for (let i = 0; i < gates.length; i++) {
      const gateName = gates[i];
      await apiRequest('POST', `/api/task-lists/${gateListId}/tasks`, {
        name: gateName,
        position: (i + 1) * 65536
      }, token);
      totalTasksCreated++;
    }
    console.log(`   ✓ Added ${gates.length} TDD Lifecycle Gates`);
  }

  console.log('\n==========================================================');
  console.log(`🎉 Complete! Successfully created ${totalTasksCreated} interactive tasks across 17 story cards in Planka!`);
  console.log('🌐 Check live in Planka at: http://localhost:1337');
  console.log('==========================================================\n');
}

main().catch(err => {
  console.error('❌ Error updating tasks in Planka:', err);
  process.exit(1);
});
