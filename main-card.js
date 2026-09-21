(function(){
  const MODE_KEY='velyb-overview-main-card';
  let savedProgressCard=null;
  const mode=()=>{try{return localStorage.getItem(MODE_KEY)||'news'}catch{return'news'}};
  const setMode=value=>{try{localStorage.setItem(MODE_KEY,value)}catch{};apply()};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const controls=current=>'<div class="main-card-switch" role="group" aria-label="메인 카드 선택"><button type="button" data-main-card="news" aria-pressed="'+(current==='news')+'">뉴스</button><button type="button" data-main-card="progress" aria-pressed="'+(current==='progress')+'">진행상황</button></div>';
  const newsCard=()=>'<section class="panel total-card news-card"><div class="main-card-head"><h2>중국 의료미용 뉴스</h2>'+controls('news')+'</div><div class="news-body"><p class="subtle">최신 기사 불러오는 중</p></div></section>';
  async function loadNews(card){
    const body=card.querySelector('.news-body');
    try{
      const response=await fetch('news.json?ts='+Date.now(),{cache:'no-store'});
      if(!response.ok)throw Error('news unavailable');
      const news=await response.json();
      if(!news.title||!news.url)throw Error('empty news');
      body.innerHTML='<p class="news-source">'+esc(news.source||'Google News')+(news.date?' · '+esc(news.date):'')+'</p><a class="news-title" href="'+esc(news.url)+'" target="_blank" rel="noopener noreferrer">'+esc(news.title)+'</a>';
    }catch{body.innerHTML='<p class="subtle">최신 뉴스 업데이트를 준비 중입니다.</p>'}
  }
  function apply(){
    const host=document.querySelector('.ov-top.primary');
    if(!host)return;
    const current=mode();
    const existing=host.querySelector('.total-card');
    if(existing&&!existing.classList.contains('news-card')&&!savedProgressCard)savedProgressCard=existing.cloneNode(true);
    if(current==='progress'){
      if(savedProgressCard&&(!existing||existing.classList.contains('news-card'))){existing?.replaceWith(savedProgressCard.cloneNode(true));}
      const progress=host.querySelector('.total-card');
      if(progress&&!progress.querySelector('.main-card-switch'))progress.insertAdjacentHTML('afterbegin','<div class="main-card-head"><span></span>'+controls('progress')+'</div>');
      return;
    }
    if(existing?.classList.contains('news-card'))return;
    const card=document.createElement('template');card.innerHTML=newsCard();
    if(existing)existing.replaceWith(card.content.firstElementChild);else host.prepend(card.content.firstElementChild);
    loadNews(host.querySelector('.news-card'));
  }
  document.addEventListener('click',event=>{const button=event.target.closest('button[data-main-card]');if(button)setMode(button.dataset.mainCard)});
  new MutationObserver(apply).observe(document.getElementById('content'),{childList:true,subtree:true});
  apply();
})();
