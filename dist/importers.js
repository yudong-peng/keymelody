(function(root){
'use strict';
const {ROWS,KEYS,parseScore}=typeof module!=='undefined'&&module.exports?require('./score.js'):root.Score;
const ASC=ROWS[2]+ROWS[1]+ROWS[0],PITCHES=[48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77,79,81,83];
const BASE_ROWS=ROWS,BASE_KEYS=KEYS,BASE_ASC=ASC,BASE_PITCHES=PITCHES;
const FORMATS={
 skyhtml:{name:'Sky HTML文本谱',example:'<div id="ascii">A1 A2 A3 . A1A3B3:2</div>',help:'仅提取#ascii中的位置谱文字，不执行HTML脚本；文件和粘贴均可。'},
 midi:{name:'MIDI文件（.mid / .midi）',example:'MIDI是二进制文件，请点击上方“选择曲谱文件”。\n导入后自动转换为可编辑的JSON时间谱，并保留原始速度变化。',help:'支持PPQ时间制的标准MIDI格式0/1。选择音轨、移调、半音与超音域处理后试听。'},
 auto:{name:'自动识别文本 / JSON / XML',example:'QW E [AS]:2 | _:1 Q',help:'JSON/XML按内容识别；纯文本会显示推定类型，请核对。'},
 letters:{name:'琴盘位置字母谱',example:'Q:1 W:0.5 [AS]:2 | _:1 E:1',help:'空格分开；[AS]同时按；:2两拍；_休止；-延音。'},
 flow:{name:'社区连写字母谱',example:'QWE [AS] Q-W-E | (DG):2',help:'QWE依次弹；[]或()同时按；横线按一拍休止处理；|仅分隔。无明确时值时为等拍假设。'},
 numbers:{name:'数字简谱（增强）',example:"123 5:2 | [135] 1' 2, 0 -",help:"1—7中音；高音1'或+1；低音1,或-1；0休止；[135]和弦；:后为拍数。下划线/上下点图片不识别。"},
 notes:{name:'音名谱 C4 / D4',example:'C4 D4 E4 [C4 E4 G4]:2 | R:1 C5',help:'科学音高：按来源琴盘的音高定义映射（标准21键C4=A）；支持#、b，由下方半音策略处理；R休止。'},
 solfege:{name:'唱名谱 Do / Re / Mi',example:'do re mi [do mi sol]:2 | rest do\'',help:'do re mi fa sol la si/ti；默认中音；单引号高音，逗号低音；rest休止。'},
 skyabc:{name:'Sky A1—C5 位置谱',example:'A1 A2 A3 . A1A3B3:2 | C1',help:'Sky三排五列位置谱；选择15键来源时A1=Q、C5=B。标准21键来源沿用低音Z起的映射。不是通用ABC乐谱。'},
 indices:{name:'琴盘顺序编号谱',example:'1 2 3 [1 5 8]:2 | 0 15 21',help:'按来源琴盘编号；标准21键为低至高1—21，其他琴盘按行顺序编号；0休止。'},
 json:{name:'JSON / Sky Studio / 时间谱',example:'[{"name":"示例","isEncrypted":false,"songNotes":[{"time":0,"key":"1Key0"},{"time":500,"key":"1Key2"},{"time":1000,"key":"1Key4"}]}]',help:'支持本软件v1/v2、songNotes(time毫秒/key)、notes(time/key或midi)、events(beat/keys/duration)。Sky编号请明确选择15音或21音。'},
 csv:{name:'CSV / TSV 时间谱',example:'time,key,duration\n0,A,400\n500,S,400\n1000,A+G,800',help:'首行字段：time,key,duration（毫秒）；或beat,keys,duration（拍）。和弦用A+G；逗号或Tab分列。'},
 xml:{name:'MusicXML（未压缩）',example:'<?xml version="1.0"?>\n<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note></measure></part></score-partwise>',help:'导入.musicxml/.xml；选择声部。反复/跳转暂不展开，会警告；压缩.mxl与图片/PDF暂不支持。'}
};
function fail(msg){throw Error(msg);}
function finite(v,label,min=0){v=Number(v);if(!Number.isFinite(v)||v<min||v>1e7)fail(label+'不是有效数值');return v;}
function notePitch(n){const m=String(n).match(/^([A-Ga-g])([#b]?)(-?\d)$/);if(!m)fail('无法识别音名 '+n);return (Number(m[3])+1)*12+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()]+(m[2]==='#'?1:m[2]==='b'?-1:0);}
// Remove only format-unknown text. Delimiters and invalid numeric syntax stay visible to validators.
function cleanNotation(source,format,ignored,allowedKeys=BASE_KEYS){
 const note=v=>{if(v)ignored.push(v);return ' ';};
 let text=source.replace(/【[^】]*】/g,note).replace(/\/\/[^\n]*/g,note).replace(/(^|[^A-Ga-g])(#.*)$/gm,(_,before,comment)=>before+note(comment)).replace(/^\s*(?:bpm|tempo|速度|作者|曲名|调号)\s*[:：=].*$/gim,note);
 text=text.replace(/[^\x00-\x7F]+/g,note);
 // Time suffixes are not cleaned: a typo such as A:fast must remain an error.
 text=text.split(/(:[^\s|()[\]]*)/g).map((part,i)=>{if(i%2)return part;
  if(['letters','flow'].includes(format))return part.replace(/[A-Za-z]+/g,w=>[...w.toUpperCase()].every(k=>allowedKeys.includes(k))?w:note(w)).split('').map(c=>allowedKeys.includes(c.toUpperCase())||/[\s\[\]()|_;,\-]/.test(c)?c:note(c)).join('');
  if(format==='numbers')return part.replace(/[A-Za-z]+/g,note).replace(/[^0-7\s\[\]()|_;.,'+\-]/g,note);
  if(format==='indices')return part.replace(/[A-Za-z]+/g,note).replace(/[^0-9\s\[\]()|_;.,+\-]/g,note);
  if(format==='skyabc')return part.replace(/[A-Za-z0-9]+/g,w=>/^(?:[ABC][1-5])+$/i.test(w)?w:note(w)).replace(/[^ABCabc1-5\s\[\]()|_;.\-]/g,note);
  if(format==='notes'||format==='solfege')return part.split(/([\s\[\]()|+]+)/).map(w=>{if(!w||/^[\s\[\]()|+]+$/.test(w)||['_','0','.','-'].includes(w))return w;const valid=format==='notes'?/^(?:[A-Ga-g][#b]?-?\d|R)$/.test(w):/^(?:(?:do|re|mi|fa|sol|la|si|ti)[',]?|rest)$/i.test(w);return valid?w:note(w);}).join('');
  return part;
 }).join('');
 text=text.replace(/\[\s*\]|\(\s*\)/g,' ');return text;
}

function parse(source,format='auto',options={}){
 const opts={bpm:90,defaultBeats:1,policy:'reject',octave:'reject',skySize:15,transpose:0,track:'all',ignoreUnknown:false,...options},warnings=[],ignored=[];let chosen=format,hasTiming=false,title='',raw=[],implicitTiming=false;
 const ROWS=opts.notationRows||BASE_ROWS,KEYS=opts.notationKeys||BASE_KEYS,ASC=opts.actionOrder||BASE_ASC,PITCHES=opts.pitchValues||BASE_PITCHES,PITCH_KEYS=opts.pitchKeys||[...BASE_ASC];
 const warn=s=>{if(!warnings.includes(s))warnings.push(s);};
 const reportIgnored=()=>{if(!ignored.length)return;const samples=[...new Set(ignored)].slice(0,12).map(s=>JSON.stringify(s.slice(0,40))).join('、');warn(`已忽略 ${ignored.length} 处未知字符或注释：${samples}${ignored.length>12?'…':''}。`);if(ignored.some(s=>s.includes('/')))warn('斜杠 / 仅被忽略为分隔，未推断分拍；空段不自动补休止，请试听核对。');};
 function pitchKey(p){if(!PITCHES.length)fail('来源琴盘没有单音位置：请使用按键谱，或先以单音琴盘导入再匹配和弦。');p=finite(p,'音高')+Number(opts.transpose||0);const original=p;
  if(p<PITCHES[0]||p>PITCHES[PITCHES.length-1]){if(opts.octave==='fold'){while(p<PITCHES[0])p+=12;while(p>PITCHES[PITCHES.length-1])p-=12;warn('超音域音符已按八度折回来源琴盘音域。');}else if(opts.policy==='drop'){warn('已跳过超音域音符。');return null;}else fail(`音高 ${original} 超出来源琴盘音域；请选择八度折回或跳过。`);}
  let idx=PITCHES.indexOf(p);if(idx<0){if(opts.policy==='drop'){warn('已跳过半音。');return null;}if(opts.policy==='nearest'){idx=PITCHES.reduce((best,x,i)=>Math.abs(x-p)<Math.abs(PITCHES[best]-p)?i:best,0);warn('半音已近似到最近自然音，旋律会改变。');}else fail(`音高 ${original} 含来源琴盘无法演奏的半音；请选择近似或跳过。`);}return PITCH_KEYS[idx];
 }
 function keysFrom(value,kind='keys'){
  if(kind==='pitch')return [pitchKey(value)].filter(Boolean);
  if(Array.isArray(value))return [...new Set(value.flatMap(v=>keysFrom(v,kind)))];
  const str=String(value??'');if(str==='_'||str==='')return [];
  const sky=str.match(/^(?:\d+)?Key(\d+)$/i);if(sky){const i=Number(sky[1]),max=Number(opts.skySize);if(i>=max)fail('Key'+i+'超出所选源谱编号范围');warn(`Sky源谱按${max}音低至高映射，起点为低音Z；编号前缀仅作声部标记。`);if(!ASC[i])fail('源琴盘没有该Key编号');return [ASC[i]];}
  if(/^[A-Ga-g][#b]?-?\d$/.test(str))return [pitchKey(notePitch(str))].filter(Boolean);
  if(/^\d+$/.test(str)&&![...str].every(k=>KEYS.includes(k)))fail('数值键位需要明确的midi音高字段或Key编号。');
  let letters=str.toUpperCase().replace(/[\s+\[\]]/g,'');if(opts.ignoreUnknown){const cleaned=cleanNotation(letters,'flow',ignored,KEYS);letters=cleaned.replace(/\s/g,'');}if([...letters].some(c=>!KEYS.includes(c)))fail('无法识别键位 '+str);return [...new Set(letters)];
 }
 function add(beat,keys,duration=1,extra={}){raw.push({beat:finite(beat,'起始拍'),keys:[...new Set(keys)],duration:Math.max(.001,finite(duration,'时值',.000001)),...extra});}
 function sequence(text,type){if(type==='flow')text=text.replace(/-/g,' - ');text=text.replace(/([\[\(])/g,' $1').replace(/([\]\)])(?=[^:\s])/g,'$1 ');let beat=0;const tokens=text.replace(/\r/g,'').split('\n').map(l=>type==='notes'?l.replace(/\/\/.*$/,''):l.replace(/#.*$/,'')).join(' ').replace(/[|，；;]/g,' ').match(/\[[^\]]*\](?::[\d.]+)?|\([^)]*\)(?::[\d.]+)?|[^\s]+/g)||[];
  for(let t of tokens){const match=t.match(/:([\d.]+)$/),d=match?Number(match[1]):Number(opts.defaultBeats);if(!Number.isFinite(d)||d<=0||d>128)fail('时值需在0—128拍之间');if(match){hasTiming=true;t=t.slice(0,match.index);}else if(t!=='-')implicitTiming=true;if(t==='-'){if(type==='flow'){add(beat,[],d);beat+=d;continue;}if(!raw.length)fail('延音前没有音符');raw[raw.length-1].duration+=d;beat+=d;hasTiming=true;continue;}
   if((['_','rest','.'].includes(t)||(t==='0'&&!(['flow','strict'].includes(type)&&KEYS.includes('0'))))||(type==='notes'&&t==='R')){add(beat,[],d);beat+=d;continue;}
   const chord=/^[\[(]/.test(t);if(chord&&!/[\])]$/.test(t))fail('和弦括号未闭合');const inner=chord?t.slice(1,-1):t;let groups=[];
   if(type==='flow'||type==='strict'){if(!inner.trim()||[...inner.toUpperCase().replace(/\s/g,'')].some(k=>!KEYS.includes(k)))fail('连写字母谱含未知字符：'+t);if(type==='strict'&&!chord&&inner.trim().length>1)fail('标准字母谱请用空格分开，或用方括号同时按');groups=[...inner.replace(/\s/g,'').toUpperCase()].map(k=>[k]);}
   if(type==='numbers'){const ns=inner.match(/[+-]?[1-7][',]?/g)||[];if(inner.replace(/[+-]?[1-7][',]?/g,'').trim())fail('无法识别数字谱 '+t);groups=ns.map(n=>{const degree=Number(n.match(/[1-7]/)[0])-1,ri=n.startsWith('+')||n.endsWith("'")?0:n.startsWith('-')||n.endsWith(',')?2:1;return opts.notationRows?[pitchKey([60,62,64,65,67,69,71][degree]+(ri===0?12:ri===2?-12:0))].filter(Boolean):[ROWS[ri][degree]];});}
   if(type==='indices'){const ns=inner.trim().split(/[\s+]+/);groups=ns.map(n=>{const i=Number(n);if(!Number.isInteger(i)||i<1||i>ASC.length)fail('顺序编号须为1—'+ASC.length+'：'+n);return [ASC[i-1]];});}
   if(type==='notes'){const ns=inner.trim().split(/[\s+]+/);groups=ns.map(n=>[pitchKey(notePitch(n))].filter(Boolean));}
   if(type==='solfege'){const ns=inner.trim().split(/[\s+]+/);groups=ns.map(n=>{const m=n.toLowerCase().match(/^(do|re|mi|fa|sol|la|si|ti)([',]?)$/);if(!m)fail('无法识别唱名 '+n);const degree={do:0,re:1,mi:2,fa:3,sol:4,la:5,si:6,ti:6}[m[1]],ri=m[2]==="'"?0:m[2]===','?2:1;return opts.notationRows?[pitchKey([60,62,64,65,67,69,71][degree]+(ri===0?12:ri===2?-12:0))].filter(Boolean):[ROWS[ri][degree]];});}
   if(type==='skyabc'){const ns=inner.toUpperCase().match(/[ABC][1-5]/g)||[];if(inner.toUpperCase().replace(/[ABC][1-5]/g,'').trim())fail('无法识别Sky位置谱 '+t);groups=ns.map(n=>[ASC['ABC'.indexOf(n[0])*5+Number(n[1])-1]]);warn(opts.notationRows?'Sky A1—C5按位置映射到来源琴盘的前15个位置（'+ASC[0]+'起）。':'Sky A1—C5按低至高映射至21键的前15音（Z起）。');}
   if(!groups.length)fail('无法识别 '+t);if(chord||type==='skyabc'){add(beat,groups.flat(),d);beat+=d;}else for(const g of groups){add(beat,g,d);beat+=d;}
  }
 }
 try{
  source=String(source).replace(/^\uFEFF/,'');if(!source.trim())fail('请粘贴琴谱，或点击“填入示例”体验。');if(source.length>2000000)fail('文本最多2MB');
  if((opts._depth||0)>3)fail('嵌套曲谱过深');if(format==='midi')fail('请使用“选择曲谱文件”导入.mid/.midi文件，不能直接粘贴二进制MIDI。');if(format==='auto'){const t=(opts.ignoreUnknown&&!/^[\s]*[<{[]/.test(source)?source.replace(/【[^】]*】|\/\/[^\n]*|#.*$/gm,' ').replace(/[^\x00-\x7F]+/g,' '):source).trim();chosen=/^[{\[]/.test(t)&&/"/.test(t)?'json':t.startsWith('<')?(/id\s*=\s*['"]?ascii/i.test(t)?'skyhtml':'xml'):/\b[A-C][1-5](?!\d)/.test(t)&&!/[D-G]\d/.test(t)?'skyabc':/\b[A-G][#b]?\d/.test(t)?'notes':/\b(do|re|mi|fa|sol|la|si|ti)\b/i.test(t)?'solfege':/^[\d\s:.,'|\[\]+_-]+$/.test(t)?'numbers':'flow';if(/[0-9]/.test(KEYS)&&chosen==='numbers')warn('来源琴盘包含数字按键：自动识别仍按数字简谱解释；若数字表示物理按键，请手动选择琴盘位置字母谱。');warn('自动识别为：'+FORMATS[chosen].name+'；请核对规则与节奏。');}
  if(opts.ignoreUnknown&&['letters','flow','numbers','indices','notes','solfege','skyabc'].includes(chosen))source=cleanNotation(source,chosen,ignored,KEYS);
  if(chosen==='skyhtml'){if(typeof DOMParser==='undefined')fail('当前环境没有HTML解析器');const d=new DOMParser().parseFromString(source,'text/html'),n=d.querySelector('#ascii');if(!n)fail('HTML中未找到#ascii文本谱');return parse(n.textContent,'skyabc',opts);}
  if(chosen==='letters'&&opts.notationRows)sequence(source,'strict');
  else if(chosen==='letters'){const p=parseScore(source,'letters',opts.defaultBeats);if(p.errors.length)fail(p.errors.join('；'));raw=p.events;hasTiming=p.hasTiming;implicitTiming=!source.replace(/#.*$/gm,'').split(/\s*\|\s*|\s+/).filter(Boolean).every(t=>/:([\d.]+)$/.test(t)||t==='-');}
  else if(['flow','numbers','notes','solfege','indices','skyabc'].includes(chosen))sequence(source,chosen);
  else if(chosen==='csv'){const lines=source.trim().split(/\r?\n/),sep=lines[0].includes('\t')?'\t':',',headers=lines.shift().split(sep).map(s=>s.trim().toLowerCase());if(!headers.includes('time')&&!headers.includes('beat'))fail('CSV首行需含time或beat字段');for(const line of lines){if(!line.trim())continue;if(opts.ignoreUnknown&&/^\s*(?:#|\/\/|【)/.test(line)){ignored.push(line);continue;}const cells=line.split(sep),r=Object.fromEntries(headers.map((h,i)=>[h,cells[i]?.trim()])),ms=r.time!==undefined;add(ms?finite(r.time,'time')*opts.bpm/60000:finite(r.beat,'beat'),keysFrom(r.key||r.keys),r.duration?finite(r.duration,'duration',.001)*(ms?opts.bpm/60000:1):Number(opts.defaultBeats));}hasTiming=true;}
  else if(chosen==='json'){
   let d=JSON.parse(source);if(Array.isArray(d)&&d[0]?.songNotes){if(d.length>1)warn('文件含多首曲谱，本次读取第一首；其他曲谱请单独导入。');d=d[0];}title=d.name||d.title||'';
   if(d.schema==='keymelody/v1'){const p=parse(d.source,d.format,{...opts,defaultBeats:d.defaultBeats||1,_depth:(opts._depth||0)+1});return {...p,title,hasTiming:d.timing==='confirmed'||p.hasTiming};}
   if(d.isEncrypted)fail('该谱已加密，请从来源软件导出未加密版本。');
   const list=Array.isArray(d)?d:d.songNotes||d.events||d.notes;if(!Array.isArray(list))fail('未识别JSON结构：支持songNotes、events、notes数组。');
   for(const n of list){if(!n||typeof n!=='object'||Array.isArray(n))fail('音符必须是含time/beat和key/keys/midi的对象。');if(opts.track!=='all'&&String(n.track??String(n.key||'').match(/^(\d+)Key/)?.[1]??0)!==String(opts.track))continue;const beat=n.beat!==undefined?finite(n.beat,'beat'):n.time!==undefined?finite(n.time,'time')*opts.bpm/60000:fail('音符缺少time或beat');const duration=n.duration!==undefined?finite(n.duration,'duration',.000001)*(n.beat!==undefined?1:opts.bpm/60000):Number(opts.defaultBeats);const keys=n.midi!==undefined?keysFrom(n.midi,'pitch'):keysFrom(n.keys??n.key??fail('音符缺少key/keys/midi'));const noteLengths={};for(const k of keys)if(n.noteLengths?.[k]!==undefined)noteLengths[k]=finite(n.noteLengths[k],'音长',.000001);add(beat,keys,duration,{track:n.track??0,...(Object.keys(noteLengths).length?{noteLengths}:{})});}hasTiming=true;
  }
  else if(chosen==='xml'){
   if(typeof DOMParser==='undefined')fail('当前环境没有XML解析器');const doc=new DOMParser().parseFromString(source,'application/xml');if(doc.querySelector('parsererror')||!doc.querySelector('score-partwise'))fail('需要有效的score-partwise MusicXML文件');if(doc.querySelector('repeat,ending,segno,coda'))warn('本次按书写顺序播放，反复、房子与跳转暂未展开。');if(doc.querySelector('grace'))warn('装饰音暂未导入。');let partIndex=0;
   for(const part of doc.querySelectorAll('score-partwise > part')){const track=String(partIndex++);if(opts.track!=='all'&&opts.track!==track)continue;let divisions=1,base=0,ties=new Map();for(const measure of part.children){let cursor=base,end=base,lastStart=base;for(const n of measure.children){if(n.tagName==='attributes'){divisions=Number(n.querySelector('divisions')?.textContent)||divisions;continue;}const dur=Number(n.querySelector('duration')?.textContent||0)/divisions;if(n.tagName==='backup'){cursor-=dur;continue;}if(n.tagName==='forward'){cursor+=dur;end=Math.max(end,cursor);continue;}if(n.tagName!=='note'||n.querySelector('grace'))continue;const start=n.querySelector('chord')?lastStart:cursor;if(!n.querySelector('chord')){lastStart=start;cursor+=dur;}end=Math.max(end,start+dur);const pitch=n.querySelector('pitch');if(pitch){const step=pitch.querySelector('step')?.textContent,oct=pitch.querySelector('octave')?.textContent,alter=Number(pitch.querySelector('alter')?.textContent||0),midi=notePitch(step+oct)+alter,k=pitchKey(midi);if(k&&dur>0){const voice=n.querySelector('voice')?.textContent||'1',id=voice+':'+midi,isStop=n.querySelector('tie[type="stop"]'),isStart=n.querySelector('tie[type="start"]');if(isStop&&ties.has(id)){ties.get(id).duration+=dur;}else{add(start,[k],dur,{track});if(isStart)ties.set(id,raw[raw.length-1]);}if(isStop&&!isStart)ties.delete(id);}}}base=end;}}
   if(doc.querySelector('sound[tempo],metronome'))warn('MusicXML使用导入框BPM匀速播放；原谱速度变化暂未应用。');hasTiming=true;
  }else fail('暂不支持该格式。');
  if(!raw.some(e=>e.keys.length))fail('没有可演奏音符，请检查音轨和转换设置。');if(raw.length>20000)fail('一份曲谱最多20,000个事件');raw.sort((a,b)=>a.beat-b.beat);let merged=[];
  for(const e of raw){const prev=merged[merged.length-1];if(prev&&Math.abs(prev.beat-e.beat)<1e-8){prev.keys=[...new Set([...prev.keys,...e.keys])];prev.noteLengths={...prev.noteLengths,...Object.fromEntries(e.keys.map(k=>[k,e.noteLengths?.[k]||e.duration]))};prev.duration=Math.max(prev.duration,e.duration);}else merged.push({...e,noteLengths:e.noteLengths||Object.fromEntries(e.keys.map(k=>[k,e.duration]))});}
  const total=Math.max(...merged.map(e=>e.beat+Math.max(e.duration,...Object.values(e.noteLengths||{}))));if(total>200000)fail('曲谱过长');if(merged[0].beat>0)merged.unshift({beat:0,duration:merged[0].beat,keys:[],noteLengths:{}});
  const events=merged.map((e,i)=>({...e,id:i,label:e.label||(e.keys.length?(chosen==='numbers'?e.keys.map(k=>{const p=PITCHES[PITCH_KEYS.indexOf(k)],degree=[0,2,4,5,7,9,11].indexOf(p%12)+1,oct=Math.floor((p-60)/12);return String(degree)+(oct>0?"'".repeat(oct):','.repeat(-oct));}).join('+'):e.keys.join('+')):'休'),duration:i<merged.length-1?merged[i+1].beat-e.beat:Math.max(.01,total-e.beat)}));
  reportIgnored();return {events,errors:[],warnings,totalBeats:total,hasTiming,completeTiming:hasTiming&&!implicitTiming,detected:chosen,title};
 }catch(e){reportIgnored();return {events:[],errors:[e.message||'读取失败'],warnings,totalBeats:0,hasTiming:false,detected:chosen,title};}
}
function midi(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);let p=0;const u8=()=>{if(p>=bytes.length)fail('MIDI文件截断');return bytes[p++];},u16=()=>u8()*256+u8(),u32=()=>u8()*16777216+u8()*65536+u8()*256+u8(),str=n=>Array.from({length:n},()=>String.fromCharCode(u8())).join(''),vlq=()=>{let v=0;for(let i=0;i<4;i++){const b=u8();v=(v<<7)|(b&127);if(!(b&128))return v;}fail('无效MIDI变长数');};
 if(str(4)!=='MThd')fail('不是MIDI文件');const len=u32(),format=u16(),count=u16(),ppq=u16();if(len<6||format>1||!ppq||(ppq&0x8000))fail('仅支持PPQ时间制的MIDI格式0/1');p+=len-6;const tempos=[{tick:0,tempo:500000}],notes=[],tracks=[],warnings=[];
 for(let tr=0;tr<count;tr++){if(str(4)!=='MTrk')fail('缺少MIDI轨道');const trackSize=u32(),end=p+trackSize;if(end>bytes.length)fail('MIDI轨道超出文件边界');let tick=0,running=0,name='音轨 '+(tr+1),active=new Map();while(p<end){tick+=vlq();let status=u8();if(status<128){p--;if(!running)fail('无效MIDI运行状态');status=running;}else if(status<240)running=status;
  if(status===255){const type=u8(),size=vlq();if(p+size>end)fail('MIDI元事件截断');if(type===81&&size===3)tempos.push({tick,tempo:bytes[p]*65536+bytes[p+1]*256+bytes[p+2]});if(type===3)name=new TextDecoder().decode(bytes.slice(p,p+size));p+=size;continue;}if(status===240||status===247){const sysLength=vlq();p+=sysLength;if(p>end)fail('MIDI系统事件截断');running=0;continue;}if(status>=240)fail('不支持的MIDI系统状态');
  const op=status>>4,ch=status&15,a=u8(),b=(op===12||op===13)?0:u8(),id=ch+':'+a;if(op===14||(op===11&&a===64))warnings.push('MIDI弯音和延音踏板暂未应用，仅按音符起止播放。');if(op===9&&b>0){if(ch===9){if(!warnings.includes('已忽略MIDI打击乐通道。'))warnings.push('已忽略MIDI打击乐通道。');continue;}if(!active.has(id))active.set(id,[]);active.get(id).push({tick,midi:a,velocity:b,track:tr});}else if(op===8||(op===9&&!b)){const n=active.get(id)?.shift();if(n)notes.push({...n,end:Math.max(n.tick+1,tick)});if(notes.length>20000)fail('MIDI最多20,000个音符');}}
  for(const list of active.values())for(const n of list){notes.push({...n,end:Math.max(n.tick+ppq/4,tick)});warnings.push('存在缺失Note Off的音，已补默认结束。');}tracks.push({id:String(tr),name,count:notes.filter(n=>n.track===tr).length});p=end;
 }
 tempos.sort((a,b)=>a.tick-b.tick);const tempoPoints=[];for(const t of tempos){if(!t.tempo)fail('MIDI速度不能为零');if(tempoPoints.length&&tempoPoints.at(-1).tick===t.tick)tempoPoints[tempoPoints.length-1]=t;else tempoPoints.push(t);}let elapsed=0;tempoPoints.forEach((t,i)=>{if(i)elapsed+=(t.tick-tempoPoints[i-1].tick)*tempoPoints[i-1].tempo/ppq/1000;t.ms=elapsed;});
 const ms=tick=>{let lo=0,hi=tempoPoints.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(tempoPoints[mid].tick<=tick)lo=mid;else hi=mid-1;}const t=tempoPoints[lo];return t.ms+(tick-t.tick)*t.tempo/ppq/1000;};
 return {notes:notes.map(n=>({time:ms(n.tick),duration:ms(n.end)-ms(n.tick),midi:n.midi,track:n.track})),tracks,warnings:[...new Set(warnings)]};
}
const api={FORMATS,parse,midi,ASC,PITCHES};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Importer=api;
})(typeof window!=='undefined'?window:globalThis);
