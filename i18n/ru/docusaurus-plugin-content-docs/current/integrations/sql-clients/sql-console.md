---
sidebar_label: 'SQL Консоль'
sidebar_position: 1
title: 'SQL Консоль'
slug: /integrations/sql-clients/sql-console
description: 'Узнайте о SQL Консоле'
---

import ExperimentalBadge from '@theme/badges/ExperimentalBadge';
import Image from '@theme/IdealImage';
import table_list_and_schema from '@site/static/images/cloud/sqlconsole/table-list-and-schema.png';
import view_columns from '@site/static/images/cloud/sqlconsole/view-columns.png';
import abc from '@site/static/images/cloud/sqlconsole/abc.png';
import inspecting_cell_content from '@site/static/images/cloud/sqlconsole/inspecting-cell-content.png';
import sort_descending_on_column from '@site/static/images/cloud/sqlconsole/sort-descending-on-column.png';
import filter_on_radio_column_equal_gsm from '@site/static/images/cloud/sqlconsole/filter-on-radio-column-equal-gsm.png';
import add_more_filters from '@site/static/images/cloud/sqlconsole/add-more-filters.png';
import filtering_and_sorting_together from '@site/static/images/cloud/sqlconsole/filtering-and-sorting-together.png';
import create_a_query_from_sorts_and_filters from '@site/static/images/cloud/sqlconsole/create-a-query-from-sorts-and-filters.png';
import creating_a_query from '@site/static/images/cloud/sqlconsole/creating-a-query.png';
import run_selected_query from '@site/static/images/cloud/sqlconsole/run-selected-query.png';
import run_at_cursor_2 from '@site/static/images/cloud/sqlconsole/run-at-cursor-2.png';
import run_at_cursor from '@site/static/images/cloud/sqlconsole/run-at-cursor.png';
import cancel_a_query from '@site/static/images/cloud/sqlconsole/cancel-a-query.png';
import sql_console_save_query from '@site/static/images/cloud/sqlconsole/sql-console-save-query.png';
import sql_console_rename from '@site/static/images/cloud/sqlconsole/sql-console-rename.png';
import sql_console_share from '@site/static/images/cloud/sqlconsole/sql-console-share.png';
import sql_console_edit_access from '@site/static/images/cloud/sqlconsole/sql-console-edit-access.png';
import sql_console_add_team from '@site/static/images/cloud/sqlconsole/sql-console-add-team.png';
import sql_console_edit_member from '@site/static/images/cloud/sqlconsole/sql-console-edit-member.png';
import sql_console_access_queries from '@site/static/images/cloud/sqlconsole/sql-console-access-queries.png';
import search_hn from '@site/static/images/cloud/sqlconsole/search-hn.png';
import match_in_body from '@site/static/images/cloud/sqlconsole/match-in-body.png';
import pagination from '@site/static/images/cloud/sqlconsole/pagination.png';
import pagination_nav from '@site/static/images/cloud/sqlconsole/pagination-nav.png';
import download_as_csv from '@site/static/images/cloud/sqlconsole/download-as-csv.png';
import tabular_query_results from '@site/static/images/cloud/sqlconsole/tabular-query-results.png';
import switch_from_query_to_chart from '@site/static/images/cloud/sqlconsole/switch-from-query-to-chart.png';
import trip_total_by_week from '@site/static/images/cloud/sqlconsole/trip-total-by-week.png';
import bar_chart from '@site/static/images/cloud/sqlconsole/bar-chart.png';
import change_from_bar_to_area from '@site/static/images/cloud/sqlconsole/change-from-bar-to-area.png';
import update_query_name from '@site/static/images/cloud/sqlconsole/update-query-name.png';
import update_subtitle_etc from '@site/static/images/cloud/sqlconsole/update-subtitle-etc.png';
import adjust_axis_scale from '@site/static/images/cloud/sqlconsole/adjust-axis-scale.png';
import give_a_query_a_name from '@site/static/images/cloud/sqlconsole/give-a-query-a-name.png'
import save_the_query from '@site/static/images/cloud/sqlconsole/save-the-query.png'

# SQL Консоль

