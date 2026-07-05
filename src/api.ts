export const API_MODE = import.meta.env.VITE_API_MODE === 'demo' ? 'demo' : 'live'
export const BACKEND_URL=(import.meta.env.VITE_BACKEND_URL as string|undefined)?.replace(/\/$/,'')
function readableAuthCookies(){return document.cookie.split('; ').filter(value=>value.startsWith('sb-cyrxjeppjqsxxjayfrur-auth-token')).join('; ')}
export async function backendRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 if(!BACKEND_URL)throw new Error('Backend distant non configuré.')
 const {supabase}=await import('./auth');const {data}=await supabase.auth.getSession();const token=data.session?.access_token
 if(!token)throw new Error('Session expirée.')
 const response=await fetch(`${BACKEND_URL}${path}`,{...init,headers:{Accept:'application/json',Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-WM-Cookie':readableAuthCookies(),...init.headers}})
 if(!response.ok)throw new Error(`Backend ${response.status}`)
 return response.status===204?undefined as T:response.json() as Promise<T>
}
export async function apiRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 if(API_MODE!=='live') throw new Error('Le mode API live est désactivé.')
 if(BACKEND_URL)return backendRequest<T>(`/proxy${path}`,init)
 const response=await fetch(`${import.meta.env.VITE_API_BASE??'/wm-api'}${path}`,{...init,credentials:'include',headers:{Accept:'application/json',...(init.body?{'Content-Type':'application/json'}:{}),...init.headers}})
 if(!response.ok) throw new Error(`API ${response.status}`)
 return response.status===204?undefined as T:response.json() as Promise<T>
}
export const apiGet=<T>(path:string)=>apiRequest<T>(path)
