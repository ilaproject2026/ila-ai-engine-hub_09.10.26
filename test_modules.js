import { execFileSync } from 'child_process';
import os from 'os';
import path from 'path';

const modules = [
  'course_creator',
  'ila_chat',
  'visa_doc_analyzer',
  'hr_interviewer',
  'ai_teacher_strategist',
  'central_dashboard'
];

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const mod of modules) {
  const tmpDir = path.join(os.tmpdir(), 'chrome_mod_' + mod + '_' + Date.now());
  try {
    const html = execFileSync(chromePath, [
      '--headless=new',
      '--dump-dom',
      '--virtual-time-budget=4000',
      '--user-data-dir=' + tmpDir,
      `http://localhost:3001/?test_mod=${mod}`
    ], { encoding: 'utf8' });

    const hasAppRoot = html.includes('id="app-root"');
    const hasCoreNav = html.includes('id="primary-core-navbar"');
    const hasGeneralNav = html.includes('id="general-ai-navbar"');

    console.log(`Mod [${mod}]: hasAppRoot=${hasAppRoot}, hasCoreNav=${hasCoreNav}, hasGeneralNav=${hasGeneralNav}`);
  } catch (e) {
    console.error(`Mod [${mod}] error:`, e.message);
  }
}
