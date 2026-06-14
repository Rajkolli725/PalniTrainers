/*
 * Team Profiles — ServiceNow proxy (zero dependencies, Node 14+).
 *
 * Why this exists:
 *   - Browsers block direct cross-origin calls to ServiceNow (CORS).
 *   - Credentials must NOT live in client-side HTML.
 * This tiny server holds the credentials server-side, serves index.html,
 * and forwards /api/team-profiles calls to the ServiceNow Table API using
 * Basic auth. The browser only ever talks to this proxy (same origin).
 *
 * Run:   node team-profiles-proxy.js
 * Then:  open http://localhost:3000
 *
 * Credentials are read from servicenow-config.json (git-ignored) or env vars.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ---- Config (env vars override the JSON file) ----
let cfg = {};
try {
  cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'servicenow-config.json'), 'utf8'));
} catch (e) {
  console.error('\n  Missing or invalid servicenow-config.json — copy the template and fill in your details.\n');
  process.exit(1);
}
const INSTANCE = (process.env.SN_INSTANCE || cfg.instance || '').replace(/\/+$/, '');
const TABLE    = process.env.SN_TABLE || cfg.table;
const USER     = process.env.SN_USER || cfg.username;
const PASS     = process.env.SN_PASS || cfg.password;
const PORT     = process.env.PORT || cfg.port || 3000;

if (!INSTANCE || !TABLE || !USER || !PASS) {
  console.error('\n  Config incomplete — need instance, table, username, password.\n');
  process.exit(1);
}
const AUTH = 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64');

// ---- Forward a request to the ServiceNow Table API ----
function snRequest(method, suffix, body, cb) {
  const url = new URL(INSTANCE + '/api/now/table/' + TABLE + suffix);
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    method,
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    headers: {
      'Authorization': AUTH,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Transaction-Source': 'Interface=Web,Interface-Type=Classic Environment,Interface-Name=Unified Navigation App'
    }
  };
  if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
  const r = https.request(opts, sn => {
    let chunks = '';
    sn.on('data', d => (chunks += d));
    sn.on('end', () => cb(null, sn.statusCode || 502, chunks));
  });
  r.on('error', err => cb(err));
  if (data) r.write(data);
  r.end();
}

function proxy(res, method, suffix, body) {
  snRequest(method, suffix, body, (err, status, data) => {
    if (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: String(err) }));
    }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(data || '{}');
  });
}

function readBody(req, cb) {
  let b = '';
  req.on('data', d => (b += d));
  req.on('end', () => { try { cb(b ? JSON.parse(b) : {}); } catch (e) { cb({}); } });
}

function serveFile(res, file, type) {
  fs.readFile(path.join(__dirname, file), (e, buf) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': type });
    res.end(buf);
  });
}

// Stream an arbitrary authenticated GET from the instance back to the browser.
function streamFromInstance(instancePath, res) {
  const url = new URL(INSTANCE + '/' + String(instancePath).replace(/^\/+/, ''));
  const r = https.request({
    method: 'GET', hostname: url.hostname, port: 443,
    path: url.pathname + url.search, headers: { 'Authorization': AUTH }
  }, sn => {
    res.writeHead(sn.statusCode || 502, {
      'Content-Type': sn.headers['content-type'] || 'application/octet-stream',
      'Content-Disposition': sn.headers['content-disposition'] || 'inline',
      'Cache-Control': 'private, max-age=300'
    });
    sn.pipe(res);
  });
  r.on('error', e => { res.writeHead(502); res.end(String(e)); });
  r.end();
}

// List attachments for a record. Scoped-table attachments carry a ZZ_YY-prefixed
// table_name, so we query by table_sys_id alone (which matches reliably).
function listAttachments(sysId, cb) {
  const url = new URL(INSTANCE + '/api/now/attachment?sysparm_query=table_sys_id=' + sysId);
  const r = https.request({
    method: 'GET', hostname: url.hostname, port: 443,
    path: url.pathname + url.search, headers: { 'Authorization': AUTH, 'Accept': 'application/json' }
  }, sn => {
    let d = '';
    sn.on('data', c => (d += c));
    sn.on('end', () => { try { cb(null, JSON.parse(d).result || []); } catch (e) { cb(e); } });
  });
  r.on('error', cb);
  r.end();
}
// The image-field's file is attached with file_name === the field name (u_profile_picture).
function isImage(a) { return /^image\//.test(a.content_type || '') || /profile_picture|photo|avatar/i.test(a.file_name || ''); }

// Find the right attachment (profile image vs resume document) and stream it.
function serveAttachment(sysId, kind, res) {
  listAttachments(sysId, (err, atts) => {
    if (err) { res.writeHead(502, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: String(err) })); }
    let pick;
    if (kind === 'image') pick = atts.find(isImage);
    else pick = atts.find(a => !isImage(a)) || atts.find(a => /pdf|word|document|octet|text/i.test(a.content_type || ''));
    if (!pick) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'No ' + kind + ' attachment on this record.' })); }
    streamFromInstance('/api/now/attachment/' + pick.sys_id + '/file', res);
  });
}

// ---- Server ----
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;

  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    return serveFile(res, 'index.html', 'text/html; charset=utf-8');
  }

  // Profile picture (stored as an attachment on the record)
  if (req.method === 'GET' && p === '/api/image') {
    const sysId = u.searchParams.get('sysId') || '';
    if (!/^[a-f0-9]{32}$/i.test(sysId)) { res.writeHead(400); return res.end('bad sysId'); }
    return serveAttachment(sysId, 'image', res);
  }

  // Resume (stored as an attachment on the record)
  if (req.method === 'GET' && p === '/api/resume') {
    const sysId = u.searchParams.get('sysId') || '';
    if (!/^[a-f0-9]{32}$/i.test(sysId)) { res.writeHead(400); return res.end('bad sysId'); }
    return serveAttachment(sysId, 'resume', res);
  }

  if (p.startsWith('/api/team-profiles')) {
    const sysId = p.replace('/api/team-profiles', '').replace(/^\//, '');
    if (req.method === 'GET') {
      const q = '?sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=1000';
      return proxy(res, 'GET', q, null);
    }
    if (req.method === 'POST') {
      return readBody(req, body => proxy(res, 'POST', '', body));
    }
    if (req.method === 'PATCH' && sysId) {
      return readBody(req, body => proxy(res, 'PATCH', '/' + sysId, body));
    }
    if (req.method === 'DELETE' && sysId) {
      return proxy(res, 'DELETE', '/' + sysId, null);
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('\n  Team Profiles proxy running:  http://localhost:' + PORT);
  console.log('  Proxying  ->  ' + INSTANCE + '/api/now/table/' + TABLE + '\n');
});
