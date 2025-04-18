---
description: 'Обзор вложенных структур данных в ClickHouse'
sidebar_label: 'Nested(Name1 Type1, Name2 Type2, ...)'
sidebar_position: 57
slug: /sql-reference/data-types/nested-data-structures/nested
title: 'Nested'
---

# Nested

## Nested(name1 Type1, Name2 Type2, ...) {#nestedname1-type1-name2-type2-}

Вложенная структура данных подобна таблице внутри ячейки. Параметры вложенной структуры данных – имена колонок и типы – задаются так же, как в запросе [CREATE TABLE](../../../sql-reference/statements/create/table.md). Каждая строка таблицы может соответствовать произвольному числу строк во вложенной структуре данных.

Пример:

```sql
CREATE TABLE test.visits
(
    CounterID UInt32,
    StartDate Date,
    Sign Int8,
    IsNew UInt8,
    VisitID UInt64,
    UserID UInt64,
    ...
    Goals Nested
    (
        ID UInt32,
        Serial UInt32,
        EventTime DateTime,
        Price Int64,
        OrderID String,
        CurrencyID UInt32
    ),
    ...
) ENGINE = CollapsingMergeTree(StartDate, intHash32(UserID), (CounterID, StartDate, intHash32(UserID), VisitID), 8192, Sign)
```

Этот пример объявляет вложенную структуру данных `Goals`, которая содержит данные оConversions (достигнутые цели). Каждая строка в таблице 'visits' может соответствовать нулю или любому количеству конверсий.

Когда [flatten_nested](/operations/settings/settings#flatten_nested) установлено в `0` (что не является значением по умолчанию), поддерживаются произвольные уровни вложенности.

В большинстве случаев, работая с вложенной структурой данных, колонки указываются с именами колонок, разделенными точкой. Эти колонки составляют массив соответствующих типов. Все массивы колонок одной вложенной структуры данных имеют одинаковую длину.

Пример:

```sql
SELECT
    Goals.ID,
    Goals.EventTime
FROM test.visits
WHERE CounterID = 101500 AND length(Goals.ID) < 5
LIMIT 10
```

```text
┌─Goals.ID───────────────────────┬─Goals.EventTime───────────────────────────────────────────────────────────────────────────┐
│ [1073752,591325,591325]        │ ['2014-03-17 16:38:10','2014-03-17 16:38:48','2014-03-17 16:42:27']                       │
│ [1073752]                      │ ['2014-03-17 00:28:25']                                                                   │
│ [1073752]                      │ ['2014-03-17 10:46:20']                                                                   │
│ [1073752,591325,591325,591325] │ ['2014-03-17 13:59:20','2014-03-17 22:17:55','2014-03-17 22:18:07','2014-03-17 22:18:51'] │
│ []                             │ []                                                                                        │
│ [1073752,591325,591325]        │ ['2014-03-17 11:37:06','2014-03-17 14:07:47','2014-03-17 14:36:21']                       │
│ []                             │ []                                                                                        │
│ []                             │ []                                                                                        │
│ [591325,1073752]               │ ['2014-03-17 00:46:05','2014-03-17 00:46:05']                                             │
│ [1073752,591325,591325,591325] │ ['2014-03-17 13:28:33','2014-03-17 13:30:26','2014-03-17 18:51:21','2014-03-17 18:51:45'] │
└────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┘
```

Проще всего представить вложенную структуру данных как набор нескольких массивов колонок одинаковой длины.

Единственное место, где запрос SELECT может указать имя всей вложенной структуры данных вместо отдельных колонок – это оператор ARRAY JOIN. Для получения дополнительной информации см. "ARRAY JOIN clause". Пример:

```sql
SELECT
    Goal.ID,
    Goal.EventTime
FROM test.visits
ARRAY JOIN Goals AS Goal
WHERE CounterID = 101500 AND length(Goals.ID) < 5
LIMIT 10
```

```text
┌─Goal.ID─┬──────Goal.EventTime─┐
│ 1073752 │ 2014-03-17 16:38:10 │
│  591325 │ 2014-03-17 16:38:48 │
│  591325 │ 2014-03-17 16:42:27 │
│ 1073752 │ 2014-03-17 00:28:25 │
│ 1073752 │ 2014-03-17 10:46:20 │
│ 1073752 │ 2014-03-17 13:59:20 │
│  591325 │ 2014-03-17 22:17:55 │
│  591325 │ 2014-03-17 22:18:07 │
│  591325 │ 2014-03-17 22:18:51 │
│ 1073752 │ 2014-03-17 11:37:06 │
└─────────┴─────────────────────┘
```

Невозможно выполнить SELECT для всей вложенной структуры данных. Можно только явно указать отдельные колонки, которые являются её частью.

Для запроса INSERT вы должны передать все массивы колонок, составляющие вложенную структуру данных, отдельно (как если бы они были отдельными массивами колонок). Во время вставки система проверяет, чтобы они имели одинаковую длину.

Для запроса DESCRIBE колонки во вложенной структуре данных перечисляются отдельно таким же образом.

Запрос ALTER для элементов во вложенной структуре данных имеет ограничения.
