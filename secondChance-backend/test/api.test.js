const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
process.env.JWT_SECRET=crypto.randomBytes(32).toString('hex');
process.env.MONGO_DB='secondchance_test_'+Date.now();
const app=require('../app');
const {loadData}=require('../util/import-mongo');
const {closeDatabase}=require('../models/db');
test('MongoDB import and item/auth/search API integration',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function call(path,method='GET',body,token){
  const r=await fetch(base+'/api/secondchance'+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};
 }
 try{
  assert.equal(await loadData(),16);
  assert.equal((await call('/items')).data.length,16);
  assert.equal((await call('/items/875')).data.name,'Lamp');
  assert.equal((await call('/items/missing')).status,404);
  const found=await call('/search?category=Kitchen');assert.ok(found.data.length);assert.ok(found.data.every(i=>i.category==='Kitchen'));
  assert.equal((await call('/search?age_years=invalid')).status,400);
  assert.equal((await call('/search?name=%5B')).status,200);
  const user={email:'test@example.com',password:crypto.randomBytes(16).toString('hex'),firstName:'Test',lastName:'User'};
  assert.equal((await call('/auth/register','POST',user)).status,201);
  assert.equal((await call('/auth/register','POST',user)).status,409);
  assert.equal((await call('/auth/login','POST',{email:user.email,password:'wrong'})).status,401);
  const login=await call('/auth/login','POST',user);assert.equal(login.status,200);const token=login.data.token;
  assert.equal((await call('/auth/update','PUT',{firstName:'Updated'},token)).data.user.firstName,'Updated');
  assert.equal((await call('/auth/update','PUT',{firstName:'Unauthorized'})).status,401);
  assert.equal((await call('/items','POST',{name:'chair',category:'Office',condition:'Good'})).status,401);
  const form=new FormData();form.set('name','Test chair');form.set('category','Office');form.set('condition','Good');
  form.set('file',new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:'image/png'}),'test.png');
  const upload=await fetch(base+'/api/secondchance/items',{method:'POST',headers:{Authorization:'Bearer '+token},body:form});assert.equal(upload.status,201);const item=await upload.json();assert.ok(item.image.startsWith('/uploads/'));
  assert.equal((await call('/items/'+item.id)).data.name,'Test chair');
  const other={email:'other@example.com',password:crypto.randomBytes(16).toString('hex')};await call('/auth/register','POST',other);const otherToken=(await call('/auth/login','POST',other)).data.token;
  assert.equal((await call('/items/'+item.id,'DELETE',null,otherToken)).status,403);
  assert.equal((await call('/items/'+item.id,'PUT',{name:'Updated chair'},token)).data.name,'Updated chair');
  assert.equal((await call('/items/'+item.id,'DELETE',null,token)).status,200);
  assert.equal((await call('/items/'+item.id)).status,404);
  assert.equal((await call('/items')).data.length,16);
 }finally{await new Promise(r=>server.close(r));await closeDatabase();}
});
