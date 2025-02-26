---
slug: /sql-reference/aggregate-functions/reference/avg
sidebar_position: 112
---

# avg

算術平均を計算します。

**文法**

``` sql
avg(x)
```

**引数**

- `x` — 入力値、[整数](../../../sql-reference/data-types/int-uint.md)、[浮動小数点](../../../sql-reference/data-types/float.md)、または [小数](../../../sql-reference/data-types/decimal.md)である必要があります。

**返される値**

- 算術平均、常に [Float64](../../../sql-reference/data-types/float.md) として返されます。
- 入力パラメータ `x` が空の場合は `NaN` を返します。

**例**

クエリ:

``` sql
SELECT avg(x) FROM values('x Int8', 0, 1, 2, 3, 4, 5);
```

結果:

``` text
┌─avg(x)─┐
│    2.5 │
└────────┘
```

**例**

一時テーブルを作成します:

クエリ:

``` sql
CREATE table test (t UInt8) ENGINE = Memory;
```

算術平均を取得します:

クエリ:

```sql
SELECT avg(t) FROM test;
```

結果:

``` text
┌─avg(x)─┐
│    nan │
└────────┘
```
