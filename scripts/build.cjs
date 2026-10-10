'use strict';
const esbuild=require('esbuild');const fs=require('node:fs');
fs.mkdirSync('assets/runtime',{recursive:true});
esbuild.buildSync({entryPoints:['scripts/blob-client.mjs'],bundle:true,format:'iife',globalName:'PixelyUpload',outfile:'assets/runtime/blob-client.js',minify:true,target:['chrome100'],legalComments:'eof'});

fs.rmSync('public',{recursive:true,force:true});fs.mkdirSync('public',{recursive:true});for(const file of fs.readdirSync('.'))if(/\.(html|css|js)$/.test(file))fs.copyFileSync(file,'public/'+file);fs.cpSync('assets','public/assets',{recursive:true});
