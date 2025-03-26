---
title: 'Типы данных даты и времени — Временные ряды'
sidebar_label: 'Типы данных даты и времени'
description: 'Типы данных временных рядов в ClickHouse.'
slug: /use-cases/time-series/date-time-data-types
keywords: ['time-series']
---


# Типы данных даты и времени

Наличие обширного набора типов данных даты и времени необходимо для эффективного управления данными временных рядов, и ClickHouse предоставляет именно это. От компактных представлений даты до временных меток высокой точности с точностью до наносекунд, эти типы разработаны для балансировки эффективности хранения с практическими требованиями для различных приложений временных рядов.

Независимо от того, работаете ли вы с историческими финансовыми данными, показаниями датчиков IoT или событиями, имеющими запланированную в будущем дату, типы данных даты и времени ClickHouse обеспечивают необходимую гибкость для работы с различными сценариями обработки временных данных. Поддерживаемый диапазон типов позволяет оптимизировать как место хранения, так и производительность запросов, одновременно поддерживая точность, необходимую вашему случаю использования.

* Тип [`Date`](/sql-reference/data-types/date) должен быть достаточен в большинстве случаев. Для хранения даты этот тип требует 2 байта и ограничивает диапазон `[1970-01-01, 2149-06-06]`. 

* [`Date32`](/sql-reference/data-types/date32) охватывает более широкий диапазон дат. Для хранения даты требуется 4 байта, и диапазон ограничен `[1900-01-01, 2299-12-31]`.

* [`DateTime`](/sql-reference/data-types/datetime) хранит значения даты и времени с точностью до секунды и диапазоном `[1970-01-01 00:00:00, 2106-02-07 06:28:15]`. Требуется 4 байта на значение.

* В случаях, когда требуется большая точность, можно использовать [`DateTime64`](/sql-reference/data-types/datetime64). Это позволяет хранить время с точностью до наносекунд в диапазоне `[1900-01-01 00:00:00, 2299-12-31 23:59:59.99999999]`. Требуется 8 байт на значение.

Создадим таблицу, которая хранит различные типы дат:


```sql
CREATE TABLE dates
(
    `date` Date,
    `wider_date` Date32,
    `datetime` DateTime,
    `precise_datetime` DateTime64(3),
    `very_precise_datetime` DateTime64(9)
)
ENGINE = MergeTree
ORDER BY tuple();
```

