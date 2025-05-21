---
description: '設定プロファイルのドキュメンテーション'
sidebar_label: '設定プロファイル'
sidebar_position: 43
slug: /sql-reference/statements/create/settings-profile
title: '設定プロファイルの作成'
---

ユーザーまたはロールに割り当てることができる[設定プロファイル](../../../guides/sre/user-management/index.md#settings-profiles-management)を作成します。

構文:

```sql
CREATE SETTINGS PROFILE [IF NOT EXISTS | OR REPLACE] name1 [, name2 [,...]] 
    [ON CLUSTER cluster_name]
    [IN access_storage_type]
    [SETTINGS variable [= value] [MIN [=] min_value] [MAX [=] max_value] [CONST|READONLY|WRITABLE|CHANGEABLE_IN_READONLY] | INHERIT 'profile_name'] [,...]
    [TO {{role1 | user1 [, role2 | user2 ...]} | NONE | ALL | ALL EXCEPT {role1 | user1 [, role2 | user2 ...]}}]
```

`ON CLUSTER`句を使用することで、クラスター上で設定プロファイルを作成できます。詳細は[分散DDL](../../../sql-reference/distributed-ddl.md)を参照してください。

## 例 {#example}

ユーザーを作成する:
```sql
CREATE USER robin IDENTIFIED BY 'password';
```

`max_memory_usage_profile`設定プロファイルを`max_memory_usage`設定の値と制約付きで作成し、それをユーザー`robin`に割り当てます:

```sql
CREATE
SETTINGS PROFILE max_memory_usage_profile SETTINGS max_memory_usage = 100000001 MIN 90000000 MAX 110000000
TO robin
```
