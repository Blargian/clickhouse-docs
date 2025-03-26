---
description: 'Позволяет выполнять запросы `SELECT` и `INSERT` к данным, которые хранятся на удаленном сервере MySQL.'
sidebar_label: 'mysql'
sidebar_position: 137
slug: /sql-reference/table-functions/mysql
title: 'mysql'
---


# mysql Табличная Функция

Позволяет выполнять запросы `SELECT` и `INSERT` к данным, которые хранятся на удаленном сервере MySQL.

**Синтаксис**

```sql
mysql({host:port, database, table, user, password[, replace_query, on_duplicate_clause] | named_collection[, option=value [,..]]})
```

**Параметры**

- `host:port` — Адрес сервера MySQL.
- `database` — Название удаленной базы данных.
- `table` — Название удаленной таблицы.
- `user` — Пользователь MySQL.
- `password` — Пароль пользователя.
- `replace_query` — Флаг, который преобразует запросы `INSERT INTO` в `REPLACE INTO`. Возможные значения:
    - `0` - Запрос выполняется как `INSERT INTO`.
    - `1` - Запрос выполняется как `REPLACE INTO`.
- `on_duplicate_clause` — Выражение `ON DUPLICATE KEY on_duplicate_clause`, которое добавляется к запросу `INSERT`. Может быть указано только с `replace_query = 0` (если одновременно передаете `replace_query = 1` и `on_duplicate_clause`, ClickHouse сгенерирует исключение).
    Пример: `INSERT INTO t (c1,c2) VALUES ('a', 2) ON DUPLICATE KEY UPDATE c2 = c2 + 1;`
    Здесь `on_duplicate_clause` — это `UPDATE c2 = c2 + 1`. См. документацию MySQL, чтобы узнать, какое `on_duplicate_clause` вы можете использовать с клаузой `ON DUPLICATE KEY`.

Аргументы также могут передаваться с помощью [именованных коллекций](operations/named-collections.md). В этом случае `host` и `port` должны быть указаны отдельно. Такой подход рекомендуется для производственной среды.

Простые условия `WHERE`, такие как `=, !=, >, >=, <, <=`, в настоящее время выполняются на сервере MySQL.

Остальные условия и ограничение выборки `LIMIT` выполняются в ClickHouse только после завершения запроса к MySQL.

Поддерживает несколько реплик, которые должны быть перечислены через `|`. Например:

```sql
SELECT name FROM mysql(`mysql{1|2|3}:3306`, 'mysql_database', 'mysql_table', 'user', 'password');
```

или

```sql
SELECT name FROM mysql(`mysql1:3306|mysql2:3306|mysql3:3306`, 'mysql_database', 'mysql_table', 'user', 'password');
```

**Возвращаемое Значение**

Объект таблицы с такими же столбцами, как и в оригинальной таблице MySQL.

:::note
Некоторые типы данных MySQL могут быть сопоставлены с различными типами ClickHouse - это регулируется параметром уровня запроса [mysql_datatypes_support_level](operations/settings/settings.md#mysql_datatypes_support_level)
:::

:::note
В запросе `INSERT`, чтобы отличить табличную функцию `mysql(...)` от имени таблицы с перечислением имен столбцов, вы должны использовать ключевые слова `FUNCTION` или `TABLE FUNCTION`. См. примеры ниже.
:::

**Примеры**

Таблица в MySQL:

```text
mysql> CREATE TABLE `test`.`test` (
    ->   `int_id` INT NOT NULL AUTO_INCREMENT,
    ->   `float` FLOAT NOT NULL,
    ->   PRIMARY KEY (`int_id`));

mysql> INSERT INTO test (`int_id`, `float`) VALUES (1,2);

mysql> SELECT * FROM test;
+--------+-------+
| int_id | float |
+--------+-------+
|      1 |     2 |
+--------+-------+
```

Выбор данных из ClickHouse:

```sql
SELECT * FROM mysql('localhost:3306', 'test', 'test', 'bayonet', '123');
```

Или с использованием [именованных коллекций](operations/named-collections.md):

```sql
CREATE NAMED COLLECTION creds AS
        host = 'localhost',
        port = 3306,
        database = 'test',
        user = 'bayonet',
        password = '123';
SELECT * FROM mysql(creds, table='test');
```

```text
┌─int_id─┬─float─┐
│      1 │     2 │
└────────┴───────┘
```

Замена и вставка:

```sql
INSERT INTO FUNCTION mysql('localhost:3306', 'test', 'test', 'bayonet', '123', 1) (int_id, float) VALUES (1, 3);
INSERT INTO TABLE FUNCTION mysql('localhost:3306', 'test', 'test', 'bayonet', '123', 0, 'UPDATE int_id = int_id + 1') (int_id, float) VALUES (1, 4);
SELECT * FROM mysql('localhost:3306', 'test', 'test', 'bayonet', '123');
```

```text
┌─int_id─┬─float─┐
│      1 │     3 │
│      2 │     4 │
└────────┴───────┘
```

Копирование данных из таблицы MySQL в таблицу ClickHouse:

```sql
CREATE TABLE mysql_copy
(
   `id` UInt64,
   `datetime` DateTime('UTC'),
   `description` String,
)
ENGINE = MergeTree
ORDER BY (id,datetime);

INSERT INTO mysql_copy
SELECT * FROM mysql('host:port', 'database', 'table', 'user', 'password');
```

Или если копируете только инкрементальную партию из MySQL на основе максимального текущего id:

```sql
INSERT INTO mysql_copy
SELECT * FROM mysql('host:port', 'database', 'table', 'user', 'password')
WHERE id > (SELECT max(id) from mysql_copy);
```

**См. Также**

- [Движок таблиц 'MySQL'](../../engines/table-engines/integrations/mysql.md)
- [Использование MySQL в качестве источника для словарей](/sql-reference/dictionaries#mysql)
- [mysql_datatypes_support_level](operations/settings/settings.md#mysql_datatypes_support_level)
- [mysql_map_fixed_string_to_text_in_show_columns](operations/settings/settings.md#mysql_map_fixed_string_to_text_in_show_columns)
- [mysql_map_string_to_text_in_show_columns](operations/settings/settings.md#mysql_map_string_to_text_in_show_columns)
- [mysql_max_rows_to_insert](operations/settings/settings.md#mysql_max_rows_to_insert)
