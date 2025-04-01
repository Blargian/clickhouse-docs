---
sidebar_label: 'Первичные индексы'
sidebar_position: 1
description: 'В этом руководстве мы подробно рассмотрим индексацию в ClickHouse.'
title: 'Практическое введение в первичные индексы в ClickHouse'
slug: /guides/best-practices/sparse-primary-indexes
---

import sparsePrimaryIndexes01 from '@site/static/images/guides/best-practices/sparse-primary-indexes-01.png';
import sparsePrimaryIndexes02 from '@site/static/images/guides/best-practices/sparse-primary-indexes-02.png';
import sparsePrimaryIndexes03a from '@site/static/images/guides/best-practices/sparse-primary-indexes-03a.png';
import sparsePrimaryIndexes03b from '@site/static/images/guides/best-practices/sparse-primary-indexes-03b.png';
import sparsePrimaryIndexes04 from '@site/static/images/guides/best-practices/sparse-primary-indexes-04.png';
import sparsePrimaryIndexes05 from '@site/static/images/guides/best-practices/sparse-primary-indexes-05.png';
import sparsePrimaryIndexes06 from '@site/static/images/guides/best-practices/sparse-primary-indexes-06.png';
import sparsePrimaryIndexes07 from '@site/static/images/guides/best-practices/sparse-primary-indexes-07.png';
import sparsePrimaryIndexes08 from '@site/static/images/guides/best-practices/sparse-primary-indexes-08.png';
import sparsePrimaryIndexes09a from '@site/static/images/guides/best-practices/sparse-primary-indexes-09a.png';
import sparsePrimaryIndexes09b from '@site/static/images/guides/best-practices/sparse-primary-indexes-09b.png';
import sparsePrimaryIndexes09c from '@site/static/images/guides/best-practices/sparse-primary-indexes-09c.png';
import sparsePrimaryIndexes10 from '@site/static/images/guides/best-practices/sparse-primary-indexes-10.png';
import sparsePrimaryIndexes11 from '@site/static/images/guides/best-practices/sparse-primary-indexes-11.png';
import sparsePrimaryIndexes12a from '@site/static/images/guides/best-practices/sparse-primary-indexes-12a.png';
import sparsePrimaryIndexes12b1 from '@site/static/images/guides/best-practices/sparse-primary-indexes-12b-1.png';
import sparsePrimaryIndexes12b2 from '@site/static/images/guides/best-practices/sparse-primary-indexes-12b-2.png';
import sparsePrimaryIndexes12c1 from '@site/static/images/guides/best-practices/sparse-primary-indexes-12c-1.png';
import sparsePrimaryIndexes12c2 from '@site/static/images/guides/best-practices/sparse-primary-indexes-12c-2.png';
import sparsePrimaryIndexes13a from '@site/static/images/guides/best-practices/sparse-primary-indexes-13a.png';
import sparsePrimaryIndexes14a from '@site/static/images/guides/best-practices/sparse-primary-indexes-14a.png';
import sparsePrimaryIndexes14b from '@site/static/images/guides/best-practices/sparse-primary-indexes-14b.png';
import sparsePrimaryIndexes15a from '@site/static/images/guides/best-practices/sparse-primary-indexes-15a.png';
import sparsePrimaryIndexes15b from '@site/static/images/guides/best-practices/sparse-primary-indexes-15b.png';
import Image from '@theme/IdealImage';

# Практическое введение в первичные индексы в ClickHouse
## Введение {#introduction}

