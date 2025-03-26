---
description: 'Документация для функций JSON'
sidebar_label: 'JSON'
sidebar_position: 105
slug: /sql-reference/functions/json-functions
title: 'Функции JSON'
---

Существует два набора функций для парсинга JSON:
   - [`simpleJSON*` (`visitParam*`)](#simplejson-visitparam-functions), которые предназначены для очень быстрого парсинга ограниченного подмножества JSON.
   - [`JSONExtract*`](#jsonextract-functions), которые предназначены для парсинга обычного JSON.
## функции simpleJSON (visitParam) {#simplejson-visitparam-functions}

ClickHouse имеет специальные функции для работы с упрощённым JSON. Все эти функции JSON основаны на строгих предположениях о том, каким может быть JSON. Они стараются сделать как можно меньше, чтобы выполнить задачу как можно быстрее.

Следующие предположения сделаны:

1.  Имя поля (аргумент функции) должно быть константой.
2.  Имя поля в каком-то смысле канонически закодировано в JSON. Например: `simpleJSONHas('{"abc":"def"}', 'abc') = 1`, но `simpleJSONHas('{"\\u0061\\u0062\\u0063":"def"}', 'abc') = 0`
3.  Поля ищутся на любом уровне вложенности, без разбора. Если есть несколько совпадающих полей, используется первое вхождение.
4.  JSON не содержит пробелов вне строковых литералов.
### simpleJSONHas {#simplejsonhas}

Проверяет, существует ли поле с именем `field_name`. Результат — `UInt8`.

**Синтаксис**

```sql
simpleJSONHas(json, field_name)
```

Псевдоним: `visitParamHas`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)


**Возвращаемое значение**

- Возвращает `1`, если поле существует, `0` в противном случае. [UInt8](../data-types/int-uint.md).

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":"true","qux":1}');

SELECT simpleJSONHas(json, 'foo') FROM jsons;
SELECT simpleJSONHas(json, 'bar') FROM jsons;
```

Результат:

```response
1
0
```
### simpleJSONExtractUInt {#simplejsonextractuint}

Парсит `UInt64` из значения поля с именем `field_name`. Если это строковое поле, оно пытается распарсить число с начала строки. Если поле не существует, или оно существует, но не содержит число, возвращается `0`.

**Синтаксис**

```sql
simpleJSONExtractUInt(json, field_name)
```

Псевдоним: `visitParamExtractUInt`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)

**Возвращаемое значение**

- Возвращает число, распарсенное из поля, если поле существует и содержит число, `0` в противном случае. [UInt64](../data-types/int-uint.md).

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":"4e3"}');
INSERT INTO jsons VALUES ('{"foo":3.4}');
INSERT INTO jsons VALUES ('{"foo":5}');
INSERT INTO jsons VALUES ('{"foo":"not1number"}');
INSERT INTO jsons VALUES ('{"baz":2}');

SELECT simpleJSONExtractUInt(json, 'foo') FROM jsons ORDER BY json;
```

Результат:

```response
0
4
0
3
5
```
### simpleJSONExtractInt {#simplejsonextractint}

Парсит `Int64` из значения поля с именем `field_name`. Если это строковое поле, оно пытается распарсить число с начала строки. Если поле не существует, или оно существует, но не содержит число, возвращается `0`.

**Синтаксис**

```sql
simpleJSONExtractInt(json, field_name)
```

Псевдоним: `visitParamExtractInt`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)

**Возвращаемое значение**

- Возвращает число, распарсенное из поля, если поле существует и содержит число, `0` в противном случае. [Int64](../data-types/int-uint.md).

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":"-4e3"}');
INSERT INTO jsons VALUES ('{"foo":-3.4}');
INSERT INTO jsons VALUES ('{"foo":5}');
INSERT INTO jsons VALUES ('{"foo":"not1number"}');
INSERT INTO jsons VALUES ('{"baz":2}');

SELECT simpleJSONExtractInt(json, 'foo') FROM jsons ORDER BY json;
```

Результат:

```response
0
-4
0
-3
5
```
### simpleJSONExtractFloat {#simplejsonextractfloat}

Парсит `Float64` из значения поля с именем `field_name`. Если это строковое поле, оно пытается распарсить число с начала строки. Если поле не существует, или оно существует, но не содержит число, возвращается `0`.

**Синтаксис**

```sql
simpleJSONExtractFloat(json, field_name)
```

Псевдоним: `visitParamExtractFloat`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)

**Возвращаемое значение**

- Возвращает число, распарсенное из поля, если поле существует и содержит число, `0` в противном случае. [Float64](/sql-reference/data-types/float).

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":"-4e3"}');
INSERT INTO jsons VALUES ('{"foo":-3.4}');
INSERT INTO jsons VALUES ('{"foo":5}');
INSERT INTO jsons VALUES ('{"foo":"not1number"}');
INSERT INTO jsons VALUES ('{"baz":2}');

SELECT simpleJSONExtractFloat(json, 'foo') FROM jsons ORDER BY json;
```

