---
slug: /integrations/postgresql/postgres-vs-clickhouse
title: Сравнение PostgreSQL и ClickHouse
keywords: [postgres, postgresql, comparison]
---

import postgresReplicas from '@site/static/images/integrations/data-ingestion/dbms/postgres-replicas.png';

## Postgres vs ClickHouse: Эквиваленты и различия {#postgres-vs-clickhouse-equivalent-and-different-concepts}

Пользователи, приходящие из OLTP систем и привыкшие к ACID транзакциям, должны знать, что ClickHouse осознанно идет на компромиссы, не обеспечивая их полностью в обмен на производительность. Семантика ClickHouse может обеспечить высокие гарантии долговечности и высокую пропускную способность записи, если это правильно понимать. Мы выделяем несколько ключевых понятий ниже, с которыми пользователи должны быть знакомы перед работой с ClickHouse из Postgres.

### Шарды и реплики {#shards-vs-replicas}

Шардинг и репликация — это две стратегии, используемые для масштабирования за пределами одной инстанции Postgres, когда хранение и/или вычисления становятся узким местом для производительности. Шардинг в Postgres включает деление большой базы данных на более мелкие, более управляемые части, распределенные по нескольким узлам. Однако в Postgres нет нативной поддержки шардинга. Вместо этого шардинг можно реализовать с помощью расширений, таких как [Citus](https://www.citusdata.com/), где Postgres становится распределенной базой данных, способной горизонтально масштабироваться. Этот подход позволяет Postgres обрабатывать более высокие скорости транзакций и большие объемы данных, распределяя нагрузку между несколькими машинами. Шарды могут быть основаны на строках или схемах для обеспечения гибкости типов нагрузки, таких как транзакционная или аналитическая. Шардинг может вводить значительную сложность в плане управления данными и выполнения запросов, так как требует координации между несколькими машинами и гарантий консистентности.

В отличие от шардов, реплики являются дополнительными инстанциями Postgres, которые содержат все или часть данных из основного узла. Реплики используются по различным причинам, включая повышенную производительность чтения и сценарии высокой доступности (HA). Физическая репликация является нативной функцией Postgres, которая включает копирование всей базы данных или значительной ее части на другой сервер, включая все базы данных, таблицы и индексы. Это включает потоковую передачу сегментов WAL от основного узла к репликам через TCP/IP. В отличие от этого, логическая репликация является более высоким уровнем абстракции, который передает изменения на основе операций `INSERT`, `UPDATE` и `DELETE`. Хотя те же результаты могут применяться к физической репликации, большая гибкость обеспечивается для нацеливания на конкретные таблицы и операции, а также для трансформаций данных и поддержки различных версий Postgres.

**В отличие от этого, шардирование и репликация в ClickHouse являются двумя ключевыми концепциями, связанными с распределением данных и избыточностью**. Реплики ClickHouse можно считать аналогичными репликам Postgres, хотя репликация в ClickHouse является конечной, без понятия основного узла. Шардинг, в отличие от Postgres, поддерживается нативно.

Шард — это часть данных вашей таблицы. У вас всегда есть как минимум один шард. Распределение данных между несколькими серверами может использоваться для деления нагрузки, если вы превышаете возможности одного сервера, при этом все шарды используются для выполнения запроса параллельно. Пользователи могут вручную создавать шарды для таблицы на разных серверах и вставлять данные непосредственно в них. В качестве альтернативы можно использовать распределенную таблицу с ключом шардинга, определяющим, в какой шард направляются данные. Ключ шардинга может быть случайным или выведенным с помощью функции хеширования. Важно отметить, что шард может состоять из нескольких реплик.

Реплика — это копия ваших данных. ClickHouse всегда имеет как минимум одну копию ваших данных, поэтому минимальное количество реплик равно одному. Добавление второй реплики ваших данных обеспечивает отказоустойчивость и потенциально дополнительную вычислительную мощность для обработки большего количества запросов ([Параллельные Реплики](https://clickhouse.com/blog/clickhouse-release-23-03#parallel-replicas-for-utilizing-the-full-power-of-your-replicas-nikita-mikhailov) также могут использоваться для распределения вычислений для одного запроса, снижающего задержку). Реплики достигаются с помощью [табличного движка ReplicatedMergeTree](/engines/table-engines/mergetree-family/replication), который позволяет ClickHouse поддерживать несколько копий данных в синхронизированном состоянии между разными серверами. Репликация является физической: между узлами передаются только сжатые части, а не запросы.

В заключение, реплика — это копия данных, предоставляющая избыточность и надежность (и потенциально распределенную обработку), в то время как шард — это подмножество данных, позволяющее распределенную обработку и балансировку нагрузки.

> ClickHouse Cloud использует одну копию данных, размещенную в S3 с несколькими вычислительными репликами. Данные доступны каждому узлу-реплике, у каждого из которых есть локальный SSD кэш. Это зависит только от репликации метаданных через ClickHouse Keeper.

## Конечная консистентность {#eventual-consistency}

ClickHouse использует ClickHouse Keeper (реализация C++ ZooKeeper, также можно использовать ZooKeeper) для управления своим внутренним механизмом репликации, сосредотачивая внимание в первую очередь на хранении метаданных и обеспечении конечной консистентности. Keeper используется для назначения уникальных последовательных номеров для каждой вставки в распределенной среде. Это критически важно для поддержания порядка и консистентности между операциями. Эта структура также обрабатывает фоновые операции, такие как слияния и мутации, гарантируя, что работа по ним распределена и они выполняются в одном и том же порядке на всех репликах. В дополнение к метаданным, Keeper функционирует как комплексный центр управления репликацией, включая отслеживание контрольных сумм для сохраненных частей данных и действует как распределенная система уведомлений между репликами.

Процесс репликации в ClickHouse (1) начинается, когда данные вставляются в любую реплику. Эти данные, в их сыром виде вставки, (2) записываются на диск вместе с их контрольными суммами. После записи реплика (3) пытается зарегистрировать эту новую часть данных в Keeper, выделяя уникальный номер блока и записывая детали новой части. Другие реплики, обнаружив (4) новые записи в журнале репликации, (5) загружают соответствующую часть данных через внутренний HTTP-протокол, проверяя ее по контрольным суммам, указанным в ZooKeeper. Этот метод обеспечивает, что все реплики в конечном итоге хранят согласованные и актуальные данные, несмотря на различные скорости обработки или потенциальные задержки. Более того, система способна обрабатывать несколько операций одновременно, оптимизируя процессы управления данными и позволяя масштабирование системы и ее устойчивость к аппаратным несоответствиям.

<br />

<img src={postgresReplicas}    
  class="image"
  alt="NEEDS ALT"
  style={{width: '500px'}} />

<br />

Обратите внимание, что ClickHouse Cloud использует [оптимизированный механизм репликации для облака](https://clickhouse.com/blog/clickhouse-cloud-boosts-performance-with-sharedmergetree-and-lightweight-updates), адаптированный к его разделению хранения и вычислений. Храня данные в общем объектном хранилище, данные автоматически становятся доступными для всех вычислительных узлов без необходимости физической репликации данных между узлами. Вместо этого Keeper используется только для обмена метаданными (где какие данные существуют в объектном хранилище) между вычислительными узлами.

PostgreSQL использует другую стратегию репликации по сравнению с ClickHouse, в основном применяя потоковую репликацию, которая включает модель основного реплики, при которой данные непрерывно передаются от основного узла к одной или нескольким узлам-репликам. Этот тип репликации обеспечивает почти реальную консистентность и может быть синхронным или асинхронным, давая администраторам контроль над балансом между доступностью и консистентностью. В отличие от ClickHouse, PostgreSQL основывается на WAL (журнале предварительной записи) с логической репликацией и декодированием для передачи объектов данных и изменений между узлами. Этот подход в PostgreSQL более прост, но может не обеспечивать тот же уровень масштабируемости и отказоустойчивости в сильно распределенных средах, который достигает ClickHouse через сложное использование Keeper для координации распределенных операций и конечной консистентности.

## Последствия для пользователей {#user-implications}

В ClickHouse возможность грязных чтений — когда пользователи могут записывать данные в одну реплику, а затем считывать потенциально не реплицированные данные из другой — возникает из его конечной модели репликации, управляемой через Keeper. Эта модель подчеркивает производительность и масштабируемость в распределенных системах, позволяя репликам работать независимо и синхронизироваться асинхронно. В результате вновь вставленные данные могут быть не сразу видимыми на всех репликах, в зависимости от задержки репликации и времени, необходимого для распространения изменений по системе. 

С другой стороны, модель потоковой репликации PostgreSQL обычно может предотвращать грязные чтения, применяя синхронные опции репликации, когда основной узел ждет подтверждения получения данных хотя бы одной репликой перед коммитом транзакций. Это гарантирует, что как только транзакция зафиксирована, существует гарантия, что данные доступны в другой реплике. В случае сбоя основного узла реплика обеспечит, что запросы будут видеть зафиксированные данные, поддерживая тем самым более строгий уровень консистентности.

## Рекомендации {#recommendations}

Пользователи, новые в ClickHouse, должны быть осведомлены об этих различиях, которые проявятся в реплицируемых средах. Обычно конечная консистентность является достаточной в аналитике по миллиардам, если не триллионам, точек данных, где метрики либо более стабильно, либо оценка является достаточной, так как новые данных постоянно вставляются с высокой скоростью.

Существуют несколько вариантов увеличения консистентности чтения, если это необходимо. Оба примера требуют либо увеличенной сложности, либо накладных расходов, что снижает производительность запросов и затрудняет масштабирование ClickHouse. **Мы рекомендуем эти подходы только в случае абсолютной необходимости.**

## Последовательная маршрутизация {#consistent-routing}

Чтобы преодолеть некоторые ограничения конечной консистентности, пользователи могут обеспечить маршрутизацию клиентов к одним и тем же репликам. Это полезно в случаях, когда несколько пользователей запрашивают ClickHouse и результаты должны быть детерминированными для всех запросов. Хотя результаты могут отличаться, когда вставляются новые данные, одни и те же реплики должны запрашиваться, обеспечивая последовательный взгляд.

Это можно достичь несколькими подходами в зависимости от вашей архитектуры и используете ли вы ClickHouse OSS или ClickHouse Cloud.

## ClickHouse Cloud {#clickhouse-cloud}

ClickHouse Cloud использует одну копию данных, размещенную в S3 с несколькими вычислительными репликами. Данные доступны каждому узлу-реплике, который имеет локальный SSD кэш. Чтобы обеспечить последовательность результатов, пользователи должны только обеспечить последовательную маршрутизацию к одному и тому же узлу.

Связь с узлами службы ClickHouse Cloud осуществляется через прокси. HTTP и нативные протоколы соединения будут маршрутизироваться к одному и тому же узлу в течение времени их открытого состояния. В случае соединений HTTP 1.1 от большинства клиентов это зависит от окна Keep-Alive. Это можно настроить на большинстве клиентов, например, Node Js. Также требуется конфигурация на стороне сервера, которая будет выше, чем у клиента и установится на 10 секунд в ClickHouse Cloud.

Чтобы обеспечить последовательную маршрутизацию в разных соединениях, например, если используется пул соединений или если соединения истекают, пользователи могут либо использовать одно и то же соединение (легче для нативного), либо запросить открытие «липких» конечных точек. Это предоставляет набор конечных точек для каждого узла в кластере, что позволяет клиентам гарантировать детерминированную маршрутизацию запросов.

> Свяжитесь с поддержкой для доступа к липким конечным точкам.

## ClickHouse OSS {#clickhouse-oss}

Достижение этого поведения в OSS зависит от вашей топологии шардов и реплик и используете ли вы [распределенную таблицу](/engines/table-engines/special/distributed) для выполнения запросов.

Когда у вас есть только один шард и реплики (что часто встречается, так как ClickHouse вертикально масштабируется), пользователи выбирают узел на клиентском уровне и напрямую запрашивают реплику, обеспечивая, что этот выбор является детерминированным.

Хотя возможны топологии с несколькими шардом и репликами без распределенной таблицы, эти расширенные развертывания обычно имеют свою собственную инфраструктуру маршрутизации. Поэтому мы предполагаем, что развертывания с более чем одним шардом используют распределенную таблицу (распределенные таблицы можно использовать с развертываниями с одним шаром, но это обычно не требуется).

В этом случае пользователи должны обеспечить последовательную маршрутизацию узлов на основе свойства, например, `session_id` или `user_id`. Настройки [`prefer_localhost_replica=0`](/operations/settings/settings#prefer_localhost_replica), [`load_balancing=in_order`](/operations/settings/settings#load_balancing) должны быть [установлены в запросе](/operations/settings/query-level). Это обеспечит предпочтение местным репликам шардов, с остальными репликами по порядку, указанному в конфигурации - если они имеют одинаковое количество ошибок - произойдет переключение с произвольным выбором, если ошибок больше. [`load_balancing=nearest_hostname`](/operations/settings/settings#load_balancing) также может использоваться в качестве альтернативы для этого детерминированного выбора шардов.

> При создании распределенной таблицы пользователи должны указать кластер. Это определение кластера, указанное в config.xml, будет перечислять шард (и их реплики) - таким образом, позволяя пользователям контролировать порядок, в котором они используются с каждого узла. Используя это, пользователи могут гарантировать детерминированный выбор.

## Последовательная консистентность {#sequential-consistency}

В исключительных случаях пользователи могут потребовать последовательную консистентность.

Последовательная консистентность в базах данных — это когда операции над базой данных, по-видимому, выполняются в некотором последовательном порядке, и этот порядок один и тот же для всех процессов, взаимодействующих с базой данных. Это означает, что каждая операция, по-видимому, начинает действовать мгновенно между ее вызовом и завершением, и существует единый, согласованный порядок, в котором все операции наблюдаются любым процессом.

С точки зрения пользователя это обычно проявляется в необходимости записывать данные в ClickHouse и при чтении данных гарантировать, что возвращаются последние вставленные строки. Это можно достичь несколькими способами (в порядке предпочтения):

1. **Чтение/запись на одном и том же узле** - Если вы используете нативный протокол или [сессию для чтения/записи через HTTP](/interfaces/http#default-database), вы должны быть подключены к одной и той же реплике: в этом сценарии вы читаете непосредственно с узла, на который записываете, тогда ваше чтение всегда будет последовательным.
2. **Узлы реплик синхронизировать вручную** - Если вы записываете в одну реплику и читаете из другой, вы можете использовать команду `SYSTEM SYNC REPLICA LIGHTWEIGHT` перед чтением. 
3. **Включить последовательную консистентность** - через настройку запроса [`select_sequential_consistency = 1`](/operations/settings/settings#select_sequential_consistency). В OSS также необходимо указать настройку `insert_quorum = 'auto'`.

<br />

Смотрите [здесь](/cloud/reference/shared-merge-tree#consistency) для получения дополнительных сведений о включении этих настроек.

> Использование последовательной консистентности создаст большую нагрузку на ClickHouse Keeper. Результатом может быть замедление вставок и чтений. SharedMergeTree, используемый в ClickHouse Cloud в качестве основного движка таблиц, [несет меньшие накладные расходы и будет гораздо лучше масштабироваться](/cloud/reference/shared-merge-tree#consistency). Пользователям OSS следует осторожно использовать этот подход и измерять нагрузку на Keeper.

## Поддержка транзакций (ACID) {#transactional-acid-support}

Пользователи, мигрирующие из PostgreSQL, могут быть привыкли к его надежной поддержке свойств ACID (Атомарность, Согласованность, Изолированность, Долговечность), что делает его надежным выбором для транзакционных баз данных. Атомарность в PostgreSQL гарантирует, что каждая транзакция рассматривается как единое целое, которая либо полностью завершается, либо полностью откатывается, предотвращая частичные обновления. Согласованность поддерживается за счет применения ограничений, триггеров и правил, которые гарантируют, что все транзакции базы данных ведут к действительному состоянию. Уровни изоляции, от Read Committed до Serializable, поддерживаются в PostgreSQL, что позволяет точно контролировать видимость изменений, внесенных конкурентными транзакциями. Наконец, долговечность достигается через журнал предварительной записи (WAL), что гарантирует, что как только транзакция зафиксирована, она остается таковой даже в случае системного сбоя. 

Эти свойства распространены для OLTP баз данных, которые действуют как источник правды.

Хотя они мощные, это также имеет свои ограничения и делает масштабирование до PB сложным. ClickHouse идет на компромисс в этих свойствах, чтобы предоставлять быстрые аналитические запросы в масштабе, поддерживая высокую пропускную способность записи.

ClickHouse предоставляет свойства ACID в [ограниченных конфигурациях](/guides/developer/transactional) - наиболее просто, когда используется неподдерживаемый экземпляр движка таблиц MergeTree с одной партицией. Пользователи не должны ожидать этих свойств за пределами этих случаев и должны убедиться, что они не являются обязательными.

## Репликация или миграция данных Postgres с помощью ClickPipes (на базе PeerDB) {#replicating-or-migrating-postgres-data-with-clickpipes-powered-by-peerdb}

:::info
PeerDB теперь доступен в ClickHouse Cloud – Быстрая репликация Postgres в ClickHouse с помощью нашего [нового соединителя ClickPipe](/integrations/clickpipes/postgres) – теперь в общественном бета-тестировании.
:::

[PeerDB](https://www.peerdb.io/) позволяет вам бесшовно реплицировать данные из Postgres в ClickHouse. Вы можете использовать этот инструмент для
1. непрерывной репликации с использованием CDC, позволяя Postgres и ClickHouse сосуществовать — Postgres для OLTP и ClickHouse для OLAP; и
2. миграции из Postgres в ClickHouse.
