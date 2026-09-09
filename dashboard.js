'use strict';
const SCHEDULE_URL='https://script.google.com/macros/s/AKfycbyUdBAku0GYKoFFgm_0FLB7GgRj7mV8S_rvCBOG5MJkGAkqXRgYNJRIXBhWfIiuOZlA/exec';
// Set once on deployment to share the menu connection across browsers.
const MENU_URL='';
const defaults=[['Overview','overview'],['일정','schedule'],['장비·약물','장비약물'],['법인·인허가','법인인허가'],['인테리어','인테리어'],['인사·조직','인사조직'],['운영시스템','운영시스템'],['마케팅','마케팅'],['계약·법무','계약법무']].map(([name,sheet],order)=>({name,sheet,order,visible:true,type:sheet==='overview'||sheet==='schedule'?sheet:'table'}));
const goals=[['① 법인·인허가','법인 설립 및 계좌 개설, 1호점 인허가 절차 진행','9/20 중국 법인 설립 예정'],['② 인테리어 착공','설계안 확정 → 공사 착공 및 진행','도면 수정 중'],['③ 정식 파트별 채용','파트별 채용 진행 → 주요 포지션 확정','채용공고 내용 전달 요청 완'],['④ 장비·약품 및 CRM','업체·품목 확정 → 계약·발주','양측 팀 진행 중'],['⑤ 마케팅 채널','메이퇀·SNS·위챗 등 주요 채널 개설 및 입점 준비','법인 설립 후 즉시 진행 준비'],['⑥ SOP·법무문서','운영 SOP 및 근로계약서·동의서·내부 규정 구축 완료','계약서 초안 완, 기타 작성중']];
let menus=defaults, tables={}, rows=[], selected='overview', week='core', scheduleState='loading', menuState='default', generation=0;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function savedURL(){try{return localStorage.getItem('velyb-menu-url')||MENU_URL}catch{return MENU_URL}}
let endpoint=savedURL();
function validURL(value){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value)}
function normalizeMenus(input){if(!Array.isArray(input))throw Error('메뉴 형식 오류');const seen=new Set();return input.filter(m=>m.visible===true||String(m.visible).toUpperCase()==='TRUE'||String(m.visible).toUpperCase()==='ON').map((m,i)=>{const sheet=String(m.sheet||'').trim(),name=String(m.name||'').trim();if(!sheet||!name||seen.has(sheet))throw Error('메뉴명과 데이터시트를 확인해 주세요. 데이터시트는 중복될 수 없습니다.');seen.add(sheet);return{name,sheet,type:sheet==='overview'||sheet==='schedule'?sheet:'table',order:Number.isFinite(Number(m.order))?Number(m.order):i}}).sort((a,b)=>a.order-b.order)}
function table(headers,data){return '<div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+data.map(r=>'<tr>'+headers.map((_,i)=>'<td>'+esc(r[i])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function goalView(){return '<h2>9월 핵심 추진 목표</h2><p class="subtle">기존 대시보드에 저장된 목표입니다. 이 요약은 아직 시트와 연동되지 않았습니다.</p>'+table(['분야','9월 목표','비고'],goals)}
function render(){
 $('menu').innerHTML=menus.map(m=>'<button data-sheet="'+esc(m.sheet)+'" '+(m.sheet===selected?'aria-current="page"':'')+'>'+esc(m.name)+'</button>').join('');
 const item=menus.find(m=>m.sheet===selected);$('title').textContent=item?.name||'메뉴 없음';
 $('connection').textContent=(scheduleState==='ready'?'일정 연결됨':scheduleState==='loading'?'일정 불러오는 중…':'일정 연결 오류 · 새로고침을 눌러 다시 시도해 주세요.')+' · '+({default:'기본 메뉴 표시 중 · 메뉴 시트 미연결',loading:'메뉴 시트 불러오는 중…',ready:'메뉴 시트 연결됨',error:'메뉴 연결 오류 · 마지막으로 불러온 메뉴 표시 중'}[menuState]);
 if(!item){$('content').innerHTML='<div class="panel">표시할 메뉴가 없습니다. 메뉴설정 시트에서 표시를 체크해 주세요.</div>';return}
 if(item.type==='overview'){$('content').innerHTML=goalView()+'<h2>업무 분야</h2><div class="grid">'+menus.filter(m=>m.type==='table').map(m=>'<button class="card" data-sheet="'+esc(m.sheet)+'"><strong>'+esc(m.name)+'</strong><span>'+(tables[m.sheet]?.error?'내용 연결 오류':tables[m.sheet]?.rows?.length?tables[m.sheet].rows.length+'개 항목':menuState==='ready'?'등록된 내용 없음':'데이터 연결 전')+'</span></button>').join('')+'</div>';return}
 if(item.type==='schedule'){
 const weeks=[...new Set(['2주차','3주차','4주차',...rows.map(r=>r.week)])];
 $('content').innerHTML='<div class="tabs" aria-label="일정 구분">'+['core',...weeks].map(w=>'<button data-week="'+esc(w)+'" aria-pressed="'+(w===week)+'">'+esc(w==='core'?'9월 핵심 추진 목표':w)+'</button>').join('')+'</div>';
 if(week==='core')$('content').innerHTML+=goalView();
 else if(scheduleState!=='ready')$('content').innerHTML+='<div class="panel">'+(scheduleState==='loading'?'일정을 불러오는 중입니다.':'일정을 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.')+'</div>';
 else{const list=rows.filter(r=>r.week===week);$('content').innerHTML+='<h2>'+esc(week)+' · '+list.length+'개 분야</h2>'+(list.length?table(['분야','일정','비고'],list.map(r=>[r.field,r.schedule,r.note])):'<div class="panel">일정이 없습니다.</div>')}
 return}
 const data=tables[item.sheet];
 if(data?.error){$('content').innerHTML='<div class="panel error">'+esc(data.error)+'</div>';return}
 $('content').innerHTML=data?.rows?.length?table(data.headers,data.rows):'<div class="panel"><h2>아직 등록된 내용이 없습니다.</h2><p>'+(menuState==='ready'?'연결된 시트에 업무를 추가한 뒤 새로고침해 주세요.':'메뉴 시트 연결 후 이 분야의 업무를 표시합니다.')+'</p></div>';
}
async function json(url){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(url+'?cacheBust='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('연결 실패');return await response.json()}finally{clearTimeout(timer)}}
async function refresh(){const run=++generation;scheduleState='loading';menuState=endpoint?'loading':'default';render();await Promise.allSettled([
 (async()=>{try{const data=await json(SCHEDULE_URL);if(!Array.isArray(data))throw Error('일정 형식 오류');if(run!==generation)return;rows=data.map(r=>({week:String(r.week||'').trim(),field:String(r.field||'').trim(),schedule:String(r.schedule||''),note:String(r.note||'')})).filter(r=>r.week&&r.field&&r.week!=='주차');scheduleState='ready'}catch{if(run===generation)scheduleState='error'}finally{if(run===generation)render()}})(),
 (async()=>{if(!endpoint)return;try{if(!validURL(endpoint))throw Error('잘못된 주소');const data=await json(endpoint);if(data.error)throw Error(data.error);const next=normalizeMenus(data.menus);if(!data.tables||typeof data.tables!=='object'||Array.isArray(data.tables))throw Error('데이터 형식 오류');for(const t of Object.values(data.tables)){if(!t.error&&(!Array.isArray(t.headers)||!Array.isArray(t.rows)||!t.rows.every(Array.isArray)))throw Error('표 형식 오류')}if(run!==generation)return;menus=next;tables=data.tables;menuState='ready';if(!menus.some(m=>m.sheet===selected))selected=menus[0]?.sheet||''}catch{if(run===generation)menuState='error'}finally{if(run===generation)render()}})()
 ]);}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.sheet!==undefined){selected=b.dataset.sheet;render()}if(b.dataset.week!==undefined){week=b.dataset.week;render()}});
$('refresh').onclick=refresh;$('print').onclick=()=>window.print();$('endpoint').value=endpoint;
$('connect').onclick=()=>{const value=$('endpoint').value.trim();if(!validURL(value)){$('settings-message').textContent='Google Apps Script의 /exec로 끝나는 연결 주소를 입력해 주세요.';return}try{localStorage.setItem('velyb-menu-url',value);$('settings-message').textContent='이 브라우저에 연결 주소를 저장했습니다.'}catch{$('settings-message').textContent='주소를 저장할 수 없어 이번 화면에서만 연결합니다.'}endpoint=value;refresh()};
$('disconnect').onclick=()=>{try{localStorage.removeItem('velyb-menu-url')}catch{}endpoint='';$('endpoint').value='';menus=defaults;tables={};selected='overview';$('settings-message').textContent='기본 메뉴로 전환했습니다.';refresh()};
refresh();
