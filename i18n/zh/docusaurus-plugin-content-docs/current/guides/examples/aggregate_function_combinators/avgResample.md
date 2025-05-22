
# countResample {#countResample}

## Description {#description}

[`Resample`](/sql-reference/aggregate-functions/combinators#-resample) 组合器可应用于 [`count`](/sql-reference/aggregate-functions/reference/count) 聚合函数，以在固定数量的区间（`N`）中计算指定键列的值。

## Example Usage {#example-usage}

### Basic example {#basic-example}

让我们来看一个例子。我们将创建一个包含员工 `name`、`age` 和 `wage` 的表，并向其中插入一些数据：

```sql
CREATE TABLE employee_data 
(
    name String,
    age UInt8,
    wage Float32
) 
ENGINE = MergeTree()
ORDER BY tuple()

INSERT INTO employee_data (name, age, wage) VALUES
    ('John', 16, 10.0),
    ('Alice', 30, 15.0),
    ('Mary', 35, 8.0),
    ('Evelyn', 48, 11.5),
    ('David', 62, 9.9),
    ('Brian', 60, 16.0);
```

让我们获取年龄在区间 `[30,60)` 和 `[60,75)` 之间的人的平均工资（`[` 是不包含，`)` 是包含）。由于我们使用整数表示年龄，因此我们在区间 `[30, 59]` 和 `[60,74]` 中获得年龄。为此，我们将 `Resample` 组合器应用于 `avg` 聚合函数。

```sql
WITH avg_wage AS
(
    SELECT avgResample(30, 75, 30)(wage, age) AS original_avg_wage
    FROM employee_data
)
SELECT
    arrayMap(x -> round(x, 3), original_avg_wage) AS avg_wage_rounded
FROM avg_wage;
```

```response
┌─avg_wage_rounded─┐
│ [11.5,12.95]     │
└──────────────────┘
```

## See also {#see-also}
- [`count`](/sql-reference/aggregate-functions/reference/count)
- [`Resample combinator`](/sql-reference/aggregate-functions/combinators#-resample)
