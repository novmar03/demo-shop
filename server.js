import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root=resolve('.');
http.createServer(async(req,res)=>{
 try {
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=resolve(root,'.'+(path==='/'||path==='/cart' ? '/index.html':path));
 if(!file.startsWith(root+'/')) {res.writeHead(403);return res.end();}
 const data=await readFile(file);
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(process.env.PORT||3000,()=>console.log('Demo Store: http://localhost:3000'));