Результат:

```response
0
-4000
0
-3.4
5
```
### simpleJSONExtractBool {#simplejsonextractbool}

Парсит значение true/false из значения поля с именем `field_name`. Результат — `UInt8`.

**Синтаксис**

```sql
simpleJSONExtractBool(json, field_name)
```

Псевдоним: `visitParamExtractBool`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)

**Возвращаемое значение**

Возвращает `1`, если значение поля равно `true`, `0` в противном случае. Это означает, что эта функция вернёт `0` включая (но не только) в следующих случаях:
 - Если поле не существует.
 - Если поле содержит `true` в строковом формате, например: `{"field":"true"}`.
 - Если поле содержит `1` как числовое значение.

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":false,"bar":true}');
INSERT INTO jsons VALUES ('{"foo":"true","qux":1}');

SELECT simpleJSONExtractBool(json, 'bar') FROM jsons ORDER BY json;
SELECT simpleJSONExtractBool(json, 'foo') FROM jsons ORDER BY json;
```

Результат:

```response
0
1
0
0
```
### simpleJSONExtractRaw {#simplejsonextractraw}

Возвращает значение поля с именем `field_name` как `String`, включая разделители.

**Синтаксис**

```sql
simpleJSONExtractRaw(json, field_name)
```

Псевдоним: `visitParamExtractRaw`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)

**Возвращаемое значение**

- Возвращает значение поля как строку, включая разделители, если поле существует, или пустую строку в противном случае. [`String`](/sql-reference/data-types/string)

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":"-4e3"}');
INSERT INTO jsons VALUES ('{"foo":-3.4}');
INSERT INTO jsons VALUES ('{"foo":5}');
INSERT INTO jsons VALUES ('{"foo":{"def":[1,2,3]}}');
INSERT INTO jsons VALUES ('{"baz":2}');

SELECT simpleJSONExtractRaw(json, 'foo') FROM jsons ORDER BY json;
```

Результат:

```response

"-4e3"
-3.4
5
{"def":[1,2,3]}
```
### simpleJSONExtractString {#simplejsonextractstring}

Парсит `String` в двойных кавычках из значения поля с именем `field_name`.

**Синтаксис**

```sql
simpleJSONExtractString(json, field_name)
```

Псевдоним: `visitParamExtractString`.

**Параметры**

