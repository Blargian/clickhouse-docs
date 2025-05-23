---
description: 'Системная таблица, содержащая список часовых поясов, поддерживаемых 
  сервером ClickHouse.'
keywords: ['системная таблица', 'часы_пояса']
slug: /operations/system-tables/time_zones
title: 'system.time_zones'
---


# system.time_zones

Содержит список часовых поясов, поддерживаемых сервером ClickHouse. Этот список часовых поясов может варьироваться в зависимости от версии ClickHouse.

Столбцы:

- `time_zone` (String) — Список поддерживаемых часовых поясов.

**Пример**

```sql
SELECT * FROM system.time_zones LIMIT 10
```

```text
┌─time_zone──────────┐
│ Africa/Abidjan     │
│ Africa/Accra       │
│ Africa/Addis_Ababa │
│ Africa/Algiers     │
│ Africa/Asmara      │
│ Africa/Asmera      │
│ Africa/Bamako      │
│ Africa/Bangui      │
│ Africa/Banjul      │
│ Africa/Bissau      │
└────────────────────┘
```
