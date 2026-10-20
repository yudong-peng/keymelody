(function(root){
'use strict';
const PRESETS=[
 {id:'piano-kw',name:'立式钢琴',sample:true},{id:'nylon',name:'古典吉他',sample:true},
 {id:'kalimba',name:'卡林巴',sample:true},{id:'harpsichord',name:'羽管键琴',sample:true},
 {id:'xylophone',name:'木琴',sample:true},{id:'glockenspiel',name:'钟琴',sample:true},
 {id:'piano',name:'合成钢琴 · 轻量',sample:false},{id:'guitar',name:'合成吉他 · 轻量',sample:false}
];
const known=id=>PRESETS.some(p=>p.id===id),isSample=id=>PRESETS.some(p=>p.id===id&&p.sample);
function nearest(samples,midi){return samples.reduce((best,s)=>Math.abs(s.root-midi)<Math.abs(best.root-midi)?s:best,samples[0]);}
class Library{
 constructor({fetcher=(...args)=>fetch(...args),cache=typeof caches!=='undefined'?caches:null}={}){this.fetcher=fetcher;this.cache=cache;this.banks=new Map();this.pending=new Map();this.listeners=new Map();this.manifest=null;this.manifestTask=null;}
 async catalog(){if(this.manifest)return this.manifest;if(!this.manifestTask)this.manifestTask=this.fetcher('audio/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('音色清单无法读取');return r.json();}).then(m=>this.manifest=m).catch(e=>{this.manifestTask=null;throw e;});return this.manifestTask;}
 ready(id){return !isSample(id)||this.banks.has(id);}
 async sampleFile(url){let cache=null;try{cache=await this.cache?.open('keymelody-audio-cc0-v1');const cached=await cache?.match(url);if(cached)return cached;}catch(e){}const r=await this.fetcher(url,{cache:'force-cache'});if(!r.ok)throw Error('采样文件加载失败');try{await cache?.put(url,r.clone());}catch(e){}return r;}
 async load(id,context,onProgress=()=>{}){
  if(!isSample(id))return null;
  if(this.banks.has(id)){const bank=this.banks.get(id);this.banks.delete(id);this.banks.set(id,bank);return bank;}
  if(!this.listeners.has(id))this.listeners.set(id,new Set());const listeners=this.listeners.get(id);listeners.add(onProgress);
  if(!this.pending.has(id))this.pending.set(id,(async()=>{const m=await this.catalog(),info=m.instruments.find(i=>i.id===id);if(!info?.samples.length)throw Error('音色包不存在');let completed=0;const samples=new Array(info.samples.length);let next=0;
   const update=()=>{for(const fn of this.listeners.get(id)||[])fn({completed,total:info.samples.length,bytes:info.bytes});};update();
   const worker=async()=>{while(next<info.samples.length){const i=next++,s=info.samples[i],r=await this.sampleFile('audio/'+s.url+'?v='+encodeURIComponent(m.version)),buffer=await context.decodeAudioData(await r.arrayBuffer());samples[i]={...s,buffer};completed++;update();}};
   await Promise.all(Array.from({length:Math.min(4,info.samples.length)},worker));const bank={...info,samples};this.banks.set(id,bank);while(this.banks.size>2)this.banks.delete(this.banks.keys().next().value);return bank;
  })().finally(()=>this.pending.delete(id)));
  try{return await this.pending.get(id);}finally{listeners.delete(onProgress);if(!listeners.size)this.listeners.delete(id);}
 }
 play(id,midi,context,{when=context.currentTime,length=.8,volume=1,nodes=new Set()}={}){
  const bank=this.banks.get(id);if(!bank)return false;const s=nearest(bank.samples,midi),rate=2**((midi-s.root+(s.tune||0)/100)/12),source=context.createBufferSource(),gain=context.createGain(),start=Math.max(context.currentTime,when),duration=Math.min(s.buffer.duration/rate,Math.max(.12,length)+.45),release=Math.min(.4,duration*.35),level=Math.max(0,volume)*bank.gain*.38;
  source.buffer=s.buffer;source.playbackRate.value=rate;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.003);gain.gain.setValueAtTime(level,start+Math.max(.004,duration-release));gain.gain.linearRampToValueAtTime(0,start+duration);source.connect(gain);gain.connect(context.destination);source.start(start);source.stop(start+duration+.01);nodes.add(source);source.onended=()=>{nodes.delete(source);source.disconnect();gain.disconnect();};return true;
 }
}
const api={PRESETS,known,isSample,nearest,Library};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SoundBank=api;
})(typeof window!=='undefined'?window:globalThis);
