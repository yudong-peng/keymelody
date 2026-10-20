const assert=require('node:assert/strict'),fs=require('node:fs');
const {Library,isSample,nearest}=require('./dist/soundbank');
const manifest=JSON.parse(fs.readFileSync('./dist/audio/manifest.json'));
for(const b of manifest.instruments){assert.equal(b.license,'CC0-1.0');assert(b.samples.length);assert.equal(b.bytes,b.samples.reduce((n,s)=>n+s.bytes,0));for(const s of b.samples){assert.equal(fs.statSync('dist/audio/'+s.url).size,s.bytes);assert.match(s.originalSha256,/^[a-f0-9]{64}$/);}}
assert(isSample('nylon'));assert(!isSample('piano'));assert.equal(nearest([{root:48},{root:60},{root:72}],64).root,60);
let reads=0,fail=false,decoded=0;const fetcher=async url=>{reads++;if(fail)throw Error('offline');return {ok:true,json:async()=>manifest,arrayBuffer:async()=>new ArrayBuffer(8)};};
const starts=[],stops=[],rates=[],levels=[],nodes=new Set();
const context={currentTime:10,destination:{},decodeAudioData:async()=>{decoded++;return {duration:5};},createBufferSource:()=>{const source={playbackRate:{set value(v){rates.push(v);}},connect(){},disconnect(){},start(t){starts.push(t)},stop(t){stops.push(t)}};return source;},createGain:()=>({connect(){},disconnect(){},gain:{setValueAtTime(v,t){levels.push(v)},linearRampToValueAtTime(v,t){levels.push(v)}}})};
(async()=>{
 const l=new Library({fetcher,cache:null}),progress=[];await Promise.all([l.load('piano-kw',context,p=>progress.push(p)),l.load('piano-kw',context)]);assert.equal(decoded,manifest.instruments[0].samples.length);const r=reads;await l.load('piano-kw',context);assert.equal(reads,r);assert(progress.some(p=>p.completed===p.total));
 const bank=l.banks.get('piano-kw'),sample=nearest(bank.samples,60);l.play('piano-kw',60,context,{when:10.2,length:1,volume:0,nodes});assert.equal(starts[0],10.2);assert(Math.abs(stops[0]-11.66)<1e-8);assert(levels.every(v=>v===0));assert.equal(rates[0],2**((60-sample.root+(sample.tune||0)/100)/12));assert.equal(nodes.size,1);[...nodes][0].onended();assert.equal(nodes.size,0);
 await l.load('kalimba',context);await l.load('nylon',context);assert.equal(l.banks.size,2);assert(!l.ready('piano-kw'));assert(l.ready('piano'));
 fail=true;await assert.rejects(l.load('glockenspiel',context));assert(!l.pending.has('glockenspiel'));fail=false;await l.load('glockenspiel',context);assert(l.ready('glockenspiel'));
 console.log('PASS: CC0 sample manifests/assets, deduplicated loading/progress, nearest-root pitch/tuning, scheduled duration, zero volume, voice cleanup, two-bank memory limit, failed-load retry.');
})().catch(e=>{console.error(e);process.exitCode=1});