В этом руководстве мы подробно рассмотрим индексацию в ClickHouse. Мы проиллюстрируем и обсудим в деталях:
- [как индексация в ClickHouse отличается от традиционных систем управления реляционными базами данных](#an-index-design-for-massive-data-scales)
- [как ClickHouse строит и использует разреженный первичный индекс таблицы](#a-table-with-a-primary-key)
- [какими являются некоторые лучшие практики индексации в ClickHouse](#using-multiple-primary-indexes)

Вы можете по желанию выполнить все SQL-запросы ClickHouse, представленные в этом руководстве, на своем собственном компьютере. Для установки ClickHouse и инструкций по началу работы смотрите [Быстрый старт](/quick-start.mdx).

:::note
Это руководство фокусируется на разреженных первичных индексах ClickHouse.

Для [вторичных индексов пропуска данных](/engines/table-engines/mergetree-family/mergetree.md/#table_engine-mergetree-data_skipping-indexes) ClickHouse смотрите [Учебник](/guides/best-practices/skipping-indexes.md).
:::
### Набор данных {#data-set}

В этом руководстве мы будем использовать образец анонимизированного набора данных веб-трафика.

- Мы будем использовать подмножество из 8,87 миллиона строк (событий) из образца данных.
- Не сжатый размер данных составляет 8,87 миллиона событий и около 700 МБ. После сжатия он занимает 200 МБ при хранении в ClickHouse.
- В нашем подмножестве каждая строка содержит три колонки, которые указывают на интернет-пользователя (колонка `UserID`), который кликнул по URL (колонка `URL`) в определенное время (колонка `EventTime`).

С этими тремя колонками мы уже можем сформулировать некоторые типичные запросы веб-аналитики, такие как:

- "Какие 10 URL были наиболее популярными у конкретного пользователя?"
- "Какие 10 пользователей чаще всего кликали по конкретному URL?"
- "В какое время (например, дни недели) пользователь чаще всего кликает по конкретному URL?"
### Тестовая машина {#test-machine}

Все числа, приведенные в этом документе, основаны на запуске ClickHouse 22.2.1 локально на MacBook Pro с чипом Apple M1 Pro и 16 ГБ оперативной памяти.
### Полное сканирование таблицы {#a-full-table-scan}

Чтобы увидеть, как выполняется запрос по нашему набору данных без первичного ключа, мы создадим таблицу (с движком таблиц MergeTree), выполнив следующий SQL DDL-запрос:

```sql
CREATE TABLE hits_NoPrimaryKey
(
    `UserID` UInt32,
    `URL` String,
    `EventTime` DateTime
)
ENGINE = MergeTree
PRIMARY KEY tuple();
```


Затем вставляем подмножество данных в таблицу с помощью следующего SQL запроса на вставку. Это использует [табличную функцию URL](/sql-reference/table-functions/url.md) для загрузки подмножества полного набора данных, размещенного удаленно по адресу clickhouse.com:

```sql
INSERT INTO hits_NoPrimaryKey SELECT
   intHash32(UserID) AS UserID,
   URL,
   EventTime
FROM url('https://datasets.clickhouse.com/hits/tsv/hits_v1.tsv.xz', 'TSV', 'WatchID UInt64,  JavaEnable UInt8,  Title String,  GoodEvent Int16,  EventTime DateTime,  EventDate Date,  CounterID UInt32,  ClientIP UInt32,  ClientIP6 FixedString(16),  RegionID UInt32,  UserID UInt64,  CounterClass Int8,  OS UInt8,  UserAgent UInt8,  URL String,  Referer String,  URLDomain String,  RefererDomain String,  Refresh UInt8,  IsRobot UInt8,  RefererCategories Array(UInt16),  URLCategories Array(UInt16), URLRegions Array(UInt32),  RefererRegions Array(UInt32),  ResolutionWidth UInt16,  ResolutionHeight UInt16,  ResolutionDepth UInt8,  FlashMajor UInt8, FlashMinor UInt8,  FlashMinor2 String,  NetMajor UInt8,  NetMinor UInt8, UserAgentMajor UInt16,  UserAgentMinor FixedString(2),  CookieEnable UInt8, JavascriptEnable UInt8,  IsMobile UInt8,  MobilePhone UInt8,  MobilePhoneModel String,  Params String,  IPNetworkID UInt32,  TraficSourceID Int8, SearchEngineID UInt16,  SearchPhrase String,  AdvEngineID UInt8,  IsArtifical UInt8,  WindowClientWidth UInt16,  WindowClientHeight UInt16,  ClientTimeZone Int16,  ClientEventTime DateTime,  SilverlightVersion1 UInt8, SilverlightVersion2 UInt8,  SilverlightVersion3 UInt32,  SilverlightVersion4 UInt16,  PageCharset String,  CodeVersion UInt32,  IsLink UInt8,  IsDownload UInt8,  IsNotBounce UInt8,  FUniqID UInt64,  HID UInt32,  IsOldCounter UInt8, IsEvent UInt8,  IsParameter UInt8,  DontCountHits UInt8,  WithHash UInt8, HitColor FixedString(1),  UTCEventTime DateTime,  Age UInt8,  Sex UInt8,  Income UInt8,  Interests UInt16,  Robotness UInt8,  GeneralInterests Array(UInt16), RemoteIP UInt32,  RemoteIP6 FixedString(16),  WindowName Int32,  OpenerName Int32,  HistoryLength Int16,  BrowserLanguage FixedString(2),  BrowserCountry FixedString(2),  SocialNetwork String,  SocialAction String,  HTTPError UInt16, SendTiming Int32,  DNSTiming Int32,  ConnectTiming Int32,  ResponseStartTiming Int32,  ResponseEndTiming Int32,  FetchTiming Int32,  RedirectTiming Int32, DOMInteractiveTiming Int32,  DOMContentLoadedTiming Int32,  DOMCompleteTiming Int32,  LoadEventStartTiming Int32,  LoadEventEndTiming Int32, NSToDOMContentLoadedTiming Int32,  FirstPaintTiming Int32,  RedirectCount Int8, SocialSourceNetworkID UInt8,  SocialSourcePage String,  ParamPrice Int64, ParamOrderID String,  ParamCurrency FixedString(3),  ParamCurrencyID UInt16, GoalsReached Array(UInt32),  OpenstatServiceName String,  OpenstatCampaignID String,  OpenstatAdID String,  OpenstatSourceID String,  UTMSource String, UTMMedium String,  UTMCampaign String,  UTMContent String,  UTMTerm String, FromTag String,  HasGCLID UInt8,  RefererHash UInt64,  URLHash UInt64,  CLID UInt32,  YCLID UInt64,  ShareService String,  ShareURL String,  ShareTitle String,  ParsedParams Nested(Key1 String,  Key2 String, Key3 String, Key4 String, Key5 String,  ValueDouble Float64),  IslandID FixedString(16),  RequestNum UInt32,  RequestTry UInt8')
WHERE URL != '';
```
Ответ:
```response
Ok.

0 rows in set. Elapsed: 145.993 sec. Processed 8.87 million rows, 18.40 GB (60.78 thousand rows/s., 126.06 MB/s.)
```


Вывод результата клиента ClickHouse показывает нам, что вышеуказанный запрос вставил 8,87 миллиона строк в таблицу.


Наконец, для упрощения последующих обсуждений в этом руководстве и для того, чтобы диаграммы и результаты можно было воспроизвести, мы [оптимизируем](/sql-reference/statements/optimize.md) таблицу с использованием ключевого слова FINAL:

```sql
OPTIMIZE TABLE hits_NoPrimaryKey FINAL;
```

:::note
В общем случае нет необходимости и не рекомендуется сразу оптимизировать таблицу после загрузки данных в нее. Почему это необходимо для этого примера станет очевидно позже.
:::


Теперь мы выполняем наш первый запрос веб-аналитики. Следующий запрос вычисляет 10 наиболее часто кликаемых URL для интернет-пользователя с UserID 749927693:

```sql
SELECT URL, count(URL) as Count
FROM hits_NoPrimaryKey
WHERE UserID = 749927693
GROUP BY URL
ORDER BY Count DESC
LIMIT 10;
```
Ответ:
```response
┌─URL────────────────────────────┬─Count─┐
│ http://auto.ru/chatay-barana.. │   170 │
│ http://auto.ru/chatay-id=371...│    52 │
│ http://public_search           │    45 │
│ http://kovrik-medvedevushku-...│    36 │
│ http://forumal                 │    33 │
│ http://korablitz.ru/L_1OFFER...│    14 │
│ http://auto.ru/chatay-id=371...│    14 │
│ http://auto.ru/chatay-john-D...│    13 │
│ http://auto.ru/chatay-john-D...│    10 │
│ http://wot/html?page/23600_m...│     9 │
└────────────────────────────────┴───────┘

10 rows in set. Elapsed: 0.022 sec.

# highlight-next-line
Processed 8.87 million rows,
70.45 MB (398.53 million rows/s., 3.17 GB/s.)
```

Вывод результата клиента ClickHouse указывает на то, что ClickHouse выполнил полное сканирование таблицы! Каждая строка из 8,87 миллиона строк нашей таблицы была передана в ClickHouse. Это не масштабируется.

Чтобы сделать это (в разы) более эффективно и (значительно) быстрее, нам нужно использовать таблицу с подходящим первичным ключом. Это позволит ClickHouse автоматически (на основе колонки(ок) первичного ключа) создать разреженный первичный индекс, который затем можно использовать для значительного ускорения выполнения нашего примера запроса.
### Связанный контент {#related-content}
- Блог: [Ускорение выполнения запросов ClickHouse](https://clickhouse.com/blog/clickhouse-faster-queries-with-projections-and-primary-indexes)
## Дизайн индекса ClickHouse {#clickhouse-index-design}
### Дизайн индекса для массовых объемов данных {#an-index-design-for-massive-data-scales}

В традиционных системах управления реляционными базами данных первичный индекс содержал бы одну запись на каждую строку таблицы. Это привело бы к тому, что первичный индекс содержал бы 8,87 миллиона записей для нашего набора данных. Такой индекс позволяет быстро находить конкретные строки, что приводит к высокой эффективности для запросов на поиск и точечных обновлений. Поиск записи в структуре данных `B(+)-Tree` имеет среднюю временную сложность `O(log n)`; более точно, `log_b n = log_2 n / log_2 b`, где `b` - коэффициент разветвления `B(+)-Tree`, а `n` - количество индексированных строк. Поскольку `b` обычно составляет от нескольких сотен до нескольких тысяч, `B(+)-Trees` - это очень мелкие структуры, и для их локализации требуется немного операций ввода-вывода на диск. С 8,87 миллиона строк и коэффициентом разветвления 1000 в среднем требуется 2,3 операции ввода-вывода на диск. Эта возможность имеет свою цену: дополнительные расходы на диск и память, более высокие затраты на вставку при добавлении новых строк в таблицу и записей в индекс, а также иногда перераспределение B-Tree.

Учитывая проблемы, связанные с индексами B-Tree, движки таблиц в ClickHouse используют другой подход. Семейство [MergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/) ClickHouse было разработано и оптимизировано для обработки огромных объемов данных. Эти таблицы предназначены для приема миллионов вставок строк в секунду и хранения очень больших объемов данных (сотни петабайт). Данные быстро записываются в таблицу [по частям](/engines/table-engines/mergetree-family/mergetree.md/#mergetree-data-storage) с применением правил для слияния частей в фоновом режиме. В ClickHouse каждая часть имеет свой первичный индекс. Когда части сливаются, первичные индексы также сливаются. На очень крупном масштабе, для которого предназначен ClickHouse, очень важно быть экономичным в отношении дискового пространства и памяти. Поэтому, вместо индексирования каждой строки, первичный индекс для части имеет одну индексную запись (известную как «метка») на группу строк (названную «гранулой») – эта техника называется **разреженным индексом**.

Разреженная индексация возможна, потому что ClickHouse хранит строки для части на диске, упорядоченные по колонке(кам) первичного ключа. Вместо прямого нахождения отдельных строк (как в индексе на базе B-Tree) разреженный первичный индекс позволяет быстро (посредством бинарного поиска по индексным записям) идентифицировать группы строк, которые могут соответствовать запросу. Обнаруженные группы потенциально совпадающих строк (гранулы) затем параллельно передаются в движок ClickHouse для нахождения совпадений. Этот дизайн индекса позволяет первичному индексу быть маленьким (он может и должен полностью помещаться в основную память), при этом значительно ускоряя время выполнения запросов: особенно для диапазонных запросов, характерных для случаев использования аналитики данных.

Следующее подробно иллюстрирует, как ClickHouse строит и использует свой разреженный первичный индекс. Позже в статье мы обсудим некоторые лучшие практики по выбору, удалению и упорядочиванию колонок таблицы, которые используются для построения индекса (колонок первичного ключа).
### Таблица с первичным ключом {#a-table-with-a-primary-key}

Создайте таблицу, которая имеет составной первичный ключ с ключевыми колонками UserID и URL:

```sql
CREATE TABLE hits_UserID_URL
(
    `UserID` UInt32,
    `URL` String,
    `EventTime` DateTime
)
ENGINE = MergeTree
-- highlight-next-line
PRIMARY KEY (UserID, URL)
ORDER BY (UserID, URL, EventTime)
SETTINGS index_granularity = 8192, index_granularity_bytes = 0, compress_primary_key = 0;
```

[//]: # (<details open>)
<details>
    <summary>
    Подробности DDL-запроса
    </summary>
    <p>

В целях упрощения обсуждений далее в этом руководстве, а также для того, чтобы диаграммы и результаты можно было воспроизвести, DDL-запрос:

<ul>
  <li>
    Устанавливает составной ключ сортировки для таблицы через <code>ORDER BY</code> оператор.
  </li>
  <li>
    Явно управляет тем, сколько индексных записей будет в первичном индексе через установки:
    <ul>
      <li>
        <code>index_granularity</code>: явно установлено на его значение по умолчанию 8192. Это означает, что для каждой группы из 8192 строк первичный индекс будет иметь одну индексную запись. Например, если таблица содержит 16384 строки, индекс будет иметь две индексные записи.
      </li>
      <li>
        <code>index_granularity_bytes</code>: установлено на 0, чтобы отключить <a href="https://clickhouse.com/docs/whats-new/changelog/2019/#experimental-features-1" target="_blank">адаптивную гранулярность индекса</a>. Адаптивная гранулярность индекса означает, что ClickHouse автоматически создает одну индексную запись для группы из n строк, если выполняется одно из следующих условий:
        <ul>
          <li>
            Если <code>n</code> меньше 8192, а размер данных строки для этих <code>n</code> строк равен или превышает 10 МБ (значение по умолчанию для <code>index_granularity_bytes</code>).
          </li>
          <li>
            Если размер данных строки для <code>n</code> строк меньше 10 МБ, но <code>n</code> равно 8192.
          </li>
        </ul>
      </li>
      <li>
        <code>compress_primary_key</code>: установлено на 0, чтобы отключить <a href="https://github.com/ClickHouse/ClickHouse/issues/34437" target="_blank">сжатие первичного индекса</a>. Это позволит нам при необходимости проверить его содержимое позже.
      </li>
    </ul>
  </li>
</ul>

</p>
</details>


Первичный ключ в вышеуказанном DDL-запросе вызывает создание первичного индекса на основе указанных двух ключевых колонок.

<br/>
Затем вставьте данные:

```sql
INSERT INTO hits_UserID_URL SELECT
   intHash32(UserID) AS UserID,
   URL,
   EventTime
FROM url('https://datasets.clickhouse.com/hits/tsv/hits_v1.tsv.xz', 'TSV', 'WatchID UInt64,  JavaEnable UInt8,  Title String,  GoodEvent Int16,  EventTime DateTime,  EventDate Date,  CounterID UInt32,  ClientIP UInt32,  ClientIP6 FixedString(16),  RegionID UInt32,  UserID UInt64,  CounterClass Int8,  OS UInt8,  UserAgent UInt8,  URL String,  Referer String,  URLDomain String,  RefererDomain String,  Refresh UInt8,  IsRobot UInt8,  RefererCategories Array(UInt16),  URLCategories Array(UInt16), URLRegions Array(UInt32),  RefererRegions Array(UInt32),  ResolutionWidth UInt16,  ResolutionHeight UInt16,  ResolutionDepth UInt8,  FlashMajor UInt8, FlashMinor UInt8,  FlashMinor2 String,  NetMajor UInt8,  NetMinor UInt8, UserAgentMajor UInt16,  UserAgentMinor FixedString(2),  CookieEnable UInt8, JavascriptEnable UInt8,  IsMobile UInt8,  MobilePhone UInt8,  MobilePhoneModel String,  Params String,  IPNetworkID UInt32,  TraficSourceID Int8, SearchEngineID UInt16,  SearchPhrase String,  AdvEngineID UInt8,  IsArtifical UInt8,  WindowClientWidth UInt16,  WindowClientHeight UInt16,  ClientTimeZone Int16,  ClientEventTime DateTime,  SilverlightVersion1 UInt8, SilverlightVersion2 UInt8,  SilverlightVersion3 UInt32,  SilverlightVersion4 UInt16,  PageCharset String,  CodeVersion UInt32,  IsLink UInt8,  IsDownload UInt8,  IsNotBounce UInt8,  FUniqID UInt64,  HID UInt32,  IsOldCounter UInt8, IsEvent UInt8,  IsParameter UInt8,  DontCountHits UInt8,  WithHash UInt8, HitColor FixedString(1),  UTCEventTime DateTime,  Age UInt8,  Sex UInt8,  Income UInt8,  Interests UInt16,  Robotness UInt8,  GeneralInterests Array(UInt16), RemoteIP UInt32,  RemoteIP6 FixedString(16),  WindowName Int32,  OpenerName Int32,  HistoryLength Int16,  BrowserLanguage FixedString(2),  BrowserCountry FixedString(2),  SocialNetwork String,  SocialAction String,  HTTPError UInt16, SendTiming Int32,  DNSTiming Int32,  ConnectTiming Int32,  ResponseStartTiming Int32,  ResponseEndTiming Int32,  FetchTiming Int32,  RedirectTiming Int32, DOMInteractiveTiming Int32,  DOMContentLoadedTiming Int32,  DOMCompleteTiming Int32,  LoadEventStartTiming Int32,  LoadEventEndTiming Int32, NSToDOMContentLoadedTiming Int32,  FirstPaintTiming Int32,  RedirectCount Int8, SocialSourceNetworkID UInt8,  SocialSourcePage String,  ParamPrice Int64, ParamOrderID String,  ParamCurrency FixedString(3),  ParamCurrencyID UInt16, GoalsReached Array(UInt32),  OpenstatServiceName String,  OpenstatCampaignID String,  OpenstatAdID String,  OpenstatSourceID String,  UTMSource String, UTMMedium String,  UTMCampaign String,  UTMContent String,  UTMTerm String, FromTag String,  HasGCLID UInt8,  RefererHash UInt64,  URLHash UInt64,  CLID UInt32,  YCLID UInt64,  ShareService String,  ShareURL String,  ShareTitle String,  ParsedParams Nested(Key1 String,  Key2 String, Key3 String, Key4 String, Key5 String,  ValueDouble Float64),  IslandID FixedString(16),  RequestNum UInt32,  RequestTry UInt8')
WHERE URL != '';
```
Ответ выглядит следующим образом:
```response
0 rows in set. Elapsed: 149.432 sec. Processed 8.87 million rows, 18.40 GB (59.38 thousand rows/s., 123.16 MB/s.)
```


<br/>
Затем оптимизируем таблицу:

```sql
OPTIMIZE TABLE hits_UserID_URL FINAL;
```

<br/>
Мы можем использовать следующий запрос для получения метаданных о нашей таблице:

```sql
SELECT
    part_type,
    path,
    formatReadableQuantity(rows) AS rows,
    formatReadableSize(data_uncompressed_bytes) AS data_uncompressed_bytes,
    formatReadableSize(data_compressed_bytes) AS data_compressed_bytes,
    formatReadableSize(primary_key_bytes_in_memory) AS primary_key_bytes_in_memory,
    marks,
    formatReadableSize(bytes_on_disk) AS bytes_on_disk
FROM system.parts
WHERE (table = 'hits_UserID_URL') AND (active = 1)
FORMAT Vertical;
```

Ответ:

```response
part_type:                   Wide
path:                        ./store/d9f/d9f36a1a-d2e6-46d4-8fb5-ffe9ad0d5aed/all_1_9_2/
rows:                        8.87 million
data_uncompressed_bytes:     733.28 MiB
data_compressed_bytes:       206.94 MiB
primary_key_bytes_in_memory: 96.93 KiB
marks:                       1083
bytes_on_disk:               207.07 MiB


1 rows in set. Elapsed: 0.003 sec.
```

Вывод клиента ClickHouse показывает:

- Данные таблицы хранятся в [широком формате](/engines/table-engines/mergetree-family/mergetree.md/#mergetree-data-storage) в конкретном каталоге на диске, что означает, что в этом каталоге будет один файл данных (и один файл меток) для каждого столбца таблицы.
- Таблица имеет 8,87 миллиона строк.
- Нерасжатый размер данных всех строк вместе составляет 733,28 МБ.
- Сжатый размер на диске всех строк вместе составляет 206,94 МБ.
- Таблица имеет первичный индекс с 1083 записями (называемыми «метки»), а размер индекса составляет 96,93 КБ.
- В общей сложности данные таблицы и файлы меток и первичного индекса занимают 207,07 МБ на диске.
### Данные хранятся на диске в порядке колонок первичного ключа {#data-is-stored-on-disk-ordered-by-primary-key-columns}

Наша таблица, которую мы создали выше, имеет:
- составной [первичный ключ](/engines/table-engines/mergetree-family/mergetree.md/#primary-keys-and-indexes-in-queries) `(UserID, URL)` и
- составной [ключ сортировки](/engines/table-engines/mergetree-family/mergetree.md/#choosing-a-primary-key-that-differs-from-the-sorting-key) `(UserID, URL, EventTime)`.

:::note
- Если бы мы указали только ключ сортировки, то первичный ключ неявно бы определялся как равный ключу сортировки.

- Чтобы быть экономным в памяти, мы явно указали первичный ключ, который содержит только колонки, по которым наши запросы фильтруются. Первичный индекс, основанный на первичном ключе, полностью загружается в основную память.

- Чтобы обеспечить согласованность в диаграммах руководства и максимизировать коэффициент сжатия, мы определили отдельный ключ сортировки, который включает все колонки таблицы (если в колонке похожие данные расположены близко друг к другу, например, через сортировку, то эти данные будут лучше сжиматься).

- Первичный ключ должен быть префиксом ключа сортировки, если оба указаны.
:::

Вставленные строки хранятся на диске в лексикографическом порядке (по возрастанию) по колонкам первичного ключа (и дополнительной колонке `EventTime` из ключа сортировки).

:::note
ClickHouse разрешает вставку нескольких строк с одинаковыми значениями колонок первичного ключа. В этом случае (см. строки 1 и 2 на диаграмме ниже) окончательный порядок определяется заданным ключом сортировки и, следовательно, значением колонки `EventTime`.
:::


ClickHouse является <a href="https://clickhouse.com/docs/introduction/distinctive-features/#true-column-oriented-dbms" target="_blank">столбцовой системой управления базами данных</a>. Как показано на диаграмме ниже:
- для представления на диске есть один файл данных (*.bin) для каждого столбца таблицы, где хранятся все значения для этого столбца в <a href="https://clickhouse.com/docs/introduction/distinctive-features/#data-compression" target="_blank">сжатом</a> формате и
- 8,87 миллиона строк хранятся на диске в лексикографическом порядке по колонкам первичного ключа (и дополнительно сортирующим колонкам), то есть в этом случае
  - сначала по `UserID`,
  - затем по `URL`,
  - и наконец по `EventTime`:

<Image img={sparsePrimaryIndexes01} size="md" alt="Sparse Primary Indices 01" background="white"/>

`UserID.bin`, `URL.bin`, и `EventTime.bin` - это файлы данных на диске, где хранятся значения колонок `UserID`, `URL` и `EventTime`.

:::note
- Поскольку первичный ключ определяет лексикографический порядок строк на диске, в таблице может быть только один первичный ключ.

- Мы нумеруем строки, начиная с 0, чтобы соответствовать внутренней схеме нумерации строк ClickHouse, которая также используется для сообщений логирования.
:::
### Данные организованы в гранулы для параллельной обработки данных {#data-is-organized-into-granules-for-parallel-data-processing}

Для целей обработки данных значения колонок таблицы логически делятся на гранулы.
Гранула - это наименьший неделимый набор данных, который передается в ClickHouse для обработки данных.
Это означает, что вместо чтения отдельных строк ClickHouse всегда считывает (в поточном режиме и параллельно) целую группу (гранулу) строк.
:::note
Значения колонок физически не хранятся внутри гранул: гранулы - это просто логическая организация значений колонок для обработки запросов.
:::

Следующая диаграмма показывает, как (значения колонок) 8,87 миллиона строк нашей таблицы организованы в 1083 гранулы, в результате того, что в DDL-запросе таблицы содержалась установка `index_granularity` (установленная на значение по умолчанию 8192).

<Image img={sparsePrimaryIndexes02} size="md" alt="Sparse Primary Indices 02" background="white"/>

Первым (на основе физического порядка на диске) 8192 строк (их значения колонок) логически принадлежат грануле 0, затем следующие 8192 строки (их значения колонок) принадлежат грануле 1 и так далее.

:::note
- Последняя гранула (гранула 1082) "содержит" менее 8192 строк.

- Мы упоминали в начале этого руководства в разделе "Подробности DDL-запроса", что мы отключили [адаптивную гранулярность индекса](/whats-new/changelog/2019.md/#experimental-features-1) (чтобы упростить обсуждения в этом руководстве, а также сделать диаграммы и результаты воспроизводимыми).

  Поэтому все гранулы (кроме последней) нашей примерной таблицы имеют одинаковый размер.

- Для таблиц с адаптивной гранулярностью индекса (гранулярность индекса является адаптивной по [умолчанию](/operations/settings/merge-tree-settings#index_granularity_bytes)) размер некоторых гранул может быть меньше 8192 строк в зависимости от размеров данных строк.


- Мы отметили некоторые значения колонок из наших колонок первичного ключа (`UserID`, `URL`) оранжевым цветом.
  Эти оранжево помеченные значения колонок будут являться записями в первичном индексе таблицы.

- Мы нумеруем гранулы, начиная с 0, чтобы соответствовать внутренней нумерации ClickHouse, которая также используется для сообщений логирования.
:::
### Первичный индекс содержит одну запись на гранулу {#the-primary-index-has-one-entry-per-granule}

Первичный индекс создается на основе гранул, показанных на диаграмме выше. Этот индекс представляет собой не сжатый плоский файл массива (primary.idx), содержащий так называемые числовые метки индекса, начинающиеся с 0.

Диаграмма ниже показывает, что индекс хранит значения столбца первичного ключа (значения, отмеченные оранжевым на диаграмме выше) для каждой первой строки каждой гранулы.
Или, другими словами: первичный индекс хранит значения столбца первичного ключа из каждой 8192-ой строки таблицы (в зависимости от физического порядка строк, определенного столбцами первичного ключа).
Например:
- первая запись индекса (‘метка 0’ на диаграмме ниже) хранит значения ключевого столбца первой строки гранулы 0 из диаграммы выше,
- вторая запись индекса (‘метка 1’ на диаграмме ниже) хранит значения ключевого столбца первой строки гранулы 1 из диаграммы выше и так далее.

<Image img={sparsePrimaryIndexes03a} size="lg" alt="Sparse Primary Indices 03a" background="white"/>

В общей сложности индекс имеет 1083 записи для нашей таблицы с 8.87 миллиона строк и 1083 гранулами:

<Image img={sparsePrimaryIndexes03b} size="md" alt="Sparse Primary Indices 03b" background="white"/>

:::note
- Для таблиц с [адаптивной гранулярностью индекса](/whats-new/changelog/2019.md/#experimental-features-1) также хранится одна "финальная" дополнительная метка в первичном индексе, которая фиксирует значения столбца первичного ключа последней строки таблицы. Однако, поскольку мы отключили адаптивную гранулярность индекса (для упрощения обсуждений в этом руководстве, а также чтобы сделать диаграммы и результаты воспроизводимыми), индекс нашей примерной таблицы не включает эту финальную метку.

- Файл первичного индекса полностью загружается в основную память. Если файл больше доступного свободного пространства памяти, то ClickHouse выдаст ошибку.
:::

<details>
    <summary>
    Проверка содержимого первичного индекса
    </summary>
    <p>

На самоуправляемом кластере ClickHouse мы можем использовать <a href="https://clickhouse.com/docs/sql-reference/table-functions/file/" target="_blank">табличную функцию file</a> для проверки содержимого первичного индекса нашей примерной таблицы.

Для этого нам сначала нужно скопировать файл первичного индекса в <a href="https://clickhouse.com/docs/operations/server-configuration-parameters/settings/#server_configuration_parameters-user_files_path" target="_blank">user_files_path</a> узла из работающего кластера:
<ul>
<li>Шаг 1: Получить путь к части, содержащей файл первичного индекса</li>
`
SELECT path FROM system.parts WHERE table = 'hits_UserID_URL' AND active = 1
`

возвращает `/Users/tomschreiber/Clickhouse/store/85f/85f4ee68-6e28-4f08-98b1-7d8affa1d88c/all_1_9_4` на тестовой машине.

<li>Шаг 2: Получить user_files_path</li>
<a href="https://github.com/ClickHouse/ClickHouse/blob/22.12/programs/server/config.xml#L505" target="_blank">Путь user_files_path по умолчанию</a> на Linux:
`/var/lib/clickhouse/user_files/`

и на Linux вы можете проверить, был ли он изменен: `$ grep user_files_path /etc/clickhouse-server/config.xml`

На тестовой машине путь: `/Users/tomschreiber/Clickhouse/user_files/`


<li>Шаг 3: Скопировать файл первичного индекса в user_files_path</li>

`cp /Users/tomschreiber/Clickhouse/store/85f/85f4ee68-6e28-4f08-98b1-7d8affa1d88c/all_1_9_4/primary.idx /Users/tomschreiber/Clickhouse/user_files/primary-hits_UserID_URL.idx`

</ul>

<br/>
Теперь мы можем проверить содержимое первичного индекса через SQL:
<ul>
<li>Получить количество записей</li>
`
SELECT count( )<br/>FROM file('primary-hits_UserID_URL.idx', 'RowBinary', 'UserID UInt32, URL String');
`
возвращает `1083`

<li>Получить первые две метки индекса</li>
`
SELECT UserID, URL<br/>FROM file('primary-hits_UserID_URL.idx', 'RowBinary', 'UserID UInt32, URL String')<br/>LIMIT 0, 2;
`

возвращает

`
240923, http://showtopics.html%3...<br/>
4073710, http://mk.ru&pos=3_0
`

<li>Получить последнюю метку индекса</li>
`
SELECT UserID, URL FROM file('primary-hits_UserID_URL.idx', 'RowBinary', 'UserID UInt32, URL String')<br/>LIMIT 1082, 1;
`
возвращает
`
4292714039 │ http://sosyal-mansetleri...
`
</ul>
<br/>
Это полностью соответствует нашей диаграмме содержимого первичного индекса для нашей примерной таблицы:

</p>
</details>

Записи первичного ключа называются метками индекса, потому что каждая запись индекса отмечает начало определенного диапазона данных. В частности, для примерной таблицы:
- метки индекса UserID:

  Хранимые значения `UserID` в первичном индексе отсортированы в порядке возрастания.<br/>
  ‘метка 1’ на диаграмме выше таким образом указывает, что значения `UserID` всех строк таблицы в грануле 1, а также во всех последующих гранулах, гарантированно больше или равны 4.073.710.

 [Как мы увидим позже](#the-primary-index-is-used-for-selecting-granules), этот глобальный порядок позволяет ClickHouse <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1452" target="_blank">использовать алгоритм бинарного поиска</a> по меткам индекса для первого ключевого столбца, когда запрос фильтрует по первому столбцу первичного ключа.

- метки индекса URL:

  Довольно сходные кардинальности столбцов первичного ключа `UserID` и `URL`
  означают, что метки индекса для всех ключевых столбцов после первого столбца в общем случае указывают только диапазон данных, пока значение предшествующего ключевого столбца остается одинаковым для всех строк таблицы в пределах хотя бы текущей гранулы.<br/>
 Например, поскольку значения UserID метки 0 и метки 1 различны на диаграмме выше, ClickHouse не может предположить, что все значения URL всех строк таблицы в грануле 0 больше или равны `'http://showtopics.html%3...'`. Однако, если бы значения UserID метки 0 и метки 1 были одинаковыми на диаграмме выше (что означает, что значение UserID остается одинаковым для всех строк таблицы в грануле 0), ClickHouse мог бы предположить, что все значения URL всех строк таблицы в грануле 0 больше или равны `'http://showtopics.html%3...'`.

  Мы обсудим последствия этого для производительности выполнения запросов более подробно позже.
### Первичный индекс используется для выбора гранул {#the-primary-index-is-used-for-selecting-granules}

Теперь мы можем выполнять наши запросы с помощью первичного индекса.

Следующий запрос вычисляет 10 наиболее кликабельных URL для UserID 749927693.

```sql
SELECT URL, count(URL) AS Count
FROM hits_UserID_URL
WHERE UserID = 749927693
GROUP BY URL
ORDER BY Count DESC
LIMIT 10;
```

Ответ:

```response
┌─URL────────────────────────────┬─Count─┐
│ http://auto.ru/chatay-barana.. │   170 │
│ http://auto.ru/chatay-id=371...│    52 │
│ http://public_search           │    45 │
│ http://kovrik-medvedevushku-...│    36 │
│ http://forumal                 │    33 │
│ http://korablitz.ru/L_1OFFER...│    14 │
│ http://auto.ru/chatay-id=371...│    14 │
│ http://auto.ru/chatay-john-D...│    13 │
│ http://auto.ru/chatay-john-D...│    10 │
│ http://wot/html?page/23600_m...│     9 │
└────────────────────────────────┴───────┘

10 строк в наборе. Время исполнения: 0.005 сек.

# highlight-next-line
Обработано 8.19 тысячи строк,
740.18 КБ (1.53 миллиона строк/сек., 138.59 МБ/сек.)
```

Вывод для клиента ClickHouse теперь показывает, что вместо выполнения полного сканирования таблицы, в ClickHouse было передано лишь 8.19 тысячи строк.

Если <a href="https://clickhouse.com/docs/operations/server-configuration-parameters/settings/#server_configuration_parameters-logger" target="_blank">включено трассировочное логирование</a>, то файл логов сервера ClickHouse показывает, что ClickHouse выполнял <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1452" target="_blank">бинарный поиск</a> по 1083 меткам индекса UserID, чтобы определить гранулы, которые могут содержать строки со значением столбца UserID равным `749927693`. Для этого потребовалось 19 шагов с средним временем сложности `O(log2 n)`:
```response
...Executor): Условие ключа: (столбец 0 в [749927693, 749927693])

# highlight-next-line
...Executor): Выполняется бинарный поиск по диапазону индекса для части all_1_9_2 (1083 метки)
...Executor): Найдена (ЛЕВАЯ) граница метки: 176
...Executor): Найдена (ПРАВАЯ) граница метки: 177
...Executor): Найден непрерывный диапазон за 19 шагов
...Executor): Выбраны 1/1 частей по ключу партиции, 1 часть по первичному ключу,

# highlight-next-line
              1/1083 меток по первичному ключу, 1 метка для чтения из 1 диапазонов
...Чтение ...приблизительно 8192 строки, начиная с 1441792
```

Мы видим в трасировочном логировании выше, что одна метка из 1083 существующих меток удовлетворила запросу.

<details>
    <summary>
    Детали трассировочного лога
    </summary>
    <p>

Метка 176 была определена (найденная левая граница метки является включительной, а найденная правая граница метки - эксклюзивной), а следовательно, все 8192 строки из гранулы 176 (которая начинается с 1.441.792 строки - мы увидим это позже в этом руководстве) затем передаются в ClickHouse с целью найти реальные строки со значением столбца UserID равным `749927693`.
</p>
</details>

Мы также можем воспроизвести это, используя <a href="https://clickhouse.com/docs/sql-reference/statements/explain/" target="_blank">класс EXPLAIN</a> в нашем примерном запросе:
```sql
EXPLAIN indexes = 1
SELECT URL, count(URL) AS Count
FROM hits_UserID_URL
WHERE UserID = 749927693
GROUP BY URL
ORDER BY Count DESC
LIMIT 10;
```

Ответ выглядит следующим образом:

```response
┌─explain───────────────────────────────────────────────────────────────────────────────┐
│ Выражение (Проекция)                                                                 │
│   Лимит (предварительный LIMIT (без OFFSET))                                          │
│     Сортировка (Сортировка для ORDER BY)                                              │
│       Выражение (Перед ORDER BY)                                                      │
│         Агрегация                                                                      │
│           Выражение (Перед GROUP BY)                                                  │
│             Фильтр (WHERE)                                                            │
│               УстановкаКвотИЛимитов (Установка лимитов и квот после чтения из хранилища) │
│                 ReadFromMergeTree                                                     │
│                 Индексы:                                                              │
│                   PrimaryKey                                                          │
│                     Ключи:                                                             │
│                       UserID                                                          │
│                     Условие: (UserID в [749927693, 749927693])                       │
│                     Части: 1/1                                                        │

# highlight-next-line
│                     Гранулы: 1/1083                                                  │
└───────────────────────────────────────────────────────────────────────────────────────┘

16 строк в наборе. Время исполнения: 0.003 сек.
```
Вывод клиента показывает, что одна из 1083 гранул была выбрана как потенциально содержащая строки со значением столбца UserID равным 749927693.

:::note Заключение
Когда запрос фильтрует по столбцу, который является частью составного ключа и является первым ключевым столбцом, ClickHouse выполняет бинарный алгоритм поиска по меткам индекса данного столбца.
:::

<br/>

Как обсуждалось выше, ClickHouse использует свой разреженный первичный индекс для быстрого (с помощью бинарного поиска) выбора гранул, которые могут содержать строки, соответствующие запросу.

Это **первая стадия (выбор гранулы)** выполнения запроса ClickHouse.

На **второй стадии (чтение данных)** ClickHouse локализует выбранные гранулы, чтобы передать все их строки в движок ClickHouse с целью найти строки, которые на самом деле соответствуют запросу.

Мы обсудим эту вторую стадию более подробно в следующем разделе.
### Файлы меток используются для локализации гранул {#mark-files-are-used-for-locating-granules}

Следующая диаграмма иллюстрирует часть файла первичного индекса для нашей таблицы.

<Image img={sparsePrimaryIndexes04} size="md" alt="Sparse Primary Indices 04" background="white"/>

Как обсуждалось выше, через бинарный поиск по 1083 меткам UserID была определена метка 176. Соответствующая ей гранула 176 может потенциально содержать строки со значением столбца UserID равным 749.927.693.

<details>
    <summary>
    Детали выбора гранул
    </summary>
    <p>

Диаграмма выше показывает, что метка 176 является первой записью индекса, где минимальное значение UserID связанной гранулы 176 меньше 749.927.693, и минимальное значение UserID гранулы 177 для следующей метки (метка 177) больше этого значения. Таким образом, только соответствующая гранула 176 для метки 176 может потенциально содержать строки со значением столбца UserID равным 749.927.693.
</p>
</details>

Для того чтобы подтвердить (или нет), что некоторые строки в грануле 176 содержат значение столбца UserID равным 749.927.693, все 8192 строки, принадлежащие этой грануле, должны быть переданы в ClickHouse.

Для достижения этого ClickHouse необходимо знать физическое местоположение гранулы 176.

В ClickHouse физические местоположения всех гранул для нашей таблицы хранятся в файлах меток. Аналогично файловым данным, существует один файл меток для каждого столбца таблицы.

Следующая диаграмма показывает три файла меток `UserID.mrk`, `URL.mrk` и `EventTime.mrk`, которые хранят физические местоположения гранул для столбцов `UserID`, `URL` и `EventTime` таблицы.

<Image img={sparsePrimaryIndexes05} size="md" alt="Sparse Primary Indices 05" background="white"/>

Мы обсудили, как первичный индекс представляет собой плоский не сжатый массивный файл (primary.idx), содержащий метки индекса, пронумерованные, начиная с 0.

Аналогично, файл меток также является плоским не сжатым массивным файлом (*.mrk), содержащим метки, пронумерованные, начиная с 0.

Как только ClickHouse определил и выбрал метку индекса для гранулы, которая может содержать строки, соответствующие запросу, можно выполнить выборку по позиционному массиву в файлах меток, чтобы получить физические местоположения гранулы.

Каждая запись файла меток для конкретного столбца хранит два местоположения в виде смещений:

- Первое смещение ('block_offset' на диаграмме выше) локализует <a href="https://clickhouse.com/docs/development/architecture/#block" target="_blank">блок</a> в <a href="https://clickhouse.com/docs/introduction/distinctive-features/#data-compression" target="_blank">сжатом</a> файле данных столбца, который содержит сжатую версию выбранной гранулы. Этот сжатый блок потенциально может содержать несколько сжатых гранул. Найденный сжатый файл блока распаковывается в основную память при чтении.

- Второе смещение ('granule_offset' на диаграмме выше) из файла меток предоставляет местоположение гранулы внутри распакованных данных блока.

Все 8192 строки, принадлежащие найденной распакованной грануле, затем передаются в ClickHouse для дальнейшей обработки.

:::note

- Для таблиц с [широким форматом](/engines/table-engines/mergetree-family/mergetree.md/#mergetree-data-storage) и без [адаптивной гранулярности индекса](/whats-new/changelog/2019.md/#experimental-features-1) ClickHouse использует файлы меток `.mrk`, как визуализировано выше, которые содержат записи с двумя 8-байтными адресами на запись. Эти записи представляют собой физические местоположения гранул, которые все имеют одинаковый размер.

Гранулярность индекса является адаптивной по [умолчанию](/operations/settings/merge-tree-settings#index_granularity_bytes), но для нашей примерной таблицы мы отключили адаптивную гранулярность индекса (чтобы упростить обсуждения в этом руководстве, а также сделать диаграммы и результаты воспроизводимыми). Наша таблица использует широкий формат, поскольку размер данных больше [min_bytes_for_wide_part](/operations/settings/merge-tree-settings#min_bytes_for_wide_part) (что по умолчанию составляет 10 МБ для самоуправляемых кластеров).

- Для таблиц с широким форматом и с адаптивной гранулярностью индекса ClickHouse использует файлы меток `.mrk2`, которые содержат аналогичные записи к файлам `.mrk`, но с дополнительным третьим значением на запись: количество строк гранулы, с которой связана текущая запись.

- Для таблиц с [компактным форматом](/engines/table-engines/mergetree-family/mergetree.md/#mergetree-data-storage) ClickHouse использует файлы меток `.mrk3`.

:::

:::note Почему файлы меток

Почему первичный индекс не содержит напрямую физические местоположения гранул, соответствующих меткам индекса?

Потому что при таком большом масштабе, для которого разработан ClickHouse, важно быть очень дисковым и оперативно экономичным.

Файл первичного индекса должен помещаться в основную память.

Для нашего примерного запроса ClickHouse использовал первичный индекс и выбрал одну гранулу, которая может содержать строки, соответствующие нашему запросу. Только для этой одной гранулы ClickHouse затем необходимо физическое местоположение, чтобы передать соответствующие строки для дальнейшей обработки.

Более того, эта информация о смещении необходима только для столбцов UserID и URL.

Информация о смещении не требуется для столбцов, не используемых в запросе, например, для `EventTime`.

Для нашего примерного запроса ClickHouse нужно только два физических смещения для гранулы 176 в файле данных UserID (UserID.bin) и два физических смещения для гранулы 176 в файле данных URL (URL.bin).

Указание, предоставляемое файлами меток, избегает хранения непосредственно в первичном индексе записей для физических местоположений всех 1083 гранул для всех трех столбцов: таким образом, избегая наличия ненужных (возможно, неиспользуемых) данных в основной памяти.
:::

Следующая диаграмма и текст ниже иллюстрируют, как ClickHouse находит гранулу 176 в файле данных UserID.bin.

<Image img={sparsePrimaryIndexes06} size="md" alt="Sparse Primary Indices 06" background="white"/>

Мы ранее обсуждали в этом руководстве, что ClickHouse выбрал метку первичного индекса 176, а поэтому гранулу 176 как потенциально содержащую строки, соответствующие нашему запросу.

Теперь ClickHouse использует выбранный номер метки (176) из индекса для выборки по позиционному массиву в файле меток UserID.mrk, чтобы получить два смещения для локализации гранулы 176.

Как показано, первое смещение локализует сжатый файл блока в файле данных UserID.bin, который, в свою очередь, содержит сжатую версию гранулы 176.

Как только локализованный файл блока будет распакован в основную память, второе смещение из файла меток может быть использовано для локализации гранулы 176 внутри распакованных данных.

ClickHouse необходимо локализовать (и передать все значения из) гранулы 176 как из файла данных UserID.bin, так и из файла данных URL.bin с целью выполнения нашего примерного запроса (10 наиболее кликаемых URL для пользователя интернета с UserID 749.927.693).

Диаграмма выше показывает, как ClickHouse локализует гранулу для файла данных UserID.bin.

Параллельно ClickHouse делает то же самое для гранулы 176 для файла данных URL.bin. Две соответствующие гранулы выравниваются и передаются в движок ClickHouse для дальнейшей обработки, то есть агрегации и подсчёта значений URL в каждой группе для всех строк, где UserID равен 749.927.693, прежде чем наконец выводить 10 самых больших групп URL по убыванию количества.

## Использование нескольких первичных индексов {#using-multiple-primary-indexes}

<a name="filtering-on-key-columns-after-the-first"></a>
### Вторичные ключевые столбцы могут (не) быть неэффективными {#secondary-key-columns-can-not-be-inefficient}

Когда запрос фильтрует по столбцу, который является частью составного ключа и является первым ключевым столбцом, [тогда ClickHouse выполняет бинарный алгоритм поиска по меткам индекса этого ключевого столбца](#the-primary-index-is-used-for-selecting-granules).

Но что происходит, когда запрос фильтрует по столбцу, который является частью составного ключа, но не является первым ключевым столбцом?

:::note
Мы обсуждаем сценарий, когда запрос явно не фильтрует по первому ключевому столбцу, а по вторичному ключевому столбцу.

Когда запрос фильтрует как по первому ключевому столбцу, так и по любым ключевым столбцам после первого, то ClickHouse выполняет бинарный поиск по меткам индекса первого ключевого столбца.
:::

<br/>
<br/>

<a name="query-on-url"></a>
Мы используем запрос, который вычисляет 10 пользователей, которые чаще всего кликали по URL "http://public_search":

```sql
SELECT UserID, count(UserID) AS Count
FROM hits_UserID_URL
WHERE URL = 'http://public_search'
GROUP BY UserID
ORDER BY Count DESC
LIMIT 10;
```

Ответ: <a name="query-on-url-slow"></a>
```response
┌─────UserID─┬─Count─┐
│ 2459550954 │  3741 │
│ 1084649151 │  2484 │
│  723361875 │   729 │
│ 3087145896 │   695 │
│ 2754931092 │   672 │
│ 1509037307 │   582 │
│ 3085460200 │   573 │
│ 2454360090 │   556 │
│ 3884990840 │   539 │
│  765730816 │   536 │
└────────────┴───────┘

10 строк в наборе. Время исполнения: 0.086 сек.

# highlight-next-line
Обработано 8.81 миллиона строк,
799.69 МБ (102.11 миллиона строк/сек., 9.27 ГБ/сек.)
```

Вывод клиента указывает на то, что ClickHouse почти выполнил полное сканирование таблицы, несмотря на то, что [столбец URL является частью составного первичного ключа](#a-table-with-a-primary-key)! ClickHouse читает 8.81 миллиона строк из 8.87 миллиона строк таблицы.

Если [trace_logging](/operations/server-configuration-parameters/settings#logger) включено, то файл логов сервера ClickHouse показывает, что ClickHouse использовал <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1444" target="_blank">обычный алгоритм исключения поиска</a> по 1083 меткам индекса URL для определения тех гранул, которые могут содержать строки со значением столбца URL равным "http://public_search":
```response
...Executor): Условие ключа: (столбец 1 в ['http://public_search',
                                           'http://public_search'])

# highlight-next-line
...Executor): Используется обычный алгоритм исключения поиска по индексу для части all_1_9_2
              с 1537 шагами
...Executor): Выбраны 1/1 частей по ключу партиции, 1 часть по первичному ключу,

# highlight-next-line
              1076/1083 меток по первичному ключу, 1076 меток для чтения из 5 диапазонов
...Executor): Чтение примерно 8814592 строк с 10 потоками
```
Мы видим в приведенном примере трассировочного лога выше, что 1076 (по меткам) из 1083 гранул были выбраны как потенциально содержащие строки со значением URL, совпадающим с указанным.

Это приводит к тому, что 8.81 миллиона строк были переданы в движок ClickHouse (параллельно с использованием 10 потоков), чтобы определить строки, которые на самом деле содержат значение URL "http://public_search".

Тем не менее, как мы увидим позже, только 39 гранул из этих выбранных 1076 гранул фактически содержат соответствующие строки.

Хотя первичный индекс на основе составного первичного ключа (UserID, URL) был очень полезен для ускорения запросов, фильтрующих строки с конкретным значением UserID, индекс не предоставляет значительной помощи в ускорении запроса, который фильтрует строки с конкретным значением URL.

Причина этого в том, что столбец URL не является первым ключевым столбцом, и поэтому ClickHouse использует обычный алгоритм исключения поиска (вместо бинарного поиска) по меткам индекса столбца URL, и **эффективность этого алгоритма зависит от разницы в кардинальности** между столбцом URL и его предшествующим ключевым столбцом UserID.

Чтобы проиллюстрировать это, мы приведем некоторые детали о том, как работает алгоритм общего исключения поиска.

<a name="generic-exclusion-search-algorithm"></a>
### Алгоритм общего исключения поиска {#generic-exclusion-search-algorithm}

Следующее иллюстрирует, как работает <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1438" target="_blank">алгоритм общего исключения поиска ClickHouse</a>, когда гранулы выбираются через вторичный столбец, у которого предшествующий ключевой столбец имеет низкую или высокую кардинальность.

В качестве примера для обеих ситуаций мы будем предполагать:
- запрос, который ищет строки со значением URL = "W3".
- абстрактная версия нашей таблицы hits с упрощенными значениями для UserID и URL.
- тот же составной первичный ключ (UserID, URL) для индекса. Это означает, что строки сначала упорядочиваются по значениям UserID. Строки с одинаковым значением UserID затем упорядочиваются по URL.
- размер гранулы равен двум, т.е. каждая гранула содержит две строки.

Мы отметили значения ключевых столбцов для первых строк таблицы для каждой гранулы оранжевым цветом на диаграммах ниже.

**Предшествующий ключевой столбец имеет низкую кардинальность**<a name="generic-exclusion-search-fast"></a>

Предположим, что UserID имеет низкую кардинальность. В этом случае маловероятно, что одно и то же значение UserID встречается в нескольких строках таблицы и гранулах, и, следовательно, в метках индекса. Для меток индекса с одинаковым UserID значения URL для меток индекса сортируются в порядке возрастания (поскольку строки таблицы сначала упорядочены по UserID, а затем по URL). Это позволяет эффективно фильтровать, как показано ниже:

<Image img={sparsePrimaryIndexes07} size="md" alt="Sparse Primary Indices 06" background="white"/>

Там есть три различных сценария для процесса выбора гранул для наших абстрактных образцов данных на диаграмме выше:

1.  Метка индекса 0, для которой **значение URL меньше W3 и значение URL напрямую следующей метки также меньше W3** может быть исключена, потому что метки 0 и 1 имеют одинаковое значение UserID. Обратите внимание, что это условие исключения гарантирует, что гранула 0 полностью состоит из значений UserID U1, так что ClickHouse может предположить, что также максимальное значение URL в грануле 0 меньше W3 и исключить гранулу.

2. Метка индекса 1, для которой **значение URL меньше (или равно) W3 и значение URL напрямую следующей метки больше (или равно) W3** выбрана, так как это означает, что гранула 1 может потенциально содержать строки со значением URL W3.

3. Метки индекса 2 и 3, для которых **значение URL больше W3**, могут быть исключены, поскольку метки индекса первичного индекса хранят значения ключевых столбцов для первой строки таблицы для каждой гранулы, и строки таблицы сортируются на диске по значениям ключевых столбцов, поэтому гранулы 2 и 3 не могут потенциально содержать значение W3.

**Предшествующий ключевой столбец имеет высокую кардинальность**<a name="generic-exclusion-search-slow"></a>

Когда UserID имеет высокую кардинальность, маловероятно, что одно и то же значение UserID встречается в нескольких строках таблицы и гранулах. Это означает, что значения URL для меток индекса не монотонно увеличиваются:

<Image img={sparsePrimaryIndexes08} size="md" alt="Sparse Primary Indices 06" background="white"/>

Как мы видим на диаграмме выше, все показанные метки, значения URL которых меньше W3, выбираются для передачи строк, связанных с их гранулами, в движок ClickHouse.

Это происходит потому, что хотя все метки индекса на диаграмме попадают в сценарий 1, описанный выше, они не соответствуют указанному условию исключения, согласно которому *непосредственно следующая метка имеет такое же значение UserID, как и текущая метка*, и таким образом не могут быть исключены.

Например, рассматривая метку индекса 0, для которой **значение URL меньше W3 и значение URL непосредственно следующей метки также меньше W3**. Это *не* может быть исключено, потому что непосредственно следующая метка 1 *не* имеет такое же значение UserID, как и текущая метка 0.

Это в конечном итоге мешает ClickHouse делать предположения о максимальном значении URL в грануле 0. Вместо этого он должен предположить, что гранула 0 потенциально содержит строки со значением URL W3 и вынужден выбрать метку 0.

Тот же сценарий верен для меток 1, 2 и 3.

:::note Заключение
Алгоритм <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1444" target="_blank">общего исключения поиска</a>, который использует ClickHouse вместо <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1452" target="_blank">алгоритма бинарного поиска</a>, когда запрос фильтрует по столбцу, который является частью составного ключа, но не является первым ключевым столбцом, наиболее эффективен, когда предшествующий ключевой столбец имеет низкую кардинальность.
:::

В нашем наборе образцов данные оба ключевых столбца (UserID, URL) имеют схожую высокую кардинальность, и, как объяснено, алгоритм общего исключения поиска не очень эффективен, когда предшествующий ключевой столбец столбца URL имеет высокую или аналогичную кардинальность.
### Заметка о индексе пропуска данных {#note-about-data-skipping-index}

Из-за аналогично высокой кардинальности UserID и URL наш [фильтр запросов по URL](/guides/best-practices/sparse-primary-indexes#secondary-key-columns-can-not-be-inefficient) также не принесет много пользы от создания [вторичного индекса пропуска данных](./skipping-indexes.md) по колонке URL в нашем [таблице с составным первичным ключом (UserID, URL)](#a-table-with-a-primary-key).

Например, следующие два оператора создают и заполняют [индекс minmax](/engines/table-engines/mergetree-family/mergetree.md/#primary-keys-and-indexes-in-queries) пропуска данных по колонке URL нашей таблицы:
```sql
ALTER TABLE hits_UserID_URL ADD INDEX url_skipping_index URL TYPE minmax GRANULARITY 4;
ALTER TABLE hits_UserID_URL MATERIALIZE INDEX url_skipping_index;
```
Теперь ClickHouse создал дополнительный индекс, который хранит - на каждую группу из 4 последовательных [гранул](#data-is-organized-into-granules-for-parallel-data-processing) (обратите внимание на условие `GRANULARITY 4` в операторе `ALTER TABLE` выше) - минимальное и максимальное значение URL:

<Image img={sparsePrimaryIndexes13a} size="md" alt="Sparse Primary Indices 13a" background="white"/>

Первая запись индекса (‘метка 0’ на диаграмме выше) хранит минимальные и максимальные значения URL для [строк, принадлежащих первым 4 гранулам нашей таблицы](#data-is-organized-into-granules-for-parallel-data-processing).

Вторая запись индекса (‘метка 1’) хранит минимальные и максимальные значения URL для строк, принадлежащих следующим 4 гранулам нашей таблицы, и так далее.

(ClickHouse также создал специальный [файл меток](#mark-files-are-used-for-locating-granules) для индекса пропуска данных для [локализации](#mark-files-are-used-for-locating-granules) групп гранул, связанных с метками индекса.)

Из-за аналогично высокой кардинальности UserID и URL этот вторичный индекс пропуска данных не может помочь в исключении гранул из выборки при выполнении нашего [фильтра запроса по URL](/guides/best-practices/sparse-primary-indexes#secondary-key-columns-can-not-be-inefficient).

Конкретное значение URL, которое ищет запрос (т.е. 'http://public_search'), вероятно, находится между минимальным и максимальным значением, хранящимся индексом для каждой группы гранул, что приводит к тому, что ClickHouse вынужден выбирать группу гранул (поскольку они могут содержать строку(и), соответствующую запросу).

### Необходимость использования нескольких первичных индексов {#a-need-to-use-multiple-primary-indexes}

В результате, если мы хотим значительно ускорить наш пример запроса, который фильтрует строки с конкретным URL, нам необходимо использовать первичный индекс, оптимизированный для этого запроса.

Если мы дополнительно хотим сохранить хорошую производительность нашего примера запроса, который фильтрует строки с конкретным UserID, нам необходимо использовать несколько первичных индексов.

Следующее показывает способы достижения этого.

<a name="multiple-primary-indexes"></a>
### Варианты создания дополнительных первичных индексов {#options-for-creating-additional-primary-indexes}

Если мы хотим значительно ускорить оба наших примера запросов - один, который фильтрует строки с конкретным UserID, и другой, который фильтрует строки с конкретным URL - нам необходимо использовать несколько первичных индексов, выбрав один из следующих трех вариантов:

- Создание **второй таблицы** с другим первичным ключом.
- Создание **материализованного представления** на нашей существующей таблице.
- Добавление **проекции** к нашей существующей таблице.

Все три варианта эффективно дублируют наши исходные данные в дополнительную таблицу, чтобы реорганизовать первичный индекс таблицы и порядок сортировки строк.

Однако три варианта различаются по тому, насколько прозрачна эта дополнительная таблица для пользователя с точки зрения маршрутизации запросов и операторов вставки.

При создании **второй таблицы** с другим первичным ключом запросы должны быть явно отправлены в версию таблицы, наиболее подходящую для запроса, а новые данные должны быть явно вставлены в обе таблицы, чтобы поддерживать их синхронизированными:

<Image img={sparsePrimaryIndexes09a} size="md" alt="Sparse Primary Indices 09a" background="white"/>

С помощью **материализованного представления** дополнительная таблица создается неявно, и данные автоматически синхронизируются между обеими таблицами:

<Image img={sparsePrimaryIndexes09b} size="md" alt="Sparse Primary Indices 09b" background="white"/>

А **проекция** - самый прозрачный вариант, поскольку помимо автоматического поддержания неявно созданной (и скрытой) дополнительной таблицы в синхронизации с изменениями данных, ClickHouse автоматически выберет наиболее эффективную версию таблицы для запросов:

<Image img={sparsePrimaryIndexes09c} size="md" alt="Sparse Primary Indices 09c" background="white"/>

В следующем мы обсуждаем эти три варианта создания и использования нескольких первичных индексов более подробно и с реальными примерами.

<a name="multiple-primary-indexes-via-secondary-tables"></a>
### Вариант 1: Вторичные таблицы {#option-1-secondary-tables}

<a name="secondary-table"></a>
Мы создаем новую дополнительную таблицу, в которой меняем порядок ключевых колонок (по сравнению с нашей оригинальной таблицей) в первичном ключе:

```sql
CREATE TABLE hits_URL_UserID
(
    `UserID` UInt32,
    `URL` String,
    `EventTime` DateTime
)
ENGINE = MergeTree
-- highlight-next-line
PRIMARY KEY (URL, UserID)
ORDER BY (URL, UserID, EventTime)
SETTINGS index_granularity = 8192, index_granularity_bytes = 0, compress_primary_key = 0;
```

Вставляем все 8.87 миллионов строк из нашей [оригинальной таблицы](#a-table-with-a-primary-key) в дополнительную таблицу:

```sql
INSERT INTO hits_URL_UserID
SELECT * from hits_UserID_URL;
```

Ответ выглядит так:

```response
Ok.

0 rows in set. Elapsed: 2.898 sec. Processed 8.87 million rows, 838.84 MB (3.06 million rows/s., 289.46 MB/s.)
```

И, наконец, оптимизируем таблицу:
```sql
OPTIMIZE TABLE hits_URL_UserID FINAL;
```

Поскольку мы поменяли порядок колонок в первичном ключе, вставленные строки теперь хранятся на диске в другом лексикографическом порядке (по сравнению с нашей [оригинальной таблицей](#a-table-with-a-primary-key)), и, следовательно, 1083 гранулы этой таблицы содержат разные значения, чем прежде:

<Image img={sparsePrimaryIndexes10} size="md" alt="Sparse Primary Indices 10" background="white"/>

Это результирующий первичный ключ:

<Image img={sparsePrimaryIndexes11} size="md" alt="Sparse Primary Indices 11" background="white"/>

Теперь его можно использовать для значительного ускорения выполнения нашего примерного запроса, фильтрующего по колонке URL, чтобы посчитать топ-10 пользователей, которые чаще всего кликали по URL "http://public_search":
```sql
SELECT UserID, count(UserID) AS Count
-- highlight-next-line
FROM hits_URL_UserID
WHERE URL = 'http://public_search'
GROUP BY UserID
ORDER BY Count DESC
LIMIT 10;
```

Ответ будет:
<a name="query-on-url-fast"></a>

```response
┌─────UserID─┬─Count─┐
│ 2459550954 │  3741 │
│ 1084649151 │  2484 │
│  723361875 │   729 │
│ 3087145896 │   695 │
│ 2754931092 │   672 │
│ 1509037307 │   582 │
│ 3085460200 │   573 │
│ 2454360090 │   556 │
│ 3884990840 │   539 │
│  765730816 │   536 │
└────────────┴───────┘

10 rows in set. Elapsed: 0.017 sec.

# highlight-next-line
Processed 319.49 thousand rows,
11.38 MB (18.41 million rows/s., 655.75 MB/s.)
```

Теперь, вместо [почти полного сканирования таблицы](/guides/best-practices/sparse-primary-indexes#efficient-filtering-on-secondary-key-columns), ClickHouse выполняет этот запрос гораздо эффективнее.

С первичным индексом из [оригинальной таблицы](#a-table-with-a-primary-key), где UserID был первым, а URL вторым ключевым столбцом, ClickHouse использовал [алгоритм обобщенного исключения](/guides/best-practices/sparse-primary-indexes#generic-exclusion-search-algorithm) для выполнения этого запроса, что было не очень эффективно из-за аналогично высокой кардинальности UserID и URL.

Теперь, когда URL находится в первой колонке первичного индекса, ClickHouse выполняет <a href="https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1452" target="_blank">двойной поиск</a> по меткам индекса.
Соответствующая запись в журнале трассировки в файле журнала сервера ClickHouse подтверждает это:
```response
...Executor): Key condition: (column 0 in ['http://public_search',
                                           'http://public_search'])

# highlight-next-line
...Executor): Running binary search on index range for part all_1_9_2 (1083 marks)
...Executor): Found (LEFT) boundary mark: 644
...Executor): Found (RIGHT) boundary mark: 683
...Executor): Found continuous range in 19 steps
...Executor): Selected 1/1 parts by partition key, 1 parts by primary key,

# highlight-next-line
              39/1083 marks by primary key, 39 marks to read from 1 ranges
...Executor): Reading approx. 319488 rows with 2 streams
```
ClickHouse выбрал только 39 меток индекса, вместо 1076, когда использовался обобщенный поиск исключений.

Обратите внимание, что дополнительная таблица оптимизирована для ускорения выполнения нашего примерного запроса, фильтрующего по URL.

Похожие по [плохой производительности](/guides/best-practices/sparse-primary-indexes#secondary-key-columns-can-not-be-inefficient) запросы с нашей [оригинальной таблицей](#a-table-with-a-primary-key) не будут работать очень эффективно с новой дополнительной таблицей, поскольку UserID теперь является вторым ключевым столбцом в первичном индексе этой таблицы, и следовательно ClickHouse использует обобщенный поиск исключений для выбора гранул, что [не очень эффективно для аналогично высокой кардинальности](/guides/best-practices/sparse-primary-indexes#generic-exclusion-search-algorithm) UserID и URL.
Откройте подробности для получения информации.

<details>
    <summary>
    Запросы, фильтрующие по UserIDs, теперь имеют плохую производительность<a name="query-on-userid-slow"></a>
    </summary>
    <p>

```sql
SELECT URL, count(URL) AS Count
FROM hits_URL_UserID
WHERE UserID = 749927693
GROUP BY URL
ORDER BY Count DESC
LIMIT 10;
```

Ответ будет:

```response
┌─URL────────────────────────────┬─Count─┐
│ http://auto.ru/chatay-barana.. │   170 │
│ http://auto.ru/chatay-id=371...│    52 │
│ http://public_search           │    45 │
│ http://kovrik-medvedevushku-...│    36 │
│ http://forumal                 │    33 │
│ http://korablitz.ru/L_1OFFER...│    14 │
│ http://auto.ru/chatay-id=371...│    14 │
│ http://auto.ru/chatay-john-D...│    13 │
│ http://auto.ru/chatay-john-D...│    10 │
│ http://wot/html?page/23600_m...│     9 │
└────────────────────────────────┴───────┘

10 rows in set. Elapsed: 0.024 sec.

# highlight-next-line
Processed 8.02 million rows,
73.04 MB (340.26 million rows/s., 3.10 GB/s.)
```

Журнал сервера:
```response
...Executor): Key condition: (column 1 in [749927693, 749927693])

# highlight-next-line
...Executor): Used generic exclusion search over index for part all_1_9_2
              with 1453 steps
...Executor): Selected 1/1 parts by partition key, 1 parts by primary key,

# highlight-next-line
              980/1083 marks by primary key, 980 marks to read from 23 ranges
...Executor): Reading approx. 8028160 rows with 10 streams
```
</p>
</details>

Теперь у нас есть две таблицы. Оптимизированные для ускорения запросов, фильтрующих по `UserIDs`, и для ускорения запросов, фильтрующих по URL соответственно:

### Вариант 2: Материализованные представления {#option-2-materialized-views}

Создайте [материализованное представление](/sql-reference/statements/create/view.md) на нашей существующей таблице.
```sql
CREATE MATERIALIZED VIEW mv_hits_URL_UserID
ENGINE = MergeTree()
PRIMARY KEY (URL, UserID)
ORDER BY (URL, UserID, EventTime)
POPULATE
AS SELECT * FROM hits_UserID_URL;
```

Ответ будет выглядеть так:

```response
Ok.

0 rows in set. Elapsed: 2.935 sec. Processed 8.87 million rows, 838.84 MB (3.02 million rows/s., 285.84 MB/s.)
```

:::note
- мы меняем порядок ключевых колонок (по сравнению с нашей [оригинальной таблицей](#a-table-with-a-primary-key)) в первичном ключе представления
- материализованное представление основывается на **неявно созданной таблице**, порядок строк и первичный индекс которой основаны на заданном определении первичного ключа
- неявно созданная таблица отображается в запросе `SHOW TABLES` и имеет имя, начинающееся с `.inner`
- также возможно сначала явно создать вспомогательную таблицу для материализованного представления, а затем представление может целиться в эту таблицу через [клаузу](/sql-reference/statements/create/view.md) `TO [db].[table]`
- мы используем ключевое слово `POPULATE`, чтобы немедленно заполнить неявно созданную таблицу всеми 8.87 миллионами строк из исходной таблицы [hits_UserID_URL](#a-table-with-a-primary-key)
- если в исходную таблицу hits_UserID_URL вставляются новые строки, то эти строки также автоматически вставляются в неявно созданную таблицу
- На самом деле неявно созданная таблица имеет такой же порядок строк и первичный индекс, как и [вторичная таблица, созданная явно](/guides/best-practices/sparse-primary-indexes#option-1-secondary-tables):

<Image img={sparsePrimaryIndexes12b1} size="md" alt="Sparse Primary Indices 12b1" background="white"/>

ClickHouse хранит [файлы данных колонок](#data-is-stored-on-disk-ordered-by-primary-key-columns) (*.bin), [файлы меток](#mark-files-are-used-for-locating-granules) (*.mrk2) и [первичный индекс](#the-primary-index-has-one-entry-per-granule) (primary.idx) неявно созданной таблицы в специальной папке в каталоге данных сервера ClickHouse:

<Image img={sparsePrimaryIndexes12b2} size="md" alt="Sparse Primary Indices 12b2" background="white"/>

:::

Теперь неявно созданную таблицу (и ее первичный индекс), поддерживающую материализованное представление, можно использовать для значительного ускорения выполнения нашего примерного запроса, фильтрующего по колонке URL:
```sql
SELECT UserID, count(UserID) AS Count
-- highlight-next-line
FROM mv_hits_URL_UserID
WHERE URL = 'http://public_search'
GROUP BY UserID
ORDER BY Count DESC
LIMIT 10;
```

Ответ будет:

```response
┌─────UserID─┬─Count─┐
│ 2459550954 │  3741 │
│ 1084649151 │  2484 │
│  723361875 │   729 │
│ 3087145896 │   695 │
│ 2754931092 │   672 │
│ 1509037307 │   582 │
│ 3085460200 │   573 │
│ 2454360090 │   556 │
│ 3884990840 │   539 │
│  765730816 │   536 │
└────────────┴───────┘

10 rows in set. Elapsed: 0.026 sec.

# highlight-next-line
Processed 335.87 thousand rows,
13.54 MB (12.91 million rows/s., 520.38 MB/s.)
```

Поскольку фактически неявно созданная таблица (и ее первичный индекс), поддерживающий материализованное представление, идентичны [вторичной таблице, созданной явно](/guides/best-practices/sparse-primary-indexes#option-1-secondary-tables), запрос выполняется так же эффективно, как и с явно созданной таблицей.

Соответствующая запись в журнале трассировки в файле журнала сервера ClickHouse подтверждает, что ClickHouse выполняет двоичный поиск по меткам индекса:

```response
...Executor): Key condition: (column 0 in ['http://public_search',
                                           'http://public_search'])

# highlight-next-line
...Executor): Running binary search on index range ...
...
...Executor): Selected 4/4 parts by partition key, 4 parts by primary key,

# highlight-next-line
              41/1083 marks by primary key, 41 marks to read from 4 ranges
...Executor): Reading approx. 335872 rows with 4 streams
```
### Вариант 3: Проекции {#option-3-projections}

Создайте проекцию в нашей существующей таблице:
```sql
ALTER TABLE hits_UserID_URL
    ADD PROJECTION prj_url_userid
    (
        SELECT *
        ORDER BY (URL, UserID)
    );
```

И материализуйте проекцию:
```sql
ALTER TABLE hits_UserID_URL
    MATERIALIZE PROJECTION prj_url_userid;
```

:::note
- проекция создает **скрытую таблицу**, порядок строк и первичный индекс которой основаны на заданном предложении `ORDER BY` проекции
- скрытая таблица не отображается в запросе `SHOW TABLES`
- мы используем ключевое слово `MATERIALIZE`, чтобы немедленно заполнить скрытую таблицу всеми 8.87 миллионами строк из исходной таблицы [hits_UserID_URL](#a-table-with-a-primary-key)
- если в исходную таблицу hits_UserID_URL вставляются новые строки, то эти строки также автоматически вставляются в скрытую таблицу
- запрос всегда (синтаксически) нацеливается на исходную таблицу hits_UserID_URL, но если порядок строк и первичный индекс скрытой таблицы позволяют более эффективное выполнение запроса, то будет использована эта скрытая таблица
- обратите внимание, что проекции не делают запросы, использующие ORDER BY, более эффективными, даже если ORDER BY совпадает с утверждением ORDER BY проекции (смотрите https://github.com/ClickHouse/ClickHouse/issues/47333)
- На самом деле неявно созданная скрытая таблица имеет такой же порядок строк и первичный индекс, как и [вторичная таблица, созданная явно](/guides/best-practices/sparse-primary-indexes#option-1-secondary-tables):

<Image img={sparsePrimaryIndexes12c1} size="md" alt="Sparse Primary Indices 12c1" background="white"/>

ClickHouse хранит [файлы данных колонок](#data-is-stored-on-disk-ordered-by-primary-key-columns) (*.bin), [файлы меток](#mark-files-are-used-for-locating-granules) (*.mrk2) и [первичный индекс](#the-primary-index-has-one-entry-per-granule) (primary.idx) скрытой таблицы в специальной папке (выделенной оранжевым цветом на скриншоте ниже) рядом с файлами данных исходной таблицы, файлами меток и файлами первичных индексов:

<Image img={sparsePrimaryIndexes12c2} size="sm" alt="Sparse Primary Indices 12c2" background="white"/>

:::

Скрытая таблица (и ее первичный индекс), созданные проекцией, теперь могут (неявно) использоваться для значительного ускорения выполнения нашего примерного запроса, фильтрующего по колонке URL. Обратите внимание, что запрос синтаксически нацеливается на исходную таблицу проекции.
```sql
SELECT UserID, count(UserID) AS Count
-- highlight-next-line
FROM hits_UserID_URL
WHERE URL = 'http://public_search'
GROUP BY UserID
ORDER BY Count DESC
LIMIT 10;
```

Ответ будет:

```response
┌─────UserID─┬─Count─┐
│ 2459550954 │  3741 │
│ 1084649151 │  2484 │
│  723361875 │   729 │
│ 3087145896 │   695 │
│ 2754931092 │   672 │
│ 1509037307 │   582 │
│ 3085460200 │   573 │
│ 2454360090 │   556 │
│ 3884990840 │   539 │
│  765730816 │   536 │
└────────────┴───────┘

10 rows in set. Elapsed: 0.029 sec.

# highlight-next-line
Processed 319.49 thousand rows, 1
1.38 MB (11.05 million rows/s., 393.58 MB/s.)
```

Поскольку фактически скрытая таблица (и ее первичный индекс), созданная проекцией, идентична [вторичной таблице, созданной явно](/guides/best-practices/sparse-primary-indexes#option-1-secondary-tables), запрос выполняется так же эффективно, как и с явно созданной таблицей.

Соответствующая запись в журнале трассировки в файле журнала сервера ClickHouse подтверждает, что ClickHouse выполняет двоичный поиск по меткам индекса:


```response
...Executor): Key condition: (column 0 in ['http://public_search',
                                           'http://public_search'])

# highlight-next-line
...Executor): Running binary search on index range for part prj_url_userid (1083 marks)
...Executor): ...

# highlight-next-line
...Executor): Choose complete Normal projection prj_url_userid
...Executor): projection required columns: URL, UserID
...Executor): Selected 1/1 parts by partition key, 1 parts by primary key,

# highlight-next-line
              39/1083 marks by primary key, 39 marks to read from 1 ranges
...Executor): Reading approx. 319488 rows with 2 streams
```
### Резюме {#summary}

Первичный индекс нашей [таблицы с составным первичным ключом (UserID, URL)](#a-table-with-a-primary-key) был очень полезен для ускорения [запроса, фильтрующего по UserID](#the-primary-index-is-used-for-selecting-granules). Но этот индекс не предоставляет значительной помощи в ускорении [запроса, фильтрующего по URL](/guides/best-practices/sparse-primary-indexes#secondary-key-columns-can-not-be-inefficient), несмотря на то, что колонка URL является частью составного первичного ключа.

И наоборот:
Первичный индекс нашей [таблицы с составным первичным ключом (URL, UserID)](/guides/best-practices/sparse-primary-indexes#option-1-secondary-tables) ускорял [запрос, фильтрующий по URL](/guides/best-practices/sparse-primary-indexes#secondary-key-columns-can-not-be-inefficient), но не предоставлял много поддержки [запросу, фильтрующему по UserID](#the-primary-index-is-used-for-selecting-granules).

Из-за аналогично высокой кардинальности столбцов первичного ключа UserID и URL запрос, который фильтрует по второму ключевому столбцу, [не приносит много пользы от второго ключевого столбца, который находится в индексе](#generic-exclusion-search-algorithm).

Поэтому имеет смысл удалить второй ключевой столбец из первичного индекса (что приводит к меньшему потреблению памяти индекса) и [использовать несколько первичных индексов](/guides/best-practices/sparse-primary-indexes#using-multiple-primary-indexes) вместо этого.

Однако, если ключевые столбцы в составном первичном ключе имеют большие различия в кардинальности, то [это выгодно для запросов](/guides/best-practices/sparse-primary-indexes#generic-exclusion-search-algorithm) упорядочивать ключевые столбцы по кардинальности в порядке возрастания.

Чем больше разница в кардинальности между ключевыми столбцами, тем больше значение порядка этих столбцов в ключе. Мы продемонстрируем это в следующем разделе.

## Эффективная сортировка ключевых колонок {#ordering-key-columns-efficiently}

<a name="test"></a>

В составном первичном ключе порядок ключевых колонок может значительно влиять как на:
- эффективность фильтрации по вторичным ключевым колонкам в запросах, так и
- коэффициент сжатия для файлов данных таблицы.

Чтобы это продемонстрировать, мы будем использовать версию нашего [набора данных о веб-трафике](#data-set), где каждая строка содержит три колонки, которые указывают на то, было ли обращение интернет 'пользователя' (`UserID` колонка) к URL (`URL` колонка) помечено как трафик от ботов (`IsRobot` колонка).

Мы будем использовать составной первичный ключ, содержащий все три упомянутые колонки, который может быть использован для ускорения типичных запросов веб-аналитики, которые вычисляют
- сколько (процент) трафика к конкретному URL приходит от ботов или
- насколько уверены мы, что конкретный пользователь (не) является ботом (каков процент трафика от этого пользователя (не) предполагается как трафик от бота)

Мы используем этот запрос для вычисления кардинальностей трех колонок, которые мы хотим использовать в качестве ключевых колонок в составном первичном ключе (обратите внимание, что мы используем [табличную функцию URL](/sql-reference/table-functions/url.md) для выборки данных TSV по требованию без необходимости создания локальной таблицы). Запустите этот запрос в `clickhouse client`:
```sql
SELECT
    formatReadableQuantity(uniq(URL)) AS cardinality_URL,
    formatReadableQuantity(uniq(UserID)) AS cardinality_UserID,
    formatReadableQuantity(uniq(IsRobot)) AS cardinality_IsRobot
FROM
(
    SELECT
        c11::UInt64 AS UserID,
        c15::String AS URL,
        c20::UInt8 AS IsRobot
    FROM url('https://datasets.clickhouse.com/hits/tsv/hits_v1.tsv.xz')
    WHERE URL != ''
)
```
Ответ будет:
```response
┌─cardinality_URL─┬─cardinality_UserID─┬─cardinality_IsRobot─┐
│ 2.39 million    │ 119.08 thousand    │ 4.00                │
└─────────────────┴────────────────────┴─────────────────────┘

1 row in set. Elapsed: 118.334 sec. Processed 8.87 million rows, 15.88 GB (74.99 thousand rows/s., 134.21 MB/s.)
```

Мы видим, что существует большая разница между кардинальностями, особенно между колонками `URL` и `IsRobot`, и поэтому порядок этих колонок в составном первичном ключе значителен как для эффективного ускорения запросов, фильтрующих по этим колонкам, так и для достижения оптимальных коэффициентов сжатия для файлов данных столбцов таблицы.

Чтобы продемонстрировать это, мы создаем две версии таблицы для нашего анализа трафика от ботов:
- таблицу `hits_URL_UserID_IsRobot` с составным первичным ключом `(URL, UserID, IsRobot)`, где мы упорядочиваем ключевые колонки по кардинальности в порядке убывания
- таблицу `hits_IsRobot_UserID_URL` с составным первичным ключом `(IsRobot, UserID, URL)`, где мы упорядочиваем ключевые колонки по кардинальности в порядке возрастания

Создайте таблицу `hits_URL_UserID_IsRobot` с составным первичным ключом `(URL, UserID, IsRobot)`:
```sql
CREATE TABLE hits_URL_UserID_IsRobot
(
    `UserID` UInt32,
    `URL` String,
    `IsRobot` UInt8
)
ENGINE = MergeTree
-- highlight-next-line
PRIMARY KEY (URL, UserID, IsRobot);
```

И заполните ее 8.87 миллионами строк:
```sql
INSERT INTO hits_URL_UserID_IsRobot SELECT
    intHash32(c11::UInt64) AS UserID,
    c15 AS URL,
    c20 AS IsRobot
FROM url('https://datasets.clickhouse.com/hits/tsv/hits_v1.tsv.xz')
WHERE URL != '';
```
Это ответ:
```response
0 rows in set. Elapsed: 104.729 sec. Processed 8.87 million rows, 15.88 GB (84.73 thousand rows/s., 151.64 MB/s.)
```

Далее создайте таблицу `hits_IsRobot_UserID_URL` с составным первичным ключом `(IsRobot, UserID, URL)`:
```sql
CREATE TABLE hits_IsRobot_UserID_URL
(
    `UserID` UInt32,
    `URL` String,
    `IsRobot` UInt8
)
ENGINE = MergeTree
-- highlight-next-line
PRIMARY KEY (IsRobot, UserID, URL);
```
И заполните ее теми же 8.87 миллионами строк, которые мы использовали для заполнения предыдущей таблицы:

```sql
INSERT INTO hits_IsRobot_UserID_URL SELECT
    intHash32(c11::UInt64) AS UserID,
    c15 AS URL,
    c20 AS IsRobot
FROM url('https://datasets.clickhouse.com/hits/tsv/hits_v1.tsv.xz')
WHERE URL != '';
```
Ответ будет:
```response
0 rows in set. Elapsed: 95.959 sec. Processed 8.87 million rows, 15.88 GB (92.48 thousand rows/s., 165.50 MB/s.)
```
### Эффективная фильтрация по вторичным ключевым колонкам {#efficient-filtering-on-secondary-key-columns}

Когда запрос фильтрует по хотя бы одной колонке, которая является частью составного ключа, и это первый ключевой столбец, [тогда ClickHouse выполняет двоичный поиск по меткам индекса ключевого столбца](#the-primary-index-is-used-for-selecting-granules).

Когда запрос фильтрует (только) по колонке, которая является частью составного ключа, но не является первым ключевым столбцом, [тогда ClickHouse использует алгоритм обобщенного исключения по меткам индекса ключевого столбца](/guides/best-practices/sparse-primary-indexes#secondary-key-columns-can-not-be-inefficient).

Для второго случая порядок ключевых колонок в составном первичном ключе значителен для эффективности [алгоритма обобщенного исключения](https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1444).

Это запрос, который фильтрует по колонке `UserID` таблицы, где мы упорядочили ключевые колонки `(URL, UserID, IsRobot)` по кардинальности в порядке убывания:
```sql
SELECT count(*)
FROM hits_URL_UserID_IsRobot
WHERE UserID = 112304
```
Ответ будет:
```response
┌─count()─┐
│      73 │
└─────────┘

1 row in set. Elapsed: 0.026 sec.

# highlight-next-line
Processed 7.92 million rows,
31.67 MB (306.90 million rows/s., 1.23 GB/s.)
```

Это тот же запрос по таблице, где мы упорядочили ключевые колонки `(IsRobot, UserID, URL)` по кардинальности в порядке возрастания:
```sql
SELECT count(*)
FROM hits_IsRobot_UserID_URL
WHERE UserID = 112304
```
Ответ будет:
```response
┌─count()─┐
│      73 │
└─────────┘

1 row in set. Elapsed: 0.003 sec.

# highlight-next-line
Processed 20.32 thousand rows,
81.28 KB (6.61 million rows/s., 26.44 MB/s.)
```

Мы видим, что выполнение запроса значительно более эффективно и быстрее на таблице, где мы упорядочили ключевые колонки по кардинальности в порядке возрастания.

Причина в том, что [алгоритм обобщенного исключения](https://github.com/ClickHouse/ClickHouse/blob/22.3/src/Storages/MergeTree/MergeTreeDataSelectExecutor.cpp#L1444) работает наиболее эффективно, когда [гранулы](#the-primary-index-is-used-for-selecting-granules) выбираются через вторичный ключевой столбец, где предшествующий ключевой столбец имеет меньшую кардинальность. Мы подробно иллюстрировали это в [предыдущем разделе](#generic-exclusion-search-algorithm) этого руководства.
### Оптимальное соотношение сжатия файлов данных {#optimal-compression-ratio-of-data-files}

Этот запрос сравнивает соотношение сжатия колонки `UserID` между двумя таблицами, которые мы создали выше:

```sql
SELECT
    table AS Table,
    name AS Column,
    formatReadableSize(data_uncompressed_bytes) AS Uncompressed,
    formatReadableSize(data_compressed_bytes) AS Compressed,
    round(data_uncompressed_bytes / data_compressed_bytes, 0) AS Ratio
FROM system.columns
WHERE (table = 'hits_URL_UserID_IsRobot' OR table = 'hits_IsRobot_UserID_URL') AND (name = 'UserID')
ORDER BY Ratio ASC
```
Вот ответ:
```response
┌─Table───────────────────┬─Column─┬─Uncompressed─┬─Compressed─┬─Ratio─┐
│ hits_URL_UserID_IsRobot │ UserID │ 33.83 MiB    │ 11.24 MiB  │     3 │
│ hits_IsRobot_UserID_URL │ UserID │ 33.83 MiB    │ 877.47 KiB │    39 │
└─────────────────────────┴────────┴──────────────┴────────────┴───────┘

2 rows in set. Elapsed: 0.006 sec.
```
Мы можем видеть, что соотношение сжатия для колонки `UserID` значительно выше для таблицы, в которой мы упорядочили ключевые колонки `(IsRobot, UserID, URL)` по возрастающей кардинальности.

Хотя в обеих таблицах хранятся точно такие же данные (мы вставили одинаковые 8.87 миллионов строк в обе таблицы), порядок ключевых колонок в составном первичном ключе существенно влияет на то, сколько дискового пространства требует <a href="https://clickhouse.com/docs/introduction/distinctive-features/#data-compression" target="_blank">сжатые</a> данные в [файлах данных колонки](#data-is-stored-on-disk-ordered-by-primary-key-columns):
- в таблице `hits_URL_UserID_IsRobot` с составным первичным ключом `(URL, UserID, IsRobot)`, где мы упорядочиваем ключевые колонки по нисходящей кардинальности, файл данных `UserID.bin` занимает **11.24 MiB** дискового пространства
- в таблице `hits_IsRobot_UserID_URL` с составным первичным ключом `(IsRobot, UserID, URL)`, где мы упорядочиваем ключевые колонки по возрастающей кардинальности, файл данных `UserID.bin` занимает всего **877.47 KiB** дискового пространства

Хорошее соотношение сжатия для данных колонки таблицы на диске не только экономит дисковое пространство, но и ускоряет запросы (особенно аналитические), которые требуют чтения данных из этой колонки, так как требуется меньше ввода-вывода для перемещения данных колонки с диска в основную память (кэш файлов операционной системы).

В следующем разделе мы иллюстрируем, почему полезно для соотношения сжатия колонок таблицы упорядочивать первичные ключевые колонки по восходящей кардинальности.

Диаграмма ниже описывает порядок хранения строк на диске для первичного ключа, где ключевые колонки упорядочены по восходящей кардинальности:

<Image img={sparsePrimaryIndexes14a} size="md" alt="Sparse Primary Indices 14a" background="white"/>

Мы обсудили, что [данные строк таблицы хранятся на диске в порядке первичных ключевых колонок](#data-is-stored-on-disk-ordered-by-primary-key-columns).

На диаграмме выше строки таблицы (их значения колонок на диске) сначала упорядочены по их значению `cl`, а строки с одинаковым значением `cl` упорядочены по значению `ch`. И поскольку первая ключевая колонка `cl` имеет низкую кардинальность, вероятнее всего, что существуют строки с одинаковым значением `cl`. Поэтому также вероятно, что значения `ch` упорядочены (локально - для строк с одинаковым значением `cl`).

Если в колонке похожие данные размещены близко друг к другу, например, за счет сортировки, то такие данные будут лучше сжиматься.
В общем, алгоритм сжатия выигрывает от длинных последовательностей данных (чем больше данных он видит, тем лучше для сжатия)
и локальности (чем более похожи данные, тем лучше соотношение сжатия).

В противовес диаграмме выше, диаграмма ниже описывает порядок хранения строк на диске для первичного ключа, где ключевые колонки упорядочены по убывающей кардинальности:

<Image img={sparsePrimaryIndexes14b} size="md" alt="Sparse Primary Indices 14b" background="white"/>

Теперь строки таблицы сначала упорядочены по значению `ch`, а строки с одинаковым значением `ch` упорядочены по значению `cl`.
Но поскольку первая ключевая колонка `ch` имеет высокую кардинальность, маловероятно, что существуют строки с одинаковым значением `ch`. Поэтому также маловероятно, что значения `cl` упорядочены (локально - для строк с одинаковым значением `ch`).

Следовательно, значения `cl` скорее всего находятся в случайном порядке и, следовательно, имеют плохую локальность и соотношение сжатия соответственно.
### Резюме {#summary-1}

Как для эффективной фильтрации по вторичным ключевым колонкам в запросах, так и для соотношения сжатия файлов данных колонки таблицы полезно упорядочивать колонки в первичном ключе по их кардинальности в восходящем порядке.
### Связанное содержание {#related-content-1}
- Блог: [Ускорение ваших запросов ClickHouse](https://clickhouse.com/blog/clickhouse-faster-queries-with-projections-and-primary-indexes)
## Эффективная идентификация отдельных строк {#identifying-single-rows-efficiently}

Хотя в общем случае это [не](/knowledgebase/key-value) является наилучшим использованием ClickHouse,
иногда приложения, построенные на ClickHouse, требуют идентификации отдельных строк таблицы ClickHouse.

Интуитивным решением для этого может быть использование колонки [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) с уникальным значением для каждой строки и для быстрого извлечения строк использовать эту колонку в качестве первичной ключевой колонки.

Для самого быстрого извлечения колонка UUID [должна быть первой ключевой колонкой](#the-primary-index-is-used-for-selecting-granules).

Мы обсуждали, что [данные строк таблицы ClickHouse хранятся на диске, упорядоченные по первичным ключевым колонкам](#data-is-stored-on-disk-ordered-by-primary-key-columns), наличие колонки с очень высокой кардинальностью (например, колонки UUID) в первичном ключе или в составном первичном ключе перед колонками с низкой кардинальностью [вредно для соотношения сжатия других колонок таблицы](#optimal-compression-ratio-of-data-files).

Компромисс между самым быстрым извлечением и оптимальным сжатием данных заключается в использовании составного первичного ключа, где UUID является последней ключевой колонкой, после колонок с низшей кардинальностью, которые используются для обеспечения хорошего соотношения сжатия для некоторых колонок таблицы.
### Конкретный пример {#a-concrete-example}

Одним конкретным примером является сервис текстовых вставок https://pastila.nl, который разработал Алексей Миловидов и [блогировал о нем](https://clickhouse.com/blog/building-a-paste-service-with-clickhouse/).

При каждом изменении в текстовом поле данные автоматически сохраняются в строку таблицы ClickHouse (одна строка на изменение).

И один из способов идентификации и извлечения (определенной версии) вставленного содержимого - использование хеша содержимого в качестве UUID для строки таблицы, содержащей это содержимое.

Следующая диаграмма показывает
- порядок вставки строк, когда содержимое изменяется (например, из-за ввода текста в текстовое поле) и
- порядок хранения данных вставленных строк на диске, когда используется `PRIMARY KEY (hash)`:

<Image img={sparsePrimaryIndexes15a} size="md" alt="Sparse Primary Indices 15a" background="white"/>

Поскольку колонка `hash` используется как первичная ключевая колонка
- конкретные строки могут быть извлечены [очень быстро](#the-primary-index-is-used-for-selecting-granules), но
- строки таблицы (их данные колонок) хранятся на диске в порядке, возрастающем по (уникальным и случайным) значениям хеша. Поэтому также значения колонки содержимого хранятся в случайном порядке без локальности данных, что приводит к **неоптимальному соотношению сжатия для файла данных колонки содержимого**.


Для значительно улучшения соотношения сжатия для колонки содержимого, сохраняя при этом быструю идентификацию конкретных строк, pastila.nl использует два хеша (и составной первичный ключ) для идентификации конкретной строки:
- хеш содержимого, как обсуждалось выше, который уникален для различных данных, и
- [локальность-чувствительный хеш (отпечаток)](https://en.wikipedia.org/wiki/Locality-sensitive_hashing), который **не** изменяется при небольших изменениях данных.

Следующая диаграмма показывает
- порядок вставки строк, когда содержимое изменяется (например, из-за ввода текста в текстовое поле) и
- порядок хранения данных вставленных строк на диске, когда используется составной `PRIMARY KEY (fingerprint, hash)`:

<Image img={sparsePrimaryIndexes15b} size="md" alt="Sparse Primary Indices 15b" background="white"/>

Теперь строки на диске сначала упорядочены по `fingerprint`, а для строк с одинаковым значением отпечатка их значение `hash` определяет окончательный порядок.

Поскольку данные, отличающиеся только небольшими изменениями, получают одинаковое значение отпечатка, похожие данные теперь хранятся на диске близко друг к другу в колонке содержимого. И это очень хорошо для соотношения сжатия колонки содержимого, так как в общем случае алгоритм сжатия выигрывает от локальности данных (чем более похожи данные, тем лучше соотношение сжатия).

Компромисс заключается в том, что для извлечения конкретной строки необходимы два поля (`fingerprint` и `hash`), чтобы оптимально использовать первичный индекс, который получается из составного `PRIMARY KEY (fingerprint, hash)`.
