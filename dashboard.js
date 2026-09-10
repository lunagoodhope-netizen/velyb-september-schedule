'use strict';
const SCHEDULE_URL='https://script.google.com/macros/s/AKfycbyUdBAku0GYKoFFgm_0FLB7GgRj7mV8S_rvCBOG5MJkGAkqXRgYNJRIXBhWfIiuOZlA/exec';
// Set once on deployment to share the menu connection across browsers.
const MENU_URL='https://script.google.com/macros/s/AKfycbwfnXwjf8hKbxSIp4vsW929JqRaT96vIK_70tPrlBzcdMikXdzdQ573DQq2RLGvTF6IKQ/exec';
const defaults=[['Overview','overview'],['일정','schedule'],['장비 리스트','장비리스트'],['약물 리스트','약물리스트'],['법인·인허가','법인인허가'],['인테리어','인테리어'],['인사·조직','인사조직'],['운영시스템','운영시스템'],['마케팅','마케팅'],['계약·법무','계약법무']].map(([name,sheet],order)=>({name,sheet,order,visible:true,type:sheet==='overview'||sheet==='schedule'?sheet:'table'}));
const goals=[['① 법인·인허가','법인 설립 및 계좌 개설, 1호점 인허가 절차 진행','9/20 중국 법인 설립 예정'],['② 인테리어 착공','설계안 확정 → 공사 착공 및 진행','도면 수정 중'],['③ 정식 파트별 채용','파트별 채용 진행 → 주요 포지션 확정','채용공고 내용 전달 요청 완'],['④ 장비·약품 및 CRM','업체·품목 확정 → 계약·발주','양측 팀 진행 중'],['⑤ 마케팅 채널','메이퇀·SNS·위챗 등 주요 채널 개설 및 입점 준비','법인 설립 후 즉시 진행 준비'],['⑥ SOP·법무문서','운영 SOP 및 근로계약서·동의서·내부 규정 구축 완료','계약서 초안 완, 기타 작성중']];
let menus=defaults, tables={}, rows=[], selected='overview', week='core', scheduleState='loading', menuState='default', generation=0;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function savedURL(){try{return localStorage.getItem('velyb-menu-url')||MENU_URL}catch{return MENU_URL}}
let endpoint=savedURL();
let taskOwner=null;
let taskOwners=[];
let collaborationCategory=null;
let collaborationCategories=[];
const checked=value=>value===true||['TRUE','ON'].includes(String(value).trim().toUpperCase());
function collaborationView(data){
 if(!data)return '<div class="panel">협업 요청을 불러오지 못했습니다. 새로고침을 눌러 주세요.</div>';
 const headers=['협업 구분','요청사항','담당자','마감일','완료','표시','비고'];
 const indices=headers.map(h=>data.headers.findIndex(v=>(v.trim()==='요청 일정'?'마감일':v.trim())===h));
 if(indices.some(i=>i<0))return '<div class="panel">협업요청 시트 첫 행을 확인해 주세요: '+headers.join(' / ')+'</div>';
 const records=data.rows.map(r=>indices.map(i=>String(r[i]??'').trim())).filter(r=>checked(r[5]));
 const typeIndex=data.headers.findIndex(h=>h.trim()==='구분');
 const typed=data.rows.filter(r=>checked(r[indices[5]])).map(r=>({values:indices.map(i=>String(r[i]??'').trim()),kind:typeIndex<0?'상세 요청':String(r[typeIndex]||'상세 요청').trim()}));
 collaborationCategories=[...new Set(records.map(r=>r[0]||'기타'))];
 if(collaborationCategory!==null&&!collaborationCategories.includes(collaborationCategory))collaborationCategory=null;
 const all=collaborationCategory===null;
 const scopeRows=typed.filter(r=>r.kind==='지원 범위'&&r.values[1]);
 const scopeHTML=list=>list.map(({values:r})=>'<div style="padding:12px 0;border-bottom:1px solid var(--line)"><p style="margin:0">'+(checked(r[4])?'<s>':'')+esc(r[1])+(checked(r[4])?'</s> <span>완료</span>':'')+'</p><p class="subtle">'+esc(r[2]||'담당자 미정')+(r[3]?' · '+esc(r[3]):'')+'</p>'+(r[6]?'<p class="subtle">'+esc(r[6])+'</p>':'')+'</div>').join('');
 if(all)return '<p class="subtle">분야별 지원 범위를 확인하고, 분야를 눌러 상세 요청을 확인하세요.</p><div class="grid">'+collaborationCategories.map((name,i)=>{const scopes=scopeRows.filter(r=>(r.values[0]||'기타')===name);return '<section class="panel"><h2 style="margin-top:0">'+esc(name)+'</h2>'+(scopes.length?scopeHTML(scopes):'<p class="subtle">등록된 지원 범위가 없습니다.</p>')+'<div class="toolbar"><button data-category="'+i+'" aria-label="'+esc(name)+' 상세 요청 보기">상세 요청 보기 →</button></div></section>'}).join('')+'</div>'+(collaborationCategories.length?'':'<div class="panel">표시 중인 협업 분야가 없습니다.</div>');
 const filtered=typed.filter(r=>r.kind!=='지원 범위'&&r.values[1]&&(r.values[0]||'기타')===collaborationCategory).map(r=>r.values);
 const due=r=>{const value=r[3].replace(/\./g,'-').replace(/\//g,'-').replace(/\s/g,'').replace(/-$/,'');const match=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);if(!match)return Infinity;const iso=match[1]+'-'+match[2].padStart(2,'0')+'-'+match[3].padStart(2,'0');return dateNumber(iso)??Infinity};
 filtered.sort((a,b)=>{const x=due(a),y=due(b);return x===y?0:x-y});
 const tabs='<div class="tabs" aria-label="협업 분야"><button data-category="all">← 지원 범위 전체</button>'+collaborationCategories.map((c,i)=>'<button data-category="'+i+'" aria-pressed="'+(c===collaborationCategory)+'">'+esc(c)+'</button>').join('')+'</div>';
 const columns=all?['협업 구분','요청사항','담당자','마감일','완료','비고']:['요청사항','담당자','마감일','완료','비고'];
 const body=filtered.map(r=>{const done=checked(r[4]);const cells=[(done?'<s>':'')+esc(r[1])+(done?'</s>':''),esc(r[2]||'—'),esc(r[3]||'미정'),done?'☑ 완료':'☐',esc(r[6])];if(all)cells.unshift(esc(r[0]||'기타'));return '<tr>'+cells.map(v=>'<td>'+v+'</td>').join('')+'</tr>'}).join('');
 const scopes=scopeRows.filter(r=>(r.values[0]||'기타')===collaborationCategory);
 return tabs+'<h2>'+esc(collaborationCategory)+'</h2>'+(scopes.length?'<details style="margin-bottom:18px"><summary>지원 범위</summary><div class="panel">'+scopeHTML(scopes)+'</div></details>':'')+'<h2>상세 요청</h2>'+(filtered.length?'<div class="table-wrap"><table><thead><tr>'+columns.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div>':'<div class="panel">표시 중인 상세 요청이 없습니다.</div>');
}
function taskView(data){
 if(!data)return '<div class="panel">업무 시트를 불러오는 중입니다.</div>';
 const ownerCol=data.headers.findIndex(h=>h.trim()==='담당자');
 if(ownerCol<0)return '<div class="panel">담당자별업무 시트 첫 행에 담당자 / 할 일 / 마감일 / 상태 / 비고를 입력해 주세요.</div>';
 taskOwners=[...new Set(data.rows.map(r=>String(r[ownerCol]||'').trim()))].sort((a,b)=>a.localeCompare(b,'ko'));
 if(taskOwner!==null&&!taskOwners.includes(taskOwner))taskOwner=null;
 const visible=taskOwner===null?data.rows:data.rows.filter(r=>String(r[ownerCol]||'').trim()===taskOwner);
 const controls='<div class="tabs" aria-label="담당자 선택"><button data-owner="all" aria-pressed="'+(taskOwner===null)+'">전체</button>'+taskOwners.map((name,i)=>'<button data-owner="'+i+'" aria-pressed="'+(taskOwner===name)+'">'+esc(name||'담당자 미지정')+'</button>').join('')+'</div>';
 return '<p class="subtle">담당자를 선택해 전달받은 업무를 확인하세요. 업무 변경 후 새로고침을 누르면 최신 내용이 표시됩니다.</p>'+controls+'<p class="subtle">'+esc(taskOwner===null?'전체 업무':taskOwner||'담당자 미지정')+' · '+visible.length+'건</p>'+(visible.length?table(data.headers,visible):'<div class="panel">아직 등록된 업무가 없습니다.</div>');
}
function validURL(value){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value)}
function normalizeMenus(input){if(!Array.isArray(input))throw Error('메뉴 형식 오류');const seen=new Set();return input.filter(m=>m.visible===true||String(m.visible).toUpperCase()==='TRUE'||String(m.visible).toUpperCase()==='ON').map((m,i)=>{const sheet=String(m.sheet||'').trim(),name=String(m.name||'').trim();if(!sheet||!name||seen.has(sheet))throw Error('메뉴명과 데이터시트를 확인해 주세요. 데이터시트는 중복될 수 없습니다.');seen.add(sheet);return{name,sheet,type:sheet==='overview'||sheet==='schedule'?sheet:'table',order:Number.isFinite(Number(m.order))?Number(m.order):i}}).sort((a,b)=>a.order-b.order)}
function table(headers,data){return '<div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+data.map(r=>'<tr>'+headers.map((_,i)=>'<td>'+esc(r[i])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function resourceCell(value){
 const raw=String(value??'').trim();
 if(!raw)return '<span class="subtle">—</span>';
 try{const url=new URL(raw);if(url.protocol==='https:'&&!url.username&&!url.password)return '<a class="resource-link" href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">📁 자료보기</a>'}catch{}
 return esc(raw);
}
function inventoryStatus(value){
 const text=String(value??'').trim()||'미입력';
 const color=/^(완료|도입 완료|계약 완료|발주 완료)$/.test(text)?'#23573b':/필요|미수신|이슈/.test(text)?'#873b33':/대기|예정/.test(text)?'#73510e':/연락 중|진행|수신/.test(text)?'#254c82':'var(--muted)';
 return '<span style="display:inline-block;font-size:14px;color:'+color+'">'+esc(text)+'</span>';
}
function inventoryView(data){
 const columns=data.headers.map((h,index)=>({name:String(h).trim(),index})).filter(c=>c.name&&!/유통|담당자|연락처|이메일|전화|이메일|email/i.test(c.name));
 const kind=name=>/관련자료|자료링크/.test(name)?'resource':/비고/.test(name)?'note':/제품|명칭/.test(name)?'product':/브랜드|제조사/.test(name)?'brand':/담당팀/.test(name)?'team':/분류/.test(name)?'category':/상태/.test(name)?'status':'other';
 columns.sort((a,b)=>(kind(a.name)==='note'?1:0)-(kind(b.name)==='note'?1:0));
 return '<p class="subtle">총 '+data.rows.length+'개 품목</p><div class="table-wrap inventory-wrap" role="region" aria-label="품목 목록" tabindex="0"><table class="inventory-table"><colgroup>'+columns.map(c=>'<col class="inventory-'+kind(c.name)+'">').join('')+'</colgroup><thead><tr>'+columns.map(c=>'<th scope="col">'+esc(c.name)+'</th>').join('')+'</tr></thead><tbody>'+data.rows.map(r=>'<tr>'+columns.map(c=>'<td>'+(kind(c.name)==='resource'?resourceCell(r[c.index]):kind(c.name)==='status'?inventoryStatus(r[c.index]):esc(r[c.index]))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}

const inventoryFilters=Object.create(null);
function filteredInventoryView(data,sheet){
 if(!data)return '<div class="panel">목록을 불러오지 못했습니다. 새로고침을 눌러 주세요.</div>';
 const productIndex=data.headers.findIndex(h=>String(h).trim()==='제품');
 const statusIndex=data.headers.findIndex(h=>String(h).trim()==='진행상태');
 const records=data.rows.filter(r=>productIndex<0?r.some(v=>String(v??'').trim()):String(r[productIndex]??'').trim());
 const status=r=>String(r[statusIndex]??'').trim()||'미입력';
 const statuses=[...new Set(records.map(status))];
 let filter=inventoryFilters[sheet]||'';
 if(filter&&!statuses.includes(filter)){filter='';inventoryFilters[sheet]=''}
 const visible=records.filter(r=>!filter||status(r)===filter);
 const controls=statusIndex<0?'':'<div class="toolbar"><label for="inventory-status" style="margin:0">진행상태 <select id="inventory-status" style="font:inherit;color:inherit;padding:8px 12px;background:white;border:1px solid var(--line);border-radius:8px;max-width:100%"><option value="">전체 상태</option>'+statuses.map(s=>'<option value="'+esc(s)+'"'+(s===filter?' selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label></div>';
 return controls+'<p class="subtle">전체 '+records.length+'개 · 표시 '+visible.length+'개</p>'+(visible.length?inventoryView({...data,rows:visible}).replace(/^<p class="subtle">총 .*?<\/p>/,''):'<div class="panel">아직 등록된 제품이 없습니다.</div>');
}
document.addEventListener('change',e=>{if(e.target.id!=='inventory-status')return;inventoryFilters[selected]=e.target.value;render();$('inventory-status')?.focus()});

function goalView(){return '<h2>9월 핵심 추진 목표</h2><p class="subtle">기존 대시보드에 저장된 목표입니다. 이 요약은 아직 시트와 연동되지 않았습니다.</p>'+table(['분야','9월 목표','비고'],goals)}
function crmView(data){
 const edit='https://docs.google.com/spreadsheets/d/1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA/edit#gid=215072242';
 const top='<div class="toolbar"><a href="'+edit+'" target="_blank" rel="noopener noreferrer">CRM 자료 수정 ↗</a></div>';
 if(!data)return top+'<div class="panel">CRM 자료를 불러오지 못했습니다. 새로고침해 주세요.</div>';
 if(data.error)return top+'<div class="panel error">'+esc(data.error)+'</div>';
 const names=['분류','제목','설명','자료 링크','영상 링크'];
 const cols=names.map(h=>data.headers.findIndex(v=>String(v).trim()===h));
 if(cols.some(i=>i<0))return top+'<div class="panel">CRM 시트의 첫 행을 확인해 주세요: '+names.join(' · ')+'</div>';
 const list=data.rows.map(r=>cols.map(i=>r[i]??'')).filter(r=>String(r[1]).trim());
 const link=(value,label)=>resourceCell(value).replace('📁 자료보기',label);
 return top+(list.length?'<div class="table-wrap"><table><thead><tr>'+['분류','제목','설명','자료보기'].map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+list.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td><td>'+(r[3]||r[4]?[r[3]?link(r[3],'자료 / 텍스트'):null,r[4]?link(r[4],'동영상'):null].filter(Boolean).join('<br>'):'<span class="subtle">자료 등록 전</span>')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="panel">등록된 CRM 자료가 없습니다.</div>');
}
function render(){
 const inventorySheets=['약물리스트','장비리스트'];
 const inventoryMenus=inventorySheets.map(sheet=>menus.find(m=>m.sheet===sheet)).filter(Boolean);
 const inInventory=inventorySheets.includes(selected);
 let groupShown=false;
 const operationMenus=menus.filter(m=>['운영시스템','CRM'].includes(m.sheet));
 const inOperations=['운영시스템','CRM'].includes(selected);
 let operationsShown=false;
 const navigation=menus.flatMap(m=>{
  if(['운영시스템','CRM'].includes(m.sheet)){
   if(operationsShown)return [];
   operationsShown=true;
   return [{name:'운영시스템',sheet:inOperations?selected:(operationMenus.find(m=>m.sheet==='CRM')||m).sheet}];
  }
  if(!inventorySheets.includes(m.sheet))return [m];
  if(groupShown)return [];
  groupShown=true;
  return [{name:'약물·장비',sheet:inInventory?selected:inventoryMenus[0].sheet}];
 });
 $('menu').innerHTML=navigation.map(m=>'<button data-sheet="'+esc(m.sheet)+'" '+(m.sheet===selected?'aria-current="page"':'')+'>'+esc(m.name)+'</button>').join('');
 const item=menus.find(m=>m.sheet===selected);$('title').textContent=inInventory&&item?'약물·장비':item?.name||'메뉴 없음';
 $('connection').textContent=(scheduleState==='ready'?'일정 연결됨':scheduleState==='loading'?'일정 불러오는 중…':'일정 연결 오류 · 새로고침을 눌러 다시 시도해 주세요.')+' · '+({default:'기본 메뉴 표시 중 · 메뉴 시트 미연결',loading:'메뉴 시트 불러오는 중…',ready:'메뉴 시트 연결됨',error:'메뉴 연결 오류 · 마지막으로 불러온 메뉴 표시 중'}[menuState]);
 if(!item){$('content').innerHTML='<div class="panel">표시할 메뉴가 없습니다. 메뉴설정 시트에서 표시를 체크해 주세요.</div>';return}
 if(item.type==='overview'){$('content').innerHTML=overviewView();return}
 if(item.type==='schedule'){
 const weeks=[...new Set(['2주차','3주차','4주차',...rows.map(r=>r.week)])];
 $('content').innerHTML='<div class="tabs" aria-label="일정 구분">'+['core',...weeks].map(w=>'<button data-week="'+esc(w)+'" aria-pressed="'+(w===week)+'">'+esc(w==='core'?'9월 핵심 추진 목표':w)+'</button>').join('')+'</div>';
 if(week==='core')$('content').innerHTML+=goalView();
 else if(scheduleState!=='ready')$('content').innerHTML+='<div class="panel">'+(scheduleState==='loading'?'일정을 불러오는 중입니다.':'일정을 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.')+'</div>';
 else{const list=rows.filter(r=>r.week===week);$('content').innerHTML+='<h2>'+esc(week)+' · '+list.length+'개 분야</h2>'+(list.length?table(['분야','일정','비고'],list.map(r=>[r.field,r.schedule,r.note])):'<div class="panel">일정이 없습니다.</div>')}
 return}
 const data=tables[item.sheet];
 if(inOperations){
  $('title').textContent='운영시스템';
  const tabs='<div class="tabs" aria-label="운영시스템">'+operationMenus.map(m=>'<button data-sheet="'+esc(m.sheet)+'" aria-pressed="'+(m.sheet===selected)+'">'+esc(m.sheet==='운영시스템'?'운영 현황':m.name)+'</button>').join('')+'</div>';
  $('content').innerHTML=tabs+(item.sheet==='CRM'?crmView(data):data?.error?'<div class="panel error">'+esc(data.error)+'</div>':data?.rows?.length?table(data.headers,data.rows):'<div class="panel">등록된 운영 현황이 없습니다.</div>');
  return;
 }
 if(inInventory){
  const tabs='<div class="tabs" aria-label="약물·장비 목록">'+inventoryMenus.map(m=>'<button data-sheet="'+esc(m.sheet)+'" aria-pressed="'+(m.sheet===selected)+'">'+esc(m.name)+'</button>').join('')+'</div>';
  $('content').innerHTML=tabs+'<h2>'+esc(item.name)+'</h2>'+(data?.error?'<div class="panel error">'+esc(data.error)+'</div>':filteredInventoryView(data,item.sheet));
  return;
 }
 if(data?.error){$('content').innerHTML='<div class="panel error">'+esc(data.error)+'</div>';return}
 if(item.sheet==='협업요청'){$('content').innerHTML=collaborationView(data);return}
 if(item.sheet==='담당자별업무'){$('content').innerHTML=taskView(data);return}
 $('content').innerHTML=data?.rows?.length?table(data.headers,data.rows):'<div class="panel"><h2>아직 등록된 내용이 없습니다.</h2><p>'+(menuState==='ready'?'연결된 시트에 업무를 추가한 뒤 새로고침해 주세요.':'메뉴 시트 연결 후 이 분야의 업무를 표시합니다.')+'</p></div>';
}
async function json(url){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(url+'?cacheBust='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('연결 실패');return await response.json()}finally{clearTimeout(timer)}}
async function refresh(){const run=++generation;scheduleState='loading';menuState=endpoint?'loading':'default';render();await Promise.allSettled([
 (async()=>{try{const data=await json(SCHEDULE_URL);if(!Array.isArray(data))throw Error('일정 형식 오류');if(run!==generation)return;rows=data.map(r=>({week:String(r.week||'').trim(),field:String(r.field||'').trim(),schedule:String(r.schedule||''),note:String(r.note||'')})).filter(r=>r.week&&r.field&&r.week!=='주차');scheduleState='ready'}catch{if(run===generation)scheduleState='error'}finally{if(run===generation)render()}})(),
 (async()=>{if(!endpoint)return;try{if(!validURL(endpoint))throw Error('잘못된 주소');const data=await json(endpoint);if(data.error)throw Error(data.error);const next=normalizeMenus(data.menus);if(!data.tables||typeof data.tables!=='object'||Array.isArray(data.tables))throw Error('데이터 형식 오류');for(const t of Object.values(data.tables)){if(!t.error&&(!Array.isArray(t.headers)||!Array.isArray(t.rows)||!t.rows.every(Array.isArray)))throw Error('표 형식 오류')}if(run!==generation)return;menus=next;tables=data.tables;overviewData=data.overview||null;menuState='ready';if(!menus.some(m=>m.sheet===selected))selected=menus[0]?.sheet||''}catch{if(run===generation)menuState='error'}finally{if(run===generation)render()}})()
 ]);}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.sheet!==undefined){selected=b.dataset.sheet;if(selected==='협업요청')collaborationCategory=null;render()}if(b.dataset.week!==undefined){week=b.dataset.week;render()}});
document.addEventListener('click',e=>{const b=e.target.closest('button[data-owner]');if(!b)return;taskOwner=b.dataset.owner==='all'?null:taskOwners[Number(b.dataset.owner)];render();document.querySelector('button[data-owner="'+b.dataset.owner+'"]')?.focus()});
document.addEventListener('click',e=>{const b=e.target.closest('button[data-category]');if(!b)return;collaborationCategory=b.dataset.category==='all'?null:collaborationCategories[Number(b.dataset.category)];render();document.querySelector('button[data-category="'+b.dataset.category+'"]')?.focus()});
$('refresh').onclick=refresh;$('print').onclick=()=>window.print();$('endpoint').value=endpoint;
$('connect').onclick=()=>{const value=$('endpoint').value.trim();if(!validURL(value)){$('settings-message').textContent='Google Apps Script의 /exec로 끝나는 연결 주소를 입력해 주세요.';return}try{localStorage.setItem('velyb-menu-url',value);$('settings-message').textContent='이 브라우저에 연결 주소를 저장했습니다.'}catch{$('settings-message').textContent='주소를 저장할 수 없어 이번 화면에서만 연결합니다.'}endpoint=value;refresh()};
$('disconnect').onclick=()=>{try{localStorage.removeItem('velyb-menu-url')}catch{}endpoint='';$('endpoint').value='';menus=defaults;tables={};overviewData=null;selected='overview';$('settings-message').textContent='기본 메뉴로 전환했습니다.';refresh()};
refresh();


