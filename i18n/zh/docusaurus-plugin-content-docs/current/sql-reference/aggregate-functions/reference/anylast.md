---
'description': '选择列的最后一个遇到的值。'
'sidebar_position': 105
'slug': '/sql-reference/aggregate-functions/reference/anylast'
'title': 'anyLast'
---


# anyLast

选择列中最后遇到的值。

:::warning
由于查询可以以任意顺序执行，因此此函数的结果是非确定性的。
如果需要任意但确定的结果，请使用函数 [`min`](../reference/min.md) 或 [`max`](../reference/max.md)。
:::

默认情况下，该函数从不返回 NULL，即忽略输入列中的 NULL 值。
然而，如果该函数与 `RESPECT NULLS` 修饰符一起使用，则无论是否为 NULL，它都会返回读取的第一个值。

**语法**

```sql
anyLast(column) [RESPECT NULLS]
```

别名 `anyLast(column)`（不带 `RESPECT NULLS`）
- [`last_value`](../reference/last_value.md)。

`anyLast(column) RESPECT NULLS` 的别名
- `anyLastRespectNulls`，`anyLast_respect_nulls`
- `lastValueRespectNulls`，`last_value_respect_nulls`

**参数**
- `column`: 列名。

**返回值**

- 最后遇到的值。

**示例**

查询：

```sql
CREATE TABLE tab (city Nullable(String)) ENGINE=Memory;

INSERT INTO tab (city) VALUES ('Amsterdam'),(NULL),('New York'),('Tokyo'),('Valencia'),(NULL);

SELECT anyLast(city), anyLastRespectNulls(city) FROM tab;
```

```response
┌─anyLast(city)─┬─anyLastRespectNulls(city)─┐
│ Valencia      │ ᴺᵁᴸᴸ                      │
└───────────────┴───────────────────────────┘
```
