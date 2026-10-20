"""Prepare the selected CC0 web samples from downloaded upstream banks.
Needs Python numpy, ffmpeg, and extracted upstream files in /tmp/keymelody-samples.
The manifest retains original URLs, filenames, source hashes, and tuning.
"""
from pathlib import Path
import re,json,hashlib,subprocess,shutil,urllib.parse
import numpy as np
ROOT=Path(__file__).resolve().parents[1]; RAW=Path('/tmp/keymelody-samples'); OUT=ROOT/'dist/audio'
SOURCES={
 'piano-kw':('立式钢琴','FreePats · Upright Piano KW','https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html#UprightKW',.75),
 'nylon':('古典吉他','FreePats · Spanish Classical Guitar','https://freepats.zenvoid.org/Guitar/acoustic-guitar.html',.65),
 'kalimba':('卡林巴','FreePats · Kalimba','https://freepats.zenvoid.org/Ethnic/kalimba.html',.7),
 'harpsichord':('羽管键琴','Versilian Studios · VCSL English Harpsichord','https://github.com/sgossner/VCSL',.65),
 'xylophone':('木琴','Versilian Studios · VCSL Xylophone','https://github.com/sgossner/VCSL',.65),
 'glockenspiel':('钟琴','Versilian Studios · VCSL Glockenspiel','https://github.com/sgossner/VCSL',.55)}
def pitch(n):
 m=re.fullmatch(r'([A-G])(#?)(\d)',n);return (int(m[3])+1)*12+dict(C=0,D=2,E=4,F=5,G=7,A=9,B=11)[m[1]]+bool(m[2])
selected={k:[] for k in SOURCES}
for src,id in [('piano','piano-kw'),('guitar','nylon')]:
 folder=next((RAW/src).glob('*'));sfz=next(folder.glob('*.sfz')).read_text()
 for reg in sfz.split('<region>')[1:]:
  name=re.search(r'sample=samples/(\S+)',reg)[1]; root=re.search(r'\b(?:pitch_keycenter|key)=(\d+)',reg);midi=int(root[1])
  if id=='piano-kw':keep=47<=midi<=84
  else:keep=midi in [48,53,57,60,64,67,72,76,79,84]
  if keep:selected[id].append((folder/'samples'/name,midi,0,'https://freepats.zenvoid.org/'+('Piano/UprightPianoKW/' if src=='piano' else 'Guitar/SpanishClassicalGuitar/')+folder.name+'.7z'))
folder=next((RAW/'kalimba').glob('*'))
for name,midi,tune in [('F3_01.wav',53,0),('1_01.wav',60,25),('2_01.wav',63,5),('3_01.wav',64,-40),('4_01.wav',67,7),('5_01.wav',68,17),('6_01.wav',72,22),('7_01.wav',73,-15)]:selected['kalimba'].append((folder/'samples'/name,midi,tune,'https://freepats.zenvoid.org/Ethnic/Kalimba/Kalimba-SFZ-20190723.tar.xz'))
for path in json.loads((RAW/'vcsl/sources.json').read_text()):
 name=Path(path).name
 id='harpsichord' if 'Harpsi' in name else 'xylophone' if name.startswith('Xylo') else 'glockenspiel'
 note=re.search(r'_([A-G]#?\d)_',name)[1] # VCSL names use C3 for middle C; +12 for scientific MIDI pitch.
 selected[id].append((RAW/'vcsl'/name,pitch(note)+12,0,'https://raw.githubusercontent.com/sgossner/VCSL/master/'+urllib.parse.quote(path)))
manifest={'version':'cc0-20261020-2','license':'CC0-1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','processing':'Selected one velocity/take; mono 32kHz MP3 112kbps, trim leading silence, max 6 seconds, peak normalize, 90ms end fade. SFZ Kalimba cent tuning retained; VCSL filename octaves converted +12 to scientific MIDI. Nearest-root pitch shifting; no SFZ loops, release samples, or round robin.','instruments':[]}
for id,(name,credit,url,gain) in SOURCES.items():
 target=OUT/id;target.mkdir(parents=True,exist_ok=True);items=[]
 for old in target.glob('*.mp3'):old.unlink()
 for f,midi,tune,original in sorted(selected[id],key=lambda a:a[1]):
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-ac','1','-ar','32000','-f','f32le','-'])
  a=np.frombuffer(raw,dtype='<f4').copy();active=np.flatnonzero(np.abs(a)>.001)
  if len(active):a=a[max(0,active[0]-64):]
  a=a[:192000];peak=float(np.max(np.abs(a)));a*=.85/max(.001,peak);n=min(2880,len(a));a[-n:]*=np.linspace(1,0,n)
  out=target/(str(midi)+'.mp3')
  subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','32000','-ac','1','-i','-','-c:a','libmp3lame','-b:a','112k',str(out)],input=a.astype('<f4').tobytes(),check=True)
  items.append({'root':midi,'tune':tune,'url':id+'/'+out.name,'bytes':out.stat().st_size,'duration':round(len(a)/32000,3),'originalFile':f.name,'originalUrl':original,'originalSha256':hashlib.sha256(f.read_bytes()).hexdigest()})
 data={'id':id,'name':name,'credit':credit,'sourceUrl':url,'license':'CC0-1.0','gain':gain,'bytes':sum(i['bytes'] for i in items),'samples':items};manifest['instruments'].append(data);print(id,len(items),data['bytes'],flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
for src in ['piano','guitar','kalimba']:
 p=next((RAW/src).rglob('readme.txt'));shutil.copyfile(p,OUT/'licenses'/(src+'-readme.txt'))
shutil.copyfile(next((RAW/'piano').rglob('cc0.txt')),OUT/'licenses/CC0-1.0.txt')
