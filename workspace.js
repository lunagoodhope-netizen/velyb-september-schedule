'use strict';
(() => {
 const SHEET_ID='1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA';
 const ENDPOINT='https://script.google.com/macros/s/AKfycbwfnXwjf8hKbxSIp4vsW929JqRaT96vIK_70tPrlBzcdMikXdzdQ573DQq2RLGvTF6IKQ/exec';
 const GIDS={'업무관리':271000,'카테고리설정':271001,'사업기본정보':271002,'바로가기':271003,'월별목표':271004,'10월':271005,'11월':271006,'12월':271007,'중요정보':271008,'주요일정':271009,'사용안내':271010};
 const STATUSES=['대기','진행 중','확인 필요','완료'];
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const text=value=>String(value??'').trim();
 const yes=value=>value===true||['TRUE','ON','1'].includes(text(value).toUpperCase());
 function safeUrl(value){try{const u=new URL(text(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
 function isoDate(value){
  const raw=text(value);if(!raw)return '';
  let m=/^(\d{4})[-/.]\s*(\d{1,2})[-/.]\s*(\d{1,2})(?:[.\sT].*)?$/.exec(raw);
  if(!m&&/^\d{5}(?:\.\d+)?$/.test(raw)){const n=Number(raw);return new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10)}
  if(!m)return '';
  const d=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return new Date(Date.UTC(+m[1],+m[2]-1,+m[3])).toISOString().slice(0,10)===d?d:'';
 }
 function monthKey(value){const m=/^(\d{4})[-/.]\s*(\d{1,2})(?:[-/.\sT].*)?$/.exec(text(value));return m&&+m[2]>=1&&+m[2]<=12?`${m[1]}-${m[2].padStart(2,'0')}`:''}
 function today(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-')}
 const todayISO=today();
 const state={page:route(),month:todayISO.slice(0,7),day:todayISO,businessTab:'info',category:'',status:'',query:'',data:null,loading:false,updated:'',error:''};
 function route(){let r;try{r=decodeURIComponent(location.hash.slice(1))}catch{r=''}return ['tasks','업무'].includes(r)?'tasks':/schedule|september|october|november|일정/.test(r)?'schedule':'overview'}
 function sheetLink(name,row){return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit${GIDS[name]===undefined?'':'#gid='+GIDS[name]+(row?'&range=A'+row:'')}`}
 function records(name){const table=state.data?.tables?.[name];if(!table||table.error||!Array.isArray(table.headers)||!Array.isArray(table.rows))return [];return table.rows.filter(Array.isArray).map((r,i)=>Object.assign({_row:i+2},Object.fromEntries(table.headers.map((h,j)=>[text(h),r[j]??'']))));}
 function ordered(rows){return rows.map((r,i)=>({...r,_order:i})).sort((a,b)=>{const n=v=>text(v)!==''&&Number.isFinite(Number(v))?Number(v):99999;return n(a['표시 순서'])-n(b['표시 순서'])||a._order-b._order})}
 function categories(){return [...new Set(ordered(records('카테고리설정')).map(r=>text(r['카테고리'])).filter(Boolean))]}
 function tasks(){const cats=categories();return records('업무관리').filter(r=>text(r['업무'])).map(r=>({...r,_category:cats.includes(text(r['카테고리']))?text(r['카테고리']):'미분류'}))}
 function visibleTasks(rows=tasks()){return rows.filter(r=>(!state.category||r._category===state.category)&&(!state.status||text(r['상태'])===state.status)&&(!state.query||['카테고리','업무','다음 할 일','비고'].some(k=>text(r[k]).toLocaleLowerCase().includes(state.query.toLocaleLowerCase()))))}
 function coreTasks(){return tasks().filter(r=>yes(r['핵심업무 표시'])&&monthKey(r['핵심업무 월'])===state.month)}
 function info(){return Object.fromEntries(records('사업기본정보').filter(r=>text(r['항목'])).map(r=>[text(r['항목']),text(r['내용'])]))}
 function monthEvents(){return records('주요일정').filter(r=>text(r['일정'])&&isoDate(r['날짜']).slice(0,7)===state.month).sort((a,b)=>isoDate(a['날짜']).localeCompare(isoDate(b['날짜']))||text(a['시간']).localeCompare(text(b['시간'])))}
 function weekGroups(){
  const name=Number(state.month.slice(5))+'월', rows=records(name).filter(r=>text(r['일정']));const groups=[];
  for(const r of rows){const start=isoDate(r['시작일']),end=isoDate(r['종료일']);if(start&&start.slice(0,7)!==state.month&&(!end||end.slice(0,7)!==state.month))continue;
   const label=text(r['주차'])||'주차 미정',key=[label,start,end].join('|');let group=groups.find(g=>g.key===key);
   if(!group){group={key,label,start,end,rows:[]};groups.push(group)}group.rows.push(r);
  }
  return groups.sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));
 }
 function dday(date){const target=isoDate(date);if(!target)return '미설정';const days=Math.round((Date.parse(target+'T00:00:00Z')-Date.parse(todayISO+'T00:00:00Z'))/86400000);return days===0?'D-DAY':days>0?'D-'+days:'D+'+Math.abs(days)}
 function dateShort(date){const d=isoDate(date);return d?`${Number(d.slice(5,7))}.${d.slice(8)}`:'날짜 미정'}
 const weekday=date=>['일','월','화','수','목','금','토'][new Date(date+'T00:00:00Z').getUTCDay()];
 function statusChip(value){const t=text(value)||'미입력',kind=t==='진행 중'?'progress':t==='확인 필요'?'attention':t==='완료'?'done':'';return `<span class="status ${kind}">${escape(t)}</span>`}
 const categoryChip=value=>`<span class="category">${escape(value)}</span>`;
 const empty=message=>`<div class="empty">${escape(message)}</div>`;
 const edit=(name,label='시트에서 수정',row)=>`<a class="text-link" href="${sheetLink(name,row)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
 function resource(value){const url=safeUrl(value);return url?`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">자료 보기 ↗</a>`:text(value)?`<span class="subtle">${escape(value)}</span>`:'<span class="placeholder">—</span>'}
 function monthNav(){return `<div class="month-nav"><button data-month-step="-1" aria-label="이전 달">‹</button><label><span class="sr-only">표시할 월</span><input class="month-input" type="month" min="2000-01" max="2099-12" value="${state.month}"></label><button data-month-step="1" aria-label="다음 달">›</button></div>`}
 function miniCalendar(){
  const [y,m]=state.month.split('-').map(Number),chosen=isoDate(state.day)&&state.day.slice(0,7)===state.month?state.day:`${state.month}-01`,day=Number(chosen.slice(8));
  const start=day-new Date(Date.UTC(y,m-1,day)).getUTCDay();
  return `<section class="panel mini-calendar" aria-label="달력">${monthNav()}<div class="calendar-grid">${['일','월','화','수','목','금','토'].map(d=>`<span class="day-label">${d}</span>`).join('')}${Array.from({length:7},(_,i)=>{const date=new Date(Date.UTC(y,m-1,start+i)),iso=date.toISOString().slice(0,10);return `<button data-date="${iso}" class="${iso===chosen?'selected ':''}${iso.slice(0,7)!==state.month?'outside':''}" aria-label="${iso}" aria-pressed="${iso===chosen}"${iso===todayISO?' aria-current="date"':''}>${date.getUTCDate()}</button>`}).join('')}</div><p class="calendar-note">${chosen===todayISO?'오늘 · ':''}${y}년 ${m}월 ${day}일 (${weekday(chosen)})</p></section>`;
 }
 function businessCard(){
  const rows=ordered(records('사업기본정보')).filter(r=>text(r['항목'])&&!/일$/.test(text(r['항목']))),links=ordered(records('바로가기')).filter(r=>text(r['이름'])&&safeUrl(r['링크']));
  return `<section class="panel business-card"><div class="tab-pair" role="tablist" aria-label="사업 자료"><button role="tab" id="info-tab" aria-controls="business-content" data-business="info" aria-selected="${state.businessTab==='info'}">사업 기본정보</button><button role="tab" id="links-tab" aria-controls="business-content" data-business="links" aria-selected="${state.businessTab==='links'}">바로가기</button></div><div id="business-content" role="tabpanel" aria-labelledby="${state.businessTab==='info'?'info-tab':'links-tab'}">${state.businessTab==='info'?`<dl class="basic">${rows.map(r=>`<div><dt>${escape(r['항목'])}</dt><dd>${text(r['내용'])?escape(r['내용']):'<span class="placeholder">입력 전</span>'}</dd></div>`).join('')}</dl>`:`<div class="quick-links">${links.map(r=>`<a href="${escape(safeUrl(r['링크']))}" target="_blank" rel="noopener noreferrer"><span>${escape(r['이름'])}</span><span>↗</span></a>`).join('')}</div>${links.length?'':empty('등록된 바로가기가 없습니다.')}`}</div><div class="card-foot">${edit(state.businessTab==='info'?'사업기본정보':'바로가기','편집')}</div></section>`;
 }
 function ddayCard(){const fields=info(),isOpen=!!isoDate(fields['오픈목표일']),target=isOpen?fields['오픈목표일']:fields['준비완료일'];return `<section class="panel dday-card"><a class="edit-dot" href="${sheetLink('사업기본정보')}" target="_blank" rel="noopener noreferrer" aria-label="오픈 목표일 수정">✎</a><h2>OPEN D-DAY</h2><div class="dday-number">${dday(target)}</div><p>${target?escape(isoDate(target)):'목표일을 입력해 주세요'}</p><p>${target?(isOpen?'오픈 목표일':'준비완료일 기준'):'사업 기본정보에서 설정'}</p></section>`}
 function eventList(events){return events.length?`<div class="events">${events.map(r=>{const date=isoDate(r['날짜']);return `<article class="event"><div class="event-date">${dateShort(date)}<small>${date?'('+weekday(date)+')':''}</small></div><div><h3>${escape(r['일정'])}</h3>${r['시간']?`<p>${escape(r['시간'])}</p>`:''}${r['장소']?`<p>⌖ ${escape(r['장소'])}</p>`:''}${r['비고']?`<p>${escape(r['비고'])}</p>`:''}</div></article>`}).join('')}</div>`:empty('이번 달 등록된 주요 일정이 없습니다.')}
 function overview(){
  const core=coreTasks(),all=tasks(),cats=categories(),events=monthEvents(),information=records('중요정보').filter(r=>text(r['제목'])||text(r['내용']));
  return `<div class="page-heading"><div><p class="eyebrow">CHINA BUSINESS</p><h1>Overview</h1></div><a class="text-link" href="#schedule">월별 주차 일정 보기 →</a></div><div class="overview-top">${businessCard()}${miniCalendar()}${ddayCard()}</div><div class="overview-main"><section class="panel"><div class="panel-head"><h2>이번 달 핵심업무</h2>${edit('업무관리','업무 수정')}</div>${core.length?`<div class="table-scroll"><table><colgroup><col style="width:48%"><col style="width:25%"><col style="width:27%"></colgroup><thead><tr><th>업무</th><th>분야</th><th>상태</th></tr></thead><tbody>${core.slice(0,6).map(r=>`<tr><td><strong>${escape(r['업무'])}</strong></td><td>${categoryChip(r._category)}</td><td>${statusChip(r['상태'])}</td></tr>`).join('')}</tbody></table></div>`:empty('이달의 핵심업무를 시트에서 선택해 주세요.')}<div class="card-foot"><a class="text-link" href="#tasks">전체 업무 보기 →</a></div></section><section class="panel"><div class="panel-head"><h2>주요 일정</h2>${edit('주요일정','일정 수정')}</div>${eventList(events.slice(0,4))}</section></div><div class="overview-bottom"><section class="panel"><div class="panel-head"><h2>분야별 요약</h2>${edit('카테고리설정','카테고리 설정')}</div><div class="fields">${cats.map(c=>{const rows=all.filter(r=>r._category===c),focus=rows.find(r=>text(r['상태'])==='확인 필요')||rows.find(r=>text(r['상태'])!=='완료')||rows[0];return `<button class="field-row" data-category-route="${escape(c)}"><strong>${escape(c)}</strong><span>${focus?escape(text(focus['다음 할 일'])||text(focus['업무'])):'등록된 업무 없음'}</span><b>›</b></button>`}).join('')}</div>${cats.length?'':empty('카테고리를 추가해 주세요.')}</section><section class="panel"><div class="panel-head"><h2>중요 정보</h2>${edit('중요정보','정보 수정')}</div>${information.length?information.map(r=>`<article class="info-item"><h3>${escape(r['제목'])}</h3><p>${escape(r['내용'])}</p>${safeUrl(r['관련 자료'])?resource(r['관련 자료']):''}</article>`).join(''):empty('공유할 중요 정보를 이곳에 모아두세요.')}</section></div>`;
 }
 function taskRows(rows){return rows.map(r=>`<tr><td>${categoryChip(r._category)}</td><td><strong>${escape(r['업무'])}</strong></td><td>${statusChip(r['상태'])}</td><td>${escape(r['다음 할 일'])||'<span class="placeholder">—</span>'}</td><td class="note">${escape(r['비고'])}</td><td>${resource(r['관련 자료'])}</td></tr>`).join('')}
 function taskTable(rows){return `<div class="table-scroll"><table class="task-table"><colgroup><col style="width:13%"><col style="width:23%"><col style="width:11%"><col style="width:21%"><col style="width:21%"><col style="width:11%"></colgroup><thead><tr>${['카테고리','업무','상태','다음 할 일','비고','관련 자료'].map(c=>`<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${taskRows(rows)}</tbody></table></div>`}
 function tasksPage(){
  const cats=categories(),all=tasks();if(all.some(r=>r._category==='미분류'))cats.push('미분류');if(state.category&&!cats.includes(state.category))state.category='';
  const rows=visibleTasks(all),done=rows.filter(r=>text(r['상태'])==='완료'),active=rows.filter(r=>text(r['상태'])!=='완료');
  return `<div class="page-heading"><div><h1>업무</h1><p>파트별 진행상황과 다음 할 일을 확인하세요.</p></div><div class="heading-tools"><a class="btn primary" href="${sheetLink('업무관리')}" target="_blank" rel="noopener noreferrer">구글 시트에서 수정 ↗</a></div></div><div class="task-controls"><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">업무 검색</span><input id="task-search" type="search" placeholder="업무 검색" value="${escape(state.query)}"></label><div class="filter-chips" aria-label="카테고리 필터"><button data-category="" aria-pressed="${!state.category}">전체</button>${cats.map(c=>`<button data-category="${escape(c)}" aria-pressed="${state.category===c}">${escape(c)}</button>`).join('')}</div><label><span class="sr-only">상태 필터</span><select id="status-filter" class="status-select"><option value="">상태 전체</option>${STATUSES.map(s=>`<option${s===state.status?' selected':''}>${s}</option>`).join('')}</select></label></div><section class="panel" id="tasks-results" aria-label="업무 목록">${state.status==='완료'?(done.length?taskTable(done):empty('완료된 업무가 없습니다.')):active.length?taskTable(active):empty(state.query||state.category||state.status?'조건에 맞는 업무가 없습니다.':'등록된 진행 업무가 없습니다.')}</section>${!state.status&&done.length?`<details class="completed"><summary>완료 업무 펼치기</summary>${taskTable(done)}</details>`:''}<p class="inline-hint">${edit('카테고리설정','카테고리 추가·삭제')} · 상태는 업무관리 시트의 드롭다운에서 선택할 수 있어요.</p>`;
 }
 function scheduleTable(rows,goal=false){return `<div class="table-scroll"><table class="schedule-table"><colgroup><col><col><col></colgroup><thead><tr><th scope="col">분야</th><th scope="col">${goal?'핵심 목표':'일정'}</th><th scope="col">비고</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${categoryChip(r['분야'])}</td><td>${escape(r[goal?'핵심 목표':'일정'])}</td><td class="subtle">${escape(r['비고'])}</td></tr>`).join('')}</tbody></table></div>`}
 function schedulePage(){
  const groups=weekGroups(),goals=records('월별목표').filter(r=>monthKey(r['월'])===state.month&&text(r['핵심 목표'])),name=Number(state.month.slice(5))+'월',months=Object.keys(state.data?.tables||{}).filter(n=>/^(?:[1-9]|1[0-2])월$/.test(n)).sort((a,b)=>parseInt(a)-parseInt(b));
  return `<div class="page-heading"><div><h1>일정</h1><p>월별 목표와 주차별 실행 일정을 확인하세요.</p></div><div class="heading-tools">${monthNav()}<a class="btn primary" href="${sheetLink(name)||sheetLink('월별목표')}" target="_blank" rel="noopener noreferrer">구글 시트에서 수정 ↗</a></div></div><div class="month-tabs" aria-label="월별 일정">${months.map(n=>`<button data-schedule-month="${parseInt(n)}" aria-pressed="${parseInt(n)===parseInt(state.month.slice(5))}">${n}</button>`).join('')}<span class="subtle" style="align-self:center;margin-left:auto">${state.month.slice(0,4)}년</span></div><section class="panel schedule-panel"><details open><summary>이번 달 핵심 일정</summary>${goals.length?scheduleTable(goals,true):empty('이번 달 핵심 일정이 없습니다.')}<div class="card-foot">${edit('월별목표','월 목표 수정')}</div></details></section>${groups.length?groups.map(g=>`<section class="panel schedule-panel"><div class="panel-head"><div class="week-title"><h2>${escape(g.label)}</h2>${g.start||g.end?`<time>${g.start?dateShort(g.start):'미정'} – ${g.end?dateShort(g.end):'미정'}</time>`:'<span class="week-tag">주차를 지정해 주세요</span>'}</div>${edit(name,'수정',g.rows[0]._row)}</div>${scheduleTable(g.rows)}</section>`).join(''):`<section class="panel schedule-panel">${empty('등록된 주차별 일정이 없습니다.')}</section>`}<section class="panel schedule-panel"><div class="panel-head"><h2>미팅·방문 일정</h2>${edit('주요일정','일정 수정')}</div>${eventList(monthEvents())}</section><p class="inline-hint">${edit('사용안내','시트 수정 안내')} · 같은 주차 이름·시작일·종료일을 입력하면 한 구간으로 표시됩니다.</p>`;
 }
 function render(){
  const root=document.getElementById('content');document.querySelectorAll('[data-page]').forEach(el=>{if(el.dataset.page===state.page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  document.title=`${state.page==='tasks'?'업무':state.page==='schedule'?'일정':'Overview'} | velyB 중국사업`;
  if(!state.data){if(state.error)root.innerHTML=`<section class="panel">${empty('구글 시트를 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.')}</section>`;return}
  root.innerHTML=state.page==='tasks'?tasksPage():state.page==='schedule'?schedulePage():overview();root.setAttribute('aria-busy','false');
 }
 function setMonth(value){const m=monthKey(value);if(!m)return;state.month=m;const day=Math.min(Number(state.day.slice(8))||1,new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate());state.day=`${m}-${String(day).padStart(2,'0')}`;render()}
 let pending=null;
 async function refresh(){
  if(pending)return pending;
  state.loading=true;document.getElementById('refresh').disabled=true;document.getElementById('sync').textContent='불러오는 중…';
  pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);try{
   const res=await fetch(ENDPOINT+'?cacheBust='+Date.now(),{cache:'no-store',signal:controller.signal});if(!res.ok)throw Error('응답 오류');const data=await res.json();
   const required=['업무관리','카테고리설정','사업기본정보','바로가기','월별목표','중요정보','주요일정'];
   if(required.some(n=>!Array.isArray(data.tables?.[n]?.headers)||!Array.isArray(data.tables?.[n]?.rows)||data.tables[n].error))throw Error('시트 연결 확인 필요');
   state.data=data;state.error='';state.updated=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
   document.getElementById('sync').textContent='✓ '+state.updated+' 동기화';document.getElementById('notice').innerHTML='';render();
  }catch(error){state.error=error.name==='AbortError'?'연결 응답이 지연되고 있어요.':'구글 시트 연결을 확인해 주세요.';document.getElementById('sync').textContent='동기화 확인 필요';document.getElementById('notice').innerHTML=`<div class="notice">${escape(state.error)}${state.data?' 마지막으로 불러온 내용을 표시합니다.':''}<button data-retry>다시 시도</button></div>`;render();
  }finally{clearTimeout(timer);state.loading=false;pending=null;document.getElementById('refresh').disabled=false}})();return pending;
 }
 function setup(){
  document.getElementById('manage').href=sheetLink('업무관리');document.getElementById('help').href=sheetLink('사용안내');document.getElementById('refresh').addEventListener('click',refresh);
  window.addEventListener('hashchange',()=>{state.page=route();render();window.scrollTo({top:0,behavior:'instant'})});
  document.addEventListener('click',e=>{
   const button=e.target.closest('button');if(!button)return;
   if(button.hasAttribute('data-retry'))refresh();
   else if(button.hasAttribute('data-business')){state.businessTab=button.dataset.business;render();document.getElementById(state.businessTab==='info'?'info-tab':'links-tab')?.focus()}
   else if(button.hasAttribute('data-category')){state.category=button.dataset.category;render()}
   else if(button.hasAttribute('data-category-route')){state.category=button.dataset.categoryRoute;state.status='';state.query='';location.hash='tasks'}
   else if(button.hasAttribute('data-month-step')){const [y,m]=state.month.split('-').map(Number),date=new Date(Date.UTC(y,m-1+Number(button.dataset.monthStep),1));setMonth(date.toISOString().slice(0,7))}
   else if(button.hasAttribute('data-date')){state.day=button.dataset.date;state.month=state.day.slice(0,7);render()}
   else if(button.hasAttribute('data-schedule-month'))setMonth(state.month.slice(0,4)+'-'+button.dataset.scheduleMonth.padStart(2,'0'));
  });
  document.addEventListener('change',e=>{if(e.target.matches('.month-input'))setMonth(e.target.value);if(e.target.id==='status-filter'){state.status=e.target.value;render();document.getElementById('status-filter')?.focus()}});
  document.addEventListener('input',e=>{if(e.target.id!=='task-search')return;state.query=e.target.value;const start=e.target.selectionStart;render();const input=document.getElementById('task-search');input.focus();try{input.setSelectionRange(start,start)}catch{}});
  document.addEventListener('keydown',e=>{if(e.target.getAttribute('role')==='tab'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();state.businessTab=state.businessTab==='info'?'links':'info';render();document.getElementById(state.businessTab==='info'?'info-tab':'links-tab')?.focus()}});
  render();refresh();setInterval(()=>{if(!document.hidden)refresh()},300000);
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={state,isoDate,monthKey,safeUrl,records,categories,tasks,visibleTasks,coreTasks,weekGroups,dday,overview,tasksPage,schedulePage};
 else setup();
})();
