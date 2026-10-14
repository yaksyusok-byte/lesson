import { projectSchema, type Project, id } from "./model";
const KEY = "worksheet-workshop.v1";
export function parseProject(raw: string): Project {
  if (raw.length > 2000000)
    throw new Error("Файл слишком большой (максимум 2 МБ текста).");
  const result = projectSchema.safeParse(JSON.parse(raw));
  if (!result.success)
    throw new Error(
      "Неверный формат проекта. " + result.error.issues[0].message,
    );
  return result.data;
}
export function listProjects(): Project[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items))
    throw new Error(
      "Хранилище проектов повреждено. Экспортируйте открытый проект в JSON.",
    );
  return items.map((v) => projectSchema.parse(v));
}
export function saveProject(p: Project) {
  projectSchema.parse(p);
  const projects = listProjects();
  const item = { ...p, updatedAt: new Date().toISOString() };
  const i = projects.findIndex((v) => v.id === p.id);
  if (i < 0) projects.unshift(item);
  else projects[i] = item;
  localStorage.setItem(KEY, JSON.stringify(projects));
  return item;
}
export function duplicate(p: Project): Project {
  return {
    ...structuredClone(p),
    id: id(),
    name: p.name + " — копия",
    blocks: p.blocks.map((b) => ({ ...structuredClone(b), id: id() })),
    updatedAt: new Date().toISOString(),
  };
}
export function download(
  bytes: Uint8Array | string,
  mime: string,
  name: string,
) {
  const part = typeof bytes === "string" ? bytes : new Uint8Array(bytes).buffer;
  const url = URL.createObjectURL(new Blob([part], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
