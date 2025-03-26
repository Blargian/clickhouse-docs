---
sidebar_title: 'API-конечные точки запросов'
slug: /cloud/get-started/query-endpoints
description: 'Легко запускать REST API конечные точки из ваших сохраненных запросов'
keywords: ['api', 'конечные точки api запроса', 'конечные точки запроса', 'api запросы rest']
title: 'API-конечные точки запросов'
---

import Image from '@theme/IdealImage';
import endpoints_testquery from '@site/static/images/cloud/sqlconsole/endpoints-testquery.png';
import endpoints_savequery from '@site/static/images/cloud/sqlconsole/endpoints-savequery.png';
import endpoints_configure from '@site/static/images/cloud/sqlconsole/endpoints-configure.png';
import endpoints_completed from '@site/static/images/cloud/sqlconsole/endpoints-completed.png';
import endpoints_curltest from '@site/static/images/cloud/sqlconsole/endpoints-curltest.png';
import endpoints_monitoring from '@site/static/images/cloud/sqlconsole/endpoints-monitoring.png';


# API-конечные точки запросов

Функция **API-конечные точки запросов** позволяет создавать API концевые точки непосредственно из любого сохраненного SQL-запроса в консоли ClickHouse Cloud. Вы сможете получать доступ к API-конечным точкам через HTTP для выполнения ваших сохраненных запросов без необходимости подключаться к вашему сервису ClickHouse Cloud через нативный драйвер.

## Руководство по быстрому старту {#quick-start-guide}

Прежде чем продолжить, убедитесь, что у вас есть ключ API и роль администратора консоли. Вы можете следовать этому руководству, чтобы [создать ключ API](/cloud/manage/openapi).

### Создание сохраненного запроса {#creating-a-saved-query}

Если у вас уже есть сохраненный запрос, вы можете пропустить этот шаг.

Откройте новую вкладку запроса. Для демонстрационных целей мы будем использовать [датасет youtube](/getting-started/example-datasets/youtube-dislikes), который содержит примерно 4.5 миллиарда записей. В качестве примерного запроса мы вернем 10 лучших загрузчиков по среднему количеству просмотров на видео в параметре `year`, введенном пользователем:

```sql
with sum(view_count) as view_sum,
    round(view_sum / num_uploads, 2) as per_upload
select
    uploader,
    count() as num_uploads,
    formatReadableQuantity(view_sum) as total_views,
    formatReadableQuantity(per_upload) as views_per_video
from
    youtube
where
    toYear(upload_date) = {year: UInt16}
group by uploader
order by per_upload desc
limit 10
```

Обратите внимание, что этот запрос содержит параметр (`year`). Редактор запросов консоли SQL автоматически обнаруживает выражения параметров запроса ClickHouse и предоставляет ввод для каждого параметра. Давайте быстро запустим этот запрос, чтобы убедиться, что он работает:

<Image img={endpoints_testquery} size="md" alt="Проверка примерного запроса" />

Следующий шаг — сохранить запрос:

<Image img={endpoints_savequery} size="md" alt="Сохранение примерного запроса" />

