#!/usr/bin/env node
/**
 * Automatically sets up Planka with:
 * 1. Project: "Daksh Game BaaS" (type: shared)
 * 2. Board: "Master Stories & AI Roadmap"
 * 3. Lists: "Backlog", "To Do", "In Progress", "Review & TDD", "Done & Verified"
 * 4. Cards: All 17 Master Stories with full user stories, deliverables, and acceptance criteria!
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

async function main() {
  console.log('🔄 Authenticating with Planka API...');
  const loginRes = await apiRequest('POST', '/api/access-tokens', {
    emailOrUsername: 'admin@daksh.io',
    password: 'dakshpassword123'
  });
  const token = loginRes.item;
  console.log('✅ Authenticated as admin@daksh.io');

  console.log('🔄 Creating Project: Daksh Game BaaS...');
  const projectRes = await apiRequest('POST', '/api/projects', {
    type: 'shared',
    name: 'Daksh Game BaaS'
  }, token);
  const projectId = projectRes.item.id;
  console.log(`✅ Project created: ID ${projectId}`);

  console.log('🔄 Creating Board: Master Stories & AI Roadmap...');
  const boardRes = await apiRequest('POST', `/api/projects/${projectId}/boards`, {
    name: 'Master Stories & AI Roadmap',
    position: 65536
  }, token);
  const boardId = boardRes.item.id;
  console.log(`✅ Board created: ID ${boardId}`);

  // Create Lists
  const listNames = ['Backlog', 'To Do', 'In Progress', 'Review & TDD', 'Done & Verified'];
  const listIds = {};

  for (let i = 0; i < listNames.length; i++) {
    const name = listNames[i];
    const listRes = await apiRequest('POST', `/api/boards/${boardId}/lists`, {
      type: 'active',
      name: name,
      position: (i + 1) * 65536
    }, token);
    listIds[name] = listRes.item.id;
    console.log(`   List created: "${name}" (ID ${listRes.item.id})`);
  }

  // Done list ID
  const doneListId = listIds['Done & Verified'];

  console.log(`🔄 Importing all ${STORIES.length} Master Stories into Planka...`);
  for (let i = 0; i < STORIES.length; i++) {
    const s = STORIES[i];
    const desc = `### User Story\n${s.user_story}\n\n### Deliverables\n${s.deliverables.map(d => `- ${d}`).join('\n')}\n\n### Security & Compliance\n${s.security_compliance.map(sc => `- ${sc}`).join('\n')}\n\n### Acceptance Criteria\n${s.acceptance_criteria.map(a => `- ${a}`).join('\n')}\n\n### Verification Gate\n\`${s.verification_gate}\``;

    await apiRequest('POST', `/api/lists/${doneListId}/cards`, {
      type: 'story',
      name: `[${s.id}] ${s.title}`,
      description: desc,
      position: (i + 1) * 65536
    }, token);

    console.log(`   ✓ Card created: ${s.id} - ${s.title}`);
  }

  console.log('\n==========================================================');
  console.log('🎉 Planka is 100% configured and pre-populated with all 17 stories!');
  console.log('🌐 Web Dashboard: http://localhost:1337');
  console.log('🔑 Credentials:');
  console.log('   Email:    admin@daksh.io');
  console.log('   Password: dakshpassword123');
  console.log('==========================================================\n');
}

main().catch(err => {
  console.error('❌ Error initializing Planka:', err);
  process.exit(1);
});
