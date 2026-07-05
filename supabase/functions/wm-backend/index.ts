import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':Deno.env.get('ALLOWED_ORIGIN')??'*',
  'Access-Control-Allow-Headers':'authorization, content-type, x-wm-cookie',
  'Access-Control-Allow-Methods':'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Content-Type':'application/json',
}
const wikiUrl='https://cyrxjeppjqsxxjayfrur.supabase.co'
const wikiAnon=Deno.env.get('WIKIMASTERS_ANON_KEY')!
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders})

Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders})
 const authorization=request.headers.get('authorization')
 if(!authorization?.startsWith('Bearer '))return json({error:'Unauthorized'},401)
 const userResponse=await fetch(`${wikiUrl}/auth/v1/user`,{headers:{apikey:wikiAnon,authorization}})
 if(!userResponse.ok)return json({error:'Invalid WikiMasters session'},401)
 const user=await userResponse.json() as {id:string}
 const url=new URL(request.url);const route=url.pathname.replace(/^.*\/wm-backend/,'')||'/'

 if(route.startsWith('/proxy/')){
   const cookie=request.headers.get('x-wm-cookie')
   if(!cookie)return json({error:'Missing session cookie'},401)
   const upstreamPath=route.slice('/proxy'.length)
   const canWrite=(request.method==='POST'&&upstreamPath==='/trades')||(request.method==='PATCH'&&/^\/trades\/[^/]+$/.test(upstreamPath))
   if(request.method!=='GET'&&!canWrite)return json({error:'Proxy mutation not allowed'},405)
   const target=`https://www.wiki-masters.com/api${route.slice('/proxy'.length)}${url.search}`
   const body=request.method==='GET'?undefined:await request.text()
   const upstream=await fetch(target,{method:request.method,body,headers:{Accept:'application/json','Content-Type':'application/json',Cookie:cookie,'x-wiki-calendar-tz':'Europe/Paris'}})
   return new Response(upstream.body,{status:upstream.status,headers:{...corsHeaders,'Cache-Control':'private, max-age=20'}})
 }

 if(route==='/wishlists'&&request.method==='GET'){
   const {data,error}=await db.from('wishlists').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false})
   if(error)return json({error:error.message},500)
   return json((data??[]).map(row=>({id:row.list_id,ownerId:row.owner_id,name:row.name,cardIds:row.card_ids,createdAt:new Date(row.created_at).getTime(),updatedAt:new Date(row.updated_at).getTime()})))
 }
 if(route==='/wishlists'&&request.method==='PUT'){
   const body=await request.json() as {id:string;name:string;cardIds:string[];createdAt:number;updatedAt:number}
   if(!body.id||!body.name||!Array.isArray(body.cardIds))return json({error:'Invalid wishlist'},400)
   const {error}=await db.from('wishlists').upsert({owner_id:user.id,list_id:body.id,name:body.name.slice(0,80),card_ids:[...new Set(body.cardIds)],created_at:new Date(body.createdAt||Date.now()).toISOString(),updated_at:new Date().toISOString()},{onConflict:'owner_id,list_id'})
   return error?json({error:error.message},500):json({ok:true})
 }
 const match=route.match(/^\/wishlists\/([^/]+)$/)
 if(match&&request.method==='DELETE'){
   const {error}=await db.from('wishlists').delete().eq('owner_id',user.id).eq('list_id',decodeURIComponent(match[1]))
   return error?json({error:error.message},500):new Response(null,{status:204,headers:corsHeaders})
 }
 return json({error:'Not found'},404)
})
