'use strict';
let overviewData=null;
function dateNumber(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));if(!m)return null;const n=Date.UTC(+m[1],+m[2]-1,+m[3]);return new Date(n).toISOString().slice(0,10)===value?n:null}
function koreaToday(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-')}
function dday(target,today=koreaToday()){const a=dateNumber(target),b=dateNumber(today);if(a===null||b===null)return '미설정';const days=Math.round((a-b)/86400000);return days===0?'D-DAY':days>0?'D-'+days:'D+'+Math.abs(days)}
function preparationSummary(data){
 const empty={mode:'숨김',custom:'',quotes:[],groups:[],percent:null,error:'진행률관리 시트를 불러오지 못했습니다.'};
 if(!data||data.error)return empty;
 const headers=['구분','대분류','하위항목 / 설정값 / 문구','진행률(0~100)','계산포함','노출'];
 const indices=headers.map(h=>data.headers.indexOf(h));
 if(indices.some(i=>i<0))return {...empty,error:'진행률관리 시트의 열 제목을 확인해 주세요.'};
 const enabled=v=>v===true||['TRUE','ON'].includes(String(v).trim().toUpperCase());
 const records=data.rows.map(r=>indices.map(i=>r[i]??''));
 const settings=Object.fromEntries(records.filter(r=>r[0]==='설정').map(r=>[r[1],String(r[2]).trim()]));
 const number=v=>{const raw=String(v).trim().replace(/%$/,'');const n=Number(raw);return raw!==''&&Number.isFinite(n)&&n>=0&&n<=100?n:null};
 const definitions=records.filter(r=>r[0]==='대분류'&&String(r[1]).trim());
 const names=definitions.map(r=>String(r[1]).trim());
 const children=records.filter(r=>r[0]==='하위항목'&&String(r[2]).trim());
 const invalid=names.some((n,i)=>names.indexOf(n)!==i)||children.some(r=>enabled(r[4])&&!names.includes(String(r[1]).trim()));
 const groups=definitions.map(r=>{
  const name=String(r[1]).trim();
  const items=children.filter(c=>String(c[1]).trim()===name).map(c=>({name:String(c[2]),percent:number(c[3]),included:enabled(c[4]),visible:enabled(c[5])}));
  const included=items.filter(c=>c.included);
  const percent=included.length&&included.every(c=>c.percent!==null)?included.reduce((n,c)=>n+c.percent,0)/included.length:null;
  return {name,items,percent,included:enabled(r[4]),visible:enabled(r[5])};
 });
 const included=groups.filter(g=>g.included);
 const percent=!invalid&&included.length&&included.every(g=>g.percent!==null)?included.reduce((n,g)=>n+g.percent,0)/included.length:null;
 return {mode:settings.상단표시||'숨김',custom:settings.직접문구||'',quotes:records.filter(r=>r[0]==='명언'&&r[2]&&enabled(r[5])).map(r=>({text:String(r[2]),source:String(r[1])})),groups,percent,error:invalid?'대분류 중복 또는 소속 대분류가 없는 하위항목을 확인해 주세요.':''};
}
function preparationCard(model,today){
 const pct=n=>n===null?'미입력':Math.round(n)+'%';
 if(model.mode==='진행률')return '<section class="panel"><h2>전체 진행률</h2><div class="ov-number">'+pct(model.percent)+'</div><p class="subtle">하위항목 평균 → 대분류 평균 · 대분류별 동일 비중</p>'+(model.percent===null?'<p class="subtle">계산에 포함된 모든 항목의 진행률을 입력하면 표시됩니다.</p>':'')+'</section>';
 if(model.mode==='오늘의 명언'){
  const quote=model.quotes.length?model.quotes[Math.floor(dateNumber(today)/86400000)%model.quotes.length]:null;
  return '<section class="panel"><h2>오늘의 명언</h2><p style="font-size:1.25rem;line-height:1.7;overflow-wrap:anywhere">'+esc(quote?.text||'표시할 문구를 등록해 주세요.')+'</p>'+(quote?.source?'<p class="subtle">'+esc(quote.source)+'</p>':'')+'</section>';
 }
 if(model.mode==='직접 문구')return '<section class="panel"><h2>오늘의 메시지</h2><p style="font-size:1.25rem;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere">'+esc(model.custom||'표시할 문구를 입력해 주세요.')+'</p></section>';
 return '';
}
function preparationDetails(model){
 if(model.mode!=='진행률')return '';
 const pct=n=>n===null?'미입력':Math.round(n)+'%';
 const groups=model.groups.filter(g=>g.visible);
 return '<section class="panel ov-progress"><h2>분야별 진행현황</h2>'+groups.map(g=>'<details style="padding:12px 0;border-bottom:1px solid var(--line)"><summary style="cursor:pointer;font-size:1rem">'+esc(g.name)+' · '+pct(g.percent)+(g.included?'':' · 계산 제외')+'</summary><div class="ov-track" style="margin:12px 0">'+(g.percent===null?'':'<div style="width:'+g.percent+'%"></div>')+'</div>'+g.items.filter(i=>i.visible).map(i=>'<p style="display:flex;justify-content:space-between;gap:16px;margin:12px 0"><span>'+esc(i.name)+(i.included?'':' · 계산 제외')+'</span><strong style="white-space:nowrap">'+pct(i.percent)+'</strong></p>').join('')+'</details>').join('')+(groups.length?'':'<p class="subtle">노출하도록 선택한 분야가 없습니다.</p>')+'</section>';
}
function overviewView(){
 const settings=overviewData?.settings||{},events=overviewData?.items||[],today=koreaToday();
 const model=preparationSummary(tables['진행률관리']);
 const list=kind=>{let items=events.filter(e=>e.kind===kind&&e.text);if(kind==='주요일정')items=items.filter(e=>dateNumber(e.date)===null||e.date>=today).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'').localeCompare(b.time||''));return items.length?'<ul class="ov-list">'+items.map(e=>'<li><div>'+esc(e.text)+'</div>'+((e.date||e.time)?'<p class="subtle">'+esc(e.date)+' '+esc(e.time||'시간 미정')+'</p>':'')+'</li>').join('')+'</ul>':'<p class="subtle">'+(kind==='주요일정'?'예정된 일정이 없습니다.':'등록된 내용이 없습니다.')+'</p>'};
 const notice=!overviewData?'오버뷰 내용을 불러오는 중입니다.':overviewData.error;
 const card=preparationCard(model,today);
 const edit='https://docs.google.com/spreadsheets/d/1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA/edit#gid=1909102026';
 return (notice?'<p class="panel">'+esc(notice)+'</p>':'')+'<div class="ov-heading"><strong>'+esc(settings.프로젝트명||'VELYB CHINA BUSINESS')+'</strong><span>1호점 징안점</span></div><div class="toolbar"><a href="'+edit+'" target="_blank" rel="noopener noreferrer">진행률·표시 설정 ↗</a></div>'+(model.error?'<p class="subtle">'+esc(model.error)+'</p>':'')+'<div class="ov-top"'+(card?'':' style="grid-template-columns:1fr"')+'>'+card+'<section class="panel ov-open"><h2>OPEN D-DAY</h2><div class="ov-number">'+dday(settings.오픈목표일)+'</div><p>'+esc(settings.오픈목표일||'목표일 미설정')+' · 한국 날짜 기준</p></section></div><div class="ov-columns"><section class="panel"><h2>이번 주 핵심 업무</h2>'+list('핵심업무')+'</section><section class="panel"><h2>주요 일정</h2>'+list('주요일정')+'</section></div>'+preparationDetails(model)+'<section class="panel ov-issues"><h2>주요 이슈 / 의사결정 필요</h2>'+list('이슈')+'</section>';
}
