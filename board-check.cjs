const assert=require('node:assert/strict'),I=require('./dist/importers'),B=require('./dist/boards');
const parse=(text,format,b)=>{const p=I.parse(text,format,B.notation(b));assert.deepEqual(p.errors,[],text);return p;};
const same=(p,b)=>B.convert(p,b,b);
assert.equal(B.standard.rows.join('').length,21);assert.equal(B.sky.rows.join('').length,15);assert.equal(B.guitar.actions.Q.type,'chord');assert.deepEqual(B.guitar.actions.Q.pitches,[60,64,67]);
assert.deepEqual(same(parse('Q:1 [QA]:1','letters',B.guitar),B.guitar).events.map(e=>e.keys),[['Q'],['Q','A']]);
const sky=parse('A1 B1 C5','skyabc',B.sky);assert.deepEqual(sky.events.map(e=>e.keys),[['Q'],['A'],['B']]);assert.deepEqual(B.sky.actions.B.pitches,[84]);
assert.deepEqual(parse('C6','notes',B.sky).events[0].keys,['B']);assert(I.parse('C6','notes',B.notation(B.standard)).errors.length);
const std=parse('A D G','letters',B.standard),target=B.convert(std,B.standard,B.sky);assert.deepEqual(target.errors,[]);assert.deepEqual(target.events.map(e=>e.keys),[['Q'],['E'],['T']]);
const chord=B.convert(parse('Q:2','letters',B.guitar),B.guitar,B.standard);assert.deepEqual(chord.events[0].keys,['A','D','G']);assert.equal(chord.events[0].beat,0);assert.equal(chord.events[0].duration,2);
const exact=B.convert(parse('[ADG]','letters',B.standard),B.standard,B.guitar,{matchChords:true});assert.deepEqual(exact.events[0].keys,['Q']);
const plain=B.convert(parse('[ADG]','letters',B.standard),B.standard,B.guitar);assert.deepEqual(plain.events[0].keys,['A','D','G']);
assert(B.convert(parse('Q','letters',B.standard),B.standard,B.guitar).errors.length);assert.deepEqual(B.convert(parse('Q','letters',B.standard),B.standard,B.guitar,{fold:true}).errors,[]);
const rows=['QWER','ASDF','ZXCV','IOPL'],custom=B.validate({id:'custom-test',name:'4行',rows,actions:B.generate(rows,60)});assert.deepEqual(parse('I O [PL]','letters',custom).events.map(e=>e.keys),[['I'],['O'],['P','L']]);
assert(I.parse('Y','letters',B.notation(B.sky)).errors.length);assert.throws(()=>B.validate({rows:['AA'],actions:B.generate(['AA'])}));assert.throws(()=>B.validate({rows:['A'],actions:{A:{pitches:[200]}}}));
const customChord=B.validate({rows:['A'],actions:{A:{pitches:[60,64,67]}}});assert(I.parse('C4','notes',B.notation(customChord)).errors.length);
const snapshot=JSON.parse(JSON.stringify(custom));custom.actions.I.pitches=[30];assert.notDeepEqual(custom.actions.I.pitches,snapshot.actions.I.pitches);
console.log('PASS: board validation, 15-key positions/C6, extra letter keys, chord-as-one-action, exact cross-board conversion, explicit chord matching, octave folding, immutable snapshots.');

assert.equal(parse('1', 'numbers', B.sky).events[0].label,'1');
assert.equal(B.validate({...B.guitar,strumMs:0}).strumMs,0);
const varied=parse('[ADG]','letters',B.standard);varied.events[0].noteLengths={A:1,D:2,G:1};assert.deepEqual(B.convert(varied,B.standard,B.guitar,{matchChords:true}).events[0].keys,['A','D','G']);

for(const k of 'ASDFGHJZXCVBNM')assert.deepEqual(B.guitar.actions[k],B.standard.actions[k]);assert.deepEqual([...B.guitar.rows[0]].map(k=>B.guitar.actions[k].label),['C','Dm','Em','F','G','Am','G7']);
// v0.7: extended position vocabulary, chromatic pitches and notation survive JSON roundtrips.
for(const [b,size] of [[B.natural14,14],[B.natural22,22],[B.chromatic36,36],[B.chromatic37,37],[B.digits21,21],[B.low21,21]]){
 assert.equal(b.rows.join('').length,size);assert.equal(new Set(b.rows.join('')).size,size);
 const p=parse([...b.rows.join('')].map(k=>k+':0.5').join(' '),'letters',b);assert.equal(p.events.length,size);
 const restored=parse(JSON.stringify({events:p.events}),'json',B.validate(JSON.parse(JSON.stringify(b))));assert.deepEqual(restored.events.map(e=>e.keys),p.events.map(e=>e.keys));
}
assert.deepEqual(Object.values(B.chromatic37.actions).flatMap(a=>a.pitches).sort((a,b)=>a-b),Array.from({length:37},(_,i)=>48+i));
assert.deepEqual(parse('C#3 F#4 C6','notes',B.chromatic37).events.map(e=>e.keys),[['W'],['L'],['=']]);
assert(I.parse('C6','notes',B.notation(B.chromatic36)).errors.length);
assert.deepEqual(parse('0 = [N0=] _:1','letters',B.chromatic37).events.map(e=>e.keys),[['0'],['='],['N','0','='],[]]);
assert.deepEqual(I.parse('0 = 【注释】','letters',{...B.notation(B.chromatic37),ignoreUnknown:true}).events.map(e=>e.keys),[['0'],['=']]);
assert.deepEqual(parse('1 Q A','letters',B.digits21).events.map(e=>e.keys.map(k=>B.digits21.actions[k].pitches[0])),[[72],[60],[48]]);
assert.equal(parse('1','numbers',B.digits21).events[0].keys[0],'Q');
assert(B.convert(parse('C#3','notes',B.chromatic37),B.chromatic37,B.standard).errors.length);
assert.deepEqual(B.convert(parse('C4','notes',B.chromatic37),B.chromatic37,B.standard).events[0].keys,['A']);
assert.throws(()=>B.validate({rows:['ABCDEFGHIJKLMN'],actions:B.generate(['ABCDEFGHIJKLMN'])}));
console.log('PASS: 14/22/36/37-key and alternate 21 layouts, every position roundtrip, zero/= notes, strict semitones and explicit numeric notation.');
