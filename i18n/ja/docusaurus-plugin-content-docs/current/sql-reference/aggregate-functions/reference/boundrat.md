---
slug: /sql-reference/aggregate-functions/reference/boundingRatio
sidebar_position: 114
title: boundingRatio
---

グループ内の値の左端と右端の点の間の傾きを計算する集計関数です。

例：

サンプルデータ：
```sql
SELECT
    number,
    number * 1.5
FROM numbers(10)
```
```response
┌─number─┬─multiply(number, 1.5)─┐
│      0 │                     0 │
│      1 │                   1.5 │
│      2 │                     3 │
│      3 │                   4.5 │
│      4 │                     6 │
│      5 │                   7.5 │
│      6 │                     9 │
│      7 │                  10.5 │
│      8 │                    12 │
│      9 │                  13.5 │
└────────┴───────────────────────┘
```

boundingRatio() 関数は、左端と右端の点の間の直線の傾きを返します。上記のデータでは、これらの点は `(0,0)` と `(9,13.5)` です。

```sql
SELECT boundingRatio(number, number * 1.5)
FROM numbers(10)
```
```response
┌─boundingRatio(number, multiply(number, 1.5))─┐
│                                          1.5 │
└──────────────────────────────────────────────┘
```
