const assert=require('node:assert/strict'),R=require('./dist/rhythm');
for(const [level,w] of Object.entries(R.WINDOWS)){
 for(const sign of [-1,1]){assert.equal(R.grade(sign*w.perfect,level),'Perfect');assert.equal(R.grade(sign*(w.perfect+.001),level),'Good');assert.equal(R.grade(sign*w.good,level),'Good');assert.equal(R.grade(sign*(w.good+.001),level),'Bad');assert.equal(R.grade(sign*w.bad,level),'Bad');assert.equal(R.grade(sign*(w.bad+.001),level),'Lost');}
}
assert.equal(R.worst(['Perfect','Good','Bad']),'Bad');assert.equal(R.accuracy({Perfect:1,Good:1,Bad:1,Lost:1}),50);assert.equal(R.accuracy({Perfect:1},1),50);assert.equal(R.accuracy({}),null);
assert.deepEqual(R.estimate([60,65,55,64]),{ok:true,offset:62,spread:10});assert.equal(R.estimate([-90,-80,-70,-75]).offset,-77);assert.equal(R.estimate([0,0,80,80]).ok,true);for(const samples of [[0,0,0,81],[null,60,60,60],[NaN,0,0,0],[301,300,300,300],[0,0,0]])assert.equal(R.estimate(samples).ok,false);
console.log('PASS: symmetric timing boundaries, worst-chord grade, weighted accuracy, four-tap median, instability and missing/out-of-range samples.');
