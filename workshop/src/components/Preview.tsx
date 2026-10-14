import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Minus,Plus,Maximize2} from 'lucide-react';
import {A4,type Layout,type Element} from '../layout';
function Shape({e}:{e:Element}){
 if(e.kind==='text')return <text x={e.x} y={e.y} fill={e.fill} fontSize={e.size} fontFamily={e.bold?'WorksheetBold':'Worksheet'} xmlSpace="preserve" style={{fontKerning:"none"}}>{e.text}</text>;
 if(e.kind==='line')return <line x1={e.x} y1={e.y} x2={e.x2} y2={e.y2} stroke={e.stroke} strokeWidth=".65"/>;
 if(e.kind==='rect')return <rect x={e.x} y={e.y} width={e.width} height={e.height} rx={e.radius} fill={e.fill} stroke={e.stroke} strokeWidth=".65"/>;
 return <ellipse cx={e.x} cy={e.y} rx={e.width!/2} ry={e.height!/2} fill={e.fill} stroke={e.stroke} strokeWidth=".8"/>;
}
export function Preview({layout,selected,onSelect,mode,setMode}:{layout:Layout|null;selected:string|null;onSelect:(id:string)=>void;mode:'student'|'teacher';setMode:(s:'student'|'teacher')=>void}){
 const [page,setPage]=useState(0),[zoom,setZoom]=useState(78),[fit,setFit]=useState(true);const ref=useRef<HTMLDivElement>(null);const [available,setAvailable]=useState(700);
 useEffect(()=>{if(!ref.current)return;const o=new ResizeObserver(entries=>setAvailable(entries[0].contentRect.width));o.observe(ref.current);return()=>o.disconnect();},[]);
 useEffect(()=>{if(layout)setPage(p=>Math.min(p,layout.pages.length-1));},[layout]);
 useEffect(()=>{const p=layout?.pages.findIndex(p=>p.regions.some(r=>r.id===selected));if(p!==undefined&&p>=0)setPage(p);},[selected,mode]);
 const index=Math.max(0,page),current=layout?.pages[index];const scale=fit?Math.min(1.15,Math.max(.2,(available-64)/A4.width)):zoom/100;
 return <section className="preview-area" aria-label="Предпросмотр рабочего листа">
  <div className="preview-top"><div><span className="eyebrow">ХОЛСТ</span><h2>Ваш рабочий лист</h2></div><div className="segmented"><button className={mode==='student'?'active':''} onClick={()=>setMode('student')}>Для ученика</button><button className={mode==='teacher'?'active':''} onClick={()=>setMode('teacher')}>С ответами</button></div></div>
  <div className="paper-scroll" ref={ref}>{current?<svg data-testid="a4-preview" className="paper" width={A4.width*scale} height={A4.height*scale} viewBox={`0 0 ${A4.width} ${A4.height}`} role="img" aria-label={`Страница ${index+1}, формат А4`}>
   <rect width={A4.width} height={A4.height} fill="white"/>
   {current.elements.map((e,i)=><g key={i} onClick={()=>e.blockId&&!e.blockId.startsWith('document-')&&onSelect(e.blockId)} style={{cursor:e.blockId&&!e.blockId.startsWith('document-')?'pointer':'default'}}><Shape e={e}/></g>)}
   {current.regions.filter(r=>r.id===selected).map((r,i)=><rect key={i} x={r.x-2} y={r.y-2} width={r.width+4} height={r.height+4} fill="none" stroke="#D57B0E" strokeWidth="1.3" strokeDasharray="4 3" rx="10" pointerEvents="none"/>)}
  </svg>:<div className="loading-paper">Подготавливаем шрифты и страницы…</div>}</div>
  <div className="preview-bottom"><div className="pager"><button aria-label="Предыдущая страница" disabled={index===0} onClick={()=>setPage(index-1)}><ChevronLeft size={17}/></button><span>Страница {index+1} из {layout?.pages.length??1}</span><button aria-label="Следующая страница" disabled={!layout||index>=layout.pages.length-1} onClick={()=>setPage(index+1)}><ChevronRight size={17}/></button></div><div className="zoom"><button aria-label="Уменьшить" onClick={()=>{setFit(false);setZoom(Math.max(25,(fit?Math.round(scale*100):zoom)-10));}}><Minus size={15}/></button><span>{Math.round(scale*100)}%</span><button aria-label="Увеличить" onClick={()=>{setFit(false);setZoom(Math.min(180,(fit?Math.round(scale*100):zoom)+10));}}><Plus size={15}/></button><button aria-label="По ширине" title="По ширине" onClick={()=>setFit(true)}><Maximize2 size={15}/></button></div></div>
 </section>;
}
