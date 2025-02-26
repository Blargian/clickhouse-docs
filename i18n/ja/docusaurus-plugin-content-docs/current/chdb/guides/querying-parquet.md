---
title: Parquetファイルのクエリ方法
sidebar_label: Parquetファイルのクエリ
slug: /chdb/guides/querying-parquet
description: chDBを使用してParquetファイルをクエリする方法を学びましょう。
keywords: [chdb, parquet]
---

世界の多くのデータはAmazon S3バケットに存在しています。
このガイドでは、chDBを使用してそのデータをクエリする方法を学びます。

## セットアップ {#setup}

まず、仮想環境を作成します。

```bash
python -m venv .venv
source .venv/bin/activate
```

次に、chDBをインストールします。
バージョン2.0.2以上が必要です。

```bash
pip install "chdb>=2.0.2"
```

次にIPythonをインストールします。

```bash
pip install ipython
```

このガイドの残りの部分でコマンドを実行するために`ipython`を使用します。`ipython`は以下のコマンドを実行して起動できます。

```bash
ipython
```

また、Pythonスクリプトやお気に入りのノートブックでもコードを使用できます。

## Parquetメタデータの調査 {#exploring-parquet-metadata}

[Amazonレビュー](/getting-started/example-datasets/amazon-reviews)データセットからParquetファイルを調査します。
まず、`chDB`をインストールします。

```python
import chdb
```

Parquetファイルをクエリするとき、[`ParquetMetadata`](/interfaces/formats#parquetmetadata-data-format-parquet-metadata)という入力形式を使用して、ファイルの内容ではなくParquetメタデータを返すことができます。
この形式を使用して返されるフィールドを確認するために、`DESCRIBE`句を使用します。

```python
query = """
DESCRIBE s3(
  'https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2015.snappy.parquet', 
  ParquetMetadata
)
SETTINGS describe_compact_output=1
"""

chdb.query(query, 'TabSeparated')
```

```text
num_columns	UInt64
num_rows	UInt64
num_row_groups	UInt64
format_version	String
metadata_size	UInt64
total_uncompressed_size	UInt64
total_compressed_size	UInt64
columns	Array(Tuple(name String, path String, max_definition_level UInt64, max_repetition_level UInt64, physical_type String, logical_type String, compression String, total_uncompressed_size UInt64, total_compressed_size UInt64, space_saved String, encodings Array(String)))
row_groups	Array(Tuple(num_columns UInt64, num_rows UInt64, total_uncompressed_size UInt64, total_compressed_size UInt64, columns Array(Tuple(name String, path String, total_compressed_size UInt64, total_uncompressed_size UInt64, have_statistics Bool, statistics Tuple(num_values Nullable(UInt64), null_count Nullable(UInt64), distinct_count Nullable(UInt64), min Nullable(String), max Nullable(String))))))
```

このファイルのメタデータを見てみましょう。
`columns`と`row_groups`はそれぞれ多くのプロパティを含むタプルの配列が含まれているため、今はそれらを除外します。

```python
query = """
SELECT * EXCEPT(columns, row_groups)
FROM s3(
  'https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2015.snappy.parquet', 
  ParquetMetadata
)
"""

chdb.query(query, 'Vertical')
```

```text
Row 1:
──────
num_columns:             15
num_rows:                41905631
num_row_groups:          42
format_version:          2.6
metadata_size:           79730
total_uncompressed_size: 14615827169
total_compressed_size:   9272262304
```

この出力から、このParquetファイルには4200万行以上があり、42の行グループに分かれていることがわかります。各行には15のカラムのデータがあります。
行グループはデータを行に対して論理的に水平方向にパーティショニングしたものです。
各行グループにはメタデータが関連付けられており、クエリツールはそのメタデータを利用してファイルを効率的にクエリできます。

行グループの1つを見てみましょう。

```python
query = """
WITH rowGroups AS (
    SELECT rg
    FROM s3(
    'https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2015.snappy.parquet',
    ParquetMetadata
    )
    ARRAY JOIN row_groups AS rg
    LIMIT 1
)
SELECT tupleElement(c, 'name') AS name, tupleElement(c, 'total_compressed_size') AS total_compressed_size, 
       tupleElement(c, 'total_uncompressed_size') AS total_uncompressed_size,
       tupleElement(tupleElement(c, 'statistics'), 'min') AS min,
       tupleElement(tupleElement(c, 'statistics'), 'max') AS max
FROM rowGroups
ARRAY JOIN tupleElement(rg, 'columns') AS c
"""

chdb.query(query, 'DataFrame')
```

```text
                 name  total_compressed_size  total_uncompressed_size                                                min                                                max
0         review_date                    493                      646                                              16455                                              16472
1         marketplace                     66                       64                                                 US                                                 US
2         customer_id                5207967                  7997207                                              10049                                           53096413
3           review_id               14748425                 17991290                                     R10004U8OQDOGE                                      RZZZUTBAV1RYI
4          product_id                8003456                 13969668                                         0000032050                                         BT00DDVMVQ
5      product_parent                5758251                  7974737                                                645                                          999999730
6       product_title               41068525                 63355320  ! Small S 1pc Black 1pc Navy (Blue) Replacemen...                            🌴 Vacation On The Beach
7    product_category                   1726                     1815                                            Apparel                                       Pet Products
8         star_rating                 369036                   374046                                                  1                                                  5
9       helpful_votes                 538940                  1022990                                                  0                                               3440
10        total_votes                 610902                  1080520                                                  0                                               3619
11               vine                  11426                   125999                                                  0                                                  1
12  verified_purchase                 102634                   125999                                                  0                                                  1
13    review_headline               16538189                 27634740                                                     🤹🏽‍♂️🎤Great product. Practice makes perfect. D...
14        review_body              145886383                232457911                                                                                              🚅 +🐧=💥 😀
```

## Parquetファイルのクエリ {#querying-parquet-files}

次に、ファイルの内容をクエリします。
これを行うには、上記のクエリを調整して`ParquetMetadata`を取り除き、すべてのレビューにおける最も人気のある`star_rating`を計算します。

```python
query = """
SELECT star_rating, count() AS count, formatReadableQuantity(count)
FROM s3(
  'https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2015.snappy.parquet'
)
GROUP BY ALL
ORDER BY star_rating
"""

chdb.query(query, 'DataFrame')
```

```text
   star_rating     count formatReadableQuantity(count())
0            1   3253070                    3.25 million
1            2   1865322                    1.87 million
2            3   3130345                    3.13 million
3            4   6578230                    6.58 million
4            5  27078664                   27.08 million
```

興味深いことに、5つ星のレビューは他のすべての評価を合わせた数よりも多いです！
どうやら、Amazonの製品が気に入られているようですが、そうでない場合は評価を提出しないだけのようです。
