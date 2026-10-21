const assert=require('node:assert/strict'),R=require('./dist/recents');
const songs=Array.from({length:8},(_,i)=>({id:'s'+i})),history=R.read(null);
for(const s of songs)R.touch(history,s.id,100);assert.deepEqual(R.list(songs,history).map(s=>s.id),['s7','s6','s5','s4','s3']);
R.touch(history,'s1',100);assert.deepEqual(R.list(songs,history).map(s=>s.id),['s1','s7','s6','s5','s4']);assert.equal(Object.keys(history).length,8);
assert.deepEqual(R.read(JSON.stringify(history)),history);delete history.s1;assert.equal(R.list(songs.filter(s=>s.id!=='s1'),history)[0].id,'s7');
assert.deepEqual(R.read('{broken'),{});assert.deepEqual(R.read('[1,2]'),{});assert.deepEqual(R.read('{"bad":"2","valid":3,"negative":-1}'),{valid:3});
console.log('PASS: persistent recency, newest-first five, deduplication, tied clocks, deletion backfill and malformed storage.');
