---
slug: /sql-reference/aggregate-functions/reference/groupbitor
sidebar_position: 152
title: "groupBitOr"
description: "一連の数値に対してビット単位の `OR` を適用します。"
---


# groupBitOr

一連の数値に対してビット単位の `OR` を適用します。

``` sql
groupBitOr(expr)
```

**引数**

`expr` – `UInt*` または `Int*` 型の結果を返す式。

**返される値**

`UInt*` または `Int*` 型の値。

**例**

テストデータ:

``` text
binary     decimal
00101100 = 44
00011100 = 28
00001101 = 13
01010101 = 85
```

クエリ:

``` sql
SELECT groupBitOr(num) FROM t
```

ここで `num` はテストデータを含むカラムです。

結果:

``` text
binary     decimal
01111101 = 125
```
