/* CRM guide: content remains editable in the existing CRM Google Sheet. */
'use strict';
window.CRMGuide=(()=>{
 const topics=['병원 시스템 기본설정 및 운영관리','직원·고객 설정 및 시술·회원 관리','병원 업무 전체 프로세스 및 APP','재고관리 담당자 교육'];
 let topic=1,mode='guide',query='',chapterKey='',videoURL='',dataRows=[],currentRows=[],videoRows=[];
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const videoID=url=>{try{const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='drive.google.com')return '';return u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1]||u.searchParams.get('id')||''}catch{return ''}};
 const title=r=>r[1].replace(/^(?:\d+-\d+ · )?\[[^\]]+\]\s*/, '');
 const time=r=>r[1].match(/\[([^\]]+)\]/)?.[1]||'';
 function scoped(){currentRows=dataRows.filter(r=>r[0]==='사용가이드 · '+topic);videoRows=dataRows.filter(r=>r[0]==='영상목록 · '+topic)}
 function record(){return currentRows.find(r=>r[1]===chapterKey)||currentRows[0]}
 function options(){return videoRows.map(r=>'<option value="'+escape(r[4])+'"'+(r[4]===videoURL?' selected':'')+'>'+escape(r[1])+'</option>').join('')}
 function showText(){const host=document.getElementById('cg-text');if(!host)return;const r=record();if(!r){host.innerHTML='<p>등록된 설명이 없습니다.</p>';return}
  const parts=r[2].split('【기능 및 작동 순서】');
  const translation=parts[0].trim(),steps=parts.slice(1).join('【기능 및 작동 순서】').trim();
  host.innerHTML='<p class="cg-meta">'+escape(time(r))+(r[4]?' · 개별 영상 기준':' · 전체 녹화 기준')+'</p><h3 tabindex="-1">'+escape(title(r))+'</h3>'+(steps?'<h4>사용 순서</h4><div class="cg-copy">'+escape(steps)+'</div>':'<div class="cg-copy">'+escape(translation)+'</div>')+(steps&&translation?'<details class="cg-original"><summary>중국어 · 한국어 설명 펼치기</summary><div class="cg-copy">'+escape(translation)+'</div></details>':'');host.scrollTop=0;
 }
 function showVideo(){const host=document.getElementById('cg-player');if(!host)return;const id=videoID(videoURL);if(host.dataset.video!==id){host.dataset.video=id;host.innerHTML=id?'<iframe src="https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview" title="CRM 교육 동영상" allow="autoplay; fullscreen" allowfullscreen></iframe>':'<div class="cg-empty">재생할 영상을 선택하세요.</div>'}
  const link=document.getElementById('cg-open');if(link){link.href=id?'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/view':'#';link.hidden=!id}
  const select=document.getElementById('cg-video');if(select)select.innerHTML=options();
 }
 function list(){const host=document.getElementById('cg-list');if(!host)return;const q=query.trim().toLocaleLowerCase();const found=currentRows.filter(r=>!q||(r[1]+' '+r[2]).toLocaleLowerCase().includes(q));host.innerHTML=found.length?found.map(r=>'<button type="button" data-cg-chapter="'+escape(r[1])+'" aria-pressed="'+(record()===r)+'"><span>'+escape(title(r))+'</span><small>'+escape((r[1].match(/^\d+-\d+/)?.[0]||'')+' '+time(r))+'</small></button>').join(''):'<p class="cg-empty">검색 결과가 없습니다.</p>';document.getElementById('cg-count').textContent=found.length+'개 목차';}
 function mount(){if(!document.getElementById('cg-work'))return;scoped();const r=record();chapterKey=r?.[1]||'';if(!videoRows.some(v=>v[4]===videoURL))videoURL=r?.[4]||videoRows[0]?.[4]||'';list();showText();showVideo()}
 function view(data,resources){
  const names=['분류','제목','설명','자료 링크','영상 링크'];const cols=names.map(n=>data?.headers?.findIndex(h=>String(h).trim()===n)??-1);
  dataRows=cols.every(c=>c>=0)?data.rows.map(r=>cols.map(c=>String(r[c]??'').trim())):[];
  const header='<div class="tabs" aria-label="CRM 자료 구분"><button data-cg-mode="guide" aria-pressed="'+(mode==='guide')+'">사용 가이드</button><button data-cg-mode="resources" aria-pressed="'+(mode==='resources')+'">업체소개 · 견적 · 기타 자료</button></div>';
  if(mode==='resources')return header+resources;
  const edit='<a href="https://docs.google.com/spreadsheets/d/1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA/edit#gid=215072242" target="_blank" rel="noopener noreferrer">가이드 내용 수정 ↗</a>';
  if(!dataRows.some(r=>r[0].startsWith('사용가이드 · ')))return header+'<div class="panel"><p>사용 가이드를 불러오지 못했습니다. 상단 새로고침을 눌러 주세요.</p>'+edit+'</div>';
  requestAnimationFrame(mount);
  return header+'<section class="cguide"><div class="cg-topics" aria-label="교육 주제">'+topics.map((t,i)=>'<button data-cg-topic="'+(i+1)+'" aria-pressed="'+(topic===i+1)+'"><b>0'+(i+1)+'</b><span>'+escape(t)+'</span></button>').join('')+'</div><div class="cg-heading"><h2>'+escape(topics[topic-1])+'</h2>'+edit+'</div><div id="cg-work"><section class="cg-toc" aria-label="가이드 목차"><label for="cg-search">목차·내용 검색</label><input id="cg-search" type="search" placeholder="환불, 고객 등록…" value="'+escape(query)+'"><p id="cg-count" class="cg-meta"></p><div id="cg-list"></div></section><section class="cg-video-panel" aria-label="교육 영상"><label for="cg-video">영상 선택</label><select id="cg-video"></select><div id="cg-player"></div><a id="cg-open" target="_blank" rel="noopener noreferrer">Drive에서 영상 열기 ↗</a><p class="cg-meta">영상이 보이지 않으면 위 링크에서 접근 가능한 Google 계정으로 로그인해 주세요.</p><p class="cg-meta">'+([1,4].includes(topic)?'목차를 누르면 해당 영상과 설명이 열립니다. 같은 영상의 다른 설명을 눌러도 재생은 유지됩니다.':'텍스트 시간은 전체 녹화 기준입니다. 개별 영상의 경계가 원문에 없어 영상은 번호 순서로 선택해 주세요.')+' 구간 이동은 영상 재생바를 이용하세요.</p></section><article id="cg-text" aria-label="선택한 목차 설명"></article></div></section>';
 }
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.cgMode){mode=b.dataset.cgMode;render()}
  if(b.dataset.cgTopic){topic=Number(b.dataset.cgTopic);chapterKey='';videoURL='';query='';render()}
  if(b.dataset.cgChapter){chapterKey=b.dataset.cgChapter;const r=record();if(r?.[4])videoURL=r[4];list();showText();showVideo();document.querySelector('#cg-text h3')?.focus({preventScroll:true})}
 });
 document.addEventListener('input',e=>{if(e.target.id==='cg-search'){query=e.target.value;list()}});
 document.addEventListener('change',e=>{if(e.target.id==='cg-video'){videoURL=e.target.value;showVideo()}});
 const style=document.createElement('style');style.textContent=`
 .cguide{--cg-accent:#244f85}.cg-topics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cg-topics button{display:flex;gap:10px;align-items:center;text-align:left;background:white;border:1px solid var(--line);border-radius:10px;padding:14px;color:var(--ink);font-size:14px}.cg-topics b{font-size:20px;color:var(--cg-accent)}.cg-topics button[aria-pressed=true]{background:#e9f0fa;border-color:var(--cg-accent)}.cg-heading{display:flex;gap:16px;align-items:center;justify-content:space-between;margin:20px 0 12px}.cg-heading h2{margin:0}.cg-heading a{font-size:14px;white-space:nowrap}#cg-work{display:grid;grid-template-columns:220px minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}.cg-toc,.cg-video-panel,#cg-text{min-width:0;background:white;border:1px solid var(--line);border-radius:12px;padding:16px}.cguide label{font-size:14px;margin:0 0 8px;font-weight:600}.cguide select{font:inherit;width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;background:white;color:var(--ink);margin-bottom:14px}.cg-meta{font-size:14px;color:var(--muted);line-height:1.65}#cg-list{max-height:60vh;overflow:auto;margin:0 -8px}#cg-list button{display:block;width:100%;border:0;border-radius:7px;background:white;text-align:left;padding:11px 8px;color:var(--ink);font-size:14px;line-height:1.6}#cg-list button:hover{background:#f0f4fa}#cg-list button[aria-pressed=true]{background:#e0eafb;color:#163e72}#cg-list small{display:block;color:var(--muted);font-size:12px;margin-top:4px}.cg-video-panel{position:sticky;top:16px}#cg-player{aspect-ratio:16/10;background:#eef1f5;border-radius:8px;overflow:hidden;margin-bottom:12px}#cg-player iframe{width:100%;height:100%;border:0}#cg-open{font-size:14px}#cg-text{max-height:76vh;overflow:auto;scrollbar-gutter:stable}#cg-text h3{font-size:20px;line-height:1.5;margin:6px 0 22px}#cg-text h4{font-size:16px;margin:16px 0 10px}.cg-copy{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.9}.cg-original{margin-top:28px}.cg-original summary{font-size:14px}.cg-original .cg-copy{margin-top:16px}.cg-empty{padding:24px;color:var(--muted);font-size:14px}@media(max-width:1200px){#cg-work{grid-template-columns:200px minmax(0,1fr)}.cg-toc{grid-row:span 2}.cg-video-panel{position:static}#cg-text{max-height:60vh}}@media(max-width:700px){.cg-topics{grid-template-columns:repeat(2,minmax(0,1fr))}.cg-heading{display:block}.cg-heading a{display:inline-block;margin-top:8px}#cg-work{display:flex;flex-direction:column}#cg-work>section,#cg-text{width:100%}#cg-list{max-height:180px}.cg-video-panel{position:static}#cg-text{max-height:60vh}}@media print{.cg-topics,.cg-toc,.cg-video-panel{display:none!important}#cg-work{display:block}#cg-text{max-height:none;overflow:visible;border:0}.cg-original{display:block!important}}
 `;document.head.appendChild(style);
 return {view};
})();
