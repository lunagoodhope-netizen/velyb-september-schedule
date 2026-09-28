(function(){
 const baseRender=render;
 const sheetURL='https://docs.google.com/spreadsheets/d/1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA/edit';
 function apply(){
  const main=document.querySelector('main'),content=document.getElementById('content');
  main.classList.add('unified-page');
  let header=content.querySelector('.mk-header');
  if(!header){
   const isSchedule=selected.startsWith('schedule-');
   const title=isSchedule?'일정':document.getElementById('title').textContent;
   const tabs=isSchedule?content.querySelector('.month-tabs'):content.querySelector(':scope > .tabs');
   const section=content.querySelector(':scope > .section-heading');
   const source=section?.querySelector('a')?.href||(isSchedule?document.querySelector('main>.toolbar a').href:sheetURL);
   header=document.createElement('div');header.className='mk-header';
   header.innerHTML='<h1>'+esc(title)+'</h1><div class="mk-tools"><button class="mk-refresh" data-mk-refresh aria-label="새로고침" title="새로고침"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.4 7a8 8 0 0 1 13-1L20 8M4 16l1.6 2a8 8 0 0 0 13-1"/></svg></button><details class="mk-more"><summary aria-label="더보기" title="더보기">⋮</summary><div class="mk-more-panel"><button data-mk-print>인쇄 / PDF 저장</button><a href="'+esc(source)+'" target="_blank" rel="noopener">'+(isSchedule?'일정 시트 열기 ↗':'관리 시트 열기 ↗')+'</a></div></details></div>';
   if(tabs){tabs.classList.add('tabs','marketing-sections');header.insertBefore(tabs,header.querySelector('.mk-tools'))}
   else header.classList.add('without-tabs');
   if(isSchedule)content.querySelector('.schedule-title')?.remove();
   if(section)section.remove();
   content.prepend(header);
  }
  const more=header.querySelector('.mk-more-panel');
  const settings=document.createElement('button');settings.dataset.openSettings='';settings.textContent='메뉴 시트 연결';more.append(settings);
  const status=document.createElement('p');status.className='header-status';status.textContent=document.getElementById('connection').textContent;more.append(status);
 }
 render=function(){baseRender();apply()};
 document.addEventListener('click',e=>{if(!e.target.closest('[data-open-settings]'))return;const main=document.querySelector('main');main.classList.add('show-connection-settings');const settings=main.querySelector(':scope > details');settings.open=true;main.querySelector('.mk-more').open=false;settings.scrollIntoView({behavior:'smooth',block:'center'});settings.querySelector('summary').focus()});
 document.querySelector('main>details').addEventListener('toggle',e=>{if(!e.target.open)document.querySelector('main').classList.remove('show-connection-settings')});
 render();
})();
