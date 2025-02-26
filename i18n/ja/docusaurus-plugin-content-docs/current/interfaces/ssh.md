---
slug: /interfaces/ssh
sidebar_label: SSHインターフェース
sidebar_position: 60
keywords: [クライアント, ssh, putty]
---
import ExperimentalBadge from '@theme/badges/ExperimentalBadge';
import CloudNotSupportedBadge from '@theme/badges/CloudNotSupportedBadge';

# PTYを用いたSSHインターフェース

<ExperimentalBadge/>
<CloudNotSupportedBadge/>

## 序文 {#preface}

ClickHouseサーバーはSSHプロトコルを使用して直接接続することを許可します。どんなクライアントでも接続が可能です。

[SSHキーによって識別されるデータベースユーザーを作成した後](/knowledgebase/how-to-connect-to-ch-cloud-using-ssh-keys):
```sql
CREATE USER abcuser IDENTIFIED WITH ssh_key BY KEY '<REDACTED>' TYPE 'ssh-ed25519';
```

このキーを使用してClickHouseサーバーに接続できます。その際、clickhouse-clientのインタラクティブセッションが開かれます。

```bash
> ssh -i ~/test_ssh/id_ed25519 abcuser@localhost -p 9022
ClickHouse埋め込みバージョン 25.1.1.1.

ip-10-1-13-116.us-west-2.compute.internal :) SELECT 1;

SELECT 1

クエリID: cdd91b7f-215b-4537-b7df-86d19bf63f64

   ┌─1─┐
1. │ 1 │
   └───┘

1 行がセットにあります。経過時間: 0.002 秒。
```

SSHを介したコマンド実行（ノンインタラクティブモード）もサポートされています：

```bash
> ssh -i ~/test_ssh/id_ed25519 abcuser@localhost -p 9022 "select 1"
1
```


## サーバー設定 {#server-configuration}

SSHサーバー機能を有効にするには、`config.xml`に以下のセクションをコメントアウト解除または配置する必要があります：

```xml
<tcp_ssh_port>9022</tcp_ssh_port>
<ssh_server>
   <host_rsa_key>path-to-the-key</host_rsa_key>
   <!--host_ecdsa_key>path-to-the-key</host_ecdsa_key-->
   <!--host_ed25519_key>path-to-the-key</host_ed25519_key-->
</ssh_server>
```

ホスト鍵はSSHプロトコルの不可欠な部分です。この鍵の公開部分はクライアント側の`~/.ssh/known_hosts`ファイルに保存され、通常は中間者攻撃を防ぐために必要です。初めてサーバーに接続すると、以下のメッセージが表示されます：

```shell
ホスト '[localhost]:9022 ([127.0.0.1]:9022)' の信頼性を確認できません。
RSAキーのフィンガープリントは SHA256:3qxVlJKMr/PEKw/hfeg06HAK451Tt0eenhwqQvh58Do です。
このキーは他の名前では知られていません。
接続を続行しますか（yes/no/[fingerprint]）？
```

これは実際には「このホストの公開鍵を記憶し、接続を続行しますか？」という意味です。

SSHクライアントにホストを検証しないように指示するには、オプションを渡すことができます：

```bash
ssh -o "StrictHostKeyChecking no" user@host
```

## 埋め込みクライアントの設定 {#configuring-embedded-client}

埋め込みクライアントに通常の`clickhouse-client`のようにオプションを渡すことができますが、いくつかの制限があります。
これはSSHプロトコルであるため、ターゲットホストにパラメーターを渡す唯一の方法は環境変数を介することです。

例えば、`format`を設定するには以下のようにします：

```bash
> ssh -o SetEnv="format=Pretty" -i ~/test_ssh/id_ed25519 abcuser@localhost -p 9022 "SELECT 1"
   ┏━━━┓
   ┃ 1 ┃
   ┡━━━┩
1. │ 1 │
   └───┘
```

この方法で任意のユーザーレベルの設定を変更でき、さらに通常の`clickhouse-client`オプションのほとんどを渡すことができます（このセットアップでは意味がないオプションを除く）。

重要:

`query`オプションとSSHコマンドの両方が渡された場合、後者が実行するクエリのリストに追加されます：

```bash
ubuntu ip-10-1-13-116@~$ ssh -o SetEnv="format=Pretty query=\"SELECT 2;\"" -i ~/test_ssh/id_ed25519 abcuser@localhost -p 9022 "SELECT 1"
   ┏━━━┓
   ┃ 2 ┃
   ┡━━━┩
1. │ 2 │
   └───┘
   ┏━━━┓
   ┃ 1 ┃
   ┡━━━┩
1. │ 1 │
   └───┘
```
