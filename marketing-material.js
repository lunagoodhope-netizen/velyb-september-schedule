(function(){
const previousProjectView=projectView;
function materialMap(data){
 if(!data||!Array.isArray(data.headers))return new Map();
 const titleIndex=data.headers.findIndex(h=>String(h).trim()==='제목');
 const linkIndex=data.headers.findIndex(h=>String(h).trim()==='자료 링크');
 if(titleIndex<0||linkIndex<0)return new Map();
 return new Map((data.rows||[]).map(r=>[String(r[titleIndex]||'').trim(),String(r[linkIndex]||'').trim()]).filter(([title,link])=>title&&link));
}
function addMaterialColumn(html,data){
 if(!html.includes('mk-table'))return html;
 const tpl=document.createElement('template');tpl.innerHTML=html;
 const table=tpl.content.querySelector('.mk-table');if(!table)return html;
 const head=table.querySelector('thead tr');
 const th=document.createElement('th');th.textContent='자료';
 head.insertBefore(th,head.lastElementChild);
 const links=materialMap(data);
 table.querySelectorAll('tbody tr').forEach(tr=>{
  const title=tr.querySelector('.mk-topic')?.textContent.trim()||'';
  const link=links.get(title)||'';
  const td=document.createElement('td');td.className='mk-material';
  td.innerHTML=link?'<button class="mk-material-btn" data-material="'+esc(link)+'" data-material-title="'+esc(title)+'">자료보기</button>':'<span class="mk-material-empty">—</span>';
  tr.insertBefore(td,tr.lastElementChild);
 });
 return tpl.innerHTML;
}
window.marketingMaterialColumn=addMaterialColumn;
projectView=function(data,item){
 const html=previousProjectView(data,item);
 return item?.sheet==='마케팅'?addMaterialColumn(html,data):html;
};
function drivePreview(url){
 try{
  const u=new URL(url);
  const fileMatch=u.pathname.match(/\/file\/d\/([^/]+)/);
  if(fileMatch)return 'https://drive.google.com/file/d/'+fileMatch[1]+'/preview';
  const id=u.searchParams.get('id');if(id)return 'https://drive.google.com/file/d/'+id+'/preview';
  return url;
 }catch{return url}
}
function ensureModal(){
 let modal=document.getElementById('mk-material-modal');if(modal)return modal;
 modal=document.createElement('div');modal.id='mk-material-modal';modal.className='mk-material-modal';modal.hidden=true;
 modal.innerHTML='<div class="mk-material-backdrop" data-material-close></div><section class="mk-material-dialog" role="dialog" aria-modal="true" aria-labelledby="mk-material-title"><div class="mk-material-top"><strong id="mk-material-title">자료 미리보기</strong><div><a id="mk-material-open" target="_blank" rel="noopener">새 창에서 열기 ↗</a><button type="button" data-material-close aria-label="닫기">×</button></div></div><iframe id="mk-material-frame" title="마케팅 자료 미리보기" allow="autoplay; fullscreen" allowfullscreen></iframe></section>';
 document.body.appendChild(modal);return modal;
}
function openMaterial(url,title){
 const modal=ensureModal();
 modal.querySelector('#mk-material-title').textContent=title||'자료 미리보기';
 modal.querySelector('#mk-material-frame').src=drivePreview(url);
 modal.querySelector('#mk-material-open').href=url;
 modal.hidden=false;document.body.style.overflow='hidden';
 modal.querySelector('[data-material-close]')?.focus?.();
}
function closeMaterial(){const modal=document.getElementById('mk-material-modal');if(!modal)return;modal.hidden=true;modal.querySelector('#mk-material-frame').src='about:blank';document.body.style.overflow=''}
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-material]');if(open){openMaterial(open.dataset.material,open.dataset.materialTitle);return}
 if(e.target.closest('[data-material-close]'))closeMaterial();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMaterial()});
const style=document.createElement('style');style.textContent=`
.mk-material{width:105px;text-align:center}.mk-material-btn{border:1px solid #b9c8d8;background:#f4f8fc;color:#244f85;border-radius:999px;padding:6px 12px;font-weight:700;font-size:12px;white-space:nowrap}.mk-material-btn:hover{background:#e7f0fa}.mk-material-empty{color:#a0a8b2}.mk-material-modal[hidden]{display:none}.mk-material-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px}.mk-material-backdrop{position:absolute;inset:0;background:rgba(20,31,45,.62);backdrop-filter:blur(2px)}.mk-material-dialog{position:relative;width:min(1000px,94vw);height:min(760px,88vh);background:#fff;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column}.mk-material-top{height:58px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 18px;border-bottom:1px solid #e3e7ec}.mk-material-top strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-material-top div{display:flex;align-items:center;gap:12px;white-space:nowrap}.mk-material-top a{font-size:13px;text-decoration:none}.mk-material-top button{border:0;background:#eef1f5;width:34px;height:34px;border-radius:50%;font-size:24px;line-height:1;color:#405064}.mk-material-dialog iframe{width:100%;height:100%;border:0;background:#f5f7fa}@media(max-width:700px){.mk-material-modal{padding:8px}.mk-material-dialog{width:98vw;height:92vh}.mk-material-top{padding:0 12px}.mk-material-top a{display:none}}
`;document.head.appendChild(style);
})();
