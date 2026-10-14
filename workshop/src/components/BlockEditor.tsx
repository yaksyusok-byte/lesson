import { NumberInput } from "./NumberInput";
import { TYPES, type Block, type BlockType } from "../model";
import { SlidersHorizontal, Trash2, Plus, BookOpen } from "lucide-react";
export function BlockEditor({
  block,
  onChange,
}: {
  block: Block | undefined;
  onChange: (v: Partial<Block>) => void;
}) {
  if (!block)
    return (
      <aside className="editor">
        <div className="panel-heading">
          <SlidersHorizontal size={18} />
          <h2>Настройки блока</h2>
        </div>
        <div className="empty-editor">
          <BookOpen size={36} />
          <h3>Выберите блок</h3>
          <p>
            Нажмите на карточку в структуре или на листе, чтобы изменить её
            содержание и оформление.
          </p>
        </div>
      </aside>
    );
  const b = block;
  const area = (
    label: string,
    key: "title" | "instruction" | "text" | "examples" | "answer" | "comment",
    rows = 3,
  ) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        rows={rows}
        maxLength={100000}
        value={b[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
      />
    </label>
  );
  return (
    <aside className="editor">
      <div className="panel-heading">
        <SlidersHorizontal size={18} />
        <h2>Редактор блока</h2>
      </div>
      <div className="editor-scroll" key={b.id}>
        <span className="eyebrow">СОДЕРЖАНИЕ</span>
        <label>
          Тип блока
          <select
            value={b.type}
            onChange={(e) => onChange({ type: e.target.value as BlockType })}
          >
            {Object.entries(TYPES).map(([v, s]) => (
              <option key={v} value={v}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {area("Заголовок блока", "title", 2)}
        {b.type !== "illustration" && area("Инструкция", "instruction", 2)}
        {b.type !== "illustration" &&
          area(
            b.type === "theory"
              ? "Определение"
              : b.type === "reading"
                ? "Текст для чтения"
                : "Текст / слова",
            "text",
            4,
          )}
        {b.type === "gaps" && (
          <p className="field-hint">
            Обозначьте пропуски подчёркиваниями: ______. Текст не будет изменён
            автоматически.
          </p>
        )}
        {b.type === "theory" && area("Примеры", "examples", 3)}
        {b.type === "classification" && (
          <label>
            Группы (2 или 3)
            <select
              value={b.groups.length}
              onChange={(e) =>
                onChange({
                  groups:
                    Number(e.target.value) === 3
                      ? [...b.groups.slice(0, 2), b.groups[2] ?? "Группа 3"]
                      : b.groups.slice(0, 2),
                })
              }
            >
              <option value="2">Две группы</option>
              <option value="3">Три группы</option>
            </select>
            {b.groups.map((s, i) => (
              <input
                aria-label={`Название группы ${i + 1}`}
                key={i}
                value={s}
                onChange={(e) =>
                  onChange({
                    groups: b.groups.map((v, j) =>
                      j === i ? e.target.value : v,
                    ),
                  })
                }
              />
            ))}
          </label>
        )}
        {b.type === "choice" && (
          <div className="field-list">
            <label>Варианты ответа</label>
            {b.options.map((s, i) => (
              <div className="input-row" key={i}>
                <textarea
                  rows={2}
                  aria-label={`Вариант ${i + 1}`}
                  value={s}
                  onChange={(e) =>
                    onChange({
                      options: b.options.map((v, j) =>
                        j === i ? e.target.value : v,
                      ),
                    })
                  }
                />
                <button
                  aria-label={`Удалить вариант ${i + 1}`}
                  onClick={() =>
                    onChange({ options: b.options.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              disabled={b.options.length >= 30}
              onClick={() => onChange({ options: [...b.options, ""] })}
            >
              <Plus size={14} /> Вариант
            </button>
          </div>
        )}
        {b.type === "matching" && (
          <div className="field-list">
            <label>Пары соответствий</label>
            {b.pairs.map((pair, i) => (
              <div className="pair-row" key={i}>
                <textarea
                  aria-label={`Левая часть ${i + 1}`}
                  rows={2}
                  value={pair.left}
                  onChange={(e) =>
                    onChange({
                      pairs: b.pairs.map((v, j) =>
                        j === i ? { ...v, left: e.target.value } : v,
                      ),
                    })
                  }
                />
                <textarea
                  aria-label={`Правая часть ${i + 1}`}
                  rows={2}
                  value={pair.right}
                  onChange={(e) =>
                    onChange({
                      pairs: b.pairs.map((v, j) =>
                        j === i ? { ...v, right: e.target.value } : v,
                      ),
                    })
                  }
                />
                <button
                  aria-label={`Удалить пару ${i + 1}`}
                  onClick={() =>
                    onChange({ pairs: b.pairs.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              disabled={b.pairs.length >= 100}
              onClick={() =>
                onChange({ pairs: [...b.pairs, { left: "", right: "" }] })
              }
            >
              <Plus size={14} /> Пара
            </button>
          </div>
        )}
        {b.type === "diagram" && (
          <div className="field-list">
            <label>Смысловые блоки</label>
            {b.nodes.map((s, i) => (
              <div key={i} className="input-row">
                <textarea
                  rows={2}
                  aria-label={`Шаг ${i + 1}`}
                  value={s}
                  onChange={(e) =>
                    onChange({
                      nodes: b.nodes.map((v, j) =>
                        j === i ? e.target.value : v,
                      ),
                    })
                  }
                />
                <button
                  disabled={b.nodes.length === 1}
                  aria-label={`Удалить шаг ${i + 1}`}
                  onClick={() =>
                    onChange({ nodes: b.nodes.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              disabled={b.nodes.length >= 8}
              onClick={() => onChange({ nodes: [...b.nodes, ""] })}
            >
              <Plus size={14} /> Шаг
            </button>
          </div>
        )}
        {b.type === "table" && (
          <div className="table-editor">
            <label>Содержание таблицы</label>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {b.table.headers.map((s, i) => (
                      <th key={i}>
                        <input
                          aria-label={`Заголовок столбца ${i + 1}`}
                          value={s}
                          onChange={(e) =>
                            onChange({
                              table: {
                                ...b.table,
                                headers: b.table.headers.map((v, j) =>
                                  j === i ? e.target.value : v,
                                ),
                              },
                            })
                          }
                        />
                        <button
                          disabled={b.table.headers.length === 1}
                          aria-label={`Удалить столбец ${i + 1}`}
                          onClick={() =>
                            onChange({
                              table: {
                                headers: b.table.headers.filter(
                                  (_, j) => j !== i,
                                ),
                                rows: b.table.rows.map((r) =>
                                  r.filter((_, j) => j !== i),
                                ),
                              },
                            })
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {b.table.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((cell, j) => (
                        <td key={j}>
                          <textarea
                            aria-label={`Ячейка ${i + 1}, ${j + 1}`}
                            rows={2}
                            value={cell}
                            onChange={(e) =>
                              onChange({
                                table: {
                                  ...b.table,
                                  rows: b.table.rows.map((v, a) =>
                                    a === i
                                      ? v.map((s, k) =>
                                          k === j ? e.target.value : s,
                                        )
                                      : v,
                                  ),
                                },
                              })
                            }
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          aria-label={`Удалить строку ${i + 1}`}
                          onClick={() =>
                            onChange({
                              table: {
                                ...b.table,
                                rows: b.table.rows.filter((_, j) => j !== i),
                              },
                            })
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="button-row">
              <button
                disabled={b.table.rows.length >= 200}
                onClick={() =>
                  onChange({
                    table: {
                      ...b.table,
                      rows: [...b.table.rows, b.table.headers.map(() => "")],
                    },
                  })
                }
              >
                <Plus size={14} /> Строка
              </button>
              <button
                disabled={b.table.headers.length >= 6}
                onClick={() =>
                  onChange({
                    table: {
                      headers: [...b.table.headers, ""],
                      rows: b.table.rows.map((r) => [...r, ""]),
                    },
                  })
                }
              >
                <Plus size={14} /> Столбец
              </button>
            </div>
          </div>
        )}
        {b.type === "illustration" && (
          <label>
            Рисунок
            <select
              value={b.illustration}
              onChange={(e) =>
                onChange({
                  illustration: e.target.value as Block["illustration"],
                })
              }
            >
              <option value="book">Книги и лупа</option>
              <option value="clock">Часы</option>
              <option value="plant">Растение</option>
            </select>
          </label>
        )}
        <hr />
        <span className="eyebrow">ОФОРМЛЕНИЕ</span>
        <label>
          Цвет карточки
          <div className="swatches">
            {["#F4E2D0", "#E3EBD9", "#FFFFFF", "#D57B0E", "#3A5635"].map(
              (color) => (
                <button
                  key={color}
                  aria-label={`Цвет ${color}`}
                  className={b.fill === color ? "chosen" : ""}
                  style={{ background: color }}
                  onClick={() => onChange({ fill: color })}
                />
              ),
            )}
            <input
              aria-label="Другой цвет"
              type="color"
              value={b.fill}
              onChange={(e) => onChange({ fill: e.target.value })}
            />
          </div>
        </label>
        <div className="two-fields">
          <label>
            Шрифт, пт
            <NumberInput
              label="Шрифт, пт"
              min={9}
              max={18}
              value={b.fontSize}
              onChange={(fontSize) => onChange({ fontSize })}
            />
          </label>
          <label>
            Отступ, пт
            <NumberInput
              label="Отступ, пт"
              min={8}
              max={28}
              value={b.padding}
              onChange={(padding) => onChange({ padding })}
            />
          </label>
        </div>
        {b.type !== "illustration" && (
          <label>
            Строк для письменного ответа
            <NumberInput
              label="Строк для письменного ответа"
              min={0}
              max={40}
              integer
              value={b.lines}
              onChange={(lines) => onChange({ lines })}
            />
          </label>
        )}
        <hr />
        <div className="answer-label">Только для преподавателя</div>
        {area("Правильный ответ", "answer", 4)}
        {area("Комментарий к ответу", "comment", 3)}
        <p className="field-hint">Эти поля не попадут в ученический PDF.</p>
      </div>
    </aside>
  );
}
