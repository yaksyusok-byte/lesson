import fontkit from '@pdf-lib/fontkit';
export type Metrics={width:(s:string,size:number,bold?:boolean)=>number;regular:Uint8Array;bold:Uint8Array};
export function createMetrics(regular:Uint8Array,bold:Uint8Array):Metrics{
 const fonts=[fontkit.create(regular),fontkit.create(bold)];const cache=new Map<string,number>();
 return {regular,bold,width(s,size,isBold=false){const key=`${isBold}:${size}:${s}`;const known=cache.get(key);if(known!==undefined)return known;const f=fonts[isBold?1:0];const run=f.layout(s);const n=run.glyphs.reduce((a:number,v:{advanceWidth:number})=>a+v.advanceWidth,0)/f.unitsPerEm*size;if(cache.size>10000)cache.clear();cache.set(key,n);return n;}};
}
let loading:Promise<Metrics>|undefined;
export function loadFonts(){return loading??=Promise.all(['OpenSans-Regular.ttf','OpenSans-Bold.ttf'].map(async f=>{const r=await fetch(import.meta.env.BASE_URL+'fonts/'+f);if(!r.ok)throw new Error('Не удалось загрузить шрифты. Перезагрузите приложение.');const bytes=new Uint8Array(await r.arrayBuffer());const face=new FontFace(f.includes('Bold')?'WorksheetBold':'Worksheet',bytes);await face.load();document.fonts.add(face);return bytes;})).then(([r,b])=>createMetrics(r,b));}
