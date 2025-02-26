---
title: clickhouse-localデータベースの使用
sidebar_label: clickhouse-localデータベースの使用
slug: /chdb/guides/clickhouse-local
description: chDBを使用してclickhouse-localデータベースを利用する方法を学びます
keywords: [chdb, clickhouse-local]
---

[clickhouse-local](/operations/utilities/clickhouse-local)は、埋め込み版のClickHouseを搭載したCLIです。  
これにより、ユーザーはサーバーをインストールすることなくClickHouseの機能を利用できます。  
このガイドでは、chDBを使用してclickhouse-localデータベースを利用する方法を学びます。

## セットアップ {#setup}

まず、仮想環境を作成しましょう：

```bash
python -m venv .venv
source .venv/bin/activate
```

次に、chDBをインストールします。  
バージョン2.0.2以上であることを確認してください：

```bash
pip install "chdb>=2.0.2"
```

次に、[ipython](https://ipython.org/)をインストールします：

```bash
pip install ipython
```

このガイドの残りの部分でコマンドを実行するために`ipython`を使用します。`ipython`は以下のコマンドで起動できます：

```bash
ipython
```

## clickhouse-localのインストール {#installing-clickhouse-local}

clickhouse-localのダウンロードとインストールは[ClickHouseのダウンロードとインストール](/install)と同様です。  
次のコマンドを実行してこれを行います：

```bash
curl https://clickhouse.com/ | sh
```

データをディレクトリに保持するためにclickhouse-localを起動するには、`--path`オプションを指定する必要があります：

```bash
./clickhouse -m --path demo.chdb
```

## clickhouse-localへのデータの取り込み {#ingesting-data-into-clickhouse-local}

デフォルトのデータベースはメモリ内にのみデータを保存するため、格納したデータがディスクに持続されるように名前付きデータベースを作成する必要があります。

```sql
CREATE DATABASE foo;
```

テーブルを作成し、いくつかのランダムな数字を挿入しましょう：

```sql
CREATE TABLE foo.randomNumbers
ORDER BY number AS
SELECT rand() AS number
FROM numbers(10_000_000);
```

どのようなデータがあるかを確認するためにクエリを書きましょう：

```sql
SELECT quantilesExact(0, 0.5, 0.75, 0.99)(number) AS quants
FROM foo.randomNumbers

┌─quants────────────────────────────────┐
│ [69,2147776478,3221525118,4252096960] │
└───────────────────────────────────────┘
```

これが完了したら、CLIから`exit;`して退出してください。このディレクトリのロックを保持できるのは一つのプロセスのみです。  
これを行わないと、chDBからデータベースに接続しようとすると以下のエラーが発生します：

```text
ChdbError: Code: 76. DB::Exception: Cannot lock file demo.chdb/status. Another server instance in same directory is already running. (CANNOT_OPEN_FILE)
```

## clickhouse-localデータベースへの接続 {#connecting-to-a-clickhouse-local-database}

`ipython`シェルに戻り、chDBから`session`モジュールをインポートします：

```python
from chdb import session as chs
```

`demo.chdb`を指すセッションを初期化します：

```python
sess = chs.Session("demo.chdb")
```

次に、数値の分位数を返す同じクエリを実行できます：

```python
sess.query("""
SELECT quantilesExact(0, 0.5, 0.75, 0.99)(number) AS quants
FROM foo.randomNumbers
""", "Vertical")

Row 1:
──────
quants: [0,9976599,2147776478,4209286886]
```

このデータベースにchDBからデータを挿入することもできます：

```python
sess.query("""
INSERT INTO foo.randomNumbers
SELECT rand() AS number FROM numbers(10_000_000)
""")

Row 1:
──────
quants: [0,9976599,2147776478,4209286886]
```

その後、chDBまたはclickhouse-localから分位数のクエリを再実行することができます。
