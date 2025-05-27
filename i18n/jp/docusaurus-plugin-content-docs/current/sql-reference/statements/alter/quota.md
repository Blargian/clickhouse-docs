---
'description': 'クォータのドキュメント'
'sidebar_label': 'クォータ'
'sidebar_position': 46
'slug': '/sql-reference/statements/alter/quota'
'title': 'ALTER QUOTA'
---



変更クォータ。

構文：

```sql
ALTER QUOTA [IF EXISTS] name [ON CLUSTER cluster_name]
    [RENAME TO new_name]
    [KEYED BY {user_name | ip_address | client_key | client_key,user_name | client_key,ip_address} | NOT KEYED]
    [FOR [RANDOMIZED] INTERVAL number {second | minute | hour | day | week | month | quarter | year}
        {MAX { {queries | query_selects | query_inserts | errors | result_rows | result_bytes | read_rows | read_bytes | execution_time} = number } [,...] |
        NO LIMITS | TRACKING ONLY} [,...]]
    [TO {role [,...] | ALL | ALL EXCEPT role [,...]}]
```
キー `user_name`、`ip_address`、`client_key`、`client_key, user_name` および `client_key, ip_address` は、[system.quotas](../../../operations/system-tables/quotas.md) テーブルのフィールドに対応します。

パラメータ `queries`、`query_selects`、`query_inserts`、`errors`、`result_rows`、`result_bytes`、`read_rows`、`read_bytes`、`execution_time` は、[system.quotas_usage](../../../operations/system-tables/quotas_usage.md) テーブルのフィールドに対応します。

`ON CLUSTER` 句は、クラスター上にクォータを作成することを許可します。詳細は [Distributed DDL](../../../sql-reference/distributed-ddl.md) を参照してください。

**例**

現在のユーザーに対して、15か月の制約で最大123クエリを制限します：

```sql
ALTER QUOTA IF EXISTS qA FOR INTERVAL 15 month MAX queries = 123 TO CURRENT_USER;
```

デフォルトユーザーに対して、30分間に半秒の最大実行時間を制限し、5四半期の間に最大321クエリと最大10エラーを制限します：

```sql
ALTER QUOTA IF EXISTS qB FOR INTERVAL 30 minute MAX execution_time = 0.5, FOR INTERVAL 5 quarter MAX queries = 321, errors = 10 TO default;
```