- `json` — JSON, в котором ищется поле. [String](/sql-reference/data-types/string)
- `field_name` — Имя поля, которое требуется найти. [String literal](/sql-reference/syntax#string)

**Возвращаемое значение**

- Возвращает неэкранированное значение поля как строку, включая разделители. Возвращается пустая строка, если поле не содержит строку в двойных кавычках, если не удалось выполнить эскейпинг или если поле не существует. [String](../data-types/string.md).

**Детали реализации**

В настоящее время нет поддержки кодовых точек в формате `\uXXXX\uYYYY`, которые не находятся в базовой многоязычной плоскости (они преобразуются в CESU-8 вместо UTF-8).

**Пример**

Запрос:

```sql
CREATE TABLE jsons
(
    `json` String
)
ENGINE = Memory;

INSERT INTO jsons VALUES ('{"foo":"\\n\\u0000"}');
INSERT INTO jsons VALUES ('{"foo":"\\u263"}');
INSERT INTO jsons VALUES ('{"foo":"\\u263а"}');
INSERT INTO jsons VALUES ('{"foo":"hello}');

SELECT simpleJSONExtractString(json, 'foo') FROM jsons ORDER BY json;
```

Результат:

```response
\n\0

☺

```
## Функции JSONExtract {#jsonextract-functions}

Следующие функции основаны на [simdjson](https://github.com/lemire/simdjson) и предназначены для более сложных требований парсинга JSON.
### isValidJSON {#isvalidjson}

Проверяет, что переданная строка является допустимым JSON.

**Синтаксис**

```sql
isValidJSON(json)
```

**Примеры**

```sql
SELECT isValidJSON('{"a": "hello", "b": [-100, 200.0, 300]}') = 1
SELECT isValidJSON('not a json') = 0
```
### JSONHas {#jsonhas}

Если значение существует в документе JSON, будет возвращено `1`. Если значение не существует, будет возвращено `0`.

**Синтаксис**

```sql
JSONHas(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает `1`, если значение существует в `json`, в противном случае `0`. [UInt8](../data-types/int-uint.md).

**Примеры**

Запрос:

```sql
SELECT JSONHas('{"a": "hello", "b": [-100, 200.0, 300]}', 'b') = 1
SELECT JSONHas('{"a": "hello", "b": [-100, 200.0, 300]}', 'b', 4) = 0
```

Минимальный индекс элемента равен 1. Таким образом элемент 0 не существует. Вы можете использовать целые числа для доступа как к массивам JSON, так и к объектам JSON. Например:

```sql
SELECT JSONExtractKey('{"a": "hello", "b": [-100, 200.0, 300]}', 1) = 'a'
SELECT JSONExtractKey('{"a": "hello", "b": [-100, 200.0, 300]}', 2) = 'b'
SELECT JSONExtractKey('{"a": "hello", "b": [-100, 200.0, 300]}', -1) = 'b'
SELECT JSONExtractKey('{"a": "hello", "b": [-100, 200.0, 300]}', -2) = 'a'
SELECT JSONExtractString('{"a": "hello", "b": [-100, 200.0, 300]}', 1) = 'hello'
```
### JSONLength {#jsonlength}

Возвращает длину JSON массива или JSON объекта. Если значение не существует или имеет неправильный тип, будет возвращено `0`.

**Синтаксис**

```sql
JSONLength(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает длину JSON массива или JSON объекта. Возвращает `0`, если значение не существует или имеет неправильный тип. [UInt64](../data-types/int-uint.md).

**Примеры**

```sql
SELECT JSONLength('{"a": "hello", "b": [-100, 200.0, 300]}', 'b') = 3
SELECT JSONLength('{"a": "hello", "b": [-100, 200.0, 300]}') = 2
```
### JSONType {#jsontype}

Возвращает тип значения JSON. Если значение не существует, будет возвращено `Null=0` (необычный [Null](../data-types/nullable.md), но `Null=0` из `Enum8('Null' = 0, 'String' = 34,...)`).

**Синтаксис**

```sql
JSONType(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает тип JSON значения как строку, в противном случае, если значение не существует, возвращает `Null=0`. [Enum](../data-types/enum.md).

**Примеры**

```sql
SELECT JSONType('{"a": "hello", "b": [-100, 200.0, 300]}') = 'Object'
SELECT JSONType('{"a": "hello", "b": [-100, 200.0, 300]}', 'a') = 'String'
SELECT JSONType('{"a": "hello", "b": [-100, 200.0, 300]}', 'b') = 'Array'
```
### JSONExtractUInt {#jsonextractuint}

Парсит JSON и извлекает значение типа UInt.

**Синтаксис**

```sql
JSONExtractUInt(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает значение UInt, если оно существует, в противном случае возвращает `0`. [UInt64](../data-types/int-uint.md).

**Примеры**

Запрос:

```sql
SELECT JSONExtractUInt('{"a": "hello", "b": [-100, 200.0, 300]}', 'b', -1) as x, toTypeName(x);
```

Результат:

```response
┌───x─┬─toTypeName(x)─┐
│ 300 │ UInt64        │
└─────┴───────────────┘
```
### JSONExtractInt {#jsonextractint}

Парсит JSON и извлекает значение типа Int.

**Синтаксис**

```sql
JSONExtractInt(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает значение Int, если оно существует, в противном случае возвращает `0`. [Int64](../data-types/int-uint.md).

**Примеры**

Запрос:

```sql
SELECT JSONExtractInt('{"a": "hello", "b": [-100, 200.0, 300]}', 'b', -1) as x, toTypeName(x);
```

Результат:

```response
┌───x─┬─toTypeName(x)─┐
│ 300 │ Int64         │
└─────┴───────────────┘
```
### JSONExtractFloat {#jsonextractfloat}

Парсит JSON и извлекает значение типа Int.

**Синтаксис**

```sql
JSONExtractFloat(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает значение Float, если оно существует, в противном случае возвращает `0`. [Float64](../data-types/float.md).

**Примеры**

Запрос:

```sql
SELECT JSONExtractFloat('{"a": "hello", "b": [-100, 200.0, 300]}', 'b', 2) as x, toTypeName(x);
```

Результат:

```response
┌───x─┬─toTypeName(x)─┐
│ 200 │ Float64       │
└─────┴───────────────┘
```
### JSONExtractBool {#jsonextractbool}

Парсит JSON и извлекает логическое значение. Если значение не существует или имеет неправильный тип, `0` будет возвращено.

**Синтаксис**

```sql
JSONExtractBool(json[, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает логическое значение, если оно существует, в противном случае возвращает `0`. [Bool](../data-types/boolean.md).

**Пример**

Запрос:

```sql
SELECT JSONExtractBool('{"passed": true}', 'passed');
```

Результат:

```response
┌─JSONExtractBool('{"passed": true}', 'passed')─┐
│                                             1 │
└───────────────────────────────────────────────┘
```
### JSONExtractString {#jsonextractstring}

Парсит JSON и извлекает строку. Эта функция аналогична [`visitParamExtractString`](#simplejsonextractstring). Если значение не существует или имеет неправильный тип, будет возвращена пустая строка.

**Синтаксис**

```sql
JSONExtractString(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает неэкранированную строку из `json`. Если не удалось выполнить эскейпинг, если значение не существует или если имеет неправильный тип, то возвращается пустая строка. [String](../data-types/string.md).

**Примеры**

```sql
SELECT JSONExtractString('{"a": "hello", "b": [-100, 200.0, 300]}', 'a') = 'hello'
SELECT JSONExtractString('{"abc":"\\n\\u0000"}', 'abc') = '\n\0'
SELECT JSONExtractString('{"abc":"\\u263а"}', 'abc') = '☺'
SELECT JSONExtractString('{"abc":"\\u263"}', 'abc') = ''
SELECT JSONExtractString('{"abc":"hello}', 'abc') = ''
```
### JSONExtract {#jsonextract}

Парсит JSON и извлекает значение заданного типа данных ClickHouse. Эта функция является обобщенной версией предыдущих функций `JSONExtract<type>`. Это означает:

`JSONExtract(..., 'String')` возвращает точно то же, что и `JSONExtractString()`,
`JSONExtract(..., 'Float64')` возвращает точно то же, что и `JSONExtractFloat()`.

**Синтаксис**

```sql
JSONExtract(json [, indices_or_keys...], return_type)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).
- `return_type` — Строка, указывающая тип извлекаемого значения. [String](../data-types/string.md). 

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает значение, если оно существует заданного типа возвращаемого значения, в противном случае возвращает `0`, `Null` или пустую строку в зависимости от указанного типа возвращаемого значения. [UInt64](../data-types/int-uint.md), [Int64](../data-types/int-uint.md), [Float64](../data-types/float.md), [Bool](../data-types/boolean.md) или [String](../data-types/string.md).

**Примеры**

```sql
SELECT JSONExtract('{"a": "hello", "b": [-100, 200.0, 300]}', 'Tuple(String, Array(Float64))') = ('hello',[-100,200,300])
SELECT JSONExtract('{"a": "hello", "b": [-100, 200.0, 300]}', 'Tuple(b Array(Float64), a String)') = ([-100,200,300],'hello')
SELECT JSONExtract('{"a": "hello", "b": "world"}', 'Map(String, String)') = map('a',  'hello', 'b', 'world');
SELECT JSONExtract('{"a": "hello", "b": [-100, 200.0, 300]}', 'b', 'Array(Nullable(Int8))') = [-100, NULL, NULL]
SELECT JSONExtract('{"a": "hello", "b": [-100, 200.0, 300]}', 'b', 4, 'Nullable(Int64)') = NULL
SELECT JSONExtract('{"passed": true}', 'passed', 'UInt8') = 1
SELECT JSONExtract('{"day": "Thursday"}', 'day', 'Enum8(\'Sunday\' = 0, \'Monday\' = 1, \'Tuesday\' = 2, \'Wednesday\' = 3, \'Thursday\' = 4, \'Friday\' = 5, \'Saturday\' = 6)') = 'Thursday'
SELECT JSONExtract('{"day": 5}', 'day', 'Enum8(\'Sunday\' = 0, \'Monday\' = 1, \'Tuesday\' = 2, \'Wednesday\' = 3, \'Thursday\' = 4, \'Friday\' = 5, \'Saturday\' = 6)') = 'Friday'
```

Обращаясь к вложенным значениям, передавая несколько параметров indices_or_keys:
```sql
SELECT JSONExtract('{"a":{"b":"hello","c":{"d":[1,2,3],"e":[1,3,7]}}}','a','c','Map(String, Array(UInt8))') AS val, toTypeName(val), val['d'];
```
Результат:
```response
┌─val───────────────────────┬─toTypeName(val)───────────┬─arrayElement(val, 'd')─┐
│ {'d':[1,2,3],'e':[1,3,7]} │ Map(String, Array(UInt8)) │ [1,2,3]                │
└───────────────────────────┴───────────────────────────┴────────────────────────┘
```
### JSONExtractKeysAndValues {#jsonextractkeysandvalues}

Парсит пары ключ-значение из JSON, где значения являются заданного типа данных ClickHouse.

**Синтаксис**

```sql
JSONExtractKeysAndValues(json [, indices_or_keys...], value_type)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).
- `value_type` — Строка, указывающая тип извлекаемого значения. [String](../data-types/string.md). 

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает массив распарсенных пар ключ-значение. [Array](../data-types/array.md)([Tuple](../data-types/tuple.md)(`value_type`)). 

**Пример**

```sql
SELECT JSONExtractKeysAndValues('{"x": {"a": 5, "b": 7, "c": 11}}', 'x', 'Int8') = [('a',5),('b',7),('c',11)];
```
### JSONExtractKeys {#jsonextractkeys}

Парсит JSON-строку и извлекает ключи.

**Синтаксис**

```sql
JSONExtractKeys(json[, a, b, c...])
```

**Параметры**

- `json` — [String](../data-types/string.md) с допустимым JSON.
- `a, b, c...` — Запятая-разделенные индексы или ключи, которые указывают путь к внутреннему полю во вложенном объекте JSON. Каждый аргумент может быть либо [String](../data-types/string.md), чтобы получить поле по ключу, либо [Integer](../data-types/int-uint.md), чтобы получить N-й поле (индексируется с 1, отрицательные числа считаются с конца). Если не установлено, весь JSON парсится как объект верхнего уровня. Необязательный параметр.

**Возвращаемое значение**

- Возвращает массив с ключами JSON. [Array](../data-types/array.md)([String](../data-types/string.md)).

**Пример**

Запрос:

```sql
SELECT JSONExtractKeys('{"a": "hello", "b": [-100, 200.0, 300]}');
```

Результат:

```response
┌─JSONExtractKeys('{"a": "hello", "b": [-100, 200.0, 300]}')─┐
│ ['a','b']                                                  │
└────────────────────────────────────────────────────────────┘
```
### JSONExtractRaw {#jsonextractraw}

Возвращает часть JSON как нераспарсенную строку. Если часть не существует или имеет неправильный тип, будет возвращена пустая строка.

**Синтаксис**

```sql
JSONExtractRaw(json [, indices_or_keys]...)
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает часть JSON как нераспарсенную строку. Если часть не существует или имеет неправильный тип, возвращается пустая строка. [String](../data-types/string.md).

**Пример**

```sql
SELECT JSONExtractRaw('{"a": "hello", "b": [-100, 200.0, 300]}', 'b') = '[-100, 200.0, 300]';
```
### JSONExtractArrayRaw {#jsonextractarrayraw}

Возвращает массив с элементами JSON массива, каждый из которых представляется как нераспарсенная строка. Если часть не существует или не является массивом, то возвращается пустой массив.

**Синтаксис**

```sql
JSONExtractArrayRaw(json [, indices_or_keys...])
```

**Параметры**

- `json` — JSON-строка для парсинга. [String](../data-types/string.md).
- `indices_or_keys` — Список из нуля или более аргументов, каждый из которых может быть либо строкой, либо целым числом. [String](../data-types/string.md), [Int*](../data-types/int-uint.md).

`indices_or_keys` тип:
- String = доступ к члену объекта по ключу.
- Положительное целое число = доступ к n-му члену/ключу с начала.
- Отрицательное целое число = доступ к n-му члену/ключу с конца.

**Возвращаемое значение**

- Возвращает массив с элементами JSON массива, каждый из которых представлен как нераспарсенная строка. В противном случае пустой массив возвращается, если часть не существует или не является массивом. [Array](../data-types/array.md)([String](../data-types/string.md)).

**Пример**

```sql
SELECT JSONExtractArrayRaw('{"a": "hello", "b": [-100, 200.0, "hello"]}', 'b') = ['-100', '200.0', '"hello"'];
```
### JSONExtractKeysAndValuesRaw {#jsonextractkeysandvaluesraw}

Извлекает нераспарсенные данные из JSON объекта.

**Синтаксис**

```sql
JSONExtractKeysAndValuesRaw(json[, p, a, t, h])
```

**Аргументы**

- `json` — [String](../data-types/string.md) с допустимым JSON.
- `p, a, t, h` — Запятая-разделенные индексы или ключи, которые указывают путь к внутреннему полю во вложенном объекте JSON. Каждый аргумент может быть либо строкой [String](../data-types/string.md), чтобы получить поле по ключу, либо целым числом [Integer](../data-types/int-uint.md), чтобы получить N-й член (индексированный с 1, отрицательные числа считают с конца). Если не установлено, весь JSON парсится как объект верхнего уровня. Необязательный параметр.

**Возвращаемые значения**

- Массив с кортежами `('key', 'value')`. Оба члена кортежа являются строками. [Array](../data-types/array.md)([Tuple](../data-types/tuple.md)([String](../data-types/string.md), [String](../data-types/string.md))).
- Пустой массив, если запрашиваемый объект не существует или входной JSON недействителен. [Array](../data-types/array.md)([Tuple](../data-types/tuple.md)([String](../data-types/string.md), [String](../data-types/string.md))).

**Примеры**

Запрос:

```sql
SELECT JSONExtractKeysAndValuesRaw('{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}');
```

Результат:

```text
┌─JSONExtractKeysAndValuesRaw('{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}')─┐
│ [('a','[-100,200]'),('b','{"c":{"d":"hello","f":"world"}}')]                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Запрос:

```sql
SELECT JSONExtractKeysAndValuesRaw('{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}', 'b');
```

Результат:

```text
┌─JSONExtractKeysAndValuesRaw('{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}', 'b')─┐
│ [('c','{"d":"hello","f":"world"}')]                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Запрос:

```sql
SELECT JSONExtractKeysAndValuesRaw('{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}', -1, 'c');
```

Результат:

```text
┌─JSONExtractKeysAndValuesRaw('{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}', -1, 'c')─┐
│ [('d','"hello"'),('f','"world"')]                                                                     │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
### JSON_EXISTS {#json_exists}

Если значение существует в документе JSON, будет возвращено `1`. Если значение не существует, будет возвращено `0`.

**Синтаксис**

```sql
JSON_EXISTS(json, path)
```

**Параметры**

- `json` — Строка с допустимым JSON. [String](../data-types/string.md). 
- `path` — Строка, представляющая путь. [String](../data-types/string.md).

:::note
До версии 21.11 порядок аргументов был неверным, т.е. JSON_EXISTS(path, json)
:::

**Возвращаемое значение**

- Возвращает `1`, если значение существует в документе JSON, в противном случае `0`.

**Примеры**

```sql
SELECT JSON_EXISTS('{"hello":1}', '$.hello');
SELECT JSON_EXISTS('{"hello":{"world":1}}', '$.hello.world');
SELECT JSON_EXISTS('{"hello":["world"]}', '$.hello[*]');
SELECT JSON_EXISTS('{"hello":["world"]}', '$.hello[0]');
```
### JSON_QUERY {#json_query}

Парсит JSON и извлекает значение в виде JSON массива или объекта. Если значение не существует, будет возвращена пустая строка.

**Синтаксис**

```sql
JSON_QUERY(json, path)
```

**Параметры**

- `json` — Строка с допустимым JSON. [String](../data-types/string.md). 
- `path` — Строка, представляющая путь. [String](../data-types/string.md).

:::note
До версии 21.11 порядок аргументов был неверным, т.е. JSON_EXISTS(path, json)
:::

**Возвращаемое значение**

- Возвращает извлеченное значение в виде JSON массива или объекта. В противном случае оно возвращает пустую строку, если значение не существует. [String](../data-types/string.md).

**Пример**

Запрос:

```sql
SELECT JSON_QUERY('{"hello":"world"}', '$.hello');
SELECT JSON_QUERY('{"array":[[0, 1, 2, 3, 4, 5], [0, -1, -2, -3, -4, -5]]}', '$.array[*][0 to 2, 4]');
SELECT JSON_QUERY('{"hello":2}', '$.hello');
SELECT toTypeName(JSON_QUERY('{"hello":2}', '$.hello'));
```

Результат:

```text
["world"]
[0, 1, 4, 0, -1, -4]
[2]
String
```
### JSON_VALUE {#json_value}

Парсит JSON и извлекает значение в виде скалярного значения JSON. Если значение не существует, по умолчанию будет возвращена пустая строка.

Эта функция контролируется следующими настройками:

- при SET `function_json_value_return_type_allow_nullable` = `true`, будет возвращено `NULL`. Если значение имеет сложный тип (например: struct, array, map), по умолчанию будет возвращена пустая строка.
- при SET `function_json_value_return_type_allow_complex` = `true`, будет возвращено сложное значение.

**Синтаксис**

```sql
JSON_VALUE(json, path)
```

**Параметры**

- `json` — Строка с допустимым JSON. [String](../data-types/string.md). 
- `path` — Строка, представляющая путь. [String](../data-types/string.md).

:::note
До версии 21.11 порядок аргументов был неверным, т.е. JSON_EXISTS(path, json)
:::

**Возвращаемое значение**

- Возвращает извлеченное значение в виде скалярного значения JSON, если оно существует, в противном случае возвращается пустая строка. [String](../data-types/string.md).

**Пример**

Запрос:

```sql
SELECT JSON_VALUE('{"hello":"world"}', '$.hello');
SELECT JSON_VALUE('{"array":[[0, 1, 2, 3, 4, 5], [0, -1, -2, -3, -4, -5]]}', '$.array[*][0 to 2, 4]');
SELECT JSON_VALUE('{"hello":2}', '$.hello');
SELECT toTypeName(JSON_VALUE('{"hello":2}', '$.hello'));
select JSON_VALUE('{"hello":"world"}', '$.b') settings function_json_value_return_type_allow_nullable=true;
select JSON_VALUE('{"hello":{"world":"!"}}', '$.hello') settings function_json_value_return_type_allow_complex=true;
```

Результат:

```text
world
0
2
String
```
### toJSONString {#tojsonstring}

Сериализует значение в его JSON представление. Поддерживаются различные типы данных и вложенные структуры.
64-битные [целые числа](../data-types/int-uint.md) или больше (например `UInt64` или `Int128`) по умолчанию заключаются в кавычки. [output_format_json_quote_64bit_integers](/operations/settings/formats#output_format_json_quote_64bit_integers) контролирует это поведение.
Специальные значения `NaN` и `inf` заменяются на `null`. Включите настройку [output_format_json_quote_denormals](/operations/settings/formats#output_format_json_quote_denormals), чтобы отобразить их.
При сериализации значения [Enum](../data-types/enum.md) функция выводит его имя.

**Синтаксис**

```sql
toJSONString(value)
```

**Аргументы**

- `value` — Значение для сериализации. Значение может быть любого типа данных.

**Возвращаемое значение**

- JSON представление значения. [String](../data-types/string.md).

**Пример**

Первый пример показывает сериализацию [Map](../data-types/map.md).
Второй пример показывает некоторые специальные значения, заключенные в [Tuple](../data-types/tuple.md).

Запрос:

```sql
SELECT toJSONString(map('key1', 1, 'key2', 2));
SELECT toJSONString(tuple(1.25, NULL, NaN, +inf, -inf, [])) SETTINGS output_format_json_quote_denormals = 1;
```

Результат:

```text
{"key1":1,"key2":2}
[1.25,null,"nan","inf","-inf",[]]
```

**См. также**

- [output_format_json_quote_64bit_integers](/operations/settings/formats#output_format_json_quote_64bit_integers)
- [output_format_json_quote_denormals](/operations/settings/formats#output_format_json_quote_denormals)
### JSONArrayLength {#jsonarraylength}

Возвращает количество элементов в самом внешнем JSON массиве. Функция возвращает NULL, если входная строка JSON недействительна.

**Синтаксис**

```sql
JSONArrayLength(json)
```

Псевдоним: `JSON_ARRAY_LENGTH(json)`.

**Аргументы**

- `json` — [String](../data-types/string.md) с допустимым JSON.

**Возвращаемое значение**

- Если `json` является допустимой строкой JSON массива, возвращает количество элементов массива, в противном случае возвращает NULL. [Nullable(UInt64)](../data-types/int-uint.md).

**Пример**

```sql
SELECT
    JSONArrayLength(''),
    JSONArrayLength('[1,2,3]')

┌─JSONArrayLength('')─┬─JSONArrayLength('[1,2,3]')─┐
│                ᴺᵁᴸᴸ │                          3 │
└─────────────────────┴────────────────────────────┘
```
### jsonMergePatch {#jsonmergepatch}

Возвращает объединенную строку JSON объекта, которая формируется путем объединения нескольких JSON объектов.

**Синтаксис**

```sql
jsonMergePatch(json1, json2, ...)
```

**Аргументы**

- `json` — [String](../data-types/string.md) с допустимым JSON.

**Возвращаемое значение**

- Если строки JSON объектов действительны, возвращает объединенную строку JSON объекта. [String](../data-types/string.md).

**Пример**

```sql
SELECT jsonMergePatch('{"a":1}', '{"name": "joey"}', '{"name": "tom"}', '{"name": "zoey"}') AS res

┌─res───────────────────┐
│ {"a":1,"name":"zoey"} │
└───────────────────────┘
```
### JSONAllPaths {#jsonallpaths}

Возвращает список всех путей, хранящихся в каждой строке в [JSON](../data-types/newjson.md) столбце.

**Синтаксис**

```sql
JSONAllPaths(json)
```

**Аргументы**

- `json` — [JSON](../data-types/newjson.md).

**Возвращаемое значение**

- Массив путей. [Array(String)](../data-types/array.md).

**Пример**

```sql
CREATE TABLE test (json JSON(max_dynamic_paths=1)) ENGINE = Memory;
INSERT INTO test FORMAT JSONEachRow {"json" : {"a" : 42}}, {"json" : {"b" : "Hello"}}, {"json" : {"a" : [1, 2, 3], "c" : "2020-01-01"}}
SELECT json, JSONAllPaths(json) FROM test;
```

```response
┌─json─────────────────────────────────┬─JSONAllPaths(json)─┐
│ {"a":"42"}                           │ ['a']              │
│ {"b":"Hello"}                        │ ['b']              │
│ {"a":["1","2","3"],"c":"2020-01-01"} │ ['a','c']          │
└──────────────────────────────────────┴────────────────────┘
```
### JSONAllPathsWithTypes {#jsonallpathswithtypes}

Возвращает карту всех путей и их типов данных, хранящихся в каждой строке в [JSON](../data-types/newjson.md) столбце.

**Синтаксис**

```sql
JSONAllPathsWithTypes(json)
```

**Аргументы**

- `json` — [JSON](../data-types/newjson.md).

**Возвращаемое значение**

- Массив путей. [Map(String, String)](../data-types/array.md).

**Пример**

```sql
CREATE TABLE test (json JSON(max_dynamic_paths=1)) ENGINE = Memory;
INSERT INTO test FORMAT JSONEachRow {"json" : {"a" : 42}}, {"json" : {"b" : "Hello"}}, {"json" : {"a" : [1, 2, 3], "c" : "2020-01-01"}}
SELECT json, JSONAllPathsWithTypes(json) FROM test;
```

```response
┌─json─────────────────────────────────┬─JSONAllPathsWithTypes(json)───────────────┐
│ {"a":"42"}                           │ {'a':'Int64'}                             │
│ {"b":"Hello"}                        │ {'b':'String'}                            │
│ {"a":["1","2","3"],"c":"2020-01-01"} │ {'a':'Array(Nullable(Int64))','c':'Date'} │
└──────────────────────────────────────┴───────────────────────────────────────────┘
```
### JSONDynamicPaths {#jsondynamicpaths}

Возвращает список динамических путей, которые хранятся как отдельные подстолбцы в [JSON](../data-types/newjson.md) столбце.

**Синтаксис**

```sql
JSONDynamicPaths(json)
```

**Аргументы**

- `json` — [JSON](../data-types/newjson.md).

**Возвращаемое значение**

- Массив путей. [Array(String)](../data-types/array.md).

**Пример**

```sql
CREATE TABLE test (json JSON(max_dynamic_paths=1)) ENGINE = Memory;
INSERT INTO test FORMAT JSONEachRow {"json" : {"a" : 42}}, {"json" : {"b" : "Hello"}}, {"json" : {"a" : [1, 2, 3], "c" : "2020-01-01"}}
SELECT json, JSONDynamicPaths(json) FROM test;
```

```response
┌─json─────────────────────────────────┬─JSONDynamicPaths(json)─┐
| {"a":"42"}                           │ ['a']                  │
│ {"b":"Hello"}                        │ []                     │
│ {"a":["1","2","3"],"c":"2020-01-01"} │ ['a']                  │
└──────────────────────────────────────┴────────────────────────┘
```
### JSONDynamicPathsWithTypes {#jsondynamicpathswithtypes}

Возвращает карту динамических путей, которые хранятся как отдельные подстолбцы и их типы в каждой строке в [JSON](../data-types/newjson.md) столбце.

**Синтаксис**

```sql
JSONAllPathsWithTypes(json)
```

**Аргументы**

- `json` — [JSON](../data-types/newjson.md).

**Возвращаемое значение**

- Массив путей. [Map(String, String)](../data-types/array.md).

**Пример**

```sql
CREATE TABLE test (json JSON(max_dynamic_paths=1)) ENGINE = Memory;
INSERT INTO test FORMAT JSONEachRow {"json" : {"a" : 42}}, {"json" : {"b" : "Hello"}}, {"json" : {"a" : [1, 2, 3], "c" : "2020-01-01"}}
SELECT json, JSONDynamicPathsWithTypes(json) FROM test;
```

```response
┌─json─────────────────────────────────┬─JSONDynamicPathsWithTypes(json)─┐
│ {"a":"42"}                           │ {'a':'Int64'}                   │
│ {"b":"Hello"}                        │ {}                              │
│ {"a":["1","2","3"],"c":"2020-01-01"} │ {'a':'Array(Nullable(Int64))'}  │
└──────────────────────────────────────┴─────────────────────────────────┘
```
### JSONSharedDataPaths {#jsonshareddatapaths}

Возвращает список путей, которые хранятся в общей структуре данных в [JSON](../data-types/newjson.md) столбце.

**Синтаксис**

```sql
JSONSharedDataPaths(json)
```

**Аргументы**

- `json` — [JSON](../data-types/newjson.md).

**Возвращаемое значение**

- Массив путей. [Array(String)](../data-types/array.md).

**Пример**

```sql
CREATE TABLE test (json JSON(max_dynamic_paths=1)) ENGINE = Memory;
INSERT INTO test FORMAT JSONEachRow {"json" : {"a" : 42}}, {"json" : {"b" : "Hello"}}, {"json" : {"a" : [1, 2, 3], "c" : "2020-01-01"}}
SELECT json, JSONSharedDataPaths(json) FROM test;
```

```response
┌─json─────────────────────────────────┬─JSONSharedDataPaths(json)─┐
│ {"a":"42"}                           │ []                        │
│ {"b":"Hello"}                        │ ['b']                     │
│ {"a":["1","2","3"],"c":"2020-01-01"} │ ['c']                     │
└──────────────────────────────────────┴───────────────────────────┘
```
### JSONSharedDataPathsWithTypes {#jsonshareddatapathswithtypes}

Возвращает карту путей, которые хранятся в общей структуре данных и их типов в каждой строке в [JSON](../data-types/newjson.md) столбце.

**Синтаксис**

```sql
JSONSharedDataPathsWithTypes(json)
```

**Аргументы**

- `json` — [JSON](../data-types/newjson.md).

**Возвращаемое значение**

- Массив путей. [Map(String, String)](../data-types/array.md).

**Пример**

```sql
CREATE TABLE test (json JSON(max_dynamic_paths=1)) ENGINE = Memory;
INSERT INTO test FORMAT JSONEachRow {"json" : {"a" : 42}}, {"json" : {"b" : "Hello"}}, {"json" : {"a" : [1, 2, 3], "c" : "2020-01-01"}}
SELECT json, JSONSharedDataPathsWithTypes(json) FROM test;
```

```response
┌─json─────────────────────────────────┬─JSONSharedDataPathsWithTypes(json)─┐
│ {"a":"42"}                           │ {}                                 │
│ {"b":"Hello"}                        │ {'b':'String'}                     │
│ {"a":["1","2","3"],"c":"2020-01-01"} │ {'c':'Date'}                       │
└──────────────────────────────────────┴────────────────────────────────────┘
```
