---
description: 'Добавляет разницу между последовательными строками. Если разница отрицательная, она игнорируется.'
sidebar_position: 130
slug: /sql-reference/aggregate-functions/reference/deltasumtimestamp
title: 'deltaSumTimestamp'
---

Добавляет разницу между последовательными строками. Если разница отрицательная, она игнорируется.

Эта функция предназначена в первую очередь для [материализованных представлений](/sql-reference/statements/create/view#materialized-view), которые хранят данные, упорядоченные по некоторой метке времени, выровненной по временным интервалам, например, по интервалу `toStartOfMinute`. Поскольку строки в таком материализованном представлении будут иметь одинаковую метку времени, они не могут быть объединены в правильном порядке, без хранения оригинального, неокругленного значения метки времени. Функция `deltaSumTimestamp` отслеживает оригинальное значение `timestamp` увиденных значений, так что значения (состояния) функции корректно вычисляются во время слияния частей.

Чтобы вычислить дельта-сумму по упорядоченной коллекции, вы можете просто использовать функцию [deltaSum](/sql-reference/aggregate-functions/reference/deltasum).

**Синтаксис**

```sql
deltaSumTimestamp(value, timestamp)
```

**Аргументы**

- `value` — Входные значения, должны быть какого-либо типа [Integer](../../data-types/int-uint.md) или типа [Float](../../data-types/float.md) или типа [Date](../../data-types/date.md) или типа [DateTime](../../data-types/datetime.md).
- `timestamp` — Параметр для порядка значений, должен быть какого-либо типа [Integer](../../data-types/int-uint.md) или типа [Float](../../data-types/float.md) или типа [Date](../../data-types/date.md) или типа [DateTime](../../data-types/datetime.md).

**Возвращаемое значение**

- Накопленные различия между последовательными значениями, упорядоченные по параметру `timestamp`.

Тип: [Integer](../../data-types/int-uint.md) или [Float](../../data-types/float.md) или [Date](../../data-types/date.md) или [DateTime](../../data-types/datetime.md).

**Пример**

Запрос:

```sql
SELECT deltaSumTimestamp(value, timestamp)
FROM (SELECT number AS timestamp, [0, 4, 8, 3, 0, 0, 0, 1, 3, 5][number] AS value FROM numbers(1, 10));
```

Результат:

```text
┌─deltaSumTimestamp(value, timestamp)─┐
│                                  13 │
└─────────────────────────────────────┘
```
