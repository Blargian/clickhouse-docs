---
slug: /sql-reference/aggregate-functions/reference/avgweighted
sidebar_position: 113
title: 'avgWeighted'
description: 'Calculates the weighted arithmetic mean.'
---


# avgWeighted

Calculates the [weighted arithmetic mean](https://en.wikipedia.org/wiki/Weighted_arithmetic_mean).

**Синтаксис**

``` sql
avgWeighted(x, weight)
```

**Аргументы**

- `x` — Значения.
- `weight` — Веса значений.

`x` и `weight` должны быть как
[Целыми](../../../sql-reference/data-types/int-uint.md) так и [числами с плавающей запятой](../../../sql-reference/data-types/float.md),
но могут иметь разные типы.

**Возвращаемое значение**

- `NaN`, если все веса равны 0 или переданный параметр весов пуст.
- Взвешенное среднее в противном случае.

**Тип возвращаемого значения** всегда [Float64](../../../sql-reference/data-types/float.md).

**Пример**

Запрос:

``` sql
SELECT avgWeighted(x, w)
FROM values('x Int8, w Int8', (4, 1), (1, 0), (10, 2))
```

Результат:

``` text
┌─avgWeighted(x, weight)─┐
│                      8 │
└────────────────────────┘
```

**Пример**

Запрос:

``` sql
SELECT avgWeighted(x, w)
FROM values('x Int8, w Float64', (4, 1), (1, 0), (10, 2))
```

Результат:

``` text
┌─avgWeighted(x, weight)─┐
│                      8 │
└────────────────────────┘
```

**Пример**

Запрос:

``` sql
SELECT avgWeighted(x, w)
FROM values('x Int8, w Int8', (0, 0), (1, 0), (10, 0))
```

Результат:

``` text
┌─avgWeighted(x, weight)─┐
│                    nan │
└────────────────────────┘
```

**Пример**

Запрос:

``` sql
CREATE table test (t UInt8) ENGINE = Memory;
SELECT avgWeighted(t) FROM test
```

Результат:

``` text
┌─avgWeighted(x, weight)─┐
│                    nan │
└────────────────────────┘
```
