import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tmpDir = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now());
const port = 9333;

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${tmpDir}`,
  'http://localhost:3001/'
]);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(3000);

  const targetsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    chrome.kill();
    return;
  }

  console.log('Connecting to target:', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params);
      console.log('[Browser Console]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Exception]', msg.params.exceptionDetails);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  }

  console.log('--- Step 1: Initial page check ---');
  let currentNav = await evaluate(`(() => {
    return {
      hasAppRoot: !!document.getElementById('app-root'),
      hasCoreNav: !!document.getElementById('primary-core-navbar'),
      hasGeneralNav: !!document.getElementById('general-ai-navbar'),
      activeText: document.getElementById('nav-course-creator-btn')?.innerText || document.getElementById('nav-chat-home-btn')?.innerText
    };
  })()`);
  console.log('Initial state:', currentNav);

  console.log('--- Step 2: Open AI Hub Dropdown ---');
  let openDropdown = await evaluate(`(() => {
    const btn = document.getElementById('ai-hub-dropdown-trigger-navbar');
    if (!btn) return 'btn not found';
    btn.click();
    return 'clicked';
  })()`);
  console.log('Open dropdown result:', openDropdown);
  await sleep(500);

  let dropdownVisible = await evaluate(`!!document.getElementById('ai-hub-dropdown-menu')`);
  console.log('Dropdown menu visible:', dropdownVisible);

  console.log('--- Step 3: Switch to Visa Doc Analyzer ---');
  let clickOption = await evaluate(`(() => {
    const opt = document.getElementById('ai-hub-option-visa_doc_analyzer');
    if (!opt) return 'option not found';
    opt.click();
    return 'clicked visa_doc_analyzer';
  })()`);
  console.log('Click option result:', clickOption);
  await sleep(1000);

  let afterSwitch = await evaluate(`(() => {
    return {
      hasCoreNav: !!document.getElementById('primary-core-navbar'),
      hasGeneralNav: !!document.getElementById('general-ai-navbar'),
      hasChatHome: !!document.getElementById('nav-chat-home-btn'),
      hasResources: !!document.getElementById('nav-resources-btn'),
      hasDashboard: !!document.getElementById('global-dashboard-btn'),
      hasActivity: !!document.getElementById('global-activity-tracker-btn'),
      hasParameter: !!document.getElementById('global-parameter-btn'),
      dropdownText: document.getElementById('ai-hub-dropdown-trigger-navbar')?.innerText
    };
  })()`);
  console.log('After switch to Visa Doc Analyzer:', afterSwitch);

  console.log('--- Step 4: Switch back to Course Creator ---');
  await evaluate(`document.getElementById('ai-hub-dropdown-trigger-navbar')?.click()`);
  await sleep(500);
  let clickCourseCreator = await evaluate(`(() => {
    const opt = document.getElementById('ai-hub-option-course_creator');
    if (!opt) return 'course_creator opt not found';
    opt.click();
    return 'clicked course_creator';
  })()`);
  console.log('Click course creator:', clickCourseCreator);
  await sleep(1000);

  let afterCourseCreator = await evaluate(`(() => {
    return {
      hasCoreNav: !!document.getElementById('primary-core-navbar'),
      hasGeneralNav: !!document.getElementById('general-ai-navbar'),
      hasCourseCreatorBtn: !!document.getElementById('nav-course-creator-btn'),
      hasLibraryBtn: !!document.getElementById('nav-library-btn'),
      hasStudentPathsBtn: !!document.getElementById('nav-student-paths-btn'),
      hasPathsDropdownToggle: !!document.getElementById('student-paths-dropdown-toggle-btn')
    };
  })()`);
  console.log('After switch to Course Creator:', afterCourseCreator);

  console.log('--- Step 5: Test Student Paths Dropdown & Auto-close ---');
  let openPathsDropdown = await evaluate(`(() => {
    const toggle = document.getElementById('student-paths-dropdown-toggle-btn');
    if (!toggle) return 'toggle not found';
    toggle.click();
    return 'clicked toggle';
  })()`);
  console.log('Open student paths dropdown:', openPathsDropdown);
  await sleep(500);

  let pathsDropdownOpen = await evaluate(`(() => {
    // Check if dropdown items are in DOM
    const text = document.body.innerText;
    return text.includes('Type + AI') && text.includes('Video + AI') && text.includes('Inteli Coach');
  })()`);
  console.log('Student paths dropdown visible with options:', pathsDropdownOpen);

  console.log('--- Step 6: Click outside Student Paths Dropdown ---');
  let clickOutside = await evaluate(`(() => {
    // Click on app-root or body outside the dropdown
    const appRoot = document.getElementById('app-root');
    const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
    document.dispatchEvent(evt);
    return 'dispatched mousedown on document';
  })()`);
  console.log('Click outside result:', clickOutside);
  await sleep(500);

  let pathsDropdownClosed = await evaluate(`(() => {
    const text = document.body.innerText;
    return !(text.includes('Type + AI') && text.includes('Video + AI'));
  })()`);
  console.log('Student paths dropdown closed after outside click:', pathsDropdownClosed);

  ws.close();
  chrome.kill();
  console.log('Test completed!');
}

run().catch(e => {
  console.error(e);
  chrome.kill();
});
