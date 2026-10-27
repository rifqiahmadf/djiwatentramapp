import os,subprocess,uuid,time,sys
E=os.environ.copy()
for k in ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']:E.pop(k,None)
def docker(*args):return subprocess.check_output(['docker','--host=unix:///var/run/docker.sock',*args],env=E,stderr=subprocess.STDOUT).decode().strip()
network='djiwa-preflight-'+uuid.uuid4().hex[:10];containers=[]
try:
 docker('network','create',network)
 values={'DATABASE_URL':'postgresql://unit:unit@127.0.0.1:1/unit','BETTER_AUTH_SECRET':'unit-test-only-secret-at-least-thirty-two-characters','AUTH_BASE_URL':'https://api.example','AUTH_TRUSTED_ORIGINS':'https://app.example','CUSTOMER_ALLOWED_ORIGINS':'https://app.example','API_ORIGIN':'https://api.example','CUSTOMER_ORIGIN':'https://app.example','PAY_ORIGIN':'https://pay.example','KOPITASIK_ORIGIN':'https://kopi.example','SUPABASE_URL':'https://database.example'}
 args=['run','-d','--network',network,'--network-alias','api']
 for k,v in values.items():args+=['-e',k+'='+v]
 api=docker(*args,'djiwa-api:preflight');containers.append(api)
 web=None
 if '--api-only' not in sys.argv:
  web=docker('run','-d','--network',network,'djiwa-customer:preflight');containers.append(web)
 for _ in range(20):
  try:
   result=docker('exec',api,'node','-e',"fetch('http://127.0.0.1:3001/api/health').then(async r=>{if(!r.ok)process.exit(1);console.log('ok')}).catch(()=>process.exit(1))")
   if result=='ok':break
  except subprocess.CalledProcessError:time.sleep(.25)
 else:
  print(docker('logs',api)[-1500:]);raise RuntimeError('API did not become healthy')
 assert '"ok":true' in docker('exec',api,'node','-e',"fetch('http://127.0.0.1:3001/v1/health').then(async r=>console.log(await r.text()))")
 if web is not None:
  for _ in range(40):
   try:
    if docker('exec',web,'wget','-Y','off','-qO-','http://127.0.0.1/healthz')=='ok':break
   except subprocess.CalledProcessError:time.sleep(.25)
  else:
   print(docker('logs',web)[-1800:]);raise RuntimeError('Frontend did not become healthy')
  assert '<html' in docker('exec',web,'wget','-Y','off','-qO-','http://127.0.0.1/')
  result=docker('exec',web,'wget','-Y','off','-qO-','http://127.0.0.1/api/health')
  assert '"ok":true' in result
  docker('exec',web,'sh','-c','grep -qlr "api.byrifqi.com" /usr/share/nginx/html/assets')
  docker('exec',api,'sh','-c','test ! -f /app/apps/customer/.env.local')
  print('PASS: API startup, static frontend, API proxy, /v1 alias, byrifqi asset configuration, excluded local env files')
 else:
  print('PASS: API non-root startup and /v1 alias with test fixtures')
 print('Database and OAuth were test fixtures only; no production readiness claim')
finally:
 for cid in reversed(containers):docker('rm','-f',cid)
 docker('network','rm',network)
