import { makeBlock, type Block, type Project } from "./model";
import type { Metrics } from "./fonts";
export const A4 = { width: 595.276, height: 841.89 };
const INK = "#3A5635",
  ORANGE = "#D57B0E",
  LINE = "#AFBDA6";
export type Element = {
  kind: "text" | "rect" | "line" | "ellipse";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  size?: number;
  bold?: boolean;
  fill?: string;
  stroke?: string;
  radius?: number;
  x2?: number;
  y2?: number;
  blockId?: string;
};
export type Page = {
  elements: Element[];
  regions: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};
export type Layout = { pages: Page[]; mode: "student" | "teacher" };
type Band = { height: number; elements: Element[]; keepNext?: boolean };
const txt = (
  text: string,
  x: number,
  y: number,
  size = 11,
  bold = false,
  fill = INK,
): Element => ({ kind: "text", text, x, y, size, bold, fill });
const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill = "#FFFFFF",
  stroke?: string,
  radius = 0,
): Element => ({ kind: "rect", x, y, width, height, fill, stroke, radius });
const line = (
  x: number,
  y: number,
  x2: number,
  y2: number,
  stroke = LINE,
): Element => ({ kind: "line", x, y, x2, y2, stroke });
function contrast(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 125
    ? "#FFFFFF"
    : INK;
}
/** Only visual wrapping: the original project strings are never modified. */
export function wrap(
  text: string,
  width: number,
  size: number,
  m: Metrics,
  bold = false,
): string[] {
  const output: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    let current = "";
    for (const token of paragraph.match(/\S+|[^\S\n]+/gu) ?? []) {
      if (m.width(current + token, size, bold) <= width) {
        current += token;
        continue;
      }
      if (current.trim().length) {
        output.push(current.trimEnd());
        current = "";
      }
      if (m.width(token, size, bold) <= width) {
        current = token.trimStart();
        continue;
      }
      for (const char of Array.from(token)) {
        if (m.width(current + char, size, bold) > width && current) {
          output.push(current);
          current = "";
        }
        current += char;
      }
    }
    output.push(current.trimEnd());
  }
  return output;
}
function textBands(
  s: string,
  w: number,
  size: number,
  m: Metrics,
  bold = false,
  color = INK,
): Band[] {
  return wrap(s, w, size, m, bold).map((t) => ({
    height: size * 1.5,
    elements: [txt(t, 0, size + 1, size, bold, color)],
  }));
}
function gridBands(
  cells: string[],
  w: number,
  size: number,
  m: Metrics,
  header = false,
): Band[] {
  const cw = w / cells.length,
    wrapped = cells.map((s) => wrap(s, cw - 14, size, m, header));
  const count = Math.max(1, ...wrapped.map((a) => a.length));
  const bands: Band[] = [];
  // A single enormous row is continued safely instead of being clipped.
  const perChunk = 16,
    leading = size * 1.5;
  for (let start = 0; start < count; start += perChunk) {
    const n = Math.min(perChunk, count - start);
    const h = Math.max(header ? 28 : 32, n * leading + 14);
    const elements: Element[] = [];
    cells.forEach((_, i) => {
      elements.push(
        rect(i * cw, 0, cw, h, header ? "#F4E2D0" : "#FFFFFF", LINE),
      );
      wrapped[i]
        .slice(start, start + n)
        .forEach((s, j) =>
          elements.push(
            txt(s, i * cw + 7, 7 + size + j * leading, size, header),
          ),
        );
    });
    bands.push({ height: h, elements });
  }
  return bands;
}
function illustration(kind: Block["illustration"], w: number): Band {
  const x = w / 2 - 44,
    es: Element[] = [];
  if (kind === "clock") {
    es.push({
      kind: "ellipse",
      x: x + 44,
      y: 45,
      width: 72,
      height: 72,
      fill: "#F4E2D0",
      stroke: INK,
    });
    es.push(
      line(x + 44, 45, x + 44, 23, INK),
      line(x + 44, 45, x + 60, 54, ORANGE),
    );
    for (const [dx, dy] of [
      [0, -29],
      [29, 0],
      [0, 29],
      [-29, 0],
    ])
      es.push({
        kind: "ellipse",
        x: x + 44 + dx,
        y: 45 + dy,
        width: 3,
        height: 3,
        fill: INK,
      });
  } else if (kind === "plant") {
    es.push(
      rect(x + 22, 57, 44, 26, "#F4E2D0", INK, 4),
      line(x + 44, 60, x + 44, 14, INK),
    );
    es.push(
      {
        kind: "ellipse",
        x: x + 30,
        y: 30,
        width: 27,
        height: 14,
        fill: "#3A5635",
      },
      {
        kind: "ellipse",
        x: x + 59,
        y: 43,
        width: 27,
        height: 14,
        fill: "#3A5635",
      },
    );
  } else {
    es.push(
      rect(x, 56, 88, 13, "#F4E2D0", INK, 3),
      rect(x + 5, 41, 78, 12, "#E3EBD9", INK, 3),
      rect(x + 1, 25, 86, 13, "#F4E2D0", INK, 3),
    );
    es.push(
      line(x + 11, 62, x + 80, 62, INK),
      line(x + 16, 47, x + 74, 47, INK),
      line(x + 11, 31, x + 78, 31, INK),
    );
    es.push(
      {
        kind: "ellipse",
        x: x + 58,
        y: 14,
        width: 21,
        height: 21,
        fill: "#FFFFFF",
        stroke: ORANGE,
      },
      line(x + 65, 21, x + 78, 30, ORANGE),
    );
  }
  return { height: 91, elements: es };
}
function bandsFor(b: Block, w: number, m: Metrics, teacher: boolean) {
  const bands: Band[] = [];
  const size = b.fontSize,
    color = contrast(b.fill);
  function text(s: string, bold = false, font = size) {
    if (s)
      bands.push(...textBands(s, w, font, m, bold, color), {
        height: 6,
        elements: [],
      });
  }
  if (b.title) {
    const title = textBands(b.title, w, Math.max(size + 2, 13), m, true, color);
    title.forEach((v) => (v.keepNext = true));
    bands.push(...title, { height: 5, elements: [], keepNext: true });
  }
  text(b.instruction);
  if (b.type === "illustration") bands.push(illustration(b.illustration, w));
  else if (b.type === "table") {
    text(b.text);
    bands.push(...gridBands(b.table.headers, w, size, m, true));
    b.table.rows.forEach((row) => bands.push(...gridBands(row, w, size, m)));
  } else if (b.type === "classification") {
    text(b.text);
    const cw = w / b.groups.length;
    bands.push(...gridBands(b.groups, w, size, m, true));
    for (let i = 0; i < b.lines; i++)
      bands.push({
        height: 24,
        elements: b.groups.map((_, j) =>
          line(j * cw + 11, 18, (j + 1) * cw - 11, 18),
        ),
      });
  } else if (b.type === "matching") {
    text(b.text);
    b.pairs.forEach((v) =>
      bands.push(...gridBands([v.left, v.right], w, size, m)),
    );
  } else if (b.type === "choice") {
    text(b.text);
    b.options.forEach((s) => {
      const wrapped = wrap(s, w - 23, size, m);
      wrapped.forEach((t, j) =>
        bands.push({
          height: size * 1.5 + 3,
          elements: [
            ...(j === 0 ? [rect(2, 3, 10, 10, "#FFFFFF", INK)] : []),
            txt(t, 23, size + 1, size, false, color),
          ],
        }),
      );
      bands.push({ height: 4, elements: [] });
    });
  } else if (b.type === "diagram") {
    text(b.text);
    b.nodes.forEach((s, i) => {
      bands.push(...gridBands([s], w, size, m, true));
      if (i < b.nodes.length - 1)
        bands.push({
          height: 22,
          elements: [
            line(w / 2, 3, w / 2, 18, ORANGE),
            line(w / 2 - 4, 14, w / 2, 18, ORANGE),
            line(w / 2 + 4, 14, w / 2, 18, ORANGE),
          ],
          keepNext: true,
        });
    });
  } else
    text(
      b.text,
      b.type === "heading",
      b.type === "heading" ? Math.max(15, size) : size,
    );
  if (b.type === "theory" && b.examples) text(b.examples, true);
  if (!["classification", "illustration"].includes(b.type))
    for (let i = 0; i < b.lines; i++)
      bands.push({ height: 24, elements: [line(0, 18, w, 18)] });
  if (teacher && (b.answer || b.comment)) {
    bands.push(
      { height: 8, elements: [] },
      {
        height: 21,
        elements: [txt("Ответ преподавателя", 0, 14, 10, true, color)],
        keepNext: true,
      },
    );
    text(b.answer);
    if (b.comment) {
      text("Комментарий", true, 10);
      text(b.comment);
    }
  }
  if (!bands.length) bands.push({ height: 18, elements: [] });
  return bands;
}
export function buildLayout(
  project: Project,
  m: Metrics,
  mode: "student" | "teacher" = "student",
): Layout {
  const margin = (project.margin * 72) / 25.4,
    width = A4.width - 2 * margin,
    start = margin + 33,
    limit = A4.height - margin - 25,
    capacity = limit - start;
  const pages: Page[] = [];
  let page: Page;
  let y = 0;
  function newPage() {
    page = { elements: [], regions: [] };
    pages.push(page);
    page.elements.push(
      txt(
        "РУССКИЙ ЯЗЫК  /  " + project.grade + " КЛАСС",
        margin,
        margin + 11,
        9,
        true,
      ),
      line(margin, margin + 21, A4.width - margin, margin + 21),
    );
    if (mode === "teacher")
      page.elements.push(
        txt("Для преподавателя", A4.width - margin - 110, margin + 11, 9),
      );
    y = start;
  }
  newPage();
  const title = makeBlock("heading");
  Object.assign(title, {
    id: "document-title",
    title: project.title,
    instruction: project.subtitle,
    text:
      project.topic &&
      project.topic !== project.subtitle &&
      project.topic !== project.title
        ? project.topic
        : "",
    fill: "#FFFFFF",
    fontSize: 16,
    lines: 0,
    padding: 8,
  });
  const identity = makeBlock("task");
  Object.assign(identity, {
    id: "document-identity",
    title: "",
    text: "Имя: __________________________    Дата: ______________",
    lines: 0,
    padding: 8,
    fill: "#FFFFFF",
    fontSize: 10,
  });
  for (const b of [
    title,
    ...(mode === "student" ? [identity] : []),
    ...project.blocks,
  ]) {
    const pad = b.padding,
      inner = width - pad * 2,
      bands = bandsFor(b, inner, m, mode === "teacher");
    const total = bands.reduce((s, v) => s + v.height, 0) + pad * 2;
    if (total <= capacity && y + total > limit) newPage();
    let index = 0,
      continuation = false;
    while (index < bands.length) {
      const remaining = limit - y - pad * 2 - (continuation ? 19 : 0);
      let used = 0,
        end = index;
      while (end < bands.length && used + bands[end].height <= remaining) {
        const nextHeight =
          bands[end].keepNext && end + 1 < bands.length
            ? bands[end + 1].height
            : 0;
        if (used + bands[end].height + nextHeight > remaining && y > start)
          break;
        used += bands[end].height;
        end++;
      }
      if (end === index) {
        if (y > start) {
          newPage();
          continue;
        }
        throw new Error(
          "Блок не помещается в страницу. Уменьшите размер текста или отступы.",
        );
      }
      const h = used + pad * 2 + (continuation ? 19 : 0);
      const bg = rect(
        margin,
        y,
        width,
        h,
        b.fill,
        undefined,
        b.type === "heading" ? 0 : 10,
      );
      bg.blockId = b.id;
      page!.elements.push(bg);
      page!.regions.push({ id: b.id, x: margin, y, width, height: h });
      let by = y + pad;
      if (continuation) {
        page!.elements.push({
          ...txt(
            "Продолжение блока",
            margin + pad,
            by + 11,
            9,
            false,
            contrast(b.fill),
          ),
          blockId: b.id,
        });
        by += 19;
      }
      for (let j = index; j < end; j++) {
        for (const e of bands[j].elements)
          page!.elements.push({
            ...e,
            x: e.x + margin + pad,
            y: e.y + by,
            ...(e.x2 !== undefined
              ? { x2: e.x2 + margin + pad, y2: e.y2! + by }
              : {}),
            blockId: b.id,
          });
        by += bands[j].height;
      }
      y += h + 12;
      index = end;
      if (index < bands.length) {
        newPage();
        continuation = true;
      }
    }
  }
  pages.forEach((p, i) =>
    p.elements.push(
      txt(
        `${i + 1} / ${pages.length}`,
        A4.width - margin - 34,
        A4.height - margin + 9,
        9,
      ),
      txt(
        mode === "teacher" ? "Ответы и комментарии" : "Рабочий лист",
        margin,
        A4.height - margin + 9,
        8,
      ),
    ),
  );
  return { pages, mode };
}
