---
description: 'Документация по функции'
sidebar_label: 'ФУНКЦИЯ'
sidebar_position: 38
slug: /sql-reference/statements/create/function
title: 'CREATE FUNCTION - пользовательская функция (UDF)'
---

Создает пользовательскую функцию (UDF) из лямбда-выражения. Выражение должно состоять из параметров функции, констант, операторов или других вызовов функций.

**Синтаксис**

```sql
CREATE FUNCTION name [ON CLUSTER cluster] AS (parameter0, ...) -> expression
```
Функция может иметь произвольное количество параметров.

Существуют некоторые ограничения:

- Имя функции должно быть уникальным среди пользовательских и системных функций.
- Рекурсивные функции не допускаются.
- Все переменные, используемые в функции, должны быть указаны в списке ее параметров.

Если любое ограничение нарушено, будет выдано исключение.

**Пример**

Запрос:

```sql
CREATE FUNCTION linear_equation AS (x, k, b) -> k*x + b;
SELECT number, linear_equation(number, 2, 1) FROM numbers(3);
```

Результат:

```text
┌─number─┬─plus(multiply(2, number), 1)─┐
│      0 │                            1 │
│      1 │                            3 │
│      2 │                            5 │
└────────┴──────────────────────────────┘
```

[Условная функция](../../../sql-reference/functions/conditional-functions.md) вызывается в пользовательской функции в следующем запросе:

```sql
CREATE FUNCTION parity_str AS (n) -> if(n % 2, 'odd', 'even');
SELECT number, parity_str(number) FROM numbers(3);
```

Результат:

```text
┌─number─┬─if(modulo(number, 2), 'odd', 'even')─┐
│      0 │ even                                 │
│      1 │ odd                                  │
│      2 │ even                                 │
└────────┴──────────────────────────────────────┘
```

## Связанный контент {#related-content}

### [Исполняемые UDF](/sql-reference/functions/udf.md). {#executable-udfs}

### [Пользовательские функции в ClickHouse Cloud](https://clickhouse.com/blog/user-defined-functions-clickhouse-udfs) {#user-defined-functions-in-clickhouse-cloud}
