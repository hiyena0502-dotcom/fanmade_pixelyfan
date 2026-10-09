'use strict';
const esbuild=require('esbuild');const fs=require('node:fs');
fs.mkdirSync('assets/runtime',{recursive:true});
esbuild.buildSync({entryPoints:['scripts/blob-client.mjs'],bundle:true,format:'iife',globalName:'PixelyUpload',outfile:'assets/runtime/blob-client.js',minify:true,target:['chrome100'],legalComments:'eof'});
