---
description: 'Документация для функции оконной nth_value'
sidebar_label: 'nth_value'
sidebar_position: 5
slug: /sql-reference/window-functions/nth_value
title: 'nth_value'
---


# nth_value

Возвращает первое ненулевое значение, оцененное по отношению к n-й строке (смещение) в его отсортированном фрейме.

**Синтаксис**

```sql
nth_value (x, offset)
  OVER ([[PARTITION BY grouping_column] [ORDER BY sorting_column] 
        [ROWS или RANGE выражение_для_ограничения_строк_в_группе]] | [window_name])
FROM table_name
WINDOW window_name as ([[PARTITION BY grouping_column] [ORDER BY sorting_column])
```

Для получения более подробной информации о синтаксисе оконных функций см.: [Оконные функции - Синтаксис](./index.md/#syntax).

**Параметры**

- `x` — Название столбца.
- `offset` — n-я строка, по отношению к которой будет оцениваться текущая строка.

**Возвращаемое значение**

- Первое ненулевое значение, оцененное по отношению к n-й строке (смещению) в его отсортированном фрейме.

**Пример**

В этом примере функция `nth_value` используется для нахождения третьей по величине зарплаты из вымышленного набора данных о зарплатах футболистов Премьер-лиги.

Запрос:

```sql
DROP TABLE IF EXISTS salaries;
CREATE TABLE salaries
(
    `team` String,
    `player` String,
    `salary` UInt32,
    `position` String
)
Engine = Memory;

INSERT INTO salaries FORMAT Values
    ('Port Elizabeth Barbarians', 'Gary Chen', 195000, 'F'),
    ('New Coreystad Archdukes', 'Charles Juarez', 190000, 'F'),
    ('Port Elizabeth Barbarians', 'Michael Stanley', 100000, 'D'),
    ('New Coreystad Archdukes', 'Scott Harrison', 180000, 'D'),
    ('Port Elizabeth Barbarians', 'Robert George', 195000, 'M'),
    ('South Hampton Seagulls', 'Douglas Benson', 150000, 'M'),
    ('South Hampton Seagulls', 'James Henderson', 140000, 'M');
```

```sql
SELECT player, salary, nth_value(player,3) OVER(ORDER BY salary DESC) AS third_highest_salary FROM salaries;
```

Результат:

```response
   ┌─player──────────┬─salary─┬─third_highest_salary─┐
1. │ Gary Chen       │ 195000 │                      │
2. │ Robert George   │ 195000 │                      │
3. │ Charles Juarez  │ 190000 │ Charles Juarez       │
4. │ Scott Harrison  │ 180000 │ Charles Juarez       │
5. │ Douglas Benson  │ 150000 │ Charles Juarez       │
6. │ James Henderson │ 140000 │ Charles Juarez       │
7. │ Michael Stanley │ 100000 │ Charles Juarez       │
   └─────────────────┴────────┴──────────────────────┘
```
