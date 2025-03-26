---
alias: []
description: 'Документация для формата LineAsStringWithNamesAndTypes'
input_format: false
keywords: ['LineAsStringWithNamesAndTypes']
output_format: true
slug: /interfaces/formats/LineAsStringWithNamesAndTypes
title: 'LineAsStringWithNamesAndTypes'
---

| Вход | Выход | Псевдоним |
|------|-------|-----------|
| ✗    | ✔     |           |

## Описание {#description}

Формат `LineAsStringWithNames` аналогичен формату [`LineAsString`](./LineAsString.md),
но выводит две строки заголовков: одну с названиями столбцов, другую с типами.

## Пример использования {#example-usage}

```sql
CREATE TABLE example (
    name String,
    value Int32
)
ENGINE = Memory;

INSERT INTO example VALUES ('John', 30), ('Jane', 25), ('Peter', 35);

SELECT * FROM example FORMAT LineAsStringWithNamesAndTypes;
```

```response title="Ответ"
name    value
String    Int32
John    30
Jane    25
Peter    35
```

## Настройки формата {#format-settings}
