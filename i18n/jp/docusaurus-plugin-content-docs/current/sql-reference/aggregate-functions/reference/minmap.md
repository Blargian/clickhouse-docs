---
description: 'Calculates the minimum from `value` array according to the keys specified
  in the `key` array.'
sidebar_position: 169
slug: '/sql-reference/aggregate-functions/reference/minmap'
title: 'minMap'
---




# minMap

`key` 配列で指定されたキーに従って、`value` 配列から最小値を計算します。

**構文**

```sql
`minMap(key, value)`
```
または
```sql
minMap(Tuple(key, value))
```

別名: `minMappedArrays`

:::note
- キーと値の配列のタプルを渡すことは、キーの配列と値の配列を渡すことと同じです。
- 各行の合計を計算するために、`key` と `value` の要素数は同じでなければなりません。
:::

**パラメータ**

- `key` — キーの配列。 [Array](../../data-types/array.md)。
- `value` — 値の配列。 [Array](../../data-types/array.md)。

**戻り値**

- ソートされた順序のキーと、対応するキーに対して計算された値のタプルを返します。 [Tuple](../../data-types/tuple.md)([Array](../../data-types/array.md), [Array](../../data-types/array.md))。

**例**

クエリ:

```sql
SELECT minMap(a, b)
FROM values('a Array(Int32), b Array(Int64)', ([1, 2], [2, 2]), ([2, 3], [1, 1]))
```

結果:

```text
┌─minMap(a, b)──────┐
│ ([1,2,3],[2,1,1]) │
└───────────────────┘
```
