---
slug: '/examples/aggregate-function-combinators/quantilesTimingIf'
title: 'quantilesTimingIf'
description: 'Пример использования комбинатора quantilesTimingIf'
keywords: ['quantilesTiming', 'if', 'combinator', 'examples', 'quantilesTimingIf']
sidebar_label: 'quantilesTimingIf'
---


# quantilesTimingIf {#quantilestimingif}

## Описание {#description}

Комбинатор [`If`](/sql-reference/aggregate-functions/combinators#-if) может применяться к функции [`quantilesTiming`](/sql-reference/aggregate-functions/reference/quantiletiming) для расчета квантилей значений времени для строк, где условие истинно, с использованием агрегирующей функции `quantilesTimingIf`.

## Пример использования {#example-usage}

В этом примере мы создадим таблицу, которая хранит время отклика API для различных конечных точек, и мы используем `quantilesTimingIf` для расчета квантилей времени отклика для успешных запросов.

```sql title="Запрос"
CREATE TABLE api_responses(
    endpoint String,
    response_time_ms UInt32,
    is_successful UInt8
) ENGINE = Log;

INSERT INTO api_responses VALUES
    ('orders', 82, 1),
    ('orders', 94, 1),
    ('orders', 98, 1),
    ('orders', 87, 1),
    ('orders', 103, 1),
    ('orders', 92, 1),
    ('orders', 89, 1),
    ('orders', 105, 1),
    ('products', 45, 1),
    ('products', 52, 1),
    ('products', 48, 1),
    ('products', 51, 1),
    ('products', 49, 1),
    ('products', 53, 1),
    ('products', 47, 1),
    ('products', 50, 1),
    ('users', 120, 0),
    ('users', 125, 0),
    ('users', 118, 0),
    ('users', 122, 0),
    ('users', 121, 0),
    ('users', 119, 0),
    ('users', 123, 0),
    ('users', 124, 0);

SELECT
    endpoint,
    quantilesTimingIf(0, 0.25, 0.5, 0.75, 0.95, 0.99, 1.0)(response_time_ms, is_successful = 1) as response_time_quantiles
FROM api_responses
GROUP BY endpoint;
```

Функция `quantilesTimingIf` будет рассчитывать квартили только для успешных запросов (is_successful = 1). Возвращаемый массив содержит следующие квартили в порядке:
- 0 (минимум)
- 0.25 (первый квартиль)
- 0.5 (медиана)
- 0.75 (третий квартиль)
- 0.95 (95-й процентиль)
- 0.99 (99-й процентиль)
- 1.0 (максимум)

```response title="Ответ"
   ┌─endpoint─┬─response_time_quantiles─────────────────────────────────────────────┐
1. │ orders   │ [82, 87, 92, 98, 103, 104, 105]                                     │
2. │ products │ [45, 47, 49, 51, 52, 52, 53]                                        │
3. │ users    │ [nan, nan, nan, nan, nan, nan, nan]                                 │
   └──────────┴─────────────────────────────────────────────────────────────────────┘
```

## См. также {#see-also}
- [`quantilesTiming`](/sql-reference/aggregate-functions/reference/quantiletiming)
- [`If combinator`](/sql-reference/aggregate-functions/combinators#-if)
