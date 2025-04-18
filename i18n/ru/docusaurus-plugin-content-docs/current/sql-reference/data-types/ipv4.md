---
description: 'Документация для типа данных IPv4 в ClickHouse'
sidebar_label: 'IPv4'
sidebar_position: 28
slug: /sql-reference/data-types/ipv4
title: 'IPv4'
---

## IPv4 {#ipv4}

IPv4 адреса. Хранятся в 4 байтах как UInt32.

### Основное Использование {#basic-usage}

```sql
CREATE TABLE hits (url String, from IPv4) ENGINE = MergeTree() ORDER BY url;

DESCRIBE TABLE hits;
```

```text
┌─name─┬─type───┬─default_type─┬─default_expression─┬─comment─┬─codec_expression─┐
│ url  │ String │              │                    │         │                  │
│ from │ IPv4   │              │                    │         │                  │
└──────┴────────┴──────────────┴────────────────────┴─────────┴──────────────────┘
```

ИЛИ вы можете использовать домен IPv4 в качестве ключа:

```sql
CREATE TABLE hits (url String, from IPv4) ENGINE = MergeTree() ORDER BY from;
```

Домен `IPv4` поддерживает пользовательский формат ввода в виде строк IPv4:

```sql
INSERT INTO hits (url, from) VALUES ('https://wikipedia.org', '116.253.40.133')('https://clickhouse.com', '183.247.232.58')('https://clickhouse.com/docs/en/', '116.106.34.242');

SELECT * FROM hits;
```

```text
┌─url────────────────────────────────┬───────────from─┐
│ https://clickhouse.com/docs/en/ │ 116.106.34.242 │
│ https://wikipedia.org              │ 116.253.40.133 │
│ https://clickhouse.com          │ 183.247.232.58 │
└────────────────────────────────────┴────────────────┘
```

Значения хранятся в компактной двоичной форме:

```sql
SELECT toTypeName(from), hex(from) FROM hits LIMIT 1;
```

```text
┌─toTypeName(from)─┬─hex(from)─┐
│ IPv4             │ B7F7E83A  │
└──────────────────┴───────────┘
```

IPv4 адреса могут быть напрямую сопоставлены с IPv6 адресами:

```sql
SELECT toIPv4('127.0.0.1') = toIPv6('::ffff:127.0.0.1');
```

```text
┌─equals(toIPv4('127.0.0.1'), toIPv6('::ffff:127.0.0.1'))─┐
│                                                       1 │
└─────────────────────────────────────────────────────────┘
```

**См. Также**

- [Функции для Работы с IPv4 и IPv6 Адресами](../functions/ip-address-functions.md)
