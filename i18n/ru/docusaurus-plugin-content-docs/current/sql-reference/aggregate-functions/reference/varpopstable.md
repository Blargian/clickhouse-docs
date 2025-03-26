---
description: 'Возвращает дисперсию по всему населению. В отличие от varPop, эта функция использует численно стабильный алгоритм. Она работает медленнее, но обеспечивает меньшую вычислительную ошибку.'
sidebar_position: 211
slug: /sql-reference/aggregate-functions/reference/varpopstable
title: 'varPopStable'
---

## varPopStable {#varpopstable}

Возвращает дисперсию по всему населению. В отличие от [`varPop`](../reference/varpop.md), эта функция использует [численно стабильный](https://en.wikipedia.org/wiki/Numerical_stability) алгоритм. Она работает медленнее, но обеспечивает меньшую вычислительную ошибку.

**Синтаксис**

```sql
varPopStable(x)
```

Псевдоним: `VAR_POP_STABLE`.

**Параметры**

- `x`: Население значений, для которого необходимо найти дисперсию. [(U)Int*](../../data-types/int-uint.md), [Float*](../../data-types/float.md), [Decimal*](../../data-types/decimal.md).

**Возвращаемое значение**

- Возвращает дисперсию по всему населению `x`. [Float64](../../data-types/float.md).

**Пример**

Запрос:

```sql
DROP TABLE IF EXISTS test_data;
CREATE TABLE test_data
(
    x UInt8,
)
ENGINE = Memory;

INSERT INTO test_data VALUES (3),(3),(3),(4),(4),(5),(5),(7),(11),(15);

SELECT
    varPopStable(x) AS var_pop_stable
FROM test_data;
```

Результат:

```response
┌─var_pop_stable─┐
│           14.4 │
└────────────────┘
```
