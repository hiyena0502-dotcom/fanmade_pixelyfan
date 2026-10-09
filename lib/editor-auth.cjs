'use strict';
const {randomBytes,createHmac,scryptSync,timingSafeEqual}=require('node:crypto');
const COOKIE='__Host-pixely_editor';
const key=()=>process.env.PIXELY_EDITOR_SESSION_KEY||'';
const safe=(a,b)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function checkCode(code){const [salt,hash]=(process.env.PIXELY_EDITOR_CODE_HASH||'').split(':');if(!salt||!hash||typeof code!=='string'||code.length>200)return false;return safe(scryptSync(code,salt,32).toString('hex'),hash);}
function sign(value){return createHmac('sha256',key()).update(value).digest('base64url');}
function session(req){if(key().length<32)return null;const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));if(!cookie)return null;const raw=cookie.slice(COOKIE.length+1),[exp,csrf,signature,...extra]=raw.split('.');if(extra.length||!signature||!safe(sign(exp+'.'+csrf),signature)||Number(exp)<=Date.now())return null;return {expires:Number(exp),csrf};}
function issue(res){const exp=Date.now()+8*3600000,csrf=randomBytes(24).toString('base64url'),value=exp+'.'+csrf;res.setHeader('Set-Cookie',`${COOKIE}=${value}.${sign(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`);return {authenticated:true,csrf,expires:exp};}
function logout(res){res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);}
function sameOrigin(req){try{return new URL(req.headers.origin).host===req.headers.host&&req.headers['x-pixely-request']==='1';}catch{return false;}}
function authorize(req,mutation=false){const s=session(req);if(!s)throw Object.assign(new Error('개발자 로그인이 필요해요'),{status:401});if(mutation&&(!sameOrigin(req)||req.headers['x-pixely-csrf']!==s.csrf))throw Object.assign(new Error('요청을 다시 확인해 주세요'),{status:403});return s;}
module.exports={COOKIE,checkCode,session,issue,logout,sameOrigin,authorize};
