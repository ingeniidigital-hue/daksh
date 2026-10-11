#!/usr/bin/env node
const http = require('http');

let tokenCache = null;

async function getAuthToken() {
  if (tokenCache) return tokenCache;
  const postData = JSON.stringify({ emailOrUsername: 'admin@daksh.io', password: 'dakshpassword123' });
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:1337/api/access-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          tokenCache = parsed.item;
          resolve(tokenCache);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function apiRequest(method, endpoint, data = null, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
          resolve(parsed);
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

async function getBoard() {
  const token = await getAuthToken();
  const projs = await apiRequest('GET', '/api/projects', null, token);
  const proj = await apiRequest('GET', `/api/projects/${projs.items[0].id}`, null, token);
  const boardId = proj.included.boards[0].id;
  return await apiRequest('GET', `/api/boards/${boardId}`, null, token);
}

async function completeTask(taskNameSnippet) {
  const token = await getAuthToken();
  const board = await getBoard();
  const tasks = board.included.tasks || [];
  const target = tasks.find(t => t.name.toLowerCase().includes(taskNameSnippet.toLowerCase()));
  if (!target) {
    console.error(`Task matching "${taskNameSnippet}" not found.`);
    return false;
  }
  const res = await apiRequest('PATCH', `/api/tasks/${target.id}`, { isCompleted: true }, token);
  console.log(`✅ Marked task completed: "${target.name}"`);
  return true;
}

async function moveStory(storyId, targetListName) {
  const token = await getAuthToken();
  const board = await getBoard();
  const cards = board.included.cards || [];
  const lists = board.included.lists || [];
  
  const card = cards.find(c => c.name.includes(`[${storyId}]`));
  if (!card) {
    console.error(`Card [${storyId}] not found.`);
    return false;
  }
  const targetList = lists.find(l => l.name && l.name.toLowerCase().includes(targetListName.toLowerCase()));
  if (!targetList) {
    console.error(`List "${targetListName}" not found.`);
    return false;
  }
  
  const res = await apiRequest('PATCH', `/api/cards/${card.id}`, { listId: targetList.id, position: 65536 }, token);
  console.log(`🚀 Moved [${storyId}] to "${targetList.name}"`);
  return true;
}

module.exports = {
  getAuthToken,
  apiRequest,
  getBoard,
  completeTask,
  moveStory
};

if (require.main === module) {
  const action = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  if (action === 'complete-task') {
    completeTask(arg1);
  } else if (action === 'move-story') {
    moveStory(arg1, arg2);
  } else {
    console.log('Usage: node planka_agent.js complete-task "<task name snippet>"');
    console.log('       node planka_agent.js move-story "STORY-01" "In Progress"');
  }
}
