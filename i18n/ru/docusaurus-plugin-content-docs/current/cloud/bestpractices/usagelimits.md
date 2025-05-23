---
slug: /cloud/bestpractices/usage-limits
sidebar_label: 'Ограничения по использованию'
title: 'Ограничения по использованию'
description: 'Описание рекомендуемых ограничений по использованию в ClickHouse Cloud'
---

Хотя ClickHouse известен своей скоростью и надежностью, оптимальная производительность достигается при соблюдении определенных параметров работы. Например, слишком большое количество таблиц, баз данных или частей может негативно сказаться на производительности. Чтобы избежать этого, в ClickHouse Cloud установлены ограничения для нескольких типов объектов. Вы можете найти подробности об этих ограничениях ниже.

:::tip
Если вы столкнулись с одним из этих ограничений, возможно, ваше решение реализовано не оптимальным образом. Свяжитесь с нашей службой поддержки, и мы с удовольствием поможем вам оптимизировать ваш случай использования, чтобы избежать превышения ограничений, или вместе рассмотрим, как мы можем аккуратно их увеличить.
:::

- **Базы данных**: 1000
- **Таблицы**: 5000
- **Колонки**: ∼1000 (широкий формат предпочтительнее компактного)
- **Партиции**: 50k
- **Части**: 100k по всей инстанции
- **Размер части**: 150gb
- **Сервисы**: 20 (мягкое ограничение)
- **Низкая кардинальность**: 10k или меньше
- **Первичные ключи в таблице**: 4-5, которые достаточно эффективно фильтруют данные
- **Конкуренция запросов**: 1000
- **Пакетный прием**: все, что больше 1M, будет разбито системой на блоки по 1M строк

:::note
Для услуг с одной репликой максимальное число баз данных ограничено 100, а максимальное число таблиц — 500. Кроме того, хранилище для услуг базового уровня ограничено 1 ТБ.
:::