Мы можем использовать функцию [`now()`](/sql-reference/functions/date-time-functions#now), чтобы вернуть текущее время, и [`now64()`](/sql-reference/functions/date-time-functions#now64), чтобы получить его с указанной точностью через первый аргумент.

```sql
INSERT INTO dates 
SELECT now(), 
       now()::Date32 + toIntervalYear(100),
       now(), 
       now64(3), 
       now64(9) + toIntervalYear(200);
```

Это заполнит наши столбцы временем в соответствии с типом столбца:

```sql
SELECT * FROM dates
FORMAT Vertical;
```

```text
Row 1:
──────
date:                  2025-03-12
wider_date:            2125-03-12
datetime:              2025-03-12 11:39:07
precise_datetime:      2025-03-12 11:39:07.196
very_precise_datetime: 2025-03-12 11:39:07.196724000
```

## Часовые пояса {#time-series-timezones}

Многие кейсы требуют также хранения часовых поясов. Мы можем задать часовой пояс в качестве последнего аргумента к типам `DateTime` или `DateTime64`:


```sql
CREATE TABLE dtz
(
    `id` Int8,
    `dt_1` DateTime('Europe/Berlin'),
    `dt_2` DateTime,
    `dt64_1` DateTime64(9, 'Europe/Berlin'),
    `dt64_2` DateTime64(9),
)
ENGINE = MergeTree
ORDER BY id;
```

Определив часовой пояс в нашем DDL, теперь мы можем вставлять времена, используя разные часовые пояса:


```sql
INSERT INTO dtz 
SELECT 1, 
       toDateTime('2022-12-12 12:13:14', 'America/New_York'),
       toDateTime('2022-12-12 12:13:14', 'America/New_York'),
       toDateTime64('2022-12-12 12:13:14.123456789', 9, 'America/New_York'),
       toDateTime64('2022-12-12 12:13:14.123456789', 9, 'America/New_York')
UNION ALL
SELECT 2, 
       toDateTime('2022-12-12 12:13:15'),
       toDateTime('2022-12-12 12:13:15'),
       toDateTime64('2022-12-12 12:13:15.123456789', 9),
       toDateTime64('2022-12-12 12:13:15.123456789', 9);
```

А теперь давайте посмотрим, что в нашей таблице:

```sql
SELECT dt_1, dt64_1, dt_2, dt64_2
FROM dtz
FORMAT Vertical;
```

```text
Row 1:
──────
dt_1:   2022-12-12 18:13:14
dt64_1: 2022-12-12 18:13:14.123456789
dt_2:   2022-12-12 17:13:14
dt64_2: 2022-12-12 17:13:14.123456789

Row 2:
──────
dt_1:   2022-12-12 13:13:15
dt64_1: 2022-12-12 13:13:15.123456789
dt_2:   2022-12-12 12:13:15
dt64_2: 2022-12-12 12:13:15.123456789
```

В первой строке мы вставили все значения, используя часовой пояс `America/New_York`.
* `dt_1` и `dt64_1` автоматически конвертируются в `Europe/Berlin` во время запроса.
* `dt_2` и `dt64_2` не имели указанного часового пояса, поэтому они используют локальный часовой пояс сервера, который в данном случае `Europe/London`.

Во второй строке мы вставили все значения без часового пояса, поэтому использовался локальный часовой пояс сервера.
Как и в первой строке, `dt_1` и `dt_3` конвертируются в `Europe/Berlin`, в то время как `dt_2` и `dt64_2` используют локальный часовой пояс сервера.


## Функции даты и времени {#time-series-date-time-functions}

ClickHouse также предоставляет набор функций, которые позволяют нам конвертировать между различными типами данных.

Например, мы можем использовать [`toDate`](/sql-reference/functions/type-conversion-functions#todate) для преобразования значения `DateTime` в тип `Date`:

```sql
SELECT
    now() AS current_time,
    toTypeName(current_time),
    toDate(current_time) AS date_only,
    toTypeName(date_only)
FORMAT Vertical;    
```

```text
Row 1:
──────
current_time:             2025-03-12 12:32:54
toTypeName(current_time): DateTime
date_only:                2025-03-12
toTypeName(date_only):    Date
```

Мы можем использовать [`toDateTime64`](/sql-reference/functions/type-conversion-functions#todatetime64) для преобразования `DateTime` в `DateTime64`:

```sql
SELECT
    now() AS current_time,
    toTypeName(current_time),
    toDateTime64(current_time, 3) AS date_only,
    toTypeName(date_only)
FORMAT Vertical;
```

```text
Row 1:
──────
current_time:             2025-03-12 12:35:01
toTypeName(current_time): DateTime
date_only:                2025-03-12 12:35:01.000
toTypeName(date_only):    DateTime64(3)
```

И мы можем использовать [`toDateTime`](/sql-reference/functions/type-conversion-functions#todatetime) для преобразования из `Date` или `DateTime64` обратно в `DateTime`:

```sql
SELECT
    now64() AS current_time,
    toTypeName(current_time),
    toDateTime(current_time) AS date_time1,
    toTypeName(date_time1),
    today() AS current_date,
    toTypeName(current_date),
    toDateTime(current_date) AS date_time2,
    toTypeName(date_time2)
FORMAT Vertical;
```

```text
Row 1:
──────
current_time:             2025-03-12 12:41:00.598
toTypeName(current_time): DateTime64(3)
date_time1:               2025-03-12 12:41:00
toTypeName(date_time1):   DateTime
current_date:             2025-03-12
toTypeName(current_date): Date
date_time2:               2025-03-12 00:00:00
toTypeName(date_time2):   DateTime
```
