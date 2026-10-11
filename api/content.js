'use strict';
const C=require('../lib/content.cjs'),A=require('../lib/editor-auth.cjs');
module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');try{
 const action=req.query.action||'published';
 if(action==='session'&&req.method==='GET'){const s=A.session(req);return res.status(200).json({authenticated:!!s,csrf:s?.csrf,configured:!!process.env.PIXELY_EDITOR_CODE_HASH,scope:C.prefix()});}
 if(action==='login'&&req.method==='POST'){if(!A.sameOrigin(req))throw C.fail('같은 사이트에서 로그인해 주세요',403);await C.rateLimit(req);if(!A.checkCode(req.body?.code))throw C.fail('개발자 로그인 코드를 확인해 주세요',401);return res.status(200).json(A.issue(res));}
 if(action==='logout'&&req.method==='POST'){A.authorize(req,true);A.logout(res);return res.status(200).json({authenticated:false});}
 if(action==='published'&&req.method==='GET')return res.status(200).json((await C.read('published')).value);
 if(action==='draft'&&req.method==='GET'){A.authorize(req);return res.status(200).json((await C.read('draft')).value);}
 if(action==='save'&&req.method==='POST'){A.authorize(req,true);return res.status(200).json(await C.save(req.body.content,req.body.baseRevision));}
 if(action==='publish'&&req.method==='POST'){A.authorize(req,true);return res.status(200).json(await C.publish(req.body.baseRevision,req.body.publishedRevision));}
 throw C.fail('사용할 수 없는 요청이에요',405);
}catch(e){const status=e.status||503;res.status(status).json({error:status===503?'서버에 저장하지 못했어요 · 내용은 그대로 유지돼요':e.message});}};
