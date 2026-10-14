import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
async function start(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("a4-preview")).toBeVisible();
}
async function projectJson(page: Page) {
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт JSON", exact: true }).click();
  const file = await d;
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}
test("edits all five tasks, adds/deletes/reorders a block, and keeps exact pasted content", async ({
  page,
}) => {
  await start(page);
  const font = page.getByLabel("Шрифт, пт", { exact: true });
  await font.fill("");
  await font.pressSequentially("10");
  await expect(font).toHaveValue("10");
  for (let i = 2; i <= 6; i++) {
    await page
      .getByRole("button", { name: new RegExp(`^Выбрать блок ${i}:`) })
      .click();
    const field = page.getByLabel("Заголовок блока", { exact: true });
    await field.fill(`Проверка задания ${i - 1}`);
    await expect(page.getByTestId("a4-preview")).toContainText(
      `Проверка задания ${i - 1}`,
    );
  }
  await page
    .getByRole("button", { name: "Добавить блок", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Обычное задание", exact: true })
    .click();
  await expect(page.locator(".block-item")).toHaveCount(7);
  await page.getByRole("button", { name: "Блок 7 вверх", exact: true }).click();
  await expect(page.locator(".block-item").nth(5)).toContainText(
    "Обычное задание",
  );
  await page
    .getByRole("button", { name: "Удалить блок 6", exact: true })
    .click();
  await expect(page.locator(".block-item")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Вставить материалы", exact: true })
    .click();
  const raw = "  Авторский текст.\n\nВторой абзац: «Не меняйте меня».\n";
  await page.getByLabel("Материал для вставки").fill(raw);
  await page
    .getByRole("button", { name: "Добавить блок без изменений" })
    .click();
  const p = await projectJson(page);
  expect(p.blocks.at(-1).text).toBe(raw);
});
test("saves, reopens, duplicates, reloads and imports JSON; malformed files leave current content intact", async ({
  page,
}) => {
  await start(page);
  await page.getByLabel("Название проекта").fill("Проверенный проект");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.getByRole("button", { name: "Мои листы", exact: true }).click();
  await page
    .getByRole("button", { name: /Проверенный проект 6 класс/ })
    .click();
  await page.reload();
  await expect(page.getByLabel("Название проекта")).toHaveValue(
    "Проверенный проект",
  );
  const saved = await projectJson(page);
  await page
    .getByRole("button", { name: "Дублировать лист", exact: true })
    .click();
  await expect(page.getByLabel("Название проекта")).toHaveValue(
    "Проверенный проект — копия",
  );
  const copied = await projectJson(page);
  expect(copied.id).not.toBe(saved.id);
  expect(copied.blocks[0].id).not.toBe(saved.blocks[0].id);
  expect(copied.blocks[0].text).toBe(saved.blocks[0].text);
  page.on("dialog", (d) => d.accept());
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "original.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(saved)),
    });
  await expect(page.getByLabel("Название проекта")).toHaveValue(
    "Проверенный проект",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":99}'),
    });
  await expect(page.getByRole("alert")).toContainText(
    "Не удалось импортировать",
  );
  await expect(page.getByLabel("Название проекта")).toHaveValue(
    "Проверенный проект",
  );
});
test("edits table structure and downloads two genuine PDFs; student preview excludes teacher secrets", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: /^Выбрать блок 5:/ }).click();
  await page.getByRole("button", { name: "Строка", exact: true }).click();
  await expect(page.getByLabel("Ячейка 4, 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Столбец", exact: true }).click();
  await page.getByLabel("Заголовок столбца 4").fill("Дополнение");
  await page.getByLabel("Ячейка 4, 4").fill("Новая ячейка");
  await page
    .getByRole("button", { name: "Удалить столбец 4", exact: true })
    .click();
  await expect(page.getByLabel("Заголовок столбца 4")).toHaveCount(0);
  await page
    .getByLabel("Правильный ответ", { exact: true })
    .fill("УЧИТЕЛЬСКИЙ СЕКРЕТ 123");
  await expect(page.getByTestId("a4-preview")).not.toContainText("УЧИТЕЛЬСКИЙ");
  await page.getByRole("button", { name: "С ответами", exact: true }).click();
  await expect(page.getByTestId("a4-preview")).toContainText("УЧИТЕЛЬСКИЙ");
  for (const [label, filename] of [
    ["Рабочий лист для ученика", "student.pdf"],
    ["Лист с ответами преподавателя", "teacher.pdf"],
  ]) {
    await page.getByRole("button", { name: "Скачать PDF" }).click();
    const promise = page.waitForEvent("download");
    await page.getByRole("button", { name: label, exact: true }).click();
    const file = await promise;
    await file.saveAs(test.info().outputPath(filename));
    const bytes = await readFile(test.info().outputPath(filename));
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(595.276, 2);
  }
});
test("paginates a long reading block and exposes honest unconfigured AI mode", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Добавить блок", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Работа с текстом", exact: true })
    .click();
  await page
    .getByLabel("Текст для чтения", { exact: true })
    .fill("Абзац для проверки переноса. ".repeat(600));
  await expect(page.locator(".pager")).not.toContainText("из 2");
  await expect(page.getByTestId("a4-preview")).toBeVisible();
  await page.getByRole("button", { name: "Новый лист", exact: true }).click();
  await page.getByRole("button", { name: "По теории", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "ИИ-сервис не подключён",
  );
  await page.getByLabel("Материал для вставки").fill("Теория без изменений.");
  const count = await page.locator(".block-item").count();
  await page
    .getByRole("button", { name: "Сгенерировать задания", exact: true })
    .click();
  await expect(page.locator(".block-item")).toHaveCount(count);
  await page
    .getByRole("button", { name: "Сохранить теорию", exact: true })
    .click();
  const p = await projectJson(page);
  expect(p.blocks.at(-1).type).toBe("theory");
  expect(p.blocks.at(-1).text).toBe("Теория без изменений.");
});
