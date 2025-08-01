---
description: 'Allows `SELECT` queries to be performed on data that is stored on
  a remote MongoDB server.'
sidebar_label: 'mongodb'
sidebar_position: 135
slug: '/sql-reference/table-functions/mongodb'
title: 'mongodb'
---




# mongodb テーブル関数

リモートの MongoDB サーバーに保存されているデータに対して `SELECT` クエリを実行できるようにします。

## 構文 {#syntax}

```sql
mongodb(host:port, database, collection, user, password, structure[, options[, oid_columns]])
```

## 引数 {#arguments}

| 引数          | 説明                                                                                                   |
|---------------|--------------------------------------------------------------------------------------------------------|
| `host:port`   | MongoDB サーバーのアドレス。                                                                           |
| `database`    | リモートデータベースの名前。                                                                           |
| `collection`  | リモートコレクションの名前。                                                                           |
| `user`        | MongoDB ユーザー。                                                                                     |
| `password`    | ユーザーパスワード。                                                                                   |
| `structure`   | この関数から返される ClickHouse テーブルのスキーマ。                                                  |
| `options`     | MongoDB 接続文字列オプション（任意のパラメータ）。                                                    |
| `oid_columns` | WHERE 句で `oid` として扱うべきカラムのカンマ区切りリスト。デフォルトでは `_id`。                     |

:::tip
MongoDB Atlas クラウドオファリングを使用している場合は、次のオプションを追加してください：

```ini
'connectTimeoutMS=10000&ssl=true&authSource=admin'
```
:::

URI による接続も可能です：

```sql
mongodb(uri, collection, structure[, oid_columns])
```

| 引数          | 説明                                                                                                   |
|---------------|--------------------------------------------------------------------------------------------------------|
| `uri`         | 接続文字列。                                                                                          |
| `collection`  | リモートコレクションの名前。                                                                           |
| `structure`   | この関数から返される ClickHouse テーブルのスキーマ。                                                  |
| `oid_columns` | WHERE 句で `oid` として扱うべきカラムのカンマ区切りリスト。デフォルトでは `_id`。                     |

## 戻り値 {#returned_value}

元の MongoDB テーブルと同じカラムを持つテーブルオブジェクト。

## 例 {#examples}

`test` という MongoDB データベースに `my_collection` というコレクションが定義されているとしましょう。いくつかのドキュメントを挿入します：

```sql
db.createUser({user:"test_user",pwd:"password",roles:[{role:"readWrite",db:"test"}]})

db.createCollection("my_collection")

db.my_collection.insertOne(
    { log_type: "event", host: "120.5.33.9", command: "check-cpu-usage -w 75 -c 90" }
)

db.my_collection.insertOne(
    { log_type: "event", host: "120.5.33.4", command: "system-check"}
)
```

`mongodb` テーブル関数を使用してコレクションをクエリします：

```sql
SELECT * FROM mongodb(
    '127.0.0.1:27017',
    'test',
    'my_collection',
    'test_user',
    'password',
    'log_type String, host String, command String',
    'connectTimeoutMS=10000'
)
```

または：

```sql
SELECT * FROM mongodb(
    'mongodb://test_user:password@127.0.0.1:27017/test?connectionTimeoutMS=10000',
    'my_collection',
    'log_type String, host String, command String'
)
```

## 関連 {#related}

- [MongoDB テーブルエンジン](engines/table-engines/integrations/mongodb.md)
- [MongoDB を辞書ソースとして使用する](sql-reference/dictionaries/index.md#mongodb)