SQL консоль — это самый быстрый и простой способ исследовать и выполнять запросы к вашим базам данных в ClickHouse Cloud. Вы можете использовать SQL консоль для:

- Подключения к вашим ClickHouse Cloud Services
- Просмотра, фильтрации и сортировки данных таблиц
- Выполнения запросов и визуализации результирующих данных всего за несколько кликов
- Совместного использования запросов с членами команды и более эффективного сотрудничества.

## Исследование Таблиц {#exploring-tables}

### Просмотр Списка Таблиц и Информации о Схеме {#viewing-table-list-and-schema-info}

Обзор таблиц, содержащихся в вашем экземпляре ClickHouse, можно найти в области левой боковой панели. Используйте выбор базы данных в верхней части левой панели, чтобы просмотреть таблицы в конкретной базе данных.

<Image img={table_list_and_schema} size="lg" border alt="Просмотр списка таблиц и схемы, отображающей таблицы базы данных в левой боковой панели"/>

Таблицы в списке также могут быть развернуты для просмотра колонок и типов.

<Image img={view_columns} size="lg" border alt="Просмотр развернутой таблицы, показывающей названия колонок и типы данных"/>

### Исследование Данных Таблицы {#exploring-table-data}

Нажмите на таблицу в списке, чтобы открыть её в новой вкладке. В режиме просмотра таблицы данные могут быть легко просмотрены, отобраны и скопированы. Обратите внимание, что структура и форматирование сохраняются при копировании и вставке в такие приложения для работы с электронными таблицами, как Microsoft Excel и Google Sheets. Вы можете переключаться между страницами данных таблицы (пагинируются по 30 строк за раз) с помощью навигации в нижней части страницы.

<Image img={abc} size="lg" border alt="Просмотр таблицы, показывающий данные, которые могут быть выбраны и скопированы"/>

### Просмотр Данных Ячейки {#inspecting-cell-data}

Инструмент инспектора ячеек может быть использован для просмотра большого объема данных, содержащегося в одной ячейке. Чтобы открыть его, щелкните правой кнопкой мыши на ячейку и выберите "Просмотреть Ячейку". Содержимое инспектора ячеек можно скопировать, нажав на значок копирования в правом верхнем углу содержания инспектора.

<Image img={inspecting_cell_content} size="lg" border alt="Диалог инспектора ячеек, показывающий содержимое выбранной ячейки"/>

## Фильтрация и Сортировка Таблиц {#filtering-and-sorting-tables}

### Сортировка Таблицы {#sorting-a-table}

Чтобы отсортировать таблицу в SQL консоли, откройте таблицу и выберите кнопку "Сортировать" на панели инструментов. Эта кнопка откроет меню, которое позволит вам настроить вашу сортировку. Вы можете выбрать колонку для сортировки и настроить порядок сортировки (по возрастанию или по убыванию). Выберите "Применить" или нажмите Enter, чтобы отсортировать вашу таблицу.

<Image img={sort_descending_on_column} size="lg" border alt="Диалог сортировки, показывающий настройки для сортировки по убыванию по колонке"/>

SQL консоль также позволяет добавлять несколько сортировок к таблице. Нажмите кнопку "Сортировать" снова, чтобы добавить еще одну сортировку. Обратите внимание: сортировки применяются в порядке их появления в панели сортировок (сверху вниз). Чтобы удалить сортировку, просто нажмите на кнопку "x" рядом со сортировкой.

### Фильтрация Таблицы {#filtering-a-table}

Для того чтобы отфильтровать таблицу в SQL консоли, откройте таблицу и выберите кнопку "Фильтр". Как и сортировка, эта кнопка откроет меню, которое позволит вам настроить ваш фильтр. Вы можете выбрать колонку, по которой нужно делать фильтрацию, и выбрать необходимые критерии. SQL консоль интеллектуально отображает параметры фильтрации, которые соответствуют типу данных, содержащихся в колонке.

<Image img={filter_on_radio_column_equal_gsm} size="lg" border alt="Диалог фильтрации, показывающий настройки для фильтрации радио-колонку, равную GSM"/>

Когда вы будете довольны своим фильтром, вы можете выбрать "Применить", чтобы отфильтровать ваши данные. Вы также можете добавлять дополнительные фильтры, как показано ниже.

