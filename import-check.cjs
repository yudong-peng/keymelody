const assert=require('node:assert/strict'),I=require('./dist/importers');
for(const [id,f]of Object.entries(I.FORMATS)){if(['xml','midi','skyhtml'].includes(id))continue;assert.deepEqual(I.parse(f.example,id).errors,[],id+' example');}
const parse=(s,f,o)=>{const p=I.parse(s,f,o);assert.deepEqual(p.errors,[],s);return p;};
assert.deepEqual(parse('QW[AS]E','flow').events.map(e=>e.keys),[['Q'],['W'],['A','S'],['E']]);
assert.deepEqual(parse('Q-W','flow').events.map(e=>e.keys),[['Q'],[],['W']]);
assert.deepEqual(parse("+1 -1 1' 1,",'numbers').events.map(e=>e.keys),[['Q'],['Z'],['Q'],['Z']]);
assert.deepEqual(parse('C3 C4 B5','notes').events.map(e=>e.keys),[['Z'],['A'],['U']]);
assert(I.parse('C#4','notes').errors.length);assert.deepEqual(parse('C#4','notes',{policy:'nearest'}).events[0].keys,['A']);
assert(I.parse('C7','notes').errors.length);assert.deepEqual(parse('C7','notes',{octave:'fold'}).events[0].keys,['Q']);
assert(parse('C4 C#4 E4','notes',{policy:'drop'}).warnings.length);assert(I.parse('Q[AS','flow').errors.length);
assert(I.parse('[{"time":-1,"key":"A"}]','json').errors.length);assert(I.parse('{"isEncrypted":true,"songNotes":[]}','json').errors.length);
const timed=parse(JSON.stringify({notes:[{time:1000,key:'A',duration:1000},{time:1000,key:'G',duration:250},{time:1500,key:'S',duration:500}]}),'json',{bpm:120});
assert.equal(timed.events[0].keys.length,0);assert.equal(timed.events[1].beat,2);assert.deepEqual(timed.events[1].keys,['A','G']);assert.equal(timed.events[1].noteLengths.G,.5);assert.equal(timed.totalBeats,4);
const back=parse(JSON.stringify({schema:'keymelody/v2',events:timed.events}),'json',{bpm:120});assert.deepEqual(back.events.map(e=>e.beat),timed.events.map(e=>e.beat));assert.equal(back.events[1].noteLengths.G,.5);
assert.equal(parse('time\tkey\tduration\n250\tA+G\t500','csv',{bpm:120}).events[1].beat,.5);
assert.deepEqual(parse('{"songNotes":[{"time":0,"key":"1Key0"},{"time":500,"key":"2Key20"}]}','json',{skySize:21}).events[1].keys,['U']);
assert(I.parse('{"songNotes":[{"time":0,"key":"1Key20"}]}','json',{skySize:15}).errors.length);
assert.equal(parse('{"notes":[{"time":0,"midi":60,"track":0},{"time":500,"midi":64,"track":1}]}','json',{track:'1'}).events.filter(e=>e.keys.length).length,1);
function smf(events){const head=[77,84,104,100,0,0,0,6,0,0,0,1,1,224],n=events.length;return Uint8Array.from([...head,77,84,114,107,(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255,...events]).buffer;}
// C4 on at 0; off at 480 ticks; tempo slows to 1sec/quarter; E4 on at 960 ticks.
const file=smf([0,0x90,60,100,0x83,0x60,0x80,60,0,0,255,81,3,15,66,64,0x83,0x60,0x90,64,100,0x83,0x60,0x80,64,0,0,255,47,0]);
const m=I.midi(file);assert.equal(m.notes.length,2);assert.equal(m.notes[0].duration,500);assert.equal(m.notes[1].time,1500);assert.equal(m.notes[1].duration,1000);
const running=I.midi(smf([0,0x90,60,100,0x83,0x60,60,0,0,255,47,0]));assert.equal(running.notes[0].duration,500);
const sysex=I.midi(smf([0,240,2,1,247,0,0x90,60,100,0x83,0x60,0x80,60,0,0,255,47,0]));assert.equal(sysex.notes.length,1);
assert.throws(()=>I.midi(file.slice(0,25)));console.log('PASS: all text examples, chords, exact timestamp import/export, pitch policies, source mapping, track filtering, MIDI tempo map, running status, SysEx, truncation.');

assert.equal(parse('Q:1 W','letters').completeTiming,false);assert.equal(parse('Q:1 W:2','letters').completeTiming,true);assert.equal(parse('1:1 2','numbers').completeTiming,false);console.log('PASS: partial text timing is explicitly marked assumed.');
// Optional cleaning preserves note syntax, structural errors and explicit timestamps.
const loose={ignoreUnknown:true};
for(const [type,text] of [['letters','Q 说明 W / E'],['flow','QWE / 作者【副歌1】 (AS)'],['numbers','1 注释 2 / 3'],['indices','1 注释 8 / 15'],['notes','C4 说明 D4 / E4'],['solfege','do 提示 re / mi'],['skyabc','A1 备注 A2 / B1']]){assert(I.parse(text,type).errors.length,type+' remains strict');const r=parse(text,type,loose);assert(r.warnings.some(w=>w.includes('已忽略')),type+' reports cleaning');}
assert.deepEqual(parse('Q说明W','letters',loose).events.map(e=>e.keys),[['Q'],['W']]);
assert.deepEqual(parse('Q // SAD is a comment\nW 【D1副歌】 E','flow',loose).events.map(e=>e.keys),[['Q'],['W'],['E']]);
assert.deepEqual(parse('Q intro W','flow',loose).events.map(e=>e.keys),[['Q'],['W']]);
assert.deepEqual(parse('1 8 2','numbers',loose).events.map(e=>e.keys),[['A'],['S']]);
assert.deepEqual(parse('C#4 说明 D4','notes',{...loose,policy:'nearest'}).events.map(e=>e.keys),[['A'],['S']]);
assert.deepEqual(parse('说明\n1 2 3','auto',loose).detected,'numbers');
assert(I.parse('Q:fast W','flow',loose).errors.length);assert(I.parse('(AS','flow',loose).errors.length);assert(I.parse('C7 备注','notes',loose).errors.length);
assert(I.parse('{broken JSON}','json',loose).errors.length);assert(I.parse('{"isEncrypted":true,"songNotes":[]}','json',loose).errors.length);
const cleanJSON=parse('{"notes":[{"time":0,"key":"A注释G"},{"time":500,"key":"提示"},{"time":1000,"key":"S"}]}','json',{...loose,bpm:120});assert.deepEqual(cleanJSON.events[0].keys,['A','G']);assert.equal(cleanJSON.events[1].beat,1);assert.equal(cleanJSON.events[1].keys.length,0);assert.equal(cleanJSON.events[2].beat,2);
const sample='(NE) C /D S /H D /G S /D N /C S /\n(BW) X /S A /G A /S   /   /  SDG/';const user=parse(sample,'flow',loose);assert.deepEqual(user.events[0].keys,['N','E']);assert(user.warnings.some(w=>w.includes('未推断分拍')));assert.equal(I.parse(sample,'flow').errors.length>0,true);
console.log('PASS: optional unknown-character cleaning across seven text types, comments, exact JSON timing, strict mode, malformed syntax, pitch rejection, user slash sample.');
