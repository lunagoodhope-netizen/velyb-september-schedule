(function(){
 let active='calendar';
 const previousProjectView=projectView;
 projectView=function(data,item){
  if(item.sheet!=='마케팅')return previousProjectView(data,item);
  const tabs='<div class="tabs marketing-sections" aria-label="마케팅"><button data-mk-go="calendar" aria-pressed="'+(active==='calendar')+'">캘린더</button><button data-mk-go="weekly" aria-pressed="'+(active==='weekly')+'">주차별 계획</button></div>';
  const edit='<p class="mk-edit"><a href="https://docs.google.com/spreadsheets/d/1U-v9bd3a6cVDivs9BeKtMMraLUqKon00hW31vqNf9YA/edit#gid=2036611167" target="_blank" rel="noopener">콘텐츠 일정 시트 수정 ↗</a></p>';
  if(!data||data.error)return tabs+'<div class="panel">'+(menuState==='loading'?'마케팅 일정을 불러오는 중입니다.':'마케팅 일정 연결을 확인한 뒤 새로고침해 주세요.')+'</div>'+edit;
  return tabs+window.marketingSectionHTML(data,active)+edit;
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-mk-go]');if(!b||!['calendar','weekly'].includes(b.dataset.mkGo))return;active=b.dataset.mkGo;render()});
 render();
 setInterval(()=>{if(!document.hidden&&menuState!=='loading')refresh()},60000);
})();
