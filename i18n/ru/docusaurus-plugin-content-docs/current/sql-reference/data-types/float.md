---
description: 'Документация для типов данных с плавающей запятой в ClickHouse: Float32, Float64 и BFloat16'
sidebar_label: 'Float32 | Float64 | BFloat16'
sidebar_position: 4
slug: /sql-reference/data-types/float
title: 'Типы Float32 | Float64 | BFloat16'
---

:::note
Если вам нужны точные вычисления, особенно если вы работаете с финансовыми или бизнес-данными, требующими высокой точности, рекомендуется использовать [Decimal](../data-types/decimal.md). 

[Числа с плавающей запятой](https://en.wikipedia.org/wiki/IEEE_754) могут привести к неточным результатам, как показано ниже:

```sql
CREATE TABLE IF NOT EXISTS float_vs_decimal
(
   my_float Float64,
   my_decimal Decimal64(3)
)
Engine=MergeTree
ORDER BY tuple();


# Генерация 1 000 000 случайных чисел с 2 знаками после запятой и их хранение как float и decimal
INSERT INTO float_vs_decimal SELECT round(randCanonical(), 3) AS res, res FROM system.numbers LIMIT 1000000;
```
```sql
SELECT sum(my_float), sum(my_decimal) FROM float_vs_decimal;

┌──────sum(my_float)─┬─sum(my_decimal)─┐
│ 499693.60500000004 │      499693.605 │
└────────────────────┴─────────────────┘

SELECT sumKahan(my_float), sumKahan(my_decimal) FROM float_vs_decimal;

┌─sumKahan(my_float)─┬─sumKahan(my_decimal)─┐
│         499693.605 │           499693.605 │
└────────────────────┴──────────────────────┘
```
:::

Эквивалентные типы в ClickHouse и C приведены ниже:

- `Float32` — `float`.
- `Float64` — `double`.

Типы Float в ClickHouse имеют следующие псевдонимы:

- `Float32` — `FLOAT`, `REAL`, `SINGLE`.
- `Float64` — `DOUBLE`, `DOUBLE PRECISION`.

При создании таблиц числовые параметры для чисел с плавающей запятой могут устанавливаться (например, `FLOAT(12)`, `FLOAT(15, 22)`, `DOUBLE(12)`, `DOUBLE(4, 18)`), но ClickHouse игнорирует их.

## Использование чисел с плавающей запятой {#using-floating-point-numbers}

- Вычисления с числами с плавающей запятой могут приводить к ошибкам округления.

<!-- -->

```sql
SELECT 1 - 0.9

┌───────minus(1, 0.9)─┐
│ 0.09999999999999998 │
└─────────────────────┘
```

- Результат вычисления зависит от метода вычисления (типа процессора и архитектуры компьютерной системы).
- Вычисления с плавающей запятой могут приводить к значениям, таким как бесконечность (`Inf`) и "не число" (`NaN`). Это следует учитывать при обработке результатов вычислений.
- При парсинге чисел с плавающей запятой из текста результат может не совпадать с ближайшим представимым машинным числом.

## NaN и Inf {#nan-and-inf}

В отличие от стандартного SQL, ClickHouse поддерживает следующие категории чисел с плавающей запятой:

- `Inf` – бесконечность.

<!-- -->

```sql
SELECT 0.5 / 0

┌─divide(0.5, 0)─┐
│            inf │
└────────────────┘
```

- `-Inf` — отрицательная бесконечность.

<!-- -->

```sql
SELECT -0.5 / 0

┌─divide(-0.5, 0)─┐
│            -inf │
└─────────────────┘
```

- `NaN` — не число.

<!-- -->

```sql
SELECT 0 / 0

┌─divide(0, 0)─┐
│          nan │
└──────────────┘
```

Смотрите правила сортировки `NaN` в разделе [ORDER BY](../../sql-reference/statements/select/order-by.md).

## BFloat16 {#bfloat16}

`BFloat16` — это тип данных с плавающей запятой размером 16 бит с 8-битным экспонентом, знаком и 7-битной мантиссой. 
Он полезен для приложений машинного обучения и искусственного интеллекта.

ClickHouse поддерживает преобразования между `Float32` и `BFloat16`, которые 
можно выполнить с помощью функций [`toFloat32()`](../functions/type-conversion-functions.md/#tofloat32) или [`toBFloat16`](../functions/type-conversion-functions.md/#tobfloat16).

:::note
Большинство других операций не поддерживается.
:::
