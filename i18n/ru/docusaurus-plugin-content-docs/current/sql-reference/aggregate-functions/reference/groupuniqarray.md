---
description: 'Создает массив из различных значений аргументов.'
sidebar_position: 154
slug: /sql-reference/aggregate-functions/reference/groupuniqarray
title: 'groupUniqArray'
---


# groupUniqArray

Синтаксис: `groupUniqArray(x)` или `groupUniqArray(max_size)(x)`

Создает массив из различных значений аргументов. Потребление памяти такое же, как у функции [uniqExact](../../../sql-reference/aggregate-functions/reference/uniqexact.md).

Вторая версия (с параметром `max_size`) ограничивает размер результирующего массива до `max_size` элементов. Например, `groupUniqArray(1)(x)` эквивалентно `[any(x)]`.
