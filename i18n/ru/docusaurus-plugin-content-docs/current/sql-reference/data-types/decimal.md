---
slug: /sql-reference/data-types/decimal
sidebar_position: 6
sidebar_label: Decimal
---


# Decimal, Decimal(P), Decimal(P, S), Decimal32(S), Decimal64(S), Decimal128(S), Decimal256(S)

Подписанные числовые значения с фиксированным количеством знаков после запятой, которые сохраняют точность при сложении, вычитании и умножении. При делении наименьшие значащие цифры отбрасываются (не округляются).

## Параметры {#parameters}

- P - точность. Допустимый диапазон: \[ 1 : 76 \]. Определяет, сколько десятичных знаков может иметь число (включая дробную часть). По умолчанию точность равна 10.
- S - масштаб. Допустимый диапазон: \[ 0 : P \]. Определяет, сколько десятичных знаков может иметь дробная часть.

Decimal(P) эквивалентен Decimal(P, 0). Аналогично, синтаксис Decimal эквивалентен Decimal(10, 0).

В зависимости от значения параметра P Decimal(P, S) является синонимом для:
- P от \[ 1 : 9 \] - для Decimal32(S)
- P от \[ 10 : 18 \] - для Decimal64(S)
- P от \[ 19 : 38 \] - для Decimal128(S)
- P от \[ 39 : 76 \] - для Decimal256(S)

## Диапазоны значений Decimal {#decimal-value-ranges}

- Decimal32(S) - ( -1 \* 10^(9 - S), 1 \* 10^(9 - S) )
- Decimal64(S) - ( -1 \* 10^(18 - S), 1 \* 10^(18 - S) )
- Decimal128(S) - ( -1 \* 10^(38 - S), 1 \* 10^(38 - S) )
- Decimal256(S) - ( -1 \* 10^(76 - S), 1 \* 10^(76 - S) )

Например, Decimal32(4) может содержать числа от -99999.9999 до 99999.9999 с шагом 0.0001.

## Внутреннее представление {#internal-representation}

Внутренне данные представляются как нормальные знаковые целые числа с соответствующей шириной в битах. Реальные диапазоны значений, которые могут быть сохранены в памяти, немного больше, чем указано выше, что проверяется только при преобразовании из строки.

Поскольку современные процессоры не поддерживают 128-битные и 256-битные целые числа на аппаратном уровне, операции с Decimal128 и Decimal256 эмулируются. Таким образом, Decimal128 и Decimal256 работают значительно медленнее, чем Decimal32/Decimal64.

## Операции и тип результата {#operations-and-result-type}

Двоичные операции над Decimal приводят к широкой типу результата (при любом порядке аргументов).

- `Decimal64(S1) <op> Decimal32(S2) -> Decimal64(S)`
- `Decimal128(S1) <op> Decimal32(S2) -> Decimal128(S)`
- `Decimal128(S1) <op> Decimal64(S2) -> Decimal128(S)`
- `Decimal256(S1) <op> Decimal<32|64|128>(S2) -> Decimal256(S)`

Правила для масштаба:

- сложение, вычитание: S = max(S1, S2).
- умножение: S = S1 + S2.
- деление: S = S1.

Для аналогичных операций между Decimal и целыми числами результат будет Decimal того же размера, что и аргумент.

Операции между Decimal и Float32/Float64 не определены. Если они вам нужны, вы можете явно привести один из аргументов, используя toDecimal32, toDecimal64, toDecimal128 или toFloat32, toFloat64 встроенные функции. Имейте в виду, что при этом результат потеряет точность, а конвертация типов является ресурсоемкой операцией.

Некоторые функции над Decimal возвращают результат в виде Float64 (например, var или stddev). Промежуточные вычисления все еще могут быть выполнены в Decimal, что может привести к различным результатам между Float64 и Decimal с одинаковыми значениями.

## Проверки переполнения {#overflow-checks}

Во время вычислений с Decimal могут произойти переполнения целых чисел. Избыточные цифры в дробной части отбрасываются (не округляются). Избыточные цифры в целой части приведут к исключению.

:::warning
Проверка переполнения не реализована для Decimal128 и Decimal256. В случае переполнения неверный результат возвращается, исключение не выбрасывается.
:::

``` sql
SELECT toDecimal32(2, 4) AS x, x / 3
```

``` text
┌──────x─┬─divide(toDecimal32(2, 4), 3)─┐
│ 2.0000 │                       0.6666 │
└────────┴──────────────────────────────┘
```

``` sql
SELECT toDecimal32(4.2, 8) AS x, x * x
```

``` text
DB::Exception: Scale is out of bounds.
```

``` sql
SELECT toDecimal32(4.2, 8) AS x, 6 * x
```

``` text
DB::Exception: Decimal math overflow.
```

Проверки переполнения замедляют операции. Если известно, что переполнения невозможны, имеет смысл отключить проверки, используя настройку `decimal_check_overflow`. Когда проверки отключены и происходит переполнение, результат будет неверным:

``` sql
SET decimal_check_overflow = 0;
SELECT toDecimal32(4.2, 8) AS x, 6 * x
```

``` text
┌──────────x─┬─multiply(6, toDecimal32(4.2, 8))─┐
│ 4.20000000 │                     -17.74967296 │
└────────────┴──────────────────────────────────┘
```

Проверки переполнения происходят не только при арифметических операциях, но и при сравнении значений:

``` sql
SELECT toDecimal32(1, 8) < 100
```

``` text
DB::Exception: Can't compare.
```

**Смотрите также**
- [isDecimalOverflow](/sql-reference/functions/other-functions#isdecimaloverflow)
- [countDigits](/sql-reference/functions/other-functions#countdigits)
