---
description: 'Вычисляет максимум из массива `value` в соответствии с ключами, указанными в массиве `key`.'
sidebar_position: 165
slug: /sql-reference/aggregate-functions/reference/maxmap
title: 'maxMap'
---


# maxMap

Вычисляет максимум из массива `value` в соответствии с ключами, указанными в массиве `key`.

**Синтаксис**

```sql
maxMap(key, value)
```
или
```sql
maxMap(Tuple(key, value))
```

Псевдоним: `maxMappedArrays`

:::note
- Передача кортежа массивов ключей и значений идентична передаче двух массивов ключей и значений.
- Число элементов в `key` и `value` должно быть одинаковым для каждой строки, которая суммируется.
:::

**Параметры**

- `key` — Массив ключей. [Array](../../data-types/array.md).
- `value` — Массив значений. [Array](../../data-types/array.md).

**Возвращаемое значение**

- Возвращает кортеж из двух массивов: ключи в отсортированном порядке и значения, вычисленные для соответствующих ключей. [Tuple](../../data-types/tuple.md)([Array](../../data-types/array.md), [Array](../../data-types/array.md)).

**Пример**

Запрос:

```sql
SELECT maxMap(a, b)
FROM values('a Array(Char), b Array(Int64)', (['x', 'y'], [2, 2]), (['y', 'z'], [3, 1]))
```

Результат:

```text
┌─maxMap(a, b)───────────┐
│ [['x','y','z'],[2,3,1]]│
└────────────────────────┘
```
