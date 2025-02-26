---
slug: /sql-reference/window-functions/rank
sidebar_label: rank
sidebar_position: 6
---

# rank

現在の行をそのパーティション内でランク付けしますが、ギャップを含みます。言い換えれば、遭遇した任意の行の値が前の行の値と等しい場合、その行は前の行と同じランクを受け取ります。
次の行のランクは、前の行のランクに、その前のランクが与えられた回数に等しいギャップを加えたものになります。

[dense_rank](./dense_rank.md) 関数は、ギャップなしで同じ動作を提供します。

**構文**

```sql
rank ()
  OVER ([[PARTITION BY grouping_column] [ORDER BY sorting_column]
        [ROWS または RANGE expression_to_bound_rows_withing_the_group]] | [window_name])
FROM table_name
WINDOW window_name as ([[PARTITION BY grouping_column] [ORDER BY sorting_column])
```

ウィンドウ関数の構文に関する詳細は、[ウィンドウ関数 - 構文](./index.md/#syntax)をご覧ください。

**返される値**

- 現在の行のパーティション内の数値（ギャップを含む）。[UInt64](../data-types/int-uint.md)。

**例**

次の例は、動画の教育資料 [Ranking window functions in ClickHouse](https://youtu.be/Yku9mmBYm_4?si=XIMu1jpYucCQEoXA) に基づいています。

クエリ：

```sql
CREATE TABLE salaries
(
    `team` String,
    `player` String,
    `salary` UInt32,
    `position` String
)
Engine = Memory;

INSERT INTO salaries FORMAT Values
    ('Port Elizabeth Barbarians', 'Gary Chen', 195000, 'F'),
    ('New Coreystad Archdukes', 'Charles Juarez', 190000, 'F'),
    ('Port Elizabeth Barbarians', 'Michael Stanley', 150000, 'D'),
    ('New Coreystad Archdukes', 'Scott Harrison', 150000, 'D'),
    ('Port Elizabeth Barbarians', 'Robert George', 195000, 'M'),
    ('South Hampton Seagulls', 'Douglas Benson', 150000, 'M'),
    ('South Hampton Seagulls', 'James Henderson', 140000, 'M');
```

```sql
SELECT player, salary,
       rank() OVER (ORDER BY salary DESC) AS rank
FROM salaries;
```

結果：

```response
   ┌─player──────────┬─salary─┬─rank─┐
1. │ Gary Chen       │ 195000 │    1 │
2. │ Robert George   │ 195000 │    1 │
3. │ Charles Juarez  │ 190000 │    3 │
4. │ Douglas Benson  │ 150000 │    4 │
5. │ Michael Stanley │ 150000 │    4 │
6. │ Scott Harrison  │ 150000 │    4 │
7. │ James Henderson │ 140000 │    7 │
   └─────────────────┴────────┴──────┘
```