<Image img={add_more_filters} size="lg" border alt="Диалог, показывающий, как добавить дополнительный фильтр на диапазон, превышающий 2000"/>

Подобно функционалу сортировки, нажмите кнопку "x" рядом с фильтром, чтобы удалить его.

### Фильтрация и Сортировка Вмете {#filtering-and-sorting-together}

SQL консоль позволяет вам одновременно фильтровать и сортировать таблицу. Для этого добавьте все желаемые фильтры и сортировки, используя шаги, описанные выше, и нажмите кнопку "Применить".

<Image img={filtering_and_sorting_together} size="lg" border alt="Интерфейс, показывающий одновременно примененные фильтрацию и сортировку"/>

### Создание Запроса Из Фильтров и Сортировок {#creating-a-query-from-filters-and-sorts}

SQL консоль может напрямую преобразовать ваши сортировки и фильтры в запросы одним щелчком. Просто выберите кнопку "Создать Запрос" на панели инструментов с параметрами сортировки и фильтрации по вашему выбору. После нажатия "Создать запрос" откроется новая вкладка запроса, предварительно заполненная SQL командой, соответствующей данным, содержащимся в вашем представлении таблицы.

<Image img={create_a_query_from_sorts_and_filters} size="lg" border alt="Интерфейс, показывающий кнопку Создать Запрос, генерирующую SQL из фильтров и сортировок"/>

:::note
Фильтры и сортировки не являются обязательными при использовании функции "Создать Запрос".
:::

Вы можете узнать больше о запросах в SQL консоли, прочитав документацию по запросам (link).

## Создание и Выполнение Запроса {#creating-and-running-a-query}

### Создание Запроса {#creating-a-query}

Есть два способа создать новый запрос в SQL консоли.

- Нажмите кнопку "+" на панели вкладок
- Выберите кнопку "Новый Запрос" из списка запросов в левой боковой панели

<Image img={creating_a_query} size="lg" border alt="Интерфейс, показывающий, как создать новый запрос, используя кнопку + или кнопку Новый Запрос"/>

### Выполнение Запроса {#running-a-query}

Чтобы выполнить запрос, введите свои SQL команды в SQL редактор и нажмите кнопку "Запустить" или используйте комбинацию клавиш `cmd / ctrl + enter`. Чтобы писать и выполнять несколько команд последовательно, убедитесь, что после каждой команды добавлен точка с запятой.

Опции Выполнения Запроса
По умолчанию, нажатие кнопки запуска выполнит все команды, содержащиеся в SQL редакторе. SQL консоль поддерживает две другие опции выполнения запросов:

- Выполнить выделенные команды
- Выполнить команду на курсоре

Чтобы выполнить выделенные команды, выделите желаемую команду или последовательность команд и нажмите кнопку "Запустить" (или используйте сочетание клавиш `cmd / ctrl + enter`). Вы также можете выбрать "Выполнить выделенные" из контекстного меню SQL редактора (открывается щелчком правой кнопки мыши в любом месте редактора), когда выделение присутствует.

<Image img={run_selected_query} size="lg" border alt="Интерфейс, показывающий, как выполнить выделенную часть SQL запроса"/>

Запуск команды на текущей позиции курсора можно осуществить двумя способами:

- Выберите "На курсоре" из расширенного меню опций выполнения (или используйте соответствующее сочетание клавиш `cmd / ctrl + shift + enter`).

<Image img={run_at_cursor_2} size="lg" border alt="Опция Запустить на курсоре в расширенном меню опций выполнения"/>

  - Выбор "Запустить на курсоре" из контекстного меню SQL редактора.

<Image img={run_at_cursor} size="lg" border alt="Опция Запустить на курсоре в контекстном меню SQL редактора"/>

:::note
Команда, находящаяся в позиции курсора, будет мигать желтым при выполнении.
:::

### Отмена Запроса {#canceling-a-query}

Пока запрос выполняется, кнопка "Запустить" на панели инструментов редактора запросов будет заменена на кнопку "Отмена". Просто нажмите эту кнопку или нажмите `Esc`, чтобы отменить запрос. Обратите внимание: любые результаты, которые уже были возвращены, сохранятся после отмены.

