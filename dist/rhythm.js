(function(root){
'use strict';
const WINDOWS={wide:{name:'宽',perfect:80,good:150,bad:230},medium:{name:'中',perfect:50,good:100,bad:160},strict:{name:'严',perfect:30,good:65,bad:110}};
const ORDER=['Perfect','Good','Bad','Lost'];
const WEIGHTS={Perfect:1,Good:.7,Bad:.3,Lost:0};
function windowFor(level){return WINDOWS[level]||WINDOWS.medium;}
function grade(ms,level){const d=Math.abs(ms),w=windowFor(level);return d<=w.perfect?'Perfect':d<=w.good?'Good':d<=w.bad?'Bad':'Lost';}
function worst(grades){return grades.length?ORDER[Math.max(...grades.map(g=>ORDER.indexOf(g)))]:null;}
function accuracy(counts,wrong=0){const total=ORDER.reduce((n,g)=>n+(counts[g]||0),0)+wrong;return total?ORDER.reduce((n,g)=>n+(counts[g]||0)*WEIGHTS[g],0)/total*100:null;}
// Four independent taps, measured against scheduled sound onset, not animation frames.
function estimate(samples){if(samples.length!==4||samples.some(x=>!Number.isFinite(x)||Math.abs(x)>300))return {ok:false,reason:'有轮次漏点或偏离第三拍，请重新校准。'};const sorted=[...samples].sort((a,b)=>a-b),spread=sorted[3]-sorted[0];if(spread>80)return {ok:false,reason:'四次点击相差超过80 ms，结果不够稳定，请重试。',spread};return {ok:true,offset:Math.round((sorted[1]+sorted[2])/2),spread:Math.round(spread)};}
const api={WINDOWS,ORDER,WEIGHTS,windowFor,grade,worst,accuracy,estimate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Rhythm=api;
})(typeof window!=='undefined'?window:globalThis);
