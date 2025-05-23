---
title: "varPopStable"
slug: /sql-reference/aggregate-functions/reference/varpopstable
sidebar_position: 211
description: "母集団分散を返します。varPop とは異なり、この関数は数値的に安定したアルゴリズムを使用します。処理速度は遅くなりますが、計算誤差が低くなります。"
---

## varPopStable {#varpopstable}

母集団分散を返します。[`varPop`](../reference/varpop.md)とは異なり、この関数は[数値的に安定した](https://en.wikipedia.org/wiki/Numerical_stability)アルゴリズムを使用します。処理速度は遅くなりますが、計算誤差が低くなります。

**構文**

```sql
varPopStable(x)
```

エイリアス: `VAR_POP_STABLE`。

**パラメータ**

- `x`: 母集団分散を求める値の集合。[(U)Int*](../../data-types/int-uint.md)、[Float*](../../data-types/float.md)、[Decimal*](../../data-types/decimal.md)。

**返される値**

- `x`の母集団分散を返します。[Float64](../../data-types/float.md)。

**例**

クエリ:

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

結果:

```response
┌─var_pop_stable─┐
│           14.4 │
└────────────────┘
```
