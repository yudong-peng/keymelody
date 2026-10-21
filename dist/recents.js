(function(root){
'use strict';
function read(text){try{const o=JSON.parse(text||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?Object.fromEntries(Object.entries(o).filter(([id,t])=>id&&Number.isFinite(t)&&t>0)):{};}catch(e){return {};}}
function touch(history,id,time=Date.now()){history[id]=Math.max(time,0,...Object.values(history))+1;return history;}
function list(songs,history,limit=5){return songs.filter(s=>Object.hasOwn(history,s.id)).sort((a,b)=>history[b.id]-history[a.id]).slice(0,limit);}
const api={read,touch,list};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Recents=api;
})(typeof window!=='undefined'?window:globalThis);
