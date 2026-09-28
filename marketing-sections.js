(function(){
 let active='calendar';
 const previousProjectView=projectView;
 projectView=function(data,item){
  if(item.sheet!=='마케팅')return previousProjectView(data,item);
  const tabs='<div class="tabs marketing-sections" aria-label="마케팅"><button data-mk-go="calendar" aria-pressed="'+(active==='calendar')+'">캘린더</button><button data-mk-go="weekly" aria-pressed="'+(active==='weekly')+'">주차별 계획</button></div>';
  const head='<div class="mk-header"><h1>마케팅</h1>'+tabs+'<div class="mk-tools"><button class="mk-refresh" data-mk-refresh aria-label="새로고침" title="새로고침"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.4 7a8 8 0 0 1 13-1L20 8M4 16l1.6 2a8 8 0 0 0 13-1"/></svg></button><details class="mk-more"><summary aria-label="더보기" title="더보기">⋮</summary><div class="mk-more-panel"><button data-mk-print>인쇄 / PDF 저장</button><a href="https://docs.google.com/spreadsheets/d/1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA/edit#gid=2036611167" target="_blank" rel="noopener">일정 시트 열기 ↗</a></div></details></div></div>';
  if(!data||data.error)return head+'<div class="panel">'+(menuState==='loading'?'마케팅 일정을 불러오는 중입니다.':'마케팅 일정 연결을 확인한 뒤 새로고침해 주세요.')+'</div>';
  return head+window.marketingSectionHTML(data,active);
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-mk-go]');if(!b||!['calendar','weekly'].includes(b.dataset.mkGo))return;active=b.dataset.mkGo;render()});
 document.addEventListener('click',e=>{if(e.target.closest('[data-mk-refresh]'))refresh();if(e.target.closest('[data-mk-print]')){document.querySelector('.mk-more').open=false;window.print()}if(!e.target.closest('.mk-more')){const more=document.querySelector('.mk-more');if(more)more.open=false}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const more=document.querySelector('.mk-more[open]');if(more){more.open=false;more.querySelector('summary').focus()}}});
 render();
})();