<Image img={cancel_a_query} size="lg" border alt="Кнопка Отмена, которая появляется во время выполнения запроса"/>

### Сохранение Запроса {#saving-a-query}

Если запрос не был ранее назван, он будет назван "Безымянный Запрос". Нажмите на имя запроса, чтобы изменить его. Переименование запроса приведет к его сохранению.

<Image img={give_a_query_a_name} size="lg" border alt="Интерфейс, показывающий, как переименовать запрос с Безымянный Запрос"/>

Вы также можете использовать кнопку сохранения или сочетание клавиш `cmd / ctrl + s`, чтобы сохранить запрос.

<Image img={save_the_query} size="lg" border alt="Кнопка Сохранить на панели инструментов редактора запросов"/>

## Использование GenAI для Управления Запросами {#using-genai-to-manage-queries}

Эта функция позволяет пользователям писать запросы в виде вопросов на естественном языке и получать SQL запросы на основе контекста доступных таблиц. GenAI также может помочь пользователям отладить свои запросы.

Для получения дополнительной информации о GenAI, ознакомьтесь с [объявлением о GenAI, движущимися предложениями в ClickHouse Cloud](https://clickhouse.com/blog/announcing-genai-powered-query-suggestions-clickhouse-cloud).

### Настройка Таблицы {#table-setup}

Давайте импортируем пример набора данных UK Price Paid и используем его, чтобы создать некоторые запросы GenAI.

1. Откройте службу ClickHouse Cloud.
1. Создайте новый запрос, нажав на значок _+_.
1. Вставьте и выполните следующий код:

   ```sql
   CREATE TABLE uk_price_paid
   (
       price UInt32,
       date Date,
       postcode1 LowCardinality(String),
       postcode2 LowCardinality(String),
       type Enum8('terraced' = 1, 'semi-detached' = 2, 'detached' = 3, 'flat' = 4, 'other' = 0),
       is_new UInt8,
       duration Enum8('freehold' = 1, 'leasehold' = 2, 'unknown' = 0),
       addr1 String,
       addr2 String,
       street LowCardinality(String),
       locality LowCardinality(String),
       town LowCardinality(String),
       district LowCardinality(String),
       county LowCardinality(String)
   )
   ENGINE = MergeTree
   ORDER BY (postcode1, postcode2, addr1, addr2);
   ```

   Этот запрос должен завершиться примерно за 1 секунду. Как только он будет завершен, у вас должна быть пустая таблица с названием `uk_price_paid`.

1. Создайте новый запрос и вставьте следующий запрос:

   ```sql
   INSERT INTO uk_price_paid
   WITH
      splitByChar(' ', postcode) AS p
   SELECT
       toUInt32(price_string) AS price,
       parseDateTimeBestEffortUS(time) AS date,
       p[1] AS postcode1,
       p[2] AS postcode2,
       transform(a, ['T', 'S', 'D', 'F', 'O'], ['terraced', 'semi-detached', 'detached', 'flat', 'other']) AS type,
       b = 'Y' AS is_new,
       transform(c, ['F', 'L', 'U'], ['freehold', 'leasehold', 'unknown']) AS duration,
       addr1,
       addr2,
       street,
       locality,
       town,
       district,
       county
   FROM url(
       'http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv',
       'CSV',
       'uuid_string String,
       price_string String,
       time String,
       postcode String,
       a String,
       b String,
       c String,
       addr1 String,
       addr2 String,
       street String,
       locality String,
       town String,
       district String,
       county String,
       d String,
       e String'
   ) SETTINGS max_http_get_redirects=10;
   ```

Этот запрос берет набор данных с сайта `gov.uk`. Этот файл ~4GB, так что выполнение этого запроса займет несколько минут. Как только ClickHouse обработает запрос, у вас должны быть все данные в таблице `uk_price_paid`.

#### Создание Запроса {#query-creation}

Давайте создадим запрос, используя естественный язык.

1. Выберите таблицу **uk_price_paid**, а затем нажмите **Создать Запрос**.
1. Нажмите **Сгенерировать SQL**. Вам может быть предложено согласиться на отправку ваших запросов в Chat-GPT. Вы должны выбрать **Я согласен**, чтобы продолжить.
1. Теперь вы можете использовать этот запрос для ввода запроса на естественном языке и позволить ChatGPT преобразовать его в SQL запрос. В этом примере мы введем:

   > Покажите мне общую цену и общее количество всех транзакций uk_price_paid по годам.

1. Консоль сгенерирует нужный нам запрос и отобразит его в новой вкладке. В нашем примере GenAI создал следующий запрос:

   ```sql
   -- Покажите мне общую цену и общее количество всех транзакций uk_price_paid по годам.
   SELECT year(date), sum(price) as total_price, Count(*) as total_transactions
   FROM uk_price_paid
   GROUP BY year(date)
   ```

1. После того, как вы убедитесь, что запрос верен, нажмите **Запустить**, чтобы выполнить его.

### Отладка {#debugging}

Теперь давайте протестируем возможности отладки запроса GenAI.

1. Создайте новый запрос, нажав на значок _+_ и вставьте следующий код:

   ```sql
   -- Покажите мне общую цену и общее количество всех транзакций uk_price_paid по годам.
   SELECT year(date), sum(pricee) as total_price, Count(*) as total_transactions
   FROM uk_price_paid
   GROUP BY year(date)
   ```

1. Нажмите **Запустить**. Запрос не выполнится, так как мы пытаемся получить значения из `pricee` вместо `price`.
1. Нажмите **Исправить Запрос**.
1. GenAI попытается исправить запрос. В данном случае он изменил `pricee` на `price`. Он также осознал, что функция `toYear` является лучшей для использования в этой ситуации.
1. Выберите **Применить**, чтобы добавить предложенные изменения в ваш запрос, и нажмите **Запустить**.

Имейте в виду, что GenAI является экспериментальной функцией. Используйте осторожно, выполняя запросы, сгенерированные GenAI, на любых наборах данных.

## Расширенные Функции Запросов {#advanced-querying-features}

### Поиск Результатов Запроса {#searching-query-results}

После выполнения запроса вы можете быстро искать в возвращенном наборе результатов, используя поле поиска в панели результатов. Эта функция помогает предварительно просматривать результаты дополнительного условия `WHERE` или просто проверять, что определенные данные включены в набор результатов. После ввода значения в поле поиска панель результатов обновится и вернет записи, содержащие элемент, соответствующий введенному значению. В этом примере мы будем искать все вхождения `breakfast` в таблице `hackernews` для комментариев, содержащих `ClickHouse` (не чувствительно к регистру):

<Image img={search_hn} size="lg" border alt="Поиск Данных Hacker News"/>

Обратите внимание: любое поле, совпадающее с введенным значением, будет возвращено. Например, третья запись на вышеуказанном скриншоте не совпадает с ‘breakfast’ в поле `by`, но поле `text` совпадает:

<Image img={match_in_body} size="lg" border alt="Совпадение в теле"/>

### Настройка Настроек Пагинации {#adjusting-pagination-settings}

По умолчанию панель результатов запроса будет отображать каждую запись результата на одной странице. Для больших наборов результатов может быть предпочтительнее разбить результаты на страницы для более удобного просмотра. Это можно сделать с помощью селектора пагинации в нижнем правом углу панели результатов:

<Image img={pagination} size="lg" border alt="Опции пагинации"/>

Выбор размера страницы немедленно применит пагинацию к набору результатов, а навигационные опции появятся в середине нижней панели результатов.

<Image img={pagination_nav} size="lg" border alt="Навигация по пагинации"/>

### Экспорт Данных Результатов Запроса {#exporting-query-result-data}

Наборы данных результатов запроса можно легко экспортировать в формат CSV непосредственно из SQL консоли. Для этого откройте меню `•••` на правой стороне панели инструментов результатов и выберите "Скачать как CSV".

<Image img={download_as_csv} size="lg" border alt="Скачать как CSV"/>

## Визуализация Данных Запроса {#visualizing-query-data}

Некоторые данные может быть проще интерпретировать в форме графика. Вы можете быстро создать визуализации из данных результата запроса непосредственно из SQL консоли всего за несколько кликов. В качестве примера мы используем запрос, который рассчитывает недельную статистику для поездок такси в Нью-Йорке:

```sql
select
   toStartOfWeek(pickup_datetime) as week,
   sum(total_amount) as fare_total,
   sum(trip_distance) as distance_total,
   count(*) as trip_total
from
   nyc_taxi
group by
   1
order by
   1 asc
```

<Image img={tabular_query_results} size="lg" border alt="Табличные результаты запроса"/>

Без визуализации эти результаты трудно интерпретировать. Давайте превратим их в график.

### Создание Графиков {#creating-charts}

Для начала создания вашей визуализации выберите опцию "График" на панели инструментов результатов запроса. Появится панель конфигурации графика:

<Image img={switch_from_query_to_chart} size="lg" border alt="Переключение с запроса на график"/>

Мы начнем с создания простого графика, отслеживающего `trip_total` по `week`. Для этого мы перетащим поле `week` на ось X и поле `trip_total` на ось Y:

<Image img={trip_total_by_week} size="lg" border alt="Общий итог поездок по неделям"/>

Большинство типов графиков поддерживают несколько полей на числовых осях. Чтобы продемонстрировать это, мы перетащим поле fare_total на ось Y:

<Image img={bar_chart} size="lg" border alt="Столбчатый график"/>

### Настройка Графиков {#customizing-charts}

SQL консоль поддерживает десять типов графиков, которые можно выбрать из селектора типов графиков в панели конфигурации графика. Например, мы можем легко изменить предыдущий тип графика с "Столбчатого" на "Площадь":

<Image img={change_from_bar_to_area} size="lg" border alt="Изменение с столбчатого графика на график площади"/>

Названия графиков соответствуют именам запросов, предоставляющим данные. Обновление имени запроса приведет к обновлению названия графика:

<Image img={update_query_name} size="lg" border alt="Обновление имени запроса"/>

Также можно настроить ряд более продвинутых характеристик графика в разделе "Дополнительно" панели конфигурации графика. Для начала мы изменим следующие настройки:

- Сабзаголовок
- Заголовки осей
- Ориентация меток для оси X

Наш график будет обновлен соответствующим образом:

<Image img={update_subtitle_etc} size="lg" border alt="Обновление сабзаголовка и т.д."/>

В некоторых случаях может потребоваться изменить масштабы осей для каждого поля независимо. Это также можно сделать в разделе "Дополнительно" панели конфигурации графика, указав минимальные и максимальные значения для диапазона оси. Например, вышеуказанный график выглядит хорошо, но, чтобы продемонстрировать взаимосвязь между нашими полями `trip_total` и `fare_total`, диапазоны осей нуждаются в некоторой корректировке:

<Image img={adjust_axis_scale} size="lg" border alt="Настройка масштаба оси"/>

## Совместное Использование Запросов {#sharing-queries}

SQL консоль позволяет вам делиться запросами с вашей командой. Когда запрос делится, все члены команды могут видеть и редактировать запрос. Общие запросы являются отличным способом для сотрудничества с вашей командой.

Чтобы поделиться запросом, нажмите кнопку "Поделиться" на панели инструментов запроса.

<Image img={sql_console_share} size="lg" border alt="Кнопка Поделиться на панели инструментов запроса"/>

Откроется диалог, позволяющий вам поделиться запросом со всеми членами команды. Если у вас несколько команд, вы можете выбрать, с какой командой делиться запросом.

<Image img={sql_console_edit_access} size="lg" border alt="Диалог для редактирования доступа к общему запросу"/>

<Image img={sql_console_add_team} size="lg" border alt="Интерфейс добавления команды к общему запросу"/>

<Image img={sql_console_edit_member} size="lg" border alt="Интерфейс редактирования доступа участника к общему запросу"/>

В некоторых случаях может потребоваться изменить масштабы осей для каждого поля независимо. Это также можно сделать в разделе "Дополнительно" панели конфигурации графика, указав минимальные и максимальные значения для диапазона оси. Например, вышеуказанный график выглядит хорошо, но, чтобы продемонстрировать взаимосвязь между нашими полями `trip_total` и `fare_total`, диапазоны осей нуждаются в некоторой корректировке:

<Image img={sql_console_access_queries} size="lg" border alt="Раздел Поделились со мной в списке запросов"/>
