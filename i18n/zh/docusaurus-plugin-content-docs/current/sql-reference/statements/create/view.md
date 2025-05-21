---
'description': 'CREATE VIEW 的文档'
'sidebar_label': '视图'
'sidebar_position': 37
'slug': '/sql-reference/statements/create/view'
'title': 'CREATE VIEW'
---

import ExperimentalBadge from '@theme/badges/ExperimentalBadge';
import DeprecatedBadge from '@theme/badges/DeprecatedBadge';
import CloudNotSupportedBadge from '@theme/badges/CloudNotSupportedBadge';


# CREATE VIEW

创建一个新的视图。视图可以是 [普通视图](#normal-view)、[物化视图](#materialized-view)、[可刷新的物化视图](#refreshable-materialized-view) 和 [窗口视图](/sql-reference/statements/create/view#window-view)（可刷新的物化视图和窗口视图是实验性功能）。

## 普通视图 {#normal-view}

语法：

```sql
CREATE [OR REPLACE] VIEW [IF NOT EXISTS] [db.]table_name [(alias1 [, alias2 ...])] [ON CLUSTER cluster_name]
[DEFINER = { user | CURRENT_USER }] [SQL SECURITY { DEFINER | INVOKER | NONE }]
AS SELECT ...
[COMMENT 'comment']
```

普通视图不存储任何数据。每次访问时，它仅从另一个表中读取数据。换句话说，普通视图只不过是一个保存的查询。当从视图中读取数据时，此保存的查询作为 [FROM](../../../sql-reference/statements/select/from.md) 子查询使用。

例如，假设您已创建一个视图：

```sql
CREATE VIEW view AS SELECT ...
```

并编写了一个查询：

```sql
SELECT a, b, c FROM view
```

该查询完全等效于使用子查询：

```sql
SELECT a, b, c FROM (SELECT ...)
```

## 带参数的视图 {#parameterized-view}

带参数的视图类似于普通视图，但可以使用在创建时未立即解析的参数。这些视图可以与表函数一起使用，表函数将视图的名称作为函数名，参数值作为其参数。

```sql
CREATE VIEW view AS SELECT * FROM TABLE WHERE Column1={column1:datatype1} and Column2={column2:datatype2} ...
```
上述创建了一个表的视图，可以通过如下替换参数作为表函数使用。

```sql
SELECT * FROM view(column1=value1, column2=value2 ...)
```

## 物化视图 {#materialized-view}

```sql
CREATE MATERIALIZED VIEW [IF NOT EXISTS] [db.]table_name [ON CLUSTER cluster_name] [TO[db.]name [(columns)]] [ENGINE = engine] [POPULATE]
[DEFINER = { user | CURRENT_USER }] [SQL SECURITY { DEFINER | NONE }]
AS SELECT ...
[COMMENT 'comment']
```

:::tip
这是有关使用 [物化视图](/guides/developer/cascading-materialized-views.md) 的逐步指南。
:::

物化视图存储通过相应的 [SELECT](../../../sql-reference/statements/select/index.md) 查询转换的数据。

在创建物化视图时，如果未包含 `TO [db].[table]`，则必须指定 `ENGINE`——用于存储数据的表引擎。

在创建包含 `TO [db].[table]` 的物化视图时，不能使用 `POPULATE`。

物化视图的实现如下：当插入数据到 `SELECT` 指定的表时，插入的数据的一部分通过此 `SELECT` 查询转换，结果插入视图中。

:::note
ClickHouse 中的物化视图使用 **列名** 而不是列顺序将数据插入到目标表中。如果在 `SELECT` 查询结果中缺少某些列名，ClickHouse 将使用默认值，即使该列不是 [Nullable](../../data-types/nullable.md)。使用物化视图时，为每个列添加别名是一种安全的做法。

ClickHouse 中的物化视图更像是插入触发器。如果视图查询中有某些聚合操作，仅对新插入数据的批次应用聚合。对源表现有数据的任何更改（如更新、删除、删除分区等）不会改变物化视图。

在出现错误的情况下，ClickHouse 中的物化视图没有确定性行为。这意味着已经写入的块将保留在目标表中，但错误后所有后续块将不会写入。

默认情况下，如果向其中一个视图推送失败，则 INSERT 查询也会失败，并且某些块可能不会写入目标表。可以使用 `materialized_views_ignore_errors` 设置进行更改（您应该为 `INSERT` 查询设置此选项），如果您设置 `materialized_views_ignore_errors=true`，则在向视图推送时的任何错误将被忽略，并且所有块都将写入目标表。

还请注意，`materialized_views_ignore_errors` 默认设置为 `true`，适用于 `system.*_log` 表。
:::

如果您指定 `POPULATE`，则在创建视图时，现有表数据将插入到视图中，就像执行 `CREATE TABLE ... AS SELECT ...` 一样。否则，该查询仅包含在创建视图后插入到表中的数据。我们 **不推荐** 使用 `POPULATE`，因为在创建视图期间插入到表的数据将不会插入到视图中。

:::note
由于 `POPULATE` 的工作方式类似于 `CREATE TABLE ... AS SELECT ...`，它有以下限制：
- 不支持复制数据库。
- 不支持 ClickHouse 云。

可以使用单独的 `INSERT ... SELECT`。
:::

`SELECT` 查询可以包含 `DISTINCT`、`GROUP BY`、`ORDER BY`、`LIMIT`。请注意，相应的转换在每个插入数据块上独立执行。例如，如果设置了 `GROUP BY`，则在插入时聚合数据，但仅在单个插入数据包内。数据不会进一步聚合。例外情况是当使用 `ENGINE` 独立执行数据聚合时，如 `SummingMergeTree`。

对物化视图的 [ALTER](/sql-reference/statements/alter/view.md) 查询执行有限制，例如，您不能更新 `SELECT` 查询，因此这可能不便。如果物化视图使用构造 `TO [db.]name`，您可以 `DETACH` 视图，对目标表运行 `ALTER`，然后 `ATTACH` 先前分离（`DETACH`）的视图。

请注意，物化视图受 [optimize_on_insert](/operations/settings/settings#optimize_on_insert) 设置的影响。在插入视图之前，数据被合并。

视图的外观与普通表相同。例如，它们会在 `SHOW TABLES` 查询的结果中列出。

要删除视图，请使用 [DROP VIEW](../../../sql-reference/statements/drop.md#drop-view)。尽管 `DROP TABLE` 也适用于视图。

## SQL 安全性 {#sql_security}

`DEFINER` 和 `SQL SECURITY` 允许您指定在执行视图的基础查询时使用哪个 ClickHouse 用户。
`SQL SECURITY` 有三个合法值：`DEFINER`、`INVOKER` 或 `NONE`。您可以在 `DEFINER` 子句中指定任何现有用户或 `CURRENT_USER`。

下表将说明选择视图的不同用户所需的权限。请注意，无论 SQL 安全选项如何，在每种情况下读取视图仍需拥有 `GRANT SELECT ON <view>` 权限。

| SQL 安全选项         | 视图                                                            | 物化视图                                                                                                 |
|---------------------|-----------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `DEFINER alice`     | `alice` 必须对视图的源表拥有 `SELECT` 授权。                  | `alice` 必须对视图的源表拥有 `SELECT` 授权，并对视图的目标表拥有 `INSERT` 授权。                         |
| `INVOKER`           | 用户必须对视图的源表拥有 `SELECT` 授权。                      | `SQL SECURITY INVOKER` 不能为物化视图指定。                                                             |
| `NONE`              | -                                                               | -                                                                                                                 |

:::note
`SQL SECURITY NONE` 是一个不推荐的选项。任何具有创建视图的 `SQL SECURITY NONE` 权限的用户都能够执行任何任意查询。
因此，必须具有 `GRANT ALLOW SQL SECURITY NONE TO <user>` 以创建此选项的视图。
:::

如果未指定 `DEFINER`/`SQL SECURITY`，则使用默认值：
- `SQL SECURITY`：对于普通视图为 `INVOKER`，对于物化视图为 `DEFINER`（[可通过设置配置](../../../operations/settings/settings.md#default_normal_view_sql_security)）。
- `DEFINER`：`CURRENT_USER`（[可通过设置配置](../../../operations/settings/settings.md#default_view_definer)）。

如果以不指定 `DEFINER`/`SQL SECURITY` 的方式附加视图，则默认值为物化视图的 `SQL SECURITY NONE`，普通视图的 `SQL SECURITY INVOKER`。

要更改现有视图的 SQL 安全性，请使用
```sql
ALTER TABLE MODIFY SQL SECURITY { DEFINER | INVOKER | NONE } [DEFINER = { user | CURRENT_USER }]
```

### 示例 {#examples}
```sql
CREATE VIEW test_view
DEFINER = alice SQL SECURITY DEFINER
AS SELECT ...
```

```sql
CREATE VIEW test_view
SQL SECURITY INVOKER
AS SELECT ...
```

## 实时视图 {#live-view}

<DeprecatedBadge/>

此功能已被弃用，并将在将来删除。

为了您的方便，旧文档位于 [此处](https://pastila.nl/?00f32652/fdf07272a7b54bda7e13b919264e449f.md)

## 可刷新的物化视图 {#refreshable-materialized-view}

```sql
CREATE MATERIALIZED VIEW [IF NOT EXISTS] [db.]table_name [ON CLUSTER cluster]
REFRESH EVERY|AFTER interval [OFFSET interval]
[RANDOMIZE FOR interval]
[DEPENDS ON [db.]name [, [db.]name [, ...]]]
[SETTINGS name = value [, name = value [, ...]]]
[APPEND]
[TO[db.]name] [(columns)] [ENGINE = engine]
[EMPTY]
[DEFINER = { user | CURRENT_USER }] [SQL SECURITY { DEFINER | NONE }]
AS SELECT ...
[COMMENT 'comment']
```
其中 `interval` 是一系列简单的时间间隔：
```sql
number SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR
```

定期运行相应的查询并将结果存储在表中。
 * 如果查询指出 `APPEND`，则每次刷新的插入会将行添加到表中，而不删除现有行。该插入不是原子的，类似于常规的 INSERT SELECT。
 * 否则，每次刷新原子性地替换表的先前内容。

与常规的不可刷新的物化视图的不同之处：
 * 没有插入触发器。即，当将新数据插入到 `SELECT` 指定的表中时，它不会自动推送到可刷新的物化视图中。定期刷新将运行整个查询。
 * 对 `SELECT` 查询没有限制。表函数（例如 `url()`）、视图、UNION、JOIN 都被允许。

:::note
查询的 `REFRESH ... SETTINGS` 部分中的设置是刷新设置（例如 `refresh_retries`），与常规设置（例如 `max_threads`）不同。常规设置可以通过在查询末尾使用 `SETTINGS` 指定。
:::

### 刷新调度 {#refresh-schedule}

示例刷新调度：
```sql
REFRESH EVERY 1 DAY -- every day, at midnight (UTC)
REFRESH EVERY 1 MONTH -- on 1st day of every month, at midnight
REFRESH EVERY 1 MONTH OFFSET 5 DAY 2 HOUR -- on 6th day of every month, at 2:00 am
REFRESH EVERY 2 WEEK OFFSET 5 DAY 15 HOUR 10 MINUTE -- every other Saturday, at 3:10 pm
REFRESH EVERY 30 MINUTE -- at 00:00, 00:30, 01:00, 01:30, etc
REFRESH AFTER 30 MINUTE -- 30 minutes after the previous refresh completes, no alignment with time of day
-- REFRESH AFTER 1 HOUR OFFSET 1 MINUTE -- syntax error, OFFSET is not allowed with AFTER
REFRESH EVERY 1 WEEK 2 DAYS -- every 9 days, not on any particular day of the week or month;
                            -- specifically, when day number (since 1969-12-29) is divisible by 9
REFRESH EVERY 5 MONTHS -- every 5 months, different months each year (as 12 is not divisible by 5);
                       -- specifically, when month number (since 1970-01) is divisible by 5
```

`RANDOMIZE FOR` 随机调整每次刷新的时间，例如：
```sql
REFRESH EVERY 1 DAY OFFSET 2 HOUR RANDOMIZE FOR 1 HOUR -- every day at random time between 01:30 and 02:30
```

对于给定视图，在任何时候最多只能运行一个刷新。例如，如果具有 `REFRESH EVERY 1 MINUTE` 的视图需要 2 分钟进行刷新，它将每 2 分钟刷新一次。如果它变得更快并开始在 10 秒内刷新，则它将恢复为每分钟刷新一次。（特别是，它不会每 10 秒刷新一次以赶上未完成刷新的积压——没有这样的积压存在。）

此外，物化视图创建后会立即启动一次刷新，除非在 `CREATE` 查询中指定了 `EMPTY`。如果指定了 `EMPTY`，则首次刷新将按照计划进行。

### 在复制数据库中 {#in-replicated-db}

如果可刷新的物化视图在 [复制数据库](../../../engines/database-engines/replicated.md) 中，副本间会协作，以便只有一个副本在每个计划时间执行刷新。需要使用 [ReplicatedMergeTree](../../../engines/table-engines/mergetree-family/replication.md) 表引擎，以便所有副本看到刷新产生的数据。

在 `APPEND` 模式下，可以使用 `SETTINGS all_replicas = 1` 禁用协作。这使得副本可以独立进行刷新。在这种情况下，不需要 ReplicatedMergeTree。

在非 `APPEND` 模式下，仅支持协作刷新。对于非协作，使用 `Atomic` 数据库和 `CREATE ... ON CLUSTER` 查询在所有副本上创建可刷新的物化视图。

协调通过 Keeper 完成。节点路径由 [default_replica_path](../../../operations/server-configuration-parameters/settings.md#default_replica_path) 服务器设置确定。

### 依赖关系 {#refresh-dependencies}

`DEPENDS ON` 同步不同表的刷新。以下是一个包含两个可刷新的物化视图的链的示例：
```sql
CREATE MATERIALIZED VIEW source REFRESH EVERY 1 DAY AS SELECT * FROM url(...)
CREATE MATERIALIZED VIEW destination REFRESH EVERY 1 DAY AS SELECT ... FROM source
```
如果没有 `DEPENDS ON`，两个视图将同时在午夜启动刷新，`destination` 通常会看到 `source` 中的昨天数据。如果我们添加依赖关系：
```sql
CREATE MATERIALIZED VIEW destination REFRESH EVERY 1 DAY DEPENDS ON source AS SELECT ... FROM source
```
则 `destination` 的刷新仅在 `source` 当天的刷新完成后开始，因此 `destination` 将基于最新数据。

或者，可以通过以下方式实现相同的结果：
```sql
CREATE MATERIALIZED VIEW destination REFRESH AFTER 1 HOUR DEPENDS ON source AS SELECT ... FROM source
```
其中 `1 HOUR` 可以是小于 `source` 刷新周期的任何持续时间。依赖表的刷新频率将不超过其任何依赖项。这是一种有效的方式来设置可刷新的视图链，而不必多次指定真实的刷新周期。

更多示例：
 * `REFRESH EVERY 1 DAY OFFSET 10 MINUTE`（`destination`）取决于 `REFRESH EVERY 1 DAY`（`source`）<br/>
   如果 `source` 刷新的时间超过 10 分钟，`destination` 将等待它。
 * `REFRESH EVERY 1 DAY OFFSET 1 HOUR` 依赖于 `REFRESH EVERY 1 DAY OFFSET 23 HOUR`<br/>
   与上述相似，尽管相应的刷新发生在不同的日历日。
   `destination` 在 X+1 天的刷新将等待 X 天的 `source` 刷新（如果超过 2 小时）。
 * `REFRESH EVERY 2 HOUR` 依赖于 `REFRESH EVERY 1 HOUR`<br/>
   2 小时的刷新将在每隔 1 小时后的 1 小时刷新后进行，例如在午夜后
   刷新，然后在凌晨 2 点刷新等。
 * `REFRESH EVERY 1 MINUTE` 依赖于 `REFRESH EVERY 2 HOUR`<br/>
   `REFRESH AFTER 1 MINUTE` 依赖于 `REFRESH EVERY 2 HOUR`<br/>
   `REFRESH AFTER 1 MINUTE` 依赖于 `REFRESH AFTER 2 HOUR`<br/>
   `destination` 在每次 `source` 刷新后刷新一次，即每 2 小时。`1 MINUTE` 实际上被忽略。
 * `REFRESH AFTER 1 HOUR` 依赖于 `REFRESH AFTER 1 HOUR`<br/>
   当前这不推荐。

:::note
`DEPENDS ON` 仅适用于可刷新的物化视图。在 `DEPENDS ON` 列表中列出常规表将阻止该视图刷新（可以通过 `ALTER` 删除依赖关系，如下所示）。
:::

### 设置 {#settings}

可用的刷新设置：
 * `refresh_retries` - 如果刷新查询由于异常失败，则重试的次数。如果所有重试都失败，则跳过到下一个计划的刷新时间。0 表示不重试，-1 表示无限重试。默认值：0。
 * `refresh_retry_initial_backoff_ms` - 如果 `refresh_retries` 不为零，则首次重试前的延迟。每个后续重试延迟加倍，直到 `refresh_retry_max_backoff_ms`。默认值：100 毫秒。
 * `refresh_retry_max_backoff_ms` - 刷新尝试之间延迟的指数增长限制。默认值：60000 毫秒（1 分钟）。

### 更改刷新参数 {#changing-refresh-parameters}

要更改刷新参数：
```sql
ALTER TABLE [db.]name MODIFY REFRESH EVERY|AFTER ... [RANDOMIZE FOR ...] [DEPENDS ON ...] [SETTINGS ...]
```

:::note
这会一次性替换 *所有* 刷新参数：调度、依赖性、设置，以及 APPEND 属性。例如，如果表有 `DEPENDS ON`，在没有 `DEPENDS ON` 的情况下执行 `MODIFY REFRESH` 将移除依赖关系。
:::

### 其他操作 {#other-operations}

所有可刷新的物化视图的状态在 [`system.view_refreshes`](../../../operations/system-tables/view_refreshes.md) 表中可用。特别是，它包含刷新进度（如果正在运行）、最后和下一个刷新时间、如果刷新失败的异常消息。

要手动停止、启动、触发或取消刷新，请使用 [`SYSTEM STOP|START|REFRESH|WAIT|CANCEL VIEW`](../system.md#refreshable-materialized-views)。

要等待刷新完成，请使用 [`SYSTEM WAIT VIEW`](../system.md#refreshable-materialized-views)。特别适合在创建视图后等待初始刷新。

:::note
有趣的是：刷新查询允许从正在刷新的视图中读取，看到数据的预刷新版本。这意味着您可以实现康威生命游戏：https://pastila.nl/?00021a4b/d6156ff819c83d490ad2dcec05676865#O0LGWTO7maUQIA4AcGUtlA==
:::

## 窗口视图 {#window-view}

<ExperimentalBadge/>
<CloudNotSupportedBadge/>

:::info
这是一个实验性功能，未来版本可能会以向后不兼容的方式更改。使用 [allow_experimental_window_view](/operations/settings/settings#allow_experimental_window_view) 设置启用窗口视图和 `WATCH` 查询的使用。输入命令 `set allow_experimental_window_view = 1`。
:::

```sql
CREATE WINDOW VIEW [IF NOT EXISTS] [db.]table_name [TO [db.]table_name] [INNER ENGINE engine] [ENGINE engine] [WATERMARK strategy] [ALLOWED_LATENESS interval_function] [POPULATE]
AS SELECT ...
GROUP BY time_window_function
[COMMENT 'comment']
```

窗口视图可以通过时间窗口聚合数据，并在窗口准备好触发时输出结果。它将部分聚合结果存储在内部（或指定）表中以减少延迟，并可以将处理结果推送到指定表或使用 `WATCH` 查询推送通知。

创建窗口视图类似于创建 `MATERIALIZED VIEW`。窗口视图需要内部存储引擎来存储中间数据。可以使用 `INNER ENGINE` 子句指定内部存储，窗口视图将使用 `AggregatingMergeTree` 作为默认内部引擎。

在没有 `TO [db].[table]` 的情况下创建窗口视图时，您必须指定 `ENGINE`——用于存储数据的表引擎。

### 时间窗口函数 {#time-window-functions}

[时间窗口函数](../../functions/time-window-functions.md)用于获取记录的下限和上限窗口边界。窗口视图需要与时间窗口函数一起使用。

### 时间属性 {#time-attributes}

窗口视图支持 **处理时间** 和 **事件时间** 的处理。

**处理时间** 使窗口视图能够根据本地机器的时间生成结果，并作为默认值使用。这是最简单的时间概念，但并不提供确定性。处理时间属性可以通过将时间窗口函数的 `time_attr` 设置为表列或使用函数 `now()` 来定义。以下查询创建了一个使用处理时间的窗口视图。

```sql
CREATE WINDOW VIEW wv AS SELECT count(number), tumbleStart(w_id) as w_start from date GROUP BY tumble(now(), INTERVAL '5' SECOND) as w_id
```

**事件时间** 是每个单独事件发生在其生成设备上的时间。当生成时，通常会将此时间嵌入记录中。事件时间处理允许在事件的顺序不一致或事件延迟的情况下获得一致的结果。窗口视图通过使用 `WATERMARK` 语法支持事件时间处理。

窗口视图提供三种水印策略：

* `STRICTLY_ASCENDING`：发出迄今为止观察到的最大时间戳的水印。具有小于最大时间戳的时间戳的行不延迟。
* `ASCENDING`：发出迄今为止观察到的最大时间戳减去 1 的水印。具有等于或小于最大时间戳的时间戳的行不延迟。
* `BOUNDED`：WATERMARK=INTERVAL。发出水印，即最大观察时间戳减去指定的延迟。

以下查询是创建带有 `WATERMARK` 的窗口视图的示例：

```sql
CREATE WINDOW VIEW wv WATERMARK=STRICTLY_ASCENDING AS SELECT count(number) FROM date GROUP BY tumble(timestamp, INTERVAL '5' SECOND);
CREATE WINDOW VIEW wv WATERMARK=ASCENDING AS SELECT count(number) FROM date GROUP BY tumble(timestamp, INTERVAL '5' SECOND);
CREATE WINDOW VIEW wv WATERMARK=INTERVAL '3' SECOND AS SELECT count(number) FROM date GROUP BY tumble(timestamp, INTERVAL '5' SECOND);
```

默认情况下，窗口在水印到达时发射，并且抵达水印的元素将被丢弃。窗口视图通过设置 `ALLOWED_LATENESS=INTERVAL` 来支持延迟事件处理。处理延迟的示例是：

```sql
CREATE WINDOW VIEW test.wv TO test.dst WATERMARK=ASCENDING ALLOWED_LATENESS=INTERVAL '2' SECOND AS SELECT count(a) AS count, tumbleEnd(wid) AS w_end FROM test.mt GROUP BY tumble(timestamp, INTERVAL '5' SECOND) AS wid;
```

请注意，由迟发出元素应视为先前计算的更新结果。窗口视图将在延迟事件到达时立即触发，而不是在窗口结束时触发。因此，它将导致对同一窗口的多次输出。用户需要考虑这些重复结果或对其去重。

您可以使用 `ALTER TABLE ... MODIFY QUERY` 语句修改在窗口视图中指定的 `SELECT` 查询。新 `SELECT` 查询生成的数据结构应与原始 `SELECT` 查询相同，无论是否包含 `TO [db.]name` 子句。请注意，当前窗口中的数据将丢失，因为中间状态不能重用。

### 监控新窗口 {#monitoring-new-windows}

窗口视图支持 [WATCH](../../../sql-reference/statements/watch.md) 查询来监控更改，或使用 `TO` 语法将结果输出到表中。

```sql
WATCH [db.]window_view
[EVENTS]
[LIMIT n]
[FORMAT format]
```

`WATCH` 查询的作用类似于 `LIVE VIEW`。可以指定 `LIMIT` 来设置在终止查询之前接收更新的数量。`EVENTS` 子句可以用来简化 `WATCH` 查询，您将仅获取最新的查询水印，而不是查询结果。

### 设置 {#settings-1}

- `window_view_clean_interval`: 窗口视图的清理间隔，单位为秒，以释放过时数据。系统将保留根据系统时间或 `WATERMARK` 配置未完全触发的窗口，而其他数据将被删除。
- `window_view_heartbeat_interval`: 心跳间隔，单位为秒以指示监视查询处于活动状态。
- `wait_for_window_view_fire_signal_timeout`: 等待事件时间处理中的窗口视图触发信号的超时。

### 示例 {#example}

假设我们需要在名为 `data` 的日志表中每 10 秒计算一次点击日志的数量，其表结构为：

```sql
CREATE TABLE data ( `id` UInt64, `timestamp` DateTime) ENGINE = Memory;
```

首先，我们创建一个每 10 秒间隔的窗口视图：

```sql
CREATE WINDOW VIEW wv as select count(id), tumbleStart(w_id) as window_start from data group by tumble(timestamp, INTERVAL '10' SECOND) as w_id
```

然后，我们使用 `WATCH` 查询获取结果。

```sql
WATCH wv
```

当日志插入到 `data` 表中，

```sql
INSERT INTO data VALUES(1,now())
```

`WATCH` 查询应如下所示打印结果：

```text
┌─count(id)─┬────────window_start─┐
│         1 │ 2020-01-14 16:56:40 │
└───────────┴─────────────────────┘
```

另外，我们可以使用 `TO` 语法将输出附加到另一个表。

```sql
CREATE WINDOW VIEW wv TO dst AS SELECT count(id), tumbleStart(w_id) as window_start FROM data GROUP BY tumble(timestamp, INTERVAL '10' SECOND) as w_id
```

其他示例可以在 ClickHouse 的有状态测试中找到（它们被命名为 `*window_view*`）。

### 窗口视图使用场景 {#window-view-usage}

窗口视图在以下场景中非常有用：

* **监控**：按时间聚合和计算指标日志，并将结果输出到目标表。仪表板可以将目标表用作源表。
* **分析**：自动在时间窗口中聚合和预处理数据。这在分析大量日志时非常有用。预处理消除了多个查询中的重复计算，并减少查询延迟。

## 相关内容 {#related-content}

- 博客: [在 ClickHouse 中处理时间序列数据](https://clickhouse.com/blog/working-with-time-series-data-and-functions-ClickHouse)
- 博客: [使用 ClickHouse 建立可观测性解决方案 - 第 2 部分 - 跟踪](https://clickhouse.com/blog/storing-traces-and-spans-open-telemetry-in-clickhouse)
