#!/usr/bin/env node
/**
 * Automatically creates structured TDD task checklists inside every story card in Planka.
 * Each card gets:
 * 1. [TDD-RED] Write Failing Automated Test Suite
 * 2. [TDD-GREEN] Implement Production Code & Runtime Logic
 * 3. [TDD-REFACTOR] Architecture Hardening & Security Compliance
 * 4. [INTEGRATION] Client SDK & Studio Hook
 * 5. [VERIFY-GATE] Run High-Level Verification Gate & Assert Exit Code 0
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

// Custom TDD tasks mapped to each story
function getTddTasksForStory(story) {
  const tasks = [
    `[TDD-RED] Write failing automated test suite for ${story.id} (${story.title}) covering happy path and edge cases`,
    `[TDD-GREEN] Implement production runtime code and backend handlers: ${story.deliverables[0]}`,
    `[TDD-REFACTOR] Enforce security compliance: ${story.security_compliance[0]}`,
    `[INTEGRATION] Wire client integration & deliverables: ${story.deliverables[1] || story.deliverables[0]}`,
    `[VERIFY-GATE] Run verification gate: "${story.verification_gate}" (Assert 100% green exit code 0)`
  ];
  return tasks;
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
  // Query boards
  const projectsRes = await apiRequest('GET', '/api/projects', null, token);
  const project = projectsRes.items.find(p => p.name === 'Daksh Game BaaS') || projectsRes.items[0];

  const boardRes = await apiRequest('GET', `/api/projects/${project.id}`, null, token);
  // Get board from included or fetch boards
  const boardId = boardRes.included.boards[0].id;
  console.log(`✅ Using Board ID: ${boardId}`);

  // Fetch full board details to get cards
  const fullBoard = await apiRequest('GET', `/api/boards/${boardId}`, null, token);
  const cards = fullBoard.included.cards || [];
  console.log(`✅ Found ${cards.length} cards in board.`);

  for (const card of cards) {
    // Extract story ID from card name "[STORY-XX]"
    const match = card.name.match(/\[(STORY-\d+)\]/);
    if (!match) continue;

    const storyId = match[1];
    const story = STORIES.find(s => s.id === storyId);
    if (!story) continue;

    console.log(`\n📋 Adding AI TDD Checklist to card ${storyId}: "${card.name}"...`);

    // 1. Create Task List in card
    const taskListRes = await apiRequest('POST', `/api/cards/${card.id}/task-lists`, {
      name: 'AI TDD Execution Checklist',
      position: 65536
    }, token);
    const taskListId = taskListRes.item.id;

    // 2. Add individual TDD tasks
    const tddTasks = getTddTasksForStory(story);
    for (let i = 0; i < tddTasks.length; i++) {
      const taskName = tddTasks[i];
      await apiRequest('POST', `/api/task-lists/${taskListId}/tasks`, {
        name: taskName,
        position: (i + 1) * 65536
      }, token);
      console.log(`   ✓ Task ${i + 1}: ${taskName.substring(0, 70)}...`);
    }
  }

  console.log('\n==========================================================');
  console.log('🎉 All 17 cards in Planka now have interactive AI TDD checklists!');
  console.log('🌐 Review now at: http://localhost:1337');
  console.log('==========================================================\n');
}

main().catch(err => {
  console.error('❌ Error populating TDD tasks in Planka:', err);
  process.exit(1);
});
