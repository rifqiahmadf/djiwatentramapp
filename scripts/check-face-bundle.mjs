import { fileURLToPath } from 'node:url';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { createVendorChunks } from '../packages/config/vendor-chunks.ts';
import { modularTensorflowCore } from '../packages/config/tensorflow-core.ts';
const app=fileURLToPath(new URL('../apps/admin',import.meta.url));
const require=createRequire(app+'/package.json');
const {build}=await import(app+'/node_modules/vite/dist/node/index.js');
const dir=await mkdtemp(join(tmpdir(),'face-bundle-'));let server;
try {
 await writeFile(join(dir,'index.html'), '<html><body>WAIT<script type="module" src="/main.js"></script></body></html>');
 await writeFile(join(dir,'main.js'), `import * as faceapi from 'face-api.js'; import * as tf from '@tensorflow/tfjs-core';
try { await tf.setBackend('cpu'); const a=tf.tensor2d([[1,2],[3,4]]); const b=tf.matMul(a,a); const result=Array.from(await b.data()); a.dispose();b.dispose(); if(JSON.stringify(result)!=='[7,10,15,22]')throw new Error('Wrong tensor result'); if(faceapi.euclideanDistance([0,0],[3,4])!==5)throw new Error('Wrong face distance'); if(faceapi.tf.engine()!==tf.engine())throw new Error('Duplicate TensorFlow engines'); document.body.textContent='PASS: modular TensorFlow, matrix operation, shared face-api engine'; } catch(e){document.body.textContent='FAIL: '+e.stack;}`);
 await build({configFile:false,root:dir,resolve:{alias:{'face-api.js':join(dirname(require.resolve('face-api.js/package.json')),'build/es6/index.js'),'@tensorflow/tfjs-core':modularTensorflowCore(app)}},build:{target:'esnext',outDir:join(dir,'dist'),rollupOptions:{output:{manualChunks:createVendorChunks(),onlyExplicitManualChunks:true}}}});
 server=createServer(async(req,res)=>{try {if(req.url==='/favicon.ico'){res.statusCode=204;res.end();return;}const path=req.url==='/'?'index.html':req.url.slice(1);if(path.includes('..'))throw new Error('path');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/html');res.end(await readFile(join(dir,'dist',path)));}catch{res.statusCode=404;res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BINARY,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const page=await browser.newPage(); const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(['warning','error'].includes(message.type()))errors.push(message.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>document.body.textContent.startsWith('PASS:') || document.body.textContent.startsWith('FAIL:'),null,{timeout:10000}).catch(()=>{});
  const result=await page.locator('body').textContent();
  if(!result.startsWith('PASS:') || errors.length)throw new Error(JSON.stringify({result,errors}));
 }finally{await browser.close();}
 console.log('PASS: browser evaluates split modules, matrix operation, face distance, and shared engine');
}finally{server?.close();await rm(dir,{recursive:true,force:true});}
