(function(root){
'use strict';
const DIATONIC=[0,2,4,5,7,9,11];
const noteName=n=>['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][n%12]+(Math.floor(n/12)-1);
function pitch(s){if(/^\d+$/.test(String(s)))return Number(s);const m=String(s).match(/^([A-Ga-g])([#b♯♭]?)(-?\d)$/);if(!m)throw Error('音高请填写C4、F#4或MIDI编号：'+s);return (Number(m[3])+1)*12+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()]+(['#','♯'].includes(m[2])?1:['b','♭'].includes(m[2])?-1:0);}
function validate(b){if(!b||!Array.isArray(b.rows)||b.rows.length<1||b.rows.length>4)throw Error('琴盘需要1—4行');const rows=b.rows.map(r=>String(r).toUpperCase());if(rows.some(r=>!/^[A-Z0-9=]{1,13}$/.test(r)))throw Error('每行需要1—13个位置字符（A—Z、0—9、=）');const keys=rows.join('');if(keys.length>37||new Set(keys).size!==keys.length)throw Error('最多37个不重复的位置字符');const actions={};for(const k of keys){const a=b.actions?.[k];if(!a||!Array.isArray(a.pitches)||!a.pitches.length||a.pitches.length>8||a.pitches.some(p=>!Number.isInteger(p)||p<0||p>127))throw Error(k+'需设置1—8个有效音高（0—127）');actions[k]={label:String(a.label||a.pitches.map(noteName).join('+')).slice(0,24),type:a.pitches.length>1?'chord':'note',pitches:[...new Set(a.pitches)]};}return {id:String(b.id||'custom').slice(0,80),name:String(b.name||'自定义琴盘').slice(0,60),rows,rowNames:rows.map((_,i)=>String(b.rowNames?.[i]||'第'+(i+1)+'行').slice(0,16)),actions,usage:String(b.usage||'').slice(0,300),examples:String(b.examples||'').slice(0,400),warning:String(b.warning||'').slice(0,300),strumMs:Math.max(0,Math.min(100,(Number.isFinite(Number(b.strumMs))?Number(b.strumMs):28)))};}
const actions21={};['QWERTYU','ASDFGHJ','ZXCVBNM'].forEach((r,ri)=>[...r].forEach((k,i)=>actions21[k]={pitches:[(ri===0?72:ri===1?60:48)+DIATONIC[i]]}));
const standard=validate({id:'standard21',name:'标准21键 · 单音',rows:['QWERTYU','ASDFGHJ','ZXCVBNM'],rowNames:['高音','中音','低音'],actions:actions21});
const actions15={};[...'QWERTASDFGZXCVB'].forEach((k,i)=>actions15[k]={pitches:[60+Math.floor(i/7)*12+DIATONIC[i%7]],label:'ABC'[Math.floor(i/5)]+(i%5+1)});
const sky=validate({id:'sky15',name:'15键 · Sky位置琴盘',rows:['QWERT','ASDFG','ZXCVB'],rowNames:['A行','B行','C行'],actions:actions15,warning:'固定C调参考音高，实际游戏调性可能随场景变化；电脑按键为本软件默认映射，可修改。'});
const guitarActions=JSON.parse(JSON.stringify(actions21));const chords=[['C',[60,64,67]],['Dm',[62,65,69]],['Em',[64,67,71]],['F',[60,65,69]],['G',[62,67,71]],['Am',[60,64,69]],['G7',[59,62,65,67]]];[...'QWERTYU'].forEach((k,i)=>guitarActions[k]={label:chords[i][0],pitches:chords[i][1]});
const guitar=validate({id:'guitar21',name:'21键吉他 · 模拟和弦',rows:standard.rows,rowNames:['和弦扫弦','中音单音','低音单音'],actions:guitarActions,warning:'模拟预设：第一行Q—U为C、Dm、Em、F、G、Am、G7，尚未实测对应具体游戏；可在自定义编辑器调整。扫弦效果为逐音模拟。'});
const natural14=validate({id:'natural14',name:'14键 · 两排自然音',rows:['QWERTYU','ASDFGHJ'],rowNames:['低音','高音'],actions:generate(['QWERTYU','ASDFGHJ'],60)});
const natural22=validate({id:'natural22',name:'22键 · 扩展自然音',rows:['QWERTYU','ASDFGHJ','ZXCVBNM='],rowNames:['低音','中音','高音'],actions:generate(['QWERTYU','ASDFGHJ','ZXCVBNM='],48)});
const numericRows=['1234567','QWERTYU','ASDFGHJ'],numericActions={};numericRows.forEach((r,ri)=>[...r].forEach((k,i)=>numericActions[k]=actions21[standard.rows[ri][i]]));
const digits21=validate({id:'digits21',name:'21键 · 数字键起始',rows:numericRows,rowNames:standard.rowNames,actions:numericActions});
const low21=validate({...standard,id:'low21',name:'21键 · 低音在上',rows:[...standard.rows].reverse(),rowNames:['低音','中音','高音']});
function chromatic(size){const rows=['QWERTYUIOPAS','DFGHJKLZXCVB','NM1234567890'+(size===37?'=':'')],actions={};[...rows.join('')].forEach((k,i)=>actions[k]={pitches:[48+i]});return validate({id:'chromatic'+size,name:size+'键 · 通用半音',rows,rowNames:['C3—B3','C4—B4',size===37?'C5—C6':'C5—B5'],actions});}
const chromatic36=chromatic(36),chromatic37=chromatic(37);
const PRESETS=[standard,digits21,low21,guitar,natural14,sky,natural22,chromatic36,chromatic37];
const descriptions={
 standard21:['三排七键，适合游戏字母谱练习 · 例：原神','C3—B5，自然音。游戏名称仅作社区适配参考，请核对游戏音域与实际键位。'],
 digits21:['保留21键音高，数字键起始排列 · 例：原神21键谱的自定义键位练习','高音1234567、中音QWERTYU、低音ASDFGHJ。选此来源时，字母／位置谱中的数字表示按键；数字简谱仍表示音阶。'],
 low21:['保留21键音高，低音行显示在上 · 例：原神21键谱的自定义排列练习','位置字母和音高不变，只反转显示行顺序；Z—M仍为低音。'],
 guitar21:['扫弦与单音配合 · 例：MuseScore编写的吉他和弦练习谱','第一行C、Dm、Em、F、G、Am、G7，其余为单音。MuseScore是制谱软件，谱子需适配此模拟琴盘。'],
 natural14:['两排七键，适合较窄音域旋律 · 例：原神、无限暖暖的部分乐器社区方案','通用C4—B5自然音布局；仅作适配参考，不代表游戏中所有乐器均为此音域或排列。'],
 sky15:['三排五键，适合位置谱练习 · 例：光遇','A1—C5位置谱；固定C4—C6参考音高，实际游戏调性可能变化。'],
 natural22:['21个自然音加高音主音 · 例：心动小镇钢琴社区方案','通用C3—C6自然音布局。社区方案供参考，请核对实际游戏音域和键位。'],
 chromatic36:['三个八度，包含升降音 · 例：燕云十六声、逆水寒社区方案','通用C3—B5，逐半音排列；不是已经实测的游戏原生键位。也可导入MuseScore导出的MIDI／MusicXML练习。'],
 chromatic37:['三个八度加高音主音，包含升降音 · 例：心动小镇37键钢琴社区方案','通用C3—C6，逐半音排列；请按实际应用修改键位与音高。MuseScore、FL Studio导出的MIDI可作为谱源。']
};
for(const b of PRESETS){[b.usage,b.examples]=descriptions[b.id];}
function notation(b){const singles=Object.entries(b.actions).filter(([,a])=>a.type==='note').map(([key,a])=>({key,pitch:a.pitches[0]})).sort((a,b)=>a.pitch-b.pitch);return {notationRows:b.rows,notationKeys:b.rows.join(''),actionOrder:b.id==='standard21'?'ZXCVBNMASDFGHJQWERTYU':b.rows.join(''),pitchKeys:singles.map(n=>n.key),pitchValues:singles.map(n=>n.pitch)};}
function convert(parsed,source,target,opts={}){if(parsed.errors.length)return parsed;const warnings=[...(parsed.warnings||[])],errors=[];const warn=s=>{if(!warnings.includes(s))warnings.push(s);};if(source.warning)warn(source.warning);if(target.warning&&target.id!==source.id)warn(target.warning);const same=JSON.stringify(source.actions)===JSON.stringify(target.actions)&&JSON.stringify(source.rows)===JSON.stringify(target.rows);let changed=0;
 const events=parsed.events.map((e,i)=>{const lengths={},out=[];const append=(k,l)=>{if(!out.includes(k))out.push(k);lengths[k]=Math.max(lengths[k]||0,l);};const src=e.keys.map(k=>({key:k,action:source.actions[k],length:e.noteLengths?.[k]||e.duration}));if(src.some(s=>!s.action)){if(errors.length<10)errors.push(`第${i+1}组包含来源琴盘不存在的按键`);return e;}
  if(same)src.forEach(s=>append(s.key,s.length));else{
   const pitches=[...new Set(src.flatMap(s=>s.action.pitches))].sort((a,b)=>a-b),sig=pitches.join(',');const exact=opts.matchChords&&new Set(src.map(s=>s.length)).size<=1?Object.entries(target.actions).find(([,a])=>a.type==='chord'&&[...a.pitches].sort((a,b)=>a-b).join(',')===sig):null;
   if(exact){append(exact[0],Math.max(...src.map(s=>s.length)));warn('整组音高已精确匹配预置和弦；按一次和弦键演奏。');}else for(const s of src)for(const p of s.action.pitches){let found=Object.entries(target.actions).find(([,a])=>a.type==='note'&&a.pitches[0]===p);if(!found&&opts.fold){found=Object.entries(target.actions).filter(([,a])=>a.type==='note'&&a.pitches[0]%12===p%12).sort((a,b)=>Math.abs(a[1].pitches[0]-p)-Math.abs(b[1].pitches[0]-p))[0];if(found)warn('转换时部分音已折回八度，实际音高有变化。');}if(found)append(found[0],s.length);else if(errors.length<10)errors.push(`第${i+1}组：目标琴盘无法演奏${noteName(p)}，可选择八度折回或更换琴盘。`);}
   if(out.join('+')!==e.keys.join('+'))changed++;
  }
  return {...e,keys:out,noteLengths:lengths,label:same&&!out.some(k=>target.actions[k].type==='chord')&&e.label?e.label:out.length?out.map(k=>target.actions[k].type==='chord'?k+'·'+target.actions[k].label:k).join('+'):'休'};
 });if(!same)warn(`已按音高转换：${source.name} → ${target.name}，${changed}组操作发生变化。`);return {...parsed,events,errors,warnings};}
function generate(rows,start=60){const actions={};let i=0;for(const r of rows)for(const k of r){actions[k]={pitches:[Number(start)+Math.floor(i/7)*12+DIATONIC[i%7]]};i++;}return actions;}
const api={PRESETS,standard,sky,guitar,natural14,natural22,digits21,low21,chromatic36,chromatic37,validate,notation,convert,noteName,pitch,generate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Boards=api;
})(typeof window!=='undefined'?window:globalThis);
