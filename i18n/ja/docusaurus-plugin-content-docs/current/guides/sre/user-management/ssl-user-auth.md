---
sidebar_label: SSLユーザー証明書認証
sidebar_position: 3
slug: /guides/sre/ssl-user-auth
---

# SSLユーザー証明書の認証設定
import SelfManaged from '@site/i18n/ja/docusaurus-plugin-content-docs/current/_snippets/_self_managed_only_no_roadmap.md';

<SelfManaged />

このガイドでは、SSLユーザー証明書を使用した認証を設定するためのシンプルで最小限の設定を提供します。このチュートリアルは、[SSL-TLSの設定ガイド](../configuring-ssl.md)に基づいています。

:::note
SSLユーザー認証は`https`またはネイティブインターフェースを使用する場合にのみサポートされています。
gRPCやPostgreSQL/MySQLエミュレーションポートでは現在使用されていません。

ClickHouseノードには、安全な認証のために`<verificationMode>strict</verificationMode>`を設定する必要があります（ただし、テスト目的で`relaxed`も機能します）。
:::

## 1. SSLユーザー証明書を作成する {#1-create-ssl-user-certificates}

:::note
この例では、自己署名の証明書と自己署名のCAを使用します。本番環境では、CSRを作成してPKIチームまたは証明書プロバイダーに提出し、適切な証明書を取得してください。
:::

1. 証明書署名要求（CSR）とキーを生成します。基本フォーマットは以下の通りです：
    ```bash
    openssl req -newkey rsa:2048 -nodes -subj "/CN=<my_host>:<my_user>"  -keyout <my_cert_name>.key -out <my_cert_name>.csr
    ```
    この例では、このサンプル環境で使用されるドメインとユーザーに対して以下のコマンドを使用します：
    ```bash
    openssl req -newkey rsa:2048 -nodes -subj "/CN=chnode1.marsnet.local:cert_user"  -keyout chnode1_cert_user.key -out chnode1_cert_user.csr
    ```
    :::note
    CNは任意であり、証明書の識別子として任意の文字列を使用できます。これは、次のステップでユーザーを作成する際に使用されます。
    :::

2. 認証に使用する新しいユーザー証明書を生成して署名します。基本フォーマットは以下の通りです：
    ```bash
    openssl x509 -req -in <my_cert_name>.csr -out <my_cert_name>.crt -CA <my_ca_cert>.crt -CAkey <my_ca_cert>.key -days 365
    ```
    この例では、このサンプル環境で使用されるドメインとユーザーに対して以下のコマンドを使用します：
    ```bash
    openssl x509 -req -in chnode1_cert_user.csr -out chnode1_cert_user.crt -CA marsnet_ca.crt -CAkey marsnet_ca.key -days 365
    ```

## 2. SQLユーザーを作成し、権限を付与する {#2-create-a-sql-user-and-grant-permissions}

:::note
SQLユーザーを有効にし、ロールを設定する方法の詳細については、[SQLユーザーとロールの定義](index.md)のユーザーガイドを参照してください。
:::

1. 証明書認証を使用するように定義されたSQLユーザーを作成します：
    ```sql
    CREATE USER cert_user IDENTIFIED WITH ssl_certificate CN 'chnode1.marsnet.local:cert_user';
    ```

2. 新しい証明書ユーザーに権限を付与します：
    ```sql
    GRANT ALL ON *.* TO cert_user WITH GRANT OPTION;
    ```
    :::note
    この演習ではデモンストレーションの目的でユーザーに完全な管理権限が付与されています。権限設定についてはClickHouseの[RBACドキュメント](/guides/sre/user-management/index.md)を参照してください。
    :::

    :::note
    ユーザーとロールを定義するためにSQLを使用することをお勧めします。ただし、現在設定ファイルでユーザーとロールを定義している場合、ユーザーは以下のようになります：
    ```xml
    <users>
        <cert_user>
            <ssl_certificates>
                <common_name>chnode1.marsnet.local:cert_user</common_name>
            </ssl_certificates>
            <networks>
                <ip>::/0</ip>
            </networks>
            <profile>default</profile>
            <access_management>1</access_management>
            <!-- ユーザーオプション -->
        </cert_user>
    </users>
    ```
    :::


## 3. テスト {#3-testing}

1. ユーザー証明書、ユーザーキー、CA証明書をリモートノードにコピーします。

2. 証明書とパスを使用してClickHouseの[クライアント設定](/interfaces/cli.md#configuration_files)にOpenSSLを構成します。

    ```xml
    <openSSL>
        <client>
            <certificateFile>my_cert_name.crt</certificateFile>
            <privateKeyFile>my_cert_name.key</privateKeyFile>
            <caConfig>my_ca_cert.crt</caConfig>
        </client>
    </openSSL>
    ```

3. `clickhouse-client`を実行します。
    ```bash
    clickhouse-client --user <my_user> --query 'SHOW TABLES'
    ```
    :::note
    configに証明書が指定されている場合、clickhouse-clientに渡されたパスワードは無視されることに注意してください。
    :::


## 4. HTTPテスト {#4-testing-http}

1. ユーザー証明書、ユーザーキー、CA証明書をリモートノードにコピーします。

2. `curl`を使用してサンプルSQLコマンドをテストします。基本フォーマットは以下の通りです：
    ```bash
    echo 'SHOW TABLES' | curl 'https://<clickhouse_node>:8443' --cert <my_cert_name>.crt --key <my_cert_name>.key --cacert <my_ca_cert>.crt -H "X-ClickHouse-SSL-Certificate-Auth: on" -H "X-ClickHouse-User: <my_user>" --data-binary @-
    ```
    例えば：
    ```bash
    echo 'SHOW TABLES' | curl 'https://chnode1:8443' --cert chnode1_cert_user.crt --key chnode1_cert_user.key --cacert marsnet_ca.crt -H "X-ClickHouse-SSL-Certificate-Auth: on" -H "X-ClickHouse-User: cert_user" --data-binary @-
    ```
    出力は以下のようになります：
    ```response
    INFORMATION_SCHEMA
    default
    information_schema
    system
    ```
    :::note
    パスワードが指定されていないことに留意してください。証明書がパスワードの代わりに使用され、ClickHouseがユーザーを認証する方法です。
    :::


## まとめ {#summary}

この記事では、SSL証明書認証のためのユーザーを作成および設定する基本を示しました。この方法は、`clickhouse-client`や`https`インターフェースをサポートするクライアントで使用でき、HTTPヘッダーが設定できる場合に適用されます。生成された証明書とキーはプライベートに保ち、限られたアクセスにする必要があります。証明書はClickHouseデータベースでの操作の認証と承認に使用されるため、証明書とキーはパスワードのように扱ってください。
