import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { A4, type Layout } from "./layout";
import type { Metrics } from "./fonts";
const color = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
function roundPath(w: number, h: number, r: number) {
  const k = 0.5522847498;
  return `M ${r} 0 L ${w - r} 0 C ${w - r + k * r} 0 ${w} ${r - k * r} ${w} ${r} L ${w} ${h - r} C ${w} ${h - r + k * r} ${w - r + k * r} ${h} ${w - r} ${h} L ${r} ${h} C ${r - k * r} ${h} 0 ${h - r + k * r} 0 ${h - r} L 0 ${r} C 0 ${r - k * r} ${r - k * r} 0 ${r} 0 Z`;
}
export async function exportPdf(layout: Layout, m: Metrics, title: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(m.regular, { subset: true });
  const bold = await doc.embedFont(m.bold, { subset: true });
  doc.setTitle(title);
  doc.setAuthor("Мастерская рабочих листов");
  doc.setLanguage("ru-RU");
  for (const data of layout.pages) {
    const page = doc.addPage([A4.width, A4.height]);
    for (const e of data.elements) {
      if (e.kind === "text")
        page.drawText(e.text ?? "", {
          x: e.x,
          y: A4.height - e.y,
          size: e.size ?? 11,
          font: e.bold ? bold : regular,
          color: color(e.fill ?? "#3A5635"),
        });
      if (e.kind === "line")
        page.drawLine({
          start: { x: e.x, y: A4.height - e.y },
          end: { x: e.x2!, y: A4.height - e.y2! },
          thickness: 0.65,
          color: color(e.stroke ?? "#AFBDA6"),
        });
      if (e.kind === "rect") {
        const opts = {
          color: color(e.fill ?? "#FFFFFF"),
          borderColor: e.stroke ? color(e.stroke) : undefined,
          borderWidth: e.stroke ? 0.65 : 0,
        };
        if (e.radius)
          page.drawSvgPath(
            roundPath(e.width!, e.height!, Math.min(e.radius, e.height! / 2)),
            { x: e.x, y: A4.height - e.y, ...opts },
          );
        else
          page.drawRectangle({
            x: e.x,
            y: A4.height - e.y - e.height!,
            width: e.width!,
            height: e.height!,
            ...opts,
          });
      }
      if (e.kind === "ellipse")
        page.drawEllipse({
          x: e.x,
          y: A4.height - e.y,
          xScale: e.width! / 2,
          yScale: e.height! / 2,
          color: color(e.fill ?? "#FFFFFF"),
          borderColor: e.stroke ? color(e.stroke) : undefined,
          borderWidth: e.stroke ? 0.8 : 0,
        });
    }
  }
  return doc.save();
}
