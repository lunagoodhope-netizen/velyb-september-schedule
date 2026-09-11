(function(){
  const originalProjectView=projectView;
  projectView=function(data,item){
    if(!data||data.error||!Array.isArray(data.headers)||!Array.isArray(data.rows)) return originalProjectView(data,item);
    const kindIndex=data.headers.findIndex(h=>String(h).trim()==='구분');
    const statusIndex=data.headers.findIndex(h=>String(h).trim()==='상태');
    if(kindIndex<0||statusIndex<0) return originalProjectView(data,item);
    const fixed={...data,rows:data.rows.map(row=>{
      const next=[...row];
      const kind=String(next[kindIndex]??'').trim();
      const status=String(next[statusIndex]??'').replace(/\s/g,'');
      if(kind==='단계'&&status==='진행중') next[statusIndex]='현재';
      return next;
    })};
    return originalProjectView(fixed,item);
  };
  const style=document.createElement('style');
  style.textContent='.stage.current span{background:#20e000!important;color:#171923!important;border-color:#20e000!important}.stage.current small{color:#177d00;font-weight:700}';
  document.head.appendChild(style);
})();