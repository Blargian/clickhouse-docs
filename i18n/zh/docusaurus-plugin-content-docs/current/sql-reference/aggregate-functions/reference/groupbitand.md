---
slug: /sql-reference/aggregate-functions/reference/groupbitand
sidebar_position: 147
title: 'groupBitAnd'
description: '应用位元的 `AND` 运算于一系列数字。'
---


# groupBitAnd

应用位元的 `AND` 运算于一系列数字。

``` sql
groupBitAnd(expr)
```

**参数**

`expr` – 结果为 `UInt*` 或 `Int*` 类型的表达式。

**返回值**

`UInt*` 或 `Int*` 类型的值。

**示例**

测试数据：

``` text
binary     decimal
00101100 = 44
00011100 = 28
00001101 = 13
01010101 = 85
```

查询：

``` sql
SELECT groupBitAnd(num) FROM t
```

其中 `num` 是包含测试数据的列。

结果：

``` text
binary     decimal
00000100 = 4
```
