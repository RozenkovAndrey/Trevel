import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';

const root = resolve('dist');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.txt':'text/plain', '.xml':'application/xml' };
const port = Number(process.env.PORT || 4173);
createServer((req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
    if (!path.startsWith(root + sep) || !statSync(path).isFile()) throw new Error();
    res.writeHead(200, {'Content-Type':mime[extname(path)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404, {'Content-Type':'text/plain'});
    res.end('Not found');
  }
}).listen(port,'127.0.0.1',()=>process.stdout.write('http://127.0.0.1:'+port+'\n'));
