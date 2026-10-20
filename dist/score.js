(function(root){
'use strict';
const ROWS=['QWERTYU','ASDFGHJ','ZXCVBNM'];
const KEYS=ROWS.join('');
function parseScore(source,format='letters',defaultBeats=1){
 const events=[],errors=[];let beat=0;let hasTiming=false;
 const lines=source.replace(/\r/g,'').split('\n');
 lines.forEach((raw,li)=>{
  const line=raw.split('#')[0]; let i=0;
  while(i<line.length){
   if(/[\s|，；;]/.test(line[i])){i++;continue;}
   const start=i;let body='';
   if(line[i]==='['){const end=line.indexOf(']',i+1);if(end<0){errors.push(`第 ${li+1} 行，第 ${i+1} 列：和弦缺少 ]`);break;}body=line.slice(i,end+1);i=end+1;}
   else{while(i<line.length&&!/[\s|，；;:]/.test(line[i]))i++;body=line.slice(start,i);}
   let duration=Number(defaultBeats);
   if(line[i]===':'){hasTiming=true;i++;const ds=i;while(i<line.length&&!/[\s|，；;]/.test(line[i]))i++;duration=Number(line.slice(ds,i));if(!Number.isFinite(duration)||duration<=0||duration>32){errors.push(`第 ${li+1} 行：时值须大于 0 且不超过 32 拍`);continue;}}
   if(body==='-'){hasTiming=true;if(!events.length){errors.push(`第 ${li+1} 行：延音符 - 前没有音符`);continue;}events[events.length-1].duration+=duration;beat+=duration;continue;}
   const rest=body==='_'||(format==='numbers'&&body==='0');let keys=[];
   if(!rest){
    let inner=body.startsWith('[')?body.slice(1,-1):body;
    if(format==='letters'){
     inner=inner.toUpperCase().replace(/\s/g,'');
     if(!inner.length||[...inner].some(c=>!KEYS.includes(c))){errors.push(`第 ${li+1} 行：无法识别「${body}」，请使用三排键位字母`);continue;}
     if(!body.startsWith('[')&&inner.length>1){errors.push(`第 ${li+1} 行：「${body}」请用空格分开，或用 [${inner}] 表示同时按`);continue;}
     keys=[...new Set(inner)];
    }else{
     const tokens=inner.match(/[1-7][',]?/g)||[];const remain=inner.replace(/[1-7][',]?/g,'').replace(/\s/g,'');
     if(remain||!tokens.length||(!body.startsWith('[')&&tokens.length!==1)){errors.push(`第 ${li+1} 行：无法识别「${body}」，高音写 1'，低音写 1,`);continue;}
     keys=[...new Set(tokens.map(n=>ROWS[n.endsWith("'")?0:n.endsWith(',')?2:1][Number(n[0])-1]))];
    }
   }
   events.push({id:events.length,beat,duration,keys,label:body,line:li+1});beat+=duration;
  }
 });
 if(!events.some(e=>e.keys.length))errors.push('曲谱中至少需要一个可演奏的音符。');
 if(events.length>10000)errors.push('第一版单份曲谱最多支持 10,000 组。');
 return {events,errors,totalBeats:beat,hasTiming};
}
const api={ROWS,KEYS,parseScore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Score=api;
})(typeof window!=='undefined'?window:globalThis);
