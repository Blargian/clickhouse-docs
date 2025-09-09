---
sidebar_label: 'SQL translation reference'
slug: /migrations/redshift/sql-translation-reference
description: 'SQL translation reference for Amazon Redshift to ClickHouse'
keywords: ['Redshift']
title: 'Amazon Redshift SQL translation guide'
doc_type: 'reference'
---

# Amazon Redshift SQL translation guide

## Data types {#data-types}

Users moving data between ClickHouse and Redshift will immediately notice
that ClickHouse offers a more extensive range of types, which are also less
restrictive. While Redshift requires users to specify possible string
lengths, even if variable, ClickHouse removes this restriction and burden
from the user by storing strings without encoding as bytes. The ClickHouse
String type thus has no limits or length specification requirements.

Furthermore, users can exploit Arrays, Tuples, and Enums - absent from
Redshift as first-class citizens (although Arrays/Structs can be imitated
with `SUPER`) and a common frustration of users. ClickHouse additionally
allows the persistence, either at query time or even in a table, of
aggregation states. This will enable data to be pre-aggregated, typically
using a materialized view, and can dramatically improve query performance
for common queries.

Below we map the equivalent ClickHouse type for each Redshift type:

| Redshift                                                                                                                           | ClickHouse                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`SMALLINT`](https://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-integer-types)                | [`Int8`](/sql-reference/data-types/int-uint) *                                                                                                                                                                                                                                                                                                                                                                       |
| [`INTEGER`](https://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-integer-types)                 | [`Int32`](/sql-reference/data-types/int-uint) *                                                                                                                                                                                                                                                                                                                                                                      |
| [`BIGINT`](https://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-integer-types)                  | [`Int64`](/sql-reference/data-types/int-uint) *                                                                                                                                                                                                                                                                                                                                                                      |
| [`DECIMAL`](https://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-decimal-or-numeric-type)       | [`UInt128`, `UInt256`, `Int128`, `Int256`](/sql-reference/data-types/int-uint), [`Decimal(P, S)`, `Decimal32(S)`, `Decimal64(S)`, `Decimal128(S)`, `Decimal256(S)`](/sql-reference/data-types/decimal) - (high precision and ranges possible)                                                                                                                                                          |
| [`REAL`](https://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-floating-point-types)             | [`Float32`](/sql-reference/data-types/float)                                                                                                                                                                                                                                                                                                                                                                         |
| [`DOUBLE PRECISION`](https://docs.aws.amazon.com/redshift/latest/dg/r_Numeric_types201.html#r_Numeric_types201-floating-point-types) | [`Float64`](/sql-reference/data-types/float)                                                                                                                                                                                                                                                                                                                                                                         |
| [`BOOLEAN`](https://docs.aws.amazon.com/redshift/latest/dg/r_Boolean_type.html)                                                      | [`Bool`](/sql-reference/data-types/boolean)                                                                                                                                                                                                                                                                                                                                                                          |
| [`CHAR`](https://docs.aws.amazon.com/redshift/latest/dg/r_Character_types.html#r_Character_types-char-or-character)                  | [`String`](/sql-reference/data-types/string), [`FixedString`](/sql-reference/data-types/fixedstring)                                                                                                                                                                                                                                                                                     |
| [`VARCHAR`](https://docs.aws.amazon.com/redshift/latest/dg/r_Character_types.html#r_Character_types-varchar-or-character-varying) ** | [`String`](/sql-reference/data-types/string)                                                                                                                                                                                                                                                                                                                                                                         |
| [`DATE`](https://docs.aws.amazon.com/redshift/latest/dg/r_Datetime_types.html#r_Datetime_types-date)                                 | [`Date32`](/sql-reference/data-types/date32)                                                                                                                                                                                                                                                                                                                                                                         |
| [`TIMESTAMP`](https://docs.aws.amazon.com/redshift/latest/dg/r_Datetime_types.html#r_Datetime_types-timestamp)                       | [`DateTime`](/sql-reference/data-types/datetime), [`DateTime64`](/sql-reference/data-types/datetime64)                                                                                                                                                                                                                                                                                   |
| [`TIMESTAMPTZ`](https://docs.aws.amazon.com/redshift/latest/dg/r_Datetime_types.html#r_Datetime_types-timestamptz)                   | [`DateTime`](/sql-reference/data-types/datetime), [`DateTime64`](/sql-reference/data-types/datetime64)                                                                                                                                                                                                                                                                                   |
| [`GEOMETRY`](https://docs.aws.amazon.com/redshift/latest/dg/geospatial-overview.html)                                                | [Geo Data Types](/sql-reference/data-types/geo)                                                                                                                                                                                                                                                                                                                                                                    |
| [`GEOGRAPHY`](https://docs.aws.amazon.com/redshift/latest/dg/geospatial-overview.html)                                               | [Geo Data Types](/sql-reference/data-types/geo) (less developed e.g. no coordinate systems - can be emulated [with functions](/sql-reference/functions/geo/))                                                                                                                                                                                                                        |
| [`HLLSKETCH`](https://docs.aws.amazon.com/redshift/latest/dg/r_HLLSKTECH_type.html)                                                  | [`AggregateFunction(uniqHLL12, X)`](/sql-reference/data-types/aggregatefunction)                                                                                                                                                                                                                                                                                                                                     |
| [`SUPER`](https://docs.aws.amazon.com/redshift/latest/dg/r_SUPER_type.html)                                                          | [`Tuple`](/sql-reference/data-types/tuple), [`Nested`](/sql-reference/data-types/nested-data-structures/nested), [`Array`](/sql-reference/data-types/array), [`JSON`](/sql-reference/data-types/newjson), [`Map`](/sql-reference/data-types/map) |
| [`TIME`](https://docs.aws.amazon.com/redshift/latest/dg/r_Datetime_types.html#r_Datetime_types-time)                                 | [`DateTime`](/sql-reference/data-types/datetime), [`DateTime64`](/sql-reference/data-types/datetime64)                                                                                                                                                                                                                                                                                   |
| [`TIMETZ`](https://docs.aws.amazon.com/redshift/latest/dg/r_Datetime_types.html#r_Datetime_types-timetz)                             | [`DateTime`](/sql-reference/data-types/datetime), [`DateTime64`](/sql-reference/data-types/datetime64)                                                                                                                                                                                                                                                                                   |
| [`VARBYTE`](https://docs.aws.amazon.com/redshift/latest/dg/r_VARBYTE_type.html) **                                                   | [`String`](/sql-reference/data-types/string) combined with [`Bit`](/sql-reference/functions/bit-functions) and [Encoding](/sql-reference/functions/encoding-functions/#hex) functions                                                                                                                                                                      |

<sub><span>*</span> ClickHouse additionally supports unsigned integers with extended ranges i.e. <a href='http://clickhouse.com/docs/sql-reference/data-types/int-uint'>`UInt8`, `UInt32`, `UInt32` and `UInt64`</a>.</sub><br />
<sub><span>**</span>ClickHouse’s String type is unlimited by default but can be constrained to specific lengths using <a href='http://clickhouse.com/docs/sql-reference/statements/create/table#constraints'>Constraints</a>.</sub>

## DDL syntax {#compression}

### Sorting keys {#sorting-keys}

Both ClickHouse and Redshift have the concept of a “sorting key”, which define 
how data is sorted when being stored. Redshift defines the sorting key using the
`SORTKEY` clause:

```sql
CREATE TABLE some_table(...) SORTKEY (column1, column2)
```

Comparatively, ClickHouse uses an `ORDER BY` clause to specify the sort order:

```sql
CREATE TABLE some_table(...) ENGINE = MergeTree ORDER BY (column1, column2)
```

In most cases, you can use the same sorting key columns and order in ClickHouse
as Redshift, assuming you are using the default `COMPOUND` type. When data is 
added to Redshift, you should run the `VACUUM` and `ANALYZE` commands to re-sort
newly added data and update the statistics for the query planner - otherwise, the
unsorted space grows. No such process is required for ClickHouse.

Redshift supports a couple of convenience features for sorting keys. The first is 
automatic sorting keys (using `SORTKEY AUTO`). While this may be appropriate for 
getting started, explicit sorting keys ensure the best performance and storage 
efficiency when the sorting key is optimal. The second is the `INTERLEAVED` sort key,
which gives equal weight to a subset of columns in the sort key to improve 
performance when a query uses one or more secondary sort columns. ClickHouse 
supports explicit [projections](/data-modeling/projections), which achieve the 
same end-result with a slightly different setup.

Users should be aware that the “primary key” concept represents different things
in ClickHouse and Redshift. In Redshift, the primary key resembles the traditional
RDMS concept intended to enforce constraints. However, they are not strictly 
enforced in Redshift and instead act as hints for the query planner and data 
distribution among nodes. In ClickHouse, the primary key denotes columns used 
to construct the sparse primary index, used to ensure the data is ordered on 
disk, maximizing compression while avoiding pollution of the primary index and 
wasting memory.