Дополнительную документацию о сохраненных запросах можно найти [здесь](/cloud/get-started/sql-console#saving-a-query).

### Настройка API-конечной точки запроса {#configuring-the-query-api-endpoint}

API-конечные точки запросов можно настроить непосредственно из представления запроса, нажав кнопку **Поделиться** и выбрав `API Endpoint`. Вам будет предложено указать, какие ключи API должны иметь доступ к конечной точке:

<Image img={endpoints_configure} size="md" alt="Настройка конечной точки запроса" />

После выбора ключа API конечная точка API-запроса будет автоматически предоставлена. Будет отображена примерная команда `curl`, чтобы вы могли отправить тестовый запрос:

<Image img={endpoints_completed} size="md" alt="Команда curl для конечной точки" />

### Параметры API запроса {#query-api-parameters}

Параметры запроса в запросе могут быть указаны с использованием синтаксиса `{parameter_name: type}`. Эти параметры будут автоматически обнаружены, и пример полезной нагрузки запроса будет содержать объект `queryVariables`, через который вы можете передать эти параметры.

### Тестирование и мониторинг {#testing-and-monitoring}

После создания API-конечной точки запроса вы можете протестировать, что она работает, используя `curl` или любой другой HTTP-клиент:

<Image img={endpoints_curltest} size="md" alt="Тестирование конечной точки curl" />

После того как вы отправите свой первый запрос, новая кнопка должна сразу же появиться справа от кнопки **Поделиться**. Нажатие на нее откроет всплывающее окно с данными мониторинга о запросе:

<Image img={endpoints_monitoring} size="md" alt="Мониторинг конечной точки" />

## Детали реализации {#implementation-details}

### Описание {#description}

Этот маршрут выполняет запрос на указанной конечной точке запроса. Он поддерживает различные версии, форматы и переменные запроса. Ответ может быть потоковым (_только версия 2_) или возвращаться в виде единой полезной нагрузки.

### Аутентификация {#authentication}

- **Обязательно**: Да
- **Метод**: Базовая аутентификация через OpenAPI Key/Secret
- **Разрешения**: Соответствующие разрешения для конечной точки запроса.

### URL параметры {#url-parameters}

- `queryEndpointId` (обязательно): Уникальный идентификатор конечной точки запроса для выполнения.

### Параметры запроса {#query-parameters}

#### V1 {#v1}

Нет

#### V2 {#v2}

- `format` (необязательно): Формат ответа. Поддерживает все форматы, поддерживаемые ClickHouse.
- `param_:name` Переменные запроса, которые будут использоваться в запросе. `name` должен соответствовать имени переменной в запросе. Это следует использовать только в том случае, если тело запроса является потоком.
- `:clickhouse_setting` Любая поддерживаемая [настройка ClickHouse](/operations/settings/settings) может быть передана в качестве параметра запроса.

### Заголовки {#headers}

- `x-clickhouse-endpoint-version` (необязательно): Версия конечной точки запроса. Поддерживаемые версии: `1` и `2`. Если не указано, версия по умолчанию — последняя сохраненная для конечной точки.
- `x-clickhouse-endpoint-upgrade` (необязательно): Установите этот заголовок, чтобы обновить версию конечной точки. Это работает в связке с заголовком `x-clickhouse-endpoint-version`.

### Тело запроса {#request-body}

- `queryVariables` (необязательно): Объект, содержащий переменные, которые будут использоваться в запросе.
- `format` (необязательно): Формат ответа. Если конечная точка API-запроса версии 2, возможен любой поддерживаемый формат ClickHouse. Поддерживаемые форматы для v1:
  - TabSeparated
  - TabSeparatedWithNames
  - TabSeparatedWithNamesAndTypes
  - JSON
  - JSONEachRow
  - CSV
  - CSVWithNames
  - CSVWithNamesAndTypes

### Ответы {#responses}

- **200 OK**: Запрос был успешно выполнен.
- **400 Bad Request**: Запрос был сформирован неправильно.
- **401 Unauthorized**: Запрос был выполнен без аутентификации или с недостаточными правами.
- **404 Not Found**: Указанная конечная точка запроса не найдена.

### Обработка ошибок {#error-handling}

- Убедитесь, что запрос включает действительные учетные данные для аутентификации.
- Проверьте `queryEndpointId` и `queryVariables`, чтобы убедиться, что они правильные.
- Обрабатывайте любые ошибки сервера корректно, возвращая соответствующие сообщения об ошибках.

### Обновление версии конечной точки {#upgrading-the-endpoint-version}

Чтобы обновить версию конечной точки с `v1` на `v2`, включите заголовок `x-clickhouse-endpoint-upgrade` в запрос и установите его в `1`. Это запустит процесс обновления и позволит вам использовать функции и улучшения, доступные в `v2`.

## Примеры {#examples}

### Базовый запрос {#basic-request}

**SQL API-конечной точки запроса:**

```sql
SELECT database, name as num_tables FROM system.tables limit 3;
```

#### Версия 1 {#version-1}

**cURL:**

```bash
curl -X POST 'https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run' \
--user '<openApiKeyId:openApiKeySecret>' \
-H 'Content-Type: application/json' \
-d '{ "format": "JSONEachRow" }'
```

**JavaScript:**

```javascript
fetch(
  "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run",
  {
    method: "POST",
    headers: {
      Authorization: "Basic <base64_encoded_credentials>",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: "JSONEachRow",
    }),
  }
)
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Ошибка:", error));
```

**Ответ:**

```json
{
  "data": {
    "columns": [
      {
        "name": "database",
        "type": "String"
      },
      {
        "name": "num_tables",
        "type": "String"
      }
    ],
    "rows": [
      ["INFORMATION_SCHEMA", "COLUMNS"],
      ["INFORMATION_SCHEMA", "KEY_COLUMN_USAGE"],
      ["INFORMATION_SCHEMA", "REFERENTIAL_CONSTRAINTS"]
    ]
  }
}
```

#### Версия 2 {#version-2}

**cURL:**

```bash
curl -X POST 'https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?format=JSONEachRow' \
--user '<openApiKeyId:openApiKeySecret>' \
-H 'Content-Type: application/json' \
-H 'x-clickhouse-endpoint-version: 2'
```

**JavaScript:**

```javascript
fetch(
  "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?format=JSONEachRow",
  {
    method: "POST",
    headers: {
      Authorization: "Basic <base64_encoded_credentials>",
      "Content-Type": "application/json",
      "x-clickhouse-endpoint-version": "2",
    },
  }
)
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Ошибка:", error));
```

**Ответ:**

```application/x-ndjson
{"database":"INFORMATION_SCHEMA","num_tables":"COLUMNS"}
{"database":"INFORMATION_SCHEMA","num_tables":"KEY_COLUMN_USAGE"}
{"database":"INFORMATION_SCHEMA","num_tables":"REFERENTIAL_CONSTRAINTS"}
```

### Запрос с переменными запроса и Версией 2 в формате JSONCompactEachRow {#request-with-query-variables-and-version-2-on-jsoncompacteachrow-format}

**SQL API-конечной точки запроса:**

```sql
SELECT name, database FROM system.tables WHERE match(name, {tableNameRegex: String}) AND database = {database: String};
```

**cURL:**

```bash
curl -X POST 'https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?format=JSONCompactEachRow' \
--user '<openApiKeyId:openApiKeySecret>' \
-H 'Content-Type: application/json' \
-H 'x-clickhouse-endpoint-version: 2' \
-d '{ "queryVariables": { "tableNameRegex": "query.*", "database": "system" } }'
```

**JavaScript:**

```javascript
fetch(
  "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?format=JSONCompactEachRow",
  {
    method: "POST",
    headers: {
      Authorization: "Basic <base64_encoded_credentials>",
      "Content-Type": "application/json",
      "x-clickhouse-endpoint-version": "2",
    },
    body: JSON.stringify({
      queryVariables: {
        tableNameRegex: "query.*",
        database: "system",
      },
    }),
  }
)
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Ошибка:", error));
```

**Ответ:**

```application/x-ndjson
["query_cache", "system"]
["query_log", "system"]
["query_views_log", "system"]
```

### Запрос с массивом в переменных запроса, который вставляет данные в таблицу {#request-with-array-in-the-query-variables-that-inserts-data-into-a-table}

**SQL таблицы:**

```SQL
CREATE TABLE default.t_arr
(
    `arr` Array(Array(Array(UInt32)))
)
ENGINE = MergeTree
ORDER BY tuple()
```

**SQL API-конечной точки запроса:**

```sql
INSERT INTO default.t_arr VALUES ({arr: Array(Array(Array(UInt32)))});
```

**cURL:**

```bash
curl -X POST 'https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run' \
--user '<openApiKeyId:openApiKeySecret>' \
-H 'Content-Type: application/json' \
-H 'x-clickhouse-endpoint-version: 2' \
-d '{
  "queryVariables": {
    "arr": [[[12, 13, 0, 1], [12]]]
  }
}'
```

**JavaScript:**

```javascript
fetch(
  "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run",
  {
    method: "POST",
    headers: {
      Authorization: "Basic <base64_encoded_credentials>",
      "Content-Type": "application/json",
      "x-clickhouse-endpoint-version": "2",
    },
    body: JSON.stringify({
      queryVariables: {
        arr: [[[12, 13, 0, 1], [12]]],
      },
    }),
  }
)
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Ошибка:", error));
```

**Ответ:**

```text
OK
```

### Запрос с установленной настройкой ClickHouse max_threads на 8 {#request-with-clickhouse-settings-max_threads-set-to-8}

**SQL API-конечной точки запроса:**

```sql
SELECT * from system.tables;
```

**cURL:**

```bash
curl -X POST 'https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?max_threads=8,' \
--user '<openApiKeyId:openApiKeySecret>' \
-H 'Content-Type: application/json' \
-H 'x-clickhouse-endpoint-version: 2' \
```

**JavaScript:**

```javascript
fetch(
  "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?max_threads=8",
  {
    method: "POST",
    headers: {
      Authorization: "Basic <base64_encoded_credentials>",
      "Content-Type": "application/json",
      "x-clickhouse-endpoint-version": "2",
    },
  }
)
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Ошибка:", error));
```

### Запрос и парсинг ответа как поток {#request-and-parse-the-response-as-a-stream}

**SQL API-конечной точки запроса:**

```sql
SELECT name, database from system.tables;
```

**Typescript:**

```typescript
async function fetchAndLogChunks(
  url: string,
  openApiKeyId: string,
  openApiKeySecret: string
) {
  const auth = Buffer.from(`${openApiKeyId}:${openApiKeySecret}`).toString(
    "base64"
  );

  const headers = {
    Authorization: `Basic ${auth}`,
    "x-clickhouse-endpoint-version": "2",
  };

  const response = await fetch(url, {
    headers,
    method: "POST",
    body: JSON.stringify({ format: "JSONEachRow" }),
  });

  if (!response.ok) {
    console.error(`Ошибка HTTP! Статус: ${response.status}`);
    return;
  }

  const reader = response.body as unknown as Readable;
  reader.on("data", (chunk) => {
    console.log(chunk.toString());
  });

  reader.on("end", () => {
    console.log("Поток завершен.");
  });

  reader.on("error", (err) => {
    console.error("Ошибка потока:", err);
  });
}

const endpointUrl =
  "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?format=JSONEachRow";
const openApiKeyId = "<myOpenApiKeyId>";
const openApiKeySecret = "<myOpenApiKeySecret>";
// Пример использования
fetchAndLogChunks(endpointUrl, openApiKeyId, openApiKeySecret).catch((err) =>
  console.error(err)
);
```

**Вывод**

```shell
> npx tsx index.ts
> {"name":"COLUMNS","database":"INFORMATION_SCHEMA"}
> {"name":"KEY_COLUMN_USAGE","database":"INFORMATION_SCHEMA"}
...
> Поток завершен.
```

### Вставка потока из файла в таблицу {#insert-a-stream-from-a-file-into-a-table}

Создайте файл ./samples/my_first_table_2024-07-11.csv со следующим содержимым:

```csv
"user_id","json","name"
"1","{""name"":""John"",""age"":30}","John"
"2","{""name"":""Jane"",""age"":25}","Jane"
```

**SQL для создания таблицы:**

```sql
create table default.my_first_table
(
    user_id String,
    json String,
    name String,
) ENGINE = MergeTree()
ORDER BY user_id;
```

**SQL API-конечной точки запроса:**

```sql
INSERT INTO default.my_first_table
```

**cURL:**

```bash
cat ./samples/my_first_table_2024-07-11.csv | curl --user '<openApiKeyId:openApiKeySecret>' \
                                                   -X POST \
                                                   -H 'Content-Type: application/octet-stream' \
                                                   -H 'x-clickhouse-endpoint-version: 2' \
                                                   "https://console-api.clickhouse.cloud/.api/query-endpoints/<endpoint id>/run?format=CSV" \
                                                   --data-binary @-
```
