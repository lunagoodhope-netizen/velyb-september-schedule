(function(){
 let marketingMonth=10,marketingYear=2026;
 window.marketingContentSource=data=>({data,recovered:false});
 function records(data){
  if(!data||!Array.isArray(data.headers)||!Array.isArray(data.rows))return [];
  const idx=n=>data.headers.findIndex(h=>String(h).trim()===n);
  const value=(r,n)=>String(r[idx(n)]??'');
  return data.rows.map(r=>({kind:value(r,'구분').trim(),order:Number(value(r,'순서')),title:value(r,'제목'),detail:value(r,'설명'),form:value(r,'담당'),date:value(r,'마감일').trim().slice(0,10),status:value(r,'상태'),link:value(r,'자료 링크'),show:idx('표시')<0||checked(r[idx('표시')])})).filter(r=>r.show&&r.kind==='캘린더'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
 }
 function calendarHTML(items){
  const first=new Date(marketingYear,marketingMonth-1,1),last=new Date(marketingYear,marketingMonth,0),start=(first.getDay()+6)%7;let cells='';
  for(let i=0;i<start;i++)cells+='<div class="mcal-cell muted"></div>';
  for(let day=1;day<=last.getDate();day++){
   const date=marketingYear+'-'+String(marketingMonth).padStart(2,'0')+'-'+String(day).padStart(2,'0');
   cells+='<div class="mcal-cell" data-date="'+date+'"><b>'+day+'</b>'+items.filter(x=>x.date===date).map(x=>'<div class="mcal-item"><small>'+esc(x.form||'콘텐츠')+'</small><strong>'+esc(x.title)+'</strong></div>').join('')+'</div>';
  }
  const tail=(7-((start+last.getDate())%7))%7;for(let i=0;i<tail;i++)cells+='<div class="mcal-cell muted"></div>';
  return '<div class="mcal-head"><button data-month="prev" aria-label="이전 달">‹</button><h2>'+marketingYear+'년 '+marketingMonth+'월 콘텐츠 캘린더</h2><button data-month="next" aria-label="다음 달">›</button></div><div class="mcal-scroll"><div class="mcal-week">'+['월','화','수','목','금','토','일'].map(d=>'<b>'+d+'</b>').join('')+'</div><div class="mcal-grid">'+cells+'</div></div>';
 }
 function dateObject(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))}
 function weekStart(iso){const d=dateObject(iso);d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.toISOString().slice(0,10)}
 function shortDate(iso){const d=dateObject(iso);return (d.getUTCMonth()+1)+'/'+d.getUTCDate()+' ('+['일','월','화','수','목','금','토'][d.getUTCDay()]+')'}
 function weekLabel(iso){const d=dateObject(iso),end=new Date(d);end.setUTCDate(d.getUTCDate()+6);return (d.getUTCMonth()+1)+'/'+d.getUTCDate()+'–'+(end.getUTCMonth()+1)+'/'+end.getUTCDate()}
 function material(x){try{const u=new URL(x.link);if(u.protocol!=='https:')return '—';return '<button class="mk-material-btn" data-material="'+esc(u.href)+'" data-material-title="'+esc(x.title)+'">자료보기</button>'}catch{return '—'}}
 function weeklyHTML(items){
  const groups=new Map();for(const x of items){const key=weekStart(x.date);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)}
  const body=[...groups].map(([key,list],gi)=>list.map((x,i)=>'<tr class="mk-week-'+gi%7+'" data-date="'+esc(x.date)+'">'+(i===0?'<td class="mk-weekcell" rowspan="'+list.length+'"><strong>'+weekLabel(key)+'</strong></td>':'')+'<td class="mk-date">'+shortDate(x.date)+'</td><td class="mk-form"><span class="mk-icon '+(x.form==='영상'?'video':'photo')+'">'+(x.form==='영상'?'▶':'▣')+'</span>'+esc(x.form||'—')+'</td><td class="mk-topic">'+esc(x.title)+'</td><td class="mk-detail">'+esc(x.detail)+'</td><td class="mk-material">'+material(x)+'</td><td class="mk-note"><span>'+esc(x.status)+'</span></td></tr>').join('')).join('');
  return '<div class="mk-plan-head"><h2>마케팅 주차별 계획</h2></div><div class="mk-table-wrap"><table class="mk-table"><thead><tr>'+['주차','날짜','형태','주제','상세 내용','자료','비고'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div>';
 }
 window.marketingSectionHTML=function(data,mode){const items=records(data);return mode==='weekly'?weeklyHTML(items):calendarHTML(items)};
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-month]');if(!b)return;const d=new Date(marketingYear,marketingMonth-1+(b.dataset.month==='next'?1:-1),1);marketingYear=d.getFullYear();marketingMonth=d.getMonth()+1;render()});
})();
