import { z } from "zod";
export const TYPES = {
  heading: "Заголовок",
  theory: "Теория",
  task: "Обычное задание",
  gaps: "Пропуски",
  table: "Таблица",
  classification: "Классификация",
  matching: "Соответствия",
  choice: "Выбор ответа",
  reading: "Работа с текстом",
  lines: "Строки для ответа",
  diagram: "Схема",
  illustration: "Иллюстрация",
} as const;
export type BlockType = keyof typeof TYPES;
const str = z.string().max(100000);
const cell = z.string().max(20000);
export const blockSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.enum(Object.keys(TYPES) as [BlockType, ...BlockType[]]),
    title: str,
    instruction: str,
    text: str,
    examples: str,
    answer: str,
    comment: str,
    fill: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    padding: z.number().min(8).max(28),
    fontSize: z.number().min(9).max(18),
    lines: z.number().int().min(0).max(40),
    groups: z.array(cell).min(2).max(3),
    options: z.array(cell).max(30),
    pairs: z.array(z.object({ left: cell, right: cell }).strict()).max(100),
    table: z
      .object({
        headers: z.array(cell).min(1).max(6),
        rows: z.array(z.array(cell).max(6)).max(200),
      })
      .strict(),
    nodes: z.array(cell).min(1).max(8),
    illustration: z.enum(["book", "clock", "plant"]),
  })
  .strict()
  .superRefine((b, ctx) => {
    if (b.table.rows.some((r) => r.length !== b.table.headers.length))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "В таблице число ячеек строки должно совпадать с числом столбцов.",
      });
  });
export const projectSchema = z
  .object({
    version: z.literal(1),
    id: z.string().min(1).max(100),
    name: str,
    grade: z.enum(["5", "6", "7", "8", "9"]),
    topic: str,
    title: str,
    subtitle: str,
    margin: z.number().min(10).max(28),
    blocks: z.array(blockSchema).max(300),
    updatedAt: z.string(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (new Set(p.blocks.map((b) => b.id)).size !== p.blocks.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Идентификаторы блоков должны быть уникальными.",
      });
    if (JSON.stringify(p).length > 2000000)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Слишком большой проект: максимум 2 млн символов.",
      });
  });
export type Block = z.infer<typeof blockSchema>;
export type Project = z.infer<typeof projectSchema>;
export const id = () => crypto.randomUUID();
export function makeBlock(type: BlockType): Block {
  return {
    id: id(),
    type,
    title: type === "illustration" ? "" : TYPES[type],
    instruction: "",
    text: "",
    examples: "",
    answer: "",
    comment: "",
    fill: type === "theory" ? "#F4E2D0" : "#E3EBD9",
    padding: 14,
    fontSize: 11,
    lines: ["task", "gaps", "reading", "lines"].includes(type) ? 3 : 0,
    groups: ["Группа 1", "Группа 2"],
    options: ["Вариант 1", "Вариант 2", "Вариант 3"],
    pairs: [
      { left: "Понятие 1", right: "Описание А" },
      { left: "Понятие 2", right: "Описание Б" },
    ],
    table: {
      headers: ["Слово", "Ответ", "Объяснение"],
      rows: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ],
    },
    nodes: ["Первый шаг", "Второй шаг", "Вывод"],
    illustration: "book",
  };
}
export function makeProject(): Project {
  return {
    version: 1,
    id: id(),
    name: "Новый рабочий лист",
    grade: "6",
    topic: "",
    title: "Новый рабочий лист",
    subtitle: "",
    margin: 14,
    blocks: [],
    updatedAt: new Date().toISOString(),
  };
}
export function demoProject(): Project {
  const p = makeProject();
  Object.assign(p, {
    name: "Слова и их происхождение",
    topic: "Исконно русские и заимствованные слова",
    title: "Слова и их происхождение",
    subtitle: "Исконно русские и заимствованные слова",
  });
  function add(type: BlockType, fields: Partial<Block>) {
    p.blocks.push({ ...makeBlock(type), ...fields });
  }
  add("theory", {
    title: "Два пути в русский язык",
    text: "Исконно русские слова возникли в русском языке или унаследованы от языков-предков. Заимствованные слова пришли из других языков.",
    examples:
      "Вода, рука, берёза — исконно русские. Театр, футбол — заимствованные.",
  });
  add("classification", {
    title: "1. Распредели слова",
    instruction:
      "Запиши слова в две группы. Если сомневаешься, воспользуйся этимологическим словарём.",
    text: "лес, автобус, снег, телефон, поле, журнал, река, метро, земля, пальто, небо, радио",
    groups: ["Исконно русские", "Заимствованные"],
    lines: 3,
    answer:
      "Исконно русские: лес, снег, поле, река, земля, небо. Заимствованные: автобус, телефон, журнал, метро, пальто, радио.",
    comment: "Не судите о происхождении только по привычности звучания.",
  });
  add("matching", {
    title: "2. Почему язык заимствует слова?",
    instruction: "Соотнеси причину с примером. Запиши пары.",
    pairs: [
      { left: "А. Новый вид спорта", right: "1. суши" },
      { left: "Б. Научный прибор", right: "2. футбол" },
      { left: "В. Блюдо другой страны", right: "3. микроскоп" },
    ],
    lines: 1,
    answer: "А — 2; Б — 3; В — 1.",
  });
  add("gaps", {
    title: "3. Сохрани смысл",
    instruction:
      "Вместо выделенных прописными буквами слов запиши нейтральную замену.",
    text: "Моё ХОББИ — рисование. → __________________\nВ ФИНАЛЕ рассказа герой вернулся домой. → __________________",
    lines: 0,
    answer: "Моё увлечение — рисование. В конце рассказа герой вернулся домой.",
  });
  add("table", {
    title: "4. Оставить или заменить?",
    instruction: "Учти ситуацию общения. Кратко объясни решение.",
    table: {
      headers: ["Ситуация", "Решение / замена", "Почему?"],
      rows: [
        ["На уроке: «Настрой микроскоп».", "", ""],
        ["Однокласснику: «Обсудим в чате».", "", ""],
        ["В рассказе: «Моё хобби — чтение».", "", ""],
      ],
    },
    answer:
      "Микроскоп: оставить, это точное название прибора. Чат: допустимо оставить. Хобби: можно заменить на «увлечение».",
    comment: "Принимайте разные уместные решения с аргументом.",
  });
  add("choice", {
    title: "5. Проверь вывод",
    instruction: "Выбери верное утверждение и объясни свой выбор.",
    options: [
      "Любое привычное слово — исконно русское.",
      "Происхождение слова проверяют по этимологическому словарю.",
      "Все заимствованные слова нужно заменять.",
    ],
    lines: 2,
    answer:
      "Второе утверждение. Привычность слова не показывает его происхождения.",
  });
  return p;
}
