import { Central } from '@lionrockjs/central';
import { performance } from 'node:perf_hooks';
let benchmarkRecords = [];

const DevUtils = {
  benchmarkReset: () => {
    benchmarkRecords = [];
  },

  benchmark: label => {
    const currTime = performance.now();
    const deltaTime = (benchmarkRecords.length === 0) ? 0 : (currTime - benchmarkRecords[benchmarkRecords.length - 1].time);
    benchmarkRecords.push({ label, time: currTime, delta: deltaTime });
  },

  getBenchmarkRecords: () => benchmarkRecords,

  printTable: (map, title = '') => {
    let text = '';
    text += `<details><summary>${title}</summary><table style="color:#AAA">`;
    map.forEach((v, k) => {
      text += `<tr><td>${k}</td><td>:</td><td>${v}</td></tr>`;
    });
    text += '</table></details>';
    return text;
  },

  printList:(ary, title = '') => {
    let text = '';
    text += `<details><summary>${title}</summary><ul style="color:#AAA">`;
    ary.forEach(v => {
      text += `<li>${v}</li>`;
    });
    text += '</ul></details>';
    return text;
  },
};

const execute_debug = async (Controller, request) => {
  const { benchmarkReset, benchmark, getBenchmarkRecords } = DevUtils;
  benchmarkReset();
  benchmark('start');

  // import controller
  const c = new Controller(request);
  benchmark('init Controller');

  const result = await c.execute();
  benchmark('exec Controller');

  const benchmarkOutput = JSON.stringify(getBenchmarkRecords().map(x => ({ label: x.label, ms: x.delta })));
  // eslint-disable-next-line no-console
  Central.log(`${request.url} :::: ${benchmarkOutput}`, false);

  if (global.gc)global.gc();

  if (!result.headers['Content-Type']) {
    result.headers['Content-Type'] = 'text/html; charset=utf-8';
  }

  if (result.headers['Content-Type'] === 'text/javascript; charset=utf-8') {
    result.body = JSON.stringify(result.body);
    if (c.error) {
      // eslint-disable-next-line no-console
      Central.log(c.error);
    }
    return result;
  }

  if (result.headers['Content-Type'] !== 'text/html; charset=utf-8') {
    // eslint-disable-next-line no-console
    if (c.error) { Central.log(c.error); }
    return result;
  }

  let debugText = '';

  if (c.error) {
    debugText += `<pre style="color:#C00; display:inline;">${c.error.stack}</pre>`;
    debugText += '<hr style="border-color:#666"/>';
    // eslint-disable-next-line no-console
    Central.log(c.error);
  }

  debugText += benchmarkOutput;
  debugText += '<hr style="border-color:#666"/>';

  debugText += DevUtils.printTable(Central.nodePackages, 'Node packages');
  debugText += '<hr style="border-color:#666"/>';
  debugText += DevUtils.printTable(Central.classPath, 'import files');
  debugText += '<hr style="border-color:#666"/>';
  debugText += DevUtils.printList([...Central.viewPath.values()], 'Views');
  debugText += '<hr style="border-color:#666"/>';

  const config = Central.config;

  debugText += `<details><summary>Core Config Values</summary><pre style="color:#777; display:inline; height: 5rem; overflow-y:scroll">${JSON.stringify(config, undefined, 2)}</pre></details>`;

  debugText += '<hr style="border-color:#666"/>';

  debugText += '<details><summary>Controller:Action</summary><pre style="color:#777; display:inline;">'
    + `${Controller.name} : ${request.params.action}</pre></details>`;

  debugText += '<hr style="border-color:#666"/>';

  debugText += `<details><summary>Session</summary><pre style="color:#777; display:inline;">${JSON.stringify(request.session, undefined, 2)}</pre></details>`;

  debugText += '<hr style="border-color:#666"/>';

  result.body += '<div id="kohanajs-debug-panel" style="background-color: #000; color: #AAA; font-family: monospace; '
    + `font-size: 12px; padding: 1em; position: relative; z-index: 9999;">${debugText}</div>`;

  return result;
};
const execute_production = async (Controller, request) => new Controller(request).execute();

export default {
  execute_debug,
  execute_production,
};
