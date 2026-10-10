import {upload} from '@vercel/blob/client';
export async function send(path,file,csrf){return upload(path,file,{access:'private',handleUploadUrl:'/api/upload',contentType:file.type,multipart:file.size>4*1024*1024,headers:{'x-pixely-request':'1','x-pixely-csrf':csrf}});}
