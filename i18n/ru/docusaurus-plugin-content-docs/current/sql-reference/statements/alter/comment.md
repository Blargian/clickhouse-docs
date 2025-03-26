---
description: 'Документация для ALTER TABLE ... MODIFY COMMENT'
sidebar_label: 'COMMENT'
sidebar_position: 51
slug: /sql-reference/statements/alter/comment
title: 'ALTER TABLE ... MODIFY COMMENT'
---


# ALTER TABLE ... MODIFY COMMENT

Добавляет, изменяет или удаляет комментарий к таблице, независимо от того, был ли он установлен ранее или нет. Изменение комментария отражается как в [system.tables](../../../operations/system-tables/tables.md), так и в запросе `SHOW CREATE TABLE`.

**Синтаксис**

```sql
ALTER TABLE [db].name [ON CLUSTER cluster] MODIFY COMMENT 'Комментарий'
```

**Примеры**

Создание таблицы с комментарием (для получения дополнительной информации см. клаузу [COMMENT](/sql-reference/statements/create/table#comment-clause)):

```sql
CREATE TABLE table_with_comment
(
    `k` UInt64,
    `s` String
)
ENGINE = Memory()
COMMENT 'Временная таблица';
```

Изменение комментария таблицы:

```sql
ALTER TABLE table_with_comment MODIFY COMMENT 'новый комментарий к таблице';
SELECT comment FROM system.tables WHERE database = currentDatabase() AND name = 'table_with_comment';
```

Вывод нового комментария:

```text
┌─comment────────────────┐
│ новый комментарий к таблице │
└────────────────────────┘
```

Удаление комментария таблицы:

```sql
ALTER TABLE table_with_comment MODIFY COMMENT '';
SELECT comment FROM system.tables WHERE database = currentDatabase() AND name = 'table_with_comment';
```

Вывод удаленного комментария:

```text
┌─comment─┐
│         │
└─────────┘
```

**Ограничения**

Для реплицированных таблиц комментарий может отличаться на разных репликах. Изменение комментария применяется лишь к одной реплике.

Эта функция доступна с версии 23.9. Она не работает в предыдущих версиях ClickHouse.
