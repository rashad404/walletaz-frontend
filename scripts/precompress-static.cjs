const fs=require('node:fs');const path=require('node:path');const zlib=require('node:zlib');
let files=0,sourceBytes=0,brotliBytes=0;
function visit(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
 const file=path.join(directory,entry.name);
 if(entry.isDirectory())visit(file);
 else if(entry.isFile()&&/\.(js|css|json|svg)$/.test(file)){
  const source=fs.readFileSync(file);if(source.length<1024)continue;
  const compressed=zlib.brotliCompressSync(source,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:6}});
  if(compressed.length>=source.length)continue;
  if(!zlib.brotliDecompressSync(compressed).equals(source))throw Error('Static compression verification failed');
  fs.writeFileSync(file+'.br',compressed);files++;sourceBytes+=source.length;brotliBytes+=compressed.length;
 }
}}
visit(path.join(process.cwd(),'.next/static'));
console.log(JSON.stringify({precompressedFiles:files,sourceBytes,brotliBytes}));
