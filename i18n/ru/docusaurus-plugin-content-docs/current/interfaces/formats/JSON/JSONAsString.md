---
alias: []
description: 'Документация для формата JSONAsString'
input_format: true
keywords: ['JSONAsString']
output_format: false
slug: /interfaces/formats/JSONAsString
title: 'JSONAsString'
---

| Input | Output  | Alias |
|-------|---------|-------|
| ✔     | ✗       |       |


## Описание {#description}

В этом формате один JSON объект интерпретируется как одно значение. 
Если входные данные содержат несколько JSON объектов (разделенных запятыми), они интерпретируются как отдельные строки. 
Если входные данные заключены в квадратные скобки, они интерпретируются как массив JSON объектов.

:::note
Этот формат может быть разобран только для таблицы с одним полем типа [String](/sql-reference/data-types/string.md). 
Остальные столбцы должны быть установлены либо на [`DEFAULT`](/sql-reference/statements/create/table.md/#default), либо на [`MATERIALIZED`](/sql-reference/statements/create/view#materialized-view), 
или быть упущены. 
:::

После того как вы сериализуете весь JSON объект в строку, вы можете использовать [JSON функции](/sql-reference/functions/json-functions.md) для обработки его.

## Пример использования {#example-usage}

### Базовый пример {#basic-example}

```sql title="Query"
DROP TABLE IF EXISTS json_as_string;
CREATE TABLE json_as_string (json String) ENGINE = Memory;
INSERT INTO json_as_string (json) FORMAT JSONAsString {"foo":{"bar":{"x":"y"},"baz":1}},{},{"any json stucture":1}
SELECT * FROM json_as_string;
```

```response title="Response"
┌─json──────────────────────────────┐
│ {"foo":{"bar":{"x":"y"},"baz":1}} │
│ {}                                │
│ {"any json stucture":1}           │
└───────────────────────────────────┘
```

### Массив JSON объектов {#an-array-of-json-objects}

```sql title="Query"
CREATE TABLE json_square_brackets (field String) ENGINE = Memory;
INSERT INTO json_square_brackets FORMAT JSONAsString [{"id": 1, "name": "name1"}, {"id": 2, "name": "name2"}];

SELECT * FROM json_square_brackets;
```

```response title="Response"
┌─field──────────────────────┐
│ {"id": 1, "name": "name1"} │
│ {"id": 2, "name": "name2"} │
└────────────────────────────┘
```

## Настройки формата {#format-settings}
