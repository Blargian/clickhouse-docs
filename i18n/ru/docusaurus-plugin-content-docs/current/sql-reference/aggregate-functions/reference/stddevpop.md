---
description: 'Результат равен квадратному корню из varPop.'
sidebar_position: 188
slug: /sql-reference/aggregate-functions/reference/stddevpop
title: 'stddevPop'
---


# stddevPop

Результат равен квадратному корню из [varPop](../../../sql-reference/aggregate-functions/reference/varpop.md).

Псевдонимы: `STD`, `STDDEV_POP`.

:::note
Эта функция использует численно нестабильный алгоритм. Если вам нужна [численная стабильность](https://en.wikipedia.org/wiki/Numerical_stability) в вычислениях, используйте функцию [`stddevPopStable`](../reference/stddevpopstable.md). Она работает медленнее, но обеспечивает меньшую вычислительную погрешность.
:::

**Синтаксис**

```sql
stddevPop(x)
```

**Параметры**

- `x`: Популяция значений, для которых необходимо найти стандартное отклонение. [(U)Int*](../../data-types/int-uint.md), [Float*](../../data-types/float.md), [Decimal*](../../data-types/decimal.md).

**Возвращаемое значение**

- Квадратный корень из стандартного отклонения `x`. [Float64](../../data-types/float.md).


**Пример**

Запрос:

```sql
DROP TABLE IF EXISTS test_data;
CREATE TABLE test_data
(
    population UInt8,
)
ENGINE = Log;

INSERT INTO test_data VALUES (3),(3),(3),(4),(4),(5),(5),(7),(11),(15);

SELECT
    stddevPop(population) AS stddev
FROM test_data;
```

Результат:

```response
┌────────────stddev─┐
│ 3.794733192202055 │
└───────────────────┘
```
