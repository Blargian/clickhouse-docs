```markdown
---
title: スキーマ設計
description: 可観測性のためのスキーマ設計
keywords: [可観測性, ログ, トレース, メトリクス, OpenTelemetry, Grafana, OTel]
---

# 可観測性のためのスキーマ設計

ユーザーは、以下の理由から常に独自のスキーマを作成することを推奨します：

- **主キーの選択** - デフォルトのスキーマは特定のアクセスパターンに最適化された `ORDER BY` を使用しています。 あなたのアクセスパターンがこれと一致する可能性は低いです。
- **構造の抽出** - ユーザーは、既存のカラムから新しいカラムを抽出したい場合があります。例えば `Body` カラムなどです。これは物化カラム（より複雑な場合は物化ビュー）を使用して行うことができます。これにはスキーマの変更が必要です。
- **マップの最適化** - デフォルトのスキーマは属性のストレージにマップ型を使用しています。これらのカラムは任意のメタデータを保存することを可能にしますが、イベントからのメタデータは事前に定義されていないことが多く、したがって ClickHouse のような厳密に型付けされたデータベースに保存できません。マップのキーやその値へのアクセスは、通常のカラムへのアクセスよりも効率的ではありません。この問題に対処するために、スキーマを修正し、最も一般的にアクセスされるマップキーをトップレベルのカラムにすることで、["SQLでの構造の抽出"](#extracting-structure-with-sql)を参照してください。これにはスキーマ変更が必要です。
- **マップキーアクセスの簡素化** - マップ内のキーにアクセスするには、冗長な構文が必要です。ユーザーはエイリアスを使用してこれを軽減することができます。クエリを簡素化するために、["エイリアスの使用"](#using-aliases)を参照してください。
- **セカンダリインデックス** - デフォルトのスキーマは、マップへのアクセスを速め、テキストクエリを加速するためにセカンダリインデックスを使用しています。一般的にこれは必要なく、追加のディスクスペースを消費します。使用することはできますが、必要であることを確認するためにテストする必要があります。["セカンダリ / データスキッピングインデックス"](#secondarydata-skipping-indices)を参照してください。
- **コーデックの使用** - ユーザーは、予想されるデータを理解しており、圧縮が改善される証拠がある場合、カラム用のコーデックをカスタマイズしたいと考えるかもしれません。

_上記の各ユースケースについて詳しく説明します。_

**重要性:** ユーザーは最適な圧縮とクエリパフォーマンスを達成するためにスキーマを拡張し修正することが推奨されますが、コアカラムに関しては可能な限り OTel スキーマの命名に従うべきです。ClickHouse Grafana プラグインは、クエリ構築を支援するために、いくつかの基本的な OTel カラムの存在を前提としており、例えば Timestamp や SeverityText などです。ログとトレースに必要なカラムは、ここに記載されています [[1]](https://grafana.com/developers/plugin-tools/tutorials/build-a-logs-data-source-plugin#logs-data-frame-format)[[2]](https://grafana.com/docs/grafana/latest/explore/logs-integration/) および [ここ](https://grafana.com/docs/grafana/latest/explore/trace-integration/#data-frame-structure) に文書化されています。これらのカラム名を変更し、プラグイン構成のデフォルトを上書きすることもできます。

## SQLでの構造の抽出 {#extracting-structure-with-sql}

構造化されたログや非構造化のログを取り込む場合、ユーザーはしばしば以下の能力を必要とします：

- **文字列ブロブからのカラムの抽出**。これらをクエリする際には、クエリタイムで文字列操作を使用するよりも高速になります。
- **マップからのキーの抽出**。デフォルトのスキーマは任意の属性をマップ型のカラムに配置します。この型はスキーマレスな能力を提供し、ユーザーがログやトレースを定義する際に属性のカラムを事前に定義する必要がないという利点があります - Kubernetes からログを収集し、ポッドラベルを後で検索するために保持する場合、これはしばしば不可能です。マップキーやその値へのアクセスは通常の ClickHouse カラムでクエリするよりも遅いです。したがって、マップからのキーをルートテーブルのカラムに抽出することは、しばしば望ましいです。

次のクエリを考慮してください：

構造化されたログを使って、最も多くの POST リクエストを受信する URL パスを数えたいとします。JSON ブロブは `Body` カラムに String として保存されています。加えて、ユーザーがコレクターで json_parser を有効にしている場合、`LogAttributes` カラムにも `Map(String, String)` として保存される可能性があります。

```sql
SELECT LogAttributes
FROM otel_logs
LIMIT 1
FORMAT Vertical

行 1:
──────
Body:      	{"remote_addr":"54.36.149.41","remote_user":"-","run_time":"0","time_local":"2019-01-22 00:26:14.000","request_type":"GET","request_path":"\/filter\/27|13 ,27|  5 ,p53","request_protocol":"HTTP\/1.1","status":"200","size":"30577","referer":"-","user_agent":"Mozilla\/5.0 (compatible; AhrefsBot\/6.1; +http:\/\/ahrefs.com\/robot\/)"}
LogAttributes: {'status':'200','log.file.name':'access-structured.log','request_protocol':'HTTP/1.1','run_time':'0','time_local':'2019-01-22 00:26:14.000','size':'30577','user_agent':'Mozilla/5.0 (compatible; AhrefsBot/6.1; +http://ahrefs.com/robot/)','referer':'-','remote_user':'-','request_type':'GET','request_path':'/filter/27|13 ,27|  5 ,p53','remote_addr':'54.36.149.41'}
```

`LogAttributes` が利用可能であると仮定し、サイトのどの URL パスが最も多くの POST リクエストを受け取っているかをカウントするクエリは次の通りです：

```sql
SELECT path(LogAttributes['request_path']) AS path, count() AS c
FROM otel_logs
WHERE ((LogAttributes['request_type']) = 'POST')
GROUP BY path
ORDER BY c DESC
LIMIT 5

┌─path─────────────────────┬─────c─┐
│ /m/updateVariation   	   │ 12182 │
│ /site/productCard    	   │ 11080 │
│ /site/productPrice   	   │ 10876 │
│ /site/productModelImages │ 10866 │
│ /site/productAdditives   │ 10866 │
└──────────────────────────┴───────┘

5 rows in set. Elapsed: 0.735 sec. Processed 10.36 million rows, 4.65 GB (14.10 million rows/s., 6.32 GB/s.)
Peak memory usage: 153.71 MiB.
```

ここでのマップ構文の使用に注意してください。 例： `LogAttributes['request_path']` および URL からクエリパラメータを取り除くための [`path` 関数](/sql-reference/functions/url-functions#path)。

もしユーザーがコレクターで JSON 解析を有効にしていない場合、`LogAttributes` は空になり、String `Body` からカラムを抽出するために [JSON 関数](/sql-reference/functions/json-functions) を使用する必要があります。

:::note ClickHouseでの解析を優先する
一般的に、ユーザーには構造化されたログの JSON 解析を ClickHouse で実行することを推奨します。 ClickHouse が最も高速な JSON 解析の実装であると信じています。しかし、ユーザーが他のソースにログを送信したい場合、このロジックが SQL に存在しないことを認識しています。
:::

```sql
SELECT path(JSONExtractString(Body, 'request_path')) AS path, count() AS c
FROM otel_logs
WHERE JSONExtractString(Body, 'request_type') = 'POST'
GROUP BY path
ORDER BY c DESC
LIMIT 5

┌─path─────────────────────┬─────c─┐
│ /m/updateVariation   	   │ 12182 │
│ /site/productCard    	   │ 11080 │
│ /site/productPrice   	   │ 10876 │
│ /site/productAdditives   │ 10866 │
│ /site/productModelImages │ 10866 │
└──────────────────────────┴───────┘

5 rows in set. Elapsed: 0.668 sec. Processed 10.37 million rows, 5.13 GB (15.52 million rows/s., 7.68 GB/s.)
Peak memory usage: 172.30 MiB.
```

次に、非構造化ログの場合についても考慮します：

```sql
SELECT Body, LogAttributes
FROM otel_logs
LIMIT 1
FORMAT Vertical

行 1:
──────
Body:      	151.233.185.144 - - [22/Jan/2019:19:08:54 +0330] "GET /image/105/brand HTTP/1.1" 200 2653 "https://www.zanbil.ir/filter/b43,p56" "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36" "-"
LogAttributes: {'log.file.name':'access-unstructured.log'}
```

非構造化ログに対する類似のクエリには、[`extractAllGroupsVertical` 関数](/sql-reference/functions/string-search-functions#extractallgroupsvertical)を使用して正規表現を使う必要があります。

```sql
SELECT
	path((groups[1])[2]) AS path,
	count() AS c
FROM
(
	SELECT extractAllGroupsVertical(Body, '(\\w+)\\s([^\\s]+)\\sHTTP/\\d\\.\\d') AS groups
	FROM otel_logs
	WHERE ((groups[1])[1]) = 'POST'
)
GROUP BY path
ORDER BY c DESC
LIMIT 5

┌─path─────────────────────┬─────c─┐
│ /m/updateVariation   	   │ 12182 │
│ /site/productCard    	   │ 11080 │
│ /site/productPrice   	   │ 10876 │
│ /site/productModelImages │ 10866 │
│ /site/productAdditives   │ 10866 │
└──────────────────────────┴───────┘

5 rows in set. Elapsed: 1.953 sec. Processed 10.37 million rows, 3.59 GB (5.31 million rows/s., 1.84 GB/s.)
```

非構造化ログの解析におけるクエリの複雑さとコストの増加（パフォーマンスの違いに注意）から、可能な限り構造化ログを使用することを推奨します。

:::note 辞書の考慮
上記のクエリは、正規表現辞書を利用して最適化することができます。詳細は [辞書の使用](#using-dictionaries) を参照してください。
:::

これらのユースケースは、ClickHouse を使用して上記のクエリロジックを挿入時に移動することで満たすことができます。以下にいくつかのアプローチを探ります。

:::note OTel か ClickHouse かを処理する？
ユーザーは、[ここ](https://observability/integrating-opentelemetry#processing---filtering-transforming-and-enriching) に記載されている OTel Collector プロセッサーとオペレーターを使用して処理を実行することもできます。ほとんどのケースでは、ユーザーは ClickHouseがコレクターのプロセッサーよりもリソース効率が高く、速いことを確認できるでしょう。全てのイベント処理を SQL で行うことの主な欠点は、ソリューションが ClickHouse に結びつくということです。例えば、ユーザーは OTel コレクターから代替の宛先に処理されたログを送信したいと考えるかもしれません（例： S3）。
:::

### 物化カラム {#materialized-columns}

物化カラムは、他のカラムから構造を抽出するための最も簡単なソリューションを提供します。このようなカラムの値は常に挿入時に計算され、INSERT クエリで指定することはできません。

:::note オーバーヘッド
物化カラムは、挿入時にディスク上の新しいカラムに値が抽出されるため、追加のストレージオーバーヘッドが発生します。
:::

物化カラムは、Any ClickHouse 式をサポートし、[文字列の処理](/sql-reference/functions/string-functions)のための任意の分析関数を利用でき（[正規表現と検索](/sql-reference/functions/string-search-functions)を含む）、[URL](/sql-reference/functions/url-functions)に対する[型変換](/sql-reference/functions/type-conversion-functions)、[JSONから値の抽出](/sql-reference/functions/json-functions)または[数学演算](/sql-reference/functions/math-functions)を実行できます。

基本的な処理には物化カラムを推奨します。特にマップから値を抽出し、それをルートカラムに昇格させ、型変換を行うのに役立ちます。それらはしばしば非常に基本的なスキーマで使用したり、物化ビューと組み合わせて使用するのが最も便利です。コレクターによって JSON が `LogAttributes` カラムに抽出されたログのための以下のスキーマを考慮してください：

```sql
CREATE TABLE otel_logs
(
	`Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
	`TraceId` String CODEC(ZSTD(1)),
	`SpanId` String CODEC(ZSTD(1)),
	`TraceFlags` UInt32 CODEC(ZSTD(1)),
	`SeverityText` LowCardinality(String) CODEC(ZSTD(1)),
	`SeverityNumber` Int32 CODEC(ZSTD(1)),
	`ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
	`Body` String CODEC(ZSTD(1)),
	`ResourceSchemaUrl` String CODEC(ZSTD(1)),
	`ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`ScopeSchemaUrl` String CODEC(ZSTD(1)),
	`ScopeName` String CODEC(ZSTD(1)),
	`ScopeVersion` String CODEC(ZSTD(1)),
	`ScopeAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`LogAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`RequestPage` String MATERIALIZED path(LogAttributes['request_path']),
	`RequestType` LowCardinality(String) MATERIALIZED LogAttributes['request_type'],
	`RefererDomain` String MATERIALIZED domain(LogAttributes['referer'])
)
ENGINE = MergeTree
PARTITION BY toDate(Timestamp)
ORDER BY (ServiceName, SeverityText, toUnixTimestamp(Timestamp), TraceId)
```

JSON 関数を使用して String `Body` から抽出するための同等のスキーマは [こちらで](https://pastila.nl/?005cbb97/513b174a7d6114bf17ecc657428cf829#gqoOOiomEjIiG6zlWhE+Sg==) 見つけることができます。

私たちの3つの物化ビューカラムは、リクエストページ、リクエストタイプ、およびリファラーのドメインを抽出します。これらはマップキーにアクセスしてその値に関数を適用します。次のクエリは大幅に高速です：

```sql
SELECT RequestPage AS path, count() AS c
FROM otel_logs
WHERE RequestType = 'POST'
GROUP BY path
ORDER BY c DESC
LIMIT 5

┌─path─────────────────────┬─────c─┐
│ /m/updateVariation   	   │ 12182 │
│ /site/productCard    	   │ 11080 │
│ /site/productPrice   	   │ 10876 │
│ /site/productAdditives   │ 10866 │
│ /site/productModelImages │ 10866 │
└──────────────────────────┴───────┘

5 rows in set. Elapsed: 0.173 sec. Processed 10.37 million rows, 418.03 MB (60.07 million rows/s., 2.42 GB/s.)
Peak memory usage: 3.16 MiB.
```

:::note
物化カラムは、デフォルトでは `SELECT *` に返されません。これは、`SELECT *` の結果は常に INSERT を使用してテーブルに再挿入できるという不変条件を維持するためです。この動作は `asterisk_include_materialized_columns=1` を設定することで無効化でき、Grafana のデータソース構成（`Additional Settings -> Custom Settings`）で有効化できます。
:::

## 物化ビュー {#materialized-views}

[物化ビュー](/materialized-view)は、ログやトレースに対して SQL フィルタリングと変換を適用するためのより強力な手段を提供します。

物化ビューを使用すると、ユーザーは計算のコストをクエリ時から挿入時にシフトさせることができます。 ClickHouse の物化ビューは、テーブルにデータが挿入されるときにブロックに対してクエリを実行するトリガです。このクエリの結果は、2番目の「ターゲット」テーブルに挿入されます。

<img src={require('./images/observability-10.png').default}    
  class="image"
  alt="NEEDS ALT"
  style={{width: '600px'}} />

<br />

:::note リアルタイム更新
ClickHouse の物化ビューは、基にしているテーブルにデータが流れ込むにつれてリアルタイムで更新され、継続的に更新されるインデックスのように機能します。対照的に、他のデータベースでは物化ビューは通常、リフレッシュする必要があるクエリの静的スナップショットです（ClickHouse のリフレッシュ可能な物化ビューに似ています）。
:::

物化ビューに関連付けられたクエリは理論的には任意のクエリを使用でき、集約を含むことができるが、[ジョインには制限が存在します](https://clickhouse.com/blog/using-materialized-views-in-clickhouse#materialized-views-and-joins)。ログやトレースに必要な変換やフィルタリングのワークロードに対しては、ユーザーは任意の `SELECT` ステートメントが可能であると考えることができます。

ユーザーは、クエリがテーブルへ挿入される行に対してトリガーとして動作し、新しいテーブル（ターゲットテーブル）に結果が送信されることを忘れないでください。

私たちがデータを二重に保存しないようにするためには、ソーステーブルのテーブルを[Null テーブルエンジン](/engines/table-engines/special/null)に変更して、元のスキーマを保持することができます。OTel コレクターはこのテーブルへのデータの送信を続けます。例えば、ログのために `otel_logs` テーブルは以下のようになります：

```sql
CREATE TABLE otel_logs
(
	`Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
	`TraceId` String CODEC(ZSTD(1)),
	`SpanId` String CODEC(ZSTD(1)),
	`TraceFlags` UInt32 CODEC(ZSTD(1)),
	`SeverityText` LowCardinality(String) CODEC(ZSTD(1)),
	`SeverityNumber` Int32 CODEC(ZSTD(1)),
	`ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
	`Body` String CODEC(ZSTD(1)),
	`ResourceSchemaUrl` String CODEC(ZSTD(1)),
	`ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`ScopeSchemaUrl` String CODEC(ZSTD(1)),
	`ScopeName` String CODEC(ZSTD(1)),
	`ScopeVersion` String CODEC(ZSTD(1)),
	`ScopeAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`LogAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1))
) ENGINE = Null
```

Null テーブルエンジンは強力な最適化です - `/dev/null` のように考えてください。このテーブルはデータを保存しませんが、添付された物化ビューは挿入された行の上で実行され、その後破棄されます。

次のクエリを考慮してください。これは、`LogAttributes` からすべてのカラムを抽出し（これがコレクターによって `json_parser` オペレーターを使用して設定されていると仮定します）、`SeverityText` と `SeverityNumber` を設定します（[これらのカラム](https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitytext)の簡単な条件と定義に基づいて）。この場合、我々はまた、設定されることがわかっているカラムのみを選択し、`TraceId`、`SpanId`、および `TraceFlags` のようなカラムを無視します。

```sql
SELECT
        Body, 
	Timestamp::DateTime AS Timestamp,
	ServiceName,
	LogAttributes['status'] AS Status,
	LogAttributes['request_protocol'] AS RequestProtocol,
	LogAttributes['run_time'] AS RunTime,
	LogAttributes['size'] AS Size,
	LogAttributes['user_agent'] AS UserAgent,
	LogAttributes['referer'] AS Referer,
	LogAttributes['remote_user'] AS RemoteUser,
	LogAttributes['request_type'] AS RequestType,
	LogAttributes['request_path'] AS RequestPath,
	LogAttributes['remote_addr'] AS RemoteAddr,
	domain(LogAttributes['referer']) AS RefererDomain,
	path(LogAttributes['request_path']) AS RequestPage,
	multiIf(Status::UInt64 > 500, 'CRITICAL', Status::UInt64 > 400, 'ERROR', Status::UInt64 > 300, 'WARNING', 'INFO') AS SeverityText,
	multiIf(Status::UInt64 > 500, 20, Status::UInt64 > 400, 17, Status::UInt64 > 300, 13, 9) AS SeverityNumber
FROM otel_logs
LIMIT 1
FORMAT Vertical

行 1:
──────
Body:        	{"remote_addr":"54.36.149.41","remote_user":"-","run_time":"0","time_local":"2019-01-22 00:26:14.000","request_type":"GET","request_path":"\/filter\/27|13 ,27|  5 ,p53","request_protocol":"HTTP\/1.1","status":"200","size":"30577","referer":"-","user_agent":"Mozilla\/5.0 (compatible; AhrefsBot\/6.1; +http:\/\/ahrefs.com\/robot\/)"}
Timestamp:   	2019-01-22 00:26:14
ServiceName:
Status:      	200
RequestProtocol: HTTP/1.1
RunTime:     	0
Size:        	30577
UserAgent:   	Mozilla/5.0 (compatible; AhrefsBot/6.1; +http://ahrefs.com/robot/)
Referer:     	-
RemoteUser:  	-
RequestType: 	GET
RequestPath: 	/filter/27|13 ,27|  5 ,p53
RemoteAddr: 	54.36.149.41
RefererDomain:
RequestPage: 	/filter/27|13 ,27|  5 ,p53
SeverityText:	INFO
SeverityNumber:  9

1 row in set. Elapsed: 0.027 sec.
```

上記では `Body` カラムも抽出しています - 後で追加の属性が追加される可能性があるため。それによって、このカラムは ClickHouse で圧縮がよく行われ、ほとんどアクセスされなくなり、クエリパフォーマンスに影響を与えません。最後に、Timestamp を DateTime に減らします（スペースを節約するため - 詳細は ["型の最適化"](#optimizing-types)を参照）して型変換します。

:::note 条件式
上記の [条件式](/sql-reference/functions/conditional-functions) の使用に注意してください。これにより、`SeverityText` と `SeverityNumber` を抽出します。複雑な条件を形成し、マップ内の値が設定されているかどうかを確認するために非常に便利です - すべてのキーが`LogAttributes`に存在すると仮定しています。ユーザーにはそれらに馴染んでおくことをお勧めします - あなたのログ解析において友達となるでしょう。さらに、[null 値を処理する関数](/sql-reference/functions/functions-for-nulls)も活用してください！
:::

これらの結果を受け取るテーブルが必要です。以下のターゲットテーブルは、上記のクエリに一致します：

```sql
CREATE TABLE otel_logs_v2
(
	`Body` String,
	`Timestamp` DateTime,
	`ServiceName` LowCardinality(String),
	`Status` UInt16,
	`RequestProtocol` LowCardinality(String),
	`RunTime` UInt32,
	`Size` UInt32,
	`UserAgent` String,
	`Referer` String,
	`RemoteUser` String,
	`RequestType` LowCardinality(String),
	`RequestPath` String,
	`RemoteAddress` IPv4,
	`RefererDomain` String,
	`RequestPage` String,
	`SeverityText` LowCardinality(String),
	`SeverityNumber` UInt8
)
ENGINE = MergeTree
ORDER BY (ServiceName, Timestamp)
```

ここで選択された型は、["型の最適化"](#optimizing-types) で議論された最適化に基づいています。

:::note
スキーマが大幅に変更されたことに注意してください。実際には、ユーザーは保持したいトレースカラムや `ResourceAttributes` カラムも持つことになりがちです（通常は Kubernetes メタデータが含まれます）。Grafana はトレースカラムを活用してログとトレース間のリンク機能を提供できます - 見てください ["Grafana の使用"](/observability/grafana)。
:::

以下に、物化ビュー `otel_logs_mv` を作成します。これは、上記の選択を `otel_logs` テーブルに対し実行し、結果を `otel_logs_v2` に送ります。

```sql
CREATE MATERIALIZED VIEW otel_logs_mv TO otel_logs_v2 AS
SELECT
        Body, 
	Timestamp::DateTime AS Timestamp,
	ServiceName,
	LogAttributes['status']::UInt16 AS Status,
	LogAttributes['request_protocol'] AS RequestProtocol,
	LogAttributes['run_time'] AS RunTime,
	LogAttributes['size'] AS Size,
	LogAttributes['user_agent'] AS UserAgent,
	LogAttributes['referer'] AS Referer,
	LogAttributes['remote_user'] AS RemoteUser,
	LogAttributes['request_type'] AS RequestType,
	LogAttributes['request_path'] AS RequestPath,
	LogAttributes['remote_addr'] AS RemoteAddress,
	domain(LogAttributes['referer']) AS RefererDomain,
	path(LogAttributes['request_path']) AS RequestPage,
	multiIf(Status::UInt64 > 500, 'CRITICAL', Status::UInt64 > 400, 'ERROR', Status::UInt64 > 300, 'WARNING', 'INFO') AS SeverityText,
	multiIf(Status::UInt64 > 500, 20, Status::UInt64 > 400, 17, Status::UInt64 > 300, 13, 9) AS SeverityNumber
FROM otel_logs
```

上記は以下に視覚化されています：

<img src={require('./images/observability-11.png').default}    
  class="image"
  alt="NEEDS ALT"
  style={{width: '800px'}} />

<br />

もし今、["ClickHouse へのエクスポート"](/observability/integrating-opentelemetry#exporting-to-clickhouse) で使用されたコレクタ設定を再起動すると、データは私たちの望む形式の `otel_logs_v2` に表示されます。型付きの JSON 抽出関数の使用に注意してください。

```sql
SELECT *
FROM otel_logs_v2
LIMIT 1
FORMAT Vertical

行 1:
──────
Body:        	{"remote_addr":"54.36.149.41","remote_user":"-","run_time":"0","time_local":"2019-01-22 00:26:14.000","request_type":"GET","request_path":"\/filter\/27|13 ,27|  5 ,p53","request_protocol":"HTTP\/1.1","status":"200","size":"30577","referer":"-","user_agent":"Mozilla\/5.0 (compatible; AhrefsBot\/6.1; +http:\/\/ahrefs.com\/robot\/)"}
Timestamp:   	2019-01-22 00:26:14
ServiceName:
Status:      	200
RequestProtocol: HTTP/1.1
RunTime:     	0
Size:        	30577
UserAgent:   	Mozilla/5.0 (compatible; AhrefsBot/6.1; +http://ahrefs.com/robot/)
Referer:     	-
RemoteUser:  	-
RequestType: 	GET
RequestPath: 	/filter/27|13 ,27|  5 ,p53
RemoteAddress: 	54.36.149.41
RefererDomain:
RequestPage: 	/filter/27|13 ,27|  5 ,p53
SeverityText:	INFO
SeverityNumber:  9

1 row in set. Elapsed: 0.010 sec.
```

JSON 関数を使用して `Body` カラムからカラムを抽出する同等の物化ビューは以下の通りです：

```sql
CREATE MATERIALIZED VIEW otel_logs_mv TO otel_logs_v2 AS
SELECT  Body, 
	Timestamp::DateTime AS Timestamp,
	ServiceName,
	JSONExtractUInt(Body, 'status') AS Status,
	JSONExtractString(Body, 'request_protocol') AS RequestProtocol,
	JSONExtractUInt(Body, 'run_time') AS RunTime,
	JSONExtractUInt(Body, 'size') AS Size,
	JSONExtractString(Body, 'user_agent') AS UserAgent,
	JSONExtractString(Body, 'referer') AS Referer,
	JSONExtractString(Body, 'remote_user') AS RemoteUser,
	JSONExtractString(Body, 'request_type') AS RequestType,
	JSONExtractString(Body, 'request_path') AS RequestPath,
	JSONExtractString(Body, 'remote_addr') AS remote_addr,
	domain(JSONExtractString(Body, 'referer')) AS RefererDomain,
	path(JSONExtractString(Body, 'request_path')) AS RequestPage,
	multiIf(Status::UInt64 > 500, 'CRITICAL', Status::UInt64 > 400, 'ERROR', Status::UInt64 > 300, 'WARNING', 'INFO') AS SeverityText,
	multiIf(Status::UInt64 > 500, 20, Status::UInt64 > 400, 17, Status::UInt64 > 300, 13, 9) AS SeverityNumber
FROM otel_logs
```

### 型に注意 {#beware-types}

上記の物化ビューは、特に `LogAttributes` マップを使用する場合に、暗黙のキャストに依存しています。ClickHouse はしばしば透明に抽出された値をターゲットテーブルの型にキャストしますが、ユーザーは常にそのビューをテストすることを推奨します。ターゲットテーブルは同じスキーマを持つ [`INSERT INTO`](/sql-reference/statements/insert-into) ステートメントを使用して、ビューの `SELECT` ステートメントで確認するべきです。特に次のケースに注意を払ってください：

- キーがマップに存在しない場合、空の文字列が返されます。数値の場合、ユーザーはこれを適切な値にマッピングする必要があります。これは、[条件式](/sql-reference/functions/conditional-functions) で達成できます例：`if(LogAttributes['status'] = ", 200, LogAttributes['status'])`またはデフォルト値が許可される場合は、[キャスト関数](/sql-reference/functions/type-conversion-functions#touint8163264256ordefault)を使用できます例：`toUInt8OrDefault(LogAttributes['status'] )`
- 一部の型は常にキャストされるわけではありません。例えば、数値の文字列表現などが enum 値にキャストされることはありません。
- JSON 抽出関数は、値が見つからない場合、その型のデフォルト値を返します。これらの値が意味をなすことを確認してください！

:::note Nullableを避ける
ClickHouse の可観測性データに [Nullable](/sql-reference/data-types/nullable) を使用することは避けてください。ログやトレースでは、空と null を区別する必要があることはあまりありません。この機能は追加のストレージオーバーヘッドを引き起こし、クエリパフォーマンスに悪影響を及ぼします。詳細は [こちら](https://data-modeling/schema-design#optimizing-types) を参照してください。
:::

## 主キー（順序）キーの選択 {#choosing-a-primary-ordering-key}

必要なカラムを抽出したら、順序/主キーを最適化し始めることができます。

以下の単純なルールを適用して順序キーを選択します。これらは時に対立することがありますので、これらを順序よく考慮してください。このプロセスから、ユーザーはキーのいくつかを特定でき、4〜5個が一般的に十分です：

1. 一般的なフィルターやアクセスパターンに一致するカラムを選択します。もしユーザーが通常、特定のカラム（例：ポッド名）で可観測性の調査を開始する場合、このカラムは `WHERE` 句で頻繁に使用されます。これらを主キーに含めることが優先されます。
2. フィルタリング時に全体の行の大部分を除外するのに役立つカラムを選ぶことを好みます。サービス名やステータスコードは良い候補となることが多いです。特に後者の場合、ユーザーがほとんどの行を除外する値でフィルタリングする場合に限ります。例：200s でフィルタリングすると、ほとんどのシステムでほとんどの行と一致しますが、500 エラーは小さなサブセットに相当します。
3. 他のカラムと強く相関する可能性のあるカラムを選ぶことを好みます。これにより、これらの値が連続して保存され、圧縮が向上します。
4. `GROUP BY` と `ORDER BY` 演算は、順序キーのカラムに対してメモリ効率が良くなります。

<br />

順序キーのサブセットを特定したら、特定の順序で宣言する必要があります。この順序は、クエリにおけるセカンダリキーのカラムに対するフィルタリングの効率と、テーブルのデータファイルの圧縮比に大きく影響します。一般的には、**カーディナリティの昇順にキーを配置するのが最良です**。これは、順序キーで後に登場するカラムでフィルタリングすることが、先に登場するものよりも効率が悪くなることに注意する必要があります。これらの動作をバランスさせ、アクセスパターンを考慮してください。最も重要なのは、さまざまなバリエーションをテストすることです。順序キーの理解を深め、それらを最適化するためには、[この記事](/optimize/sparse-primary-indexes)を推奨します。

:::note 構造を先に
ログを構造化した後に順序キーを決定することをお勧めします。属性マップのキーや JSON 抽出式を順序キーとして使用しないでください。順序キーをテーブルのルートカラムとして配置してください。
:::

## マップの使用 {#using-maps}

以前の例では、マップ型のカラムに値をアクセスするために `map['key']` の構文を示しました。ネストされたキーにアクセスするためのマップ表記を使用するだけでなく、フィルタリングやこれらのカラムを選択するための特殊な ClickHouse の [マップ関数](/sql-reference/functions/tuple-map-functions#mapkeys) が利用できます。

例えば、次のクエリは [`mapKeys` 関数](/sql-reference/functions/tuple-map-functions#mapkeys) を使用して `LogAttributes` カラムに存在するすべてのユニークキーを特定し、[`groupArrayDistinctArray` 関数](/sql-reference/aggregate-functions/combinators)（コンビネーター）によって実行されます。

```sql
SELECT groupArrayDistinctArray(mapKeys(LogAttributes))
FROM otel_logs
FORMAT Vertical

行 1:
──────
groupArrayDistinctArray(mapKeys(LogAttributes)): ['remote_user','run_time','request_type','log.file.name','referer','request_path','status','user_agent','remote_addr','time_local','size','request_protocol']

1 row in set. Elapsed: 1.139 sec. Processed 5.63 million rows, 2.53 GB (4.94 million rows/s., 2.22 GB/s.)
Peak memory usage: 71.90 MiB.
```

:::note ドットを避ける
マップカラム名にはドットを使用しないことをお勧めします、その使用は非推奨になるかもしれません。`_` を使用してください。
:::


## エイリアスの使用 {#using-aliases}

マップ型をクエリすることは、通常のカラムをクエリするよりも遅くなります - 詳細は ["クエリの高速化"](#accelerating-queries) を参照してください。さらに、構文がより複雑であり、ユーザーが書くのが煩わしい場合があります。この後者の問題を解決するために、エイリアスカラムの使用を推奨します。

ALIAS カラムはクエリタイムで計算され、テーブルに格納されません。つまり、この型のカラムに値を INSERT することは不可能です。エイリアスを使用することで、マップキーを参照して構文を簡略化し、マップエントリを通常のカラムとして透過的に公開できます。以下の例を考えてみてください：

```sql
CREATE TABLE otel_logs
(
	`Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
	`TraceId` String CODEC(ZSTD(1)),
	`SpanId` String CODEC(ZSTD(1)),
	`TraceFlags` UInt32 CODEC(ZSTD(1)),
	`SeverityText` LowCardinality(String) CODEC(ZSTD(1)),
	`SeverityNumber` Int32 CODEC(ZSTD(1)),
	`ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
```
```
```sql
`Body` String CODEC(ZSTD(1)),
`ResourceSchemaUrl` String CODEC(ZSTD(1)),
`ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
`ScopeSchemaUrl` String CODEC(ZSTD(1)),
`ScopeName` String CODEC(ZSTD(1)),
`ScopeVersion` String CODEC(ZSTD(1)),
`ScopeAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
`LogAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
`RequestPath` String MATERIALIZED path(LogAttributes['request_path']),
`RequestType` LowCardinality(String) MATERIALIZED LogAttributes['request_type'],
`RefererDomain` String MATERIALIZED domain(LogAttributes['referer']),
`RemoteAddr` IPv4 ALIAS LogAttributes['remote_addr']
)
ENGINE = MergeTree
PARTITION BY toDate(Timestamp)
ORDER BY (ServiceName, Timestamp)
```

いくつかのマテリアライズドカラムと、マップ`LogAttributes`にアクセスする`ALIAS`カラム`RemoteAddr`があります。これにより、このカラム経由で`LogAttributes['remote_addr']`の値をクエリすることができ、クエリが簡素化されます。すなわち、

```sql
SELECT RemoteAddr
FROM default.otel_logs
LIMIT 5

┌─RemoteAddr────┐
│ 54.36.149.41  │
│ 31.56.96.51   │
│ 31.56.96.51   │
│ 40.77.167.129 │
│ 91.99.72.15   │
└───────────────┘

5 rows in set. Elapsed: 0.011 sec.
```

さらに、`ALIAS`を追加するのは、`ALTER TABLE`コマンドを用いることで簡単に行えます。これにより、カラムが即座に利用可能になります。

```sql
ALTER TABLE default.otel_logs
	(ADD COLUMN `Size` String ALIAS LogAttributes['size'])

SELECT Size
FROM default.otel_logs_v3
LIMIT 5

┌─Size──┐
│ 30577 │
│ 5667  │
│ 5379  │
│ 1696  │
│ 41483 │
└───────┘

5 rows in set. Elapsed: 0.014 sec.
```

:::note デフォルトで除外されるエイリアス
デフォルトでは、`SELECT *`はALIASカラムを除外します。この動作は、`asterisk_include_alias_columns=1`を設定することで無効にできます。
:::

## 型の最適化 {#optimizing-types}

ClickHouseの使用ケースにおける型の最適化に関する[一般的なベストプラクティス](/data-modeling/schema-design#optimizing-types)が適用されます。

## コーデックの使用 {#using-codecs}

型の最適化に加えて、ユーザーはClickHouseの可観測性スキーマの圧縮を最適化しようとする際に、[コーデックに関する一般的なベストプラクティス](/data-compression/compression-in-clickhouse#choosing-the-right-column-compression-codec)に従うことができます。

一般的に、ユーザーは`ZSTD`コーデックがログやトレースデータセットに非常に適用可能であることを見出すでしょう。圧縮の値をデフォルトの1から増加させることで、圧縮が改善される可能性があります。しかし、これはテストされるべきであり、高値は挿入時により大きなCPUオーバーヘッドを引き起こします。通常、この値を増加させてもあまり効果は見られません。

さらに、タイムスタンプは圧縮に関してデルタエンコーディングの恩恵を受けますが、このカラムが主キーまたは順序付けのキーに使用される場合、クエリのパフォーマンスが遅くなることが示されています。したがって、ユーザーはそれぞれの圧縮とクエリパフォーマンスのトレードオフを評価することをお勧めします。

## 辞書の使用 {#using-dictionaries}

[辞書](/sql-reference/dictionaries)は、ClickHouseの[主な機能](https://clickhouse.com/blog/faster-queries-dictionaries-clickhouse)の一つであり、さまざまな内部および外部の[ソース](/sql-reference/dictionaries#dictionary-sources)からのデータのインメモリ[キー-バリュー](https://en.wikipedia.org/wiki/Key%E2%80%93value_database)表現を提供し、超低レイテンシのルックアップクエリに最適化されています。

<img src={require('./images/observability-12.png').default}    
  class="image"
  alt="NEEDS ALT"
  style={{width: '800px'}} />

<br />

これは、取り込まれたデータをリアルタイムで豊かにしたり、一般的にクエリのパフォーマンスを向上させるなど、さまざまなシナリオで便利です。特にJOINが特に有利になります。
可観測性の使用ケースでは、JOINはほとんど必要ありませんが、辞書は挿入時とクエリ時の両方で豊かにする目的で便利です。以下に両方の例を示します。

:::note JOINの加速
辞書を使用してJOINを加速したいユーザーは、[こちら](/dictionary)で詳細を見つけることができます。
:::

### 挿入時とクエリ時 {#insert-time-vs-query-time}

辞書は、クエリ時または挿入時にデータセットを豊かにするために使用できます。これらのアプローチはそれぞれ利点と欠点があります。要約すると次の通りです：

- **挿入時** - これは通常、豊かさの値が変わらず、辞書を満たすために使用できる外部ソースに存在する場合に適切です。この場合、挿入時に行を豊かにすることで、辞書へのクエリ時のルックアップを回避できます。これは、挿入パフォーマンスと追加のストレージオーバーヘッドのコストがかかります。豊かにされた値はカラムとして格納されます。
- **クエリ時** - 辞書内の値が頻繁に変わる場合、クエリ時のルックアップの方が一般的に適用されます。これは、マッピングされた値が変更された場合にカラムを更新（およびデータを書き直す）する必要がないためです。この柔軟性は、クエリ時のルックアップコストを伴います。このコストは、特にフィルター句で辞書ルックアップが必要な場合、多くの行で貴重です。結果の豊かさ、すなわち`SELECT`内では、このオーバーヘッドは通常、顕著ではありません。

ユーザーは辞書の基本に慣れ親しむことをお勧めします。辞書は、専用の[専門関数](/sql-reference/functions/ext-dict-functions#dictgetall)を使用して値を取得できるインメモリのルックアップテーブルを提供します。

簡単な豊か化の例については、[こちら](/dictionary)の辞書ガイドを確認してください。以下では、一般的な可観測性の豊かさのタスクに注目します。

### IP辞書の使用 {#using-ip-dictionaries}

IPアドレスを使用して緯度および経度値でログとトレースを地理的に豊かにすることは一般的な可観測性の要件です。これを`ip_trie`構造の辞書を使用して実現できます。

公開されている[DB-IP市レベルデータセット](https://github.com/sapics/ip-location-db#db-ip-database-update-monthly)を、[DB-IP.com](https://db-ip.com/)から[CC BY 4.0ライセンス](https://creativecommons.org/licenses/by/4.0/)の条件の下で取得します。

[README](https://github.com/sapics/ip-location-db#csv-format)から、データの構造が次のように整理されていることがわかります：

```csv
| ip_range_start | ip_range_end | country_code | state1 | state2 | city | postcode | latitude | longitude | timezone |
```

この構造を考慮して、[url()](/sql-reference/table-functions/url)テーブル関数を使用してデータをのぞいてみましょう：

```sql
SELECT *
FROM url('https://raw.githubusercontent.com/sapics/ip-location-db/master/dbip-city/dbip-city-ipv4.csv.gz', 'CSV', '\n    	\tip_range_start IPv4, \n    	\tip_range_end IPv4, \n    	\tcountry_code Nullable(String), \n    	\tstate1 Nullable(String), \n    	\tstate2 Nullable(String), \n    	\tcity Nullable(String), \n    	\tpostcode Nullable(String), \n    	\tlatitude Float64, \n    	\tlongitude Float64, \n    	\ttimezone Nullable(String)\n	\t')
LIMIT 1
FORMAT Vertical
Row 1:
──────
ip_range_start: 1.0.0.0
ip_range_end:   1.0.0.255
country_code:   AU
state1:     	Queensland
state2:     	ᴺᵁᴸᴸ
city:       	South Brisbane
postcode:   	ᴺᵁᴸᴸ
latitude:   	-27.4767
longitude:  	153.017
timezone:   	ᴺᵁᴸᴸ
```

私たちの作業を簡単にするために、[`URL()`](/engines/table-engines/special/url)テーブルエンジンを使用して、フィールド名を用いてClickHouseテーブルオブジェクトを作成し、行数の総数を確認します。

```sql
CREATE TABLE geoip_url(
	ip_range_start IPv4,
	ip_range_end IPv4,
	country_code Nullable(String),
	state1 Nullable(String),
	state2 Nullable(String),
	city Nullable(String),
	postcode Nullable(String),
	latitude Float64,
	longitude Float64,
	timezone Nullable(String)
) engine=URL('https://raw.githubusercontent.com/sapics/ip-location-db/master/dbip-city/dbip-city-ipv4.csv.gz', 'CSV')

select count() from geoip_url;

┌─count()─┐
│ 3261621 │ -- 3.26 million
└─────────┘
```

私たちの`ip_trie`辞書がCIDR形式でIPアドレス範囲を表す必要があるため、`ip_range_start`と`ip_range_end`を変換する必要があります。

この各範囲のCIDRは、以下のクエリで簡潔に計算できます：

```sql
with
	bitXor(ip_range_start, ip_range_end) as xor,
	if(xor != 0, ceil(log2(xor)), 0) as unmatched,
	32 - unmatched as cidr_suffix,
	toIPv4(bitAnd(bitNot(pow(2, unmatched) - 1), ip_range_start)::UInt64) as cidr_address
select
	ip_range_start,
	ip_range_end,
	concat(toString(cidr_address),'/',toString(cidr_suffix)) as cidr    
from
	geoip_url
limit 4;

┌─ip_range_start─┬─ip_range_end─┬─cidr───────┐
│ 1.0.0.0    	 │ 1.0.0.255	│ 1.0.0.0/24 │
│ 1.0.1.0    	 │ 1.0.3.255	│ 1.0.0.0/22 │
│ 1.0.4.0    	 │ 1.0.7.255	│ 1.0.4.0/22 │
│ 1.0.8.0    	 │ 1.0.15.255   │ 1.0.8.0/21 │
└────────────────┴──────────────┴────────────┘

4 rows in set. Elapsed: 0.259 sec.
```

:::note
上記のクエリでは、多くのことが行われています。興味のある方は、これに関する優れた[説明](https://clickhouse.com/blog/geolocating-ips-in-clickhouse-and-grafana#using-bit-functions-to-convert-ip-ranges-to-cidr-notation)を読んでください。さもなければ、上記がIP範囲のCIDRを計算していると受け入れてください。
:::

私たちの目的には、IP範囲、国コード、座標が必要ですので、新しいテーブルを作成し、Geo IPデータを挿入しましょう：

```sql
CREATE TABLE geoip
(
	`cidr` String,
	`latitude` Float64,
	`longitude` Float64,
	`country_code` String
)
ENGINE = MergeTree
ORDER BY cidr

INSERT INTO geoip
WITH
	bitXor(ip_range_start, ip_range_end) as xor,
	if(xor != 0, ceil(log2(xor)), 0) as unmatched,
	32 - unmatched as cidr_suffix,
	toIPv4(bitAnd(bitNot(pow(2, unmatched) - 1), ip_range_start)::UInt64) as cidr_address
SELECT
	concat(toString(cidr_address),'/',toString(cidr_suffix)) as cidr,
	latitude,
	longitude,
	country_code    
FROM geoip_url
```

ClickHouseで低レイテンシのIPルックアップを実行するには、Geo IPデータのキー→属性マッピングをインメモリで保存するために辞書を活用します。ClickHouseは、ネットワークプレフィックス（CIDRブロック）を座標および国コードにマッピングするための`ip_trie`[辞書構造](/sql-reference/dictionaries#ip_trie)を提供します。次のクエリでは、このレイアウトを使用して辞書を指定し、上記のテーブルをソースとして使用します。

```sql
CREATE DICTIONARY ip_trie (
   cidr String,
   latitude Float64,
   longitude Float64,
   country_code String
)
primary key cidr
source(clickhouse(table 'geoip'))
layout(ip_trie)
lifetime(3600);
```

辞書から行を選択し、このデータセットがルックアップに利用可能であるかを確認できます：

```sql
SELECT * FROM ip_trie LIMIT 3

┌─cidr───────┬─latitude─┬─longitude─┬─country_code─┐
│ 1.0.0.0/22 │  26.0998 │   119.297 │ CN       	   │
│ 1.0.0.0/24 │ -27.4767 │   153.017 │ AU       	   │
│ 1.0.4.0/22 │ -38.0267 │   145.301 │ AU       	   │
└────────────┴──────────┴───────────┴──────────────┘

3 rows in set. Elapsed: 4.662 sec.
```

:::note 定期的なリフレッシュ
ClickHouseの辞書は、基になるテーブルデータおよび上記の寿命条項に基づいて定期的にリフレッシュされます。DB-IPデータセットの最新の変更を反映するためにGeo IP辞書を更新するには、ただgeoip_urlリモートテーブルからgeoipテーブルに変換を適用してデータを再挿入すればよいでしょう。
:::

Geo IPデータが`ip_trie`辞書（便利にも`ip_trie`という名前）にロードされたので、IPの地理的位置を使用できます。これは、次のように[`dictGet()`関数](/sql-reference/functions/ext-dict-functions)を使用して実現できます。

```sql
SELECT dictGet('ip_trie', ('country_code', 'latitude', 'longitude'), CAST('85.242.48.167', 'IPv4')) AS ip_details

┌─ip_details──────────────┐
│ ('PT',38.7944,-9.34284) │
└─────────────────────────┘

1 row in set. Elapsed: 0.003 sec.
```

ここでの取得速度に注目してください。これにより、ログを豊かにすることができます。この場合、私たちは**クエリ時の豊かさを実行することを選択します**。

元のログデータセットに戻り、上記を使用して国別にログを集計できます。次の例は、先にマテリアライズドビューによって生成されたスキーマを使用し、抽出された`RemoteAddress`カラムがあることを前提としています。

```sql
SELECT dictGet('ip_trie', 'country_code', tuple(RemoteAddress)) AS country,
	formatReadableQuantity(count()) AS num_requests
FROM default.otel_logs_v2
WHERE country != ''
GROUP BY country
ORDER BY count() DESC
LIMIT 5

┌─country─┬─num_requests────┐
│ IR  	  │ 7.36 million	│
│ US  	  │ 1.67 million	│
│ AE  	  │ 526.74 thousand │
│ DE  	  │ 159.35 thousand │
│ FR  	  │ 109.82 thousand │
└─────────┴─────────────────┘

5 rows in set. Elapsed: 0.140 sec. Processed 20.73 million rows, 82.92 MB (147.79 million rows/s., 591.16 MB/s.)
Peak memory usage: 1.16 MiB.
```

IPから地理的な位置へのマッピングは変化する可能性があるため、ユーザーはリクエストが行われたときにどこからリクエストが発信されたのか知りたいと思うでしょう。したがって、インデックスタイムの豊かさが好まれる可能性があります。これは、次のようにマテリアライズドカラムを使用して実行できます。

```sql
CREATE TABLE otel_logs_v2
(
	`Body` String,
	`Timestamp` DateTime,
	`ServiceName` LowCardinality(String),
	`Status` UInt16,
	`RequestProtocol` LowCardinality(String),
	`RunTime` UInt32,
	`Size` UInt32,
	`UserAgent` String,
	`Referer` String,
	`RemoteUser` String,
	`RequestType` LowCardinality(String),
	`RequestPath` String,
	`RemoteAddress` IPv4,
	`RefererDomain` String,
	`RequestPage` String,
	`SeverityText` LowCardinality(String),
	`SeverityNumber` UInt8,
    `Country` String MATERIALIZED dictGet('ip_trie', 'country_code', tuple(RemoteAddress)),
    `Latitude` Float32 MATERIALIZED dictGet('ip_trie', 'latitude', tuple(RemoteAddress)),
    `Longitude` Float32 MATERIALIZED dictGet('ip_trie', 'longitude', tuple(RemoteAddress))
)
ENGINE = MergeTree
ORDER BY (ServiceName, Timestamp)
```

:::note 定期的な更新
ユーザーは、ipの豊かさの辞書を新しいデータに基づいて定期的に更新することを望むでしょう。これは、辞書の`LIFETIME`条項を使用することで実現でき、これにより辞書は基になるテーブルから定期的に再読み込みされることになります。基になるテーブルを更新するには、["リフレッシュ可能なマテリアライズドビュー"](/materialized-view/refreshable-materialized-view)を参照してください。
:::

上記の国と座標は、国別にグループ化およびフィルタリングを超えた視覚化の可能性を提供します。インスピレーションについては、["地理データの視覚化"](/observability/grafana#visualizing-geo-data)を参照してください。

### 正規表現辞書の使用（ユーザーエージェント解析） {#using-regex-dictionaries-user-agent-parsing}

[ユーザーエージェント文字列](https://en.wikipedia.org/wiki/User_agent)の解析は、古典的な正規表現の問題であり、ログやトレースベースのデータセットで一般的な要件です。ClickHouseは、正規表現ツリー辞書を使用してユーザーエージェントを効率的に解析する機能を提供します。

正規表現ツリー辞書は、正規表現ツリーを含むYAMLファイルへのパスを提供するYAMLRegExpTree辞書ソースタイプを使用してClickHouseオープンソース内で定義されています。独自の正規表現辞書を提供したい場合、必要な構造の詳細は[こちら](/sql-reference/dictionaries#use-regular-expression-tree-dictionary-in-clickhouse-open-source)にあります。以下では、[uap-core](https://github.com/ua-parser/uap-core)を使用してユーザーエージェントの解析に焦点を当て、サポートされているCSVフォーマットの辞書をロードします。このアプローチはOSSとClickHouse Cloudに対応しています。

:::note
以下の例では、2024年6月のユーザーエージェント解析の最新のuap-core正規表現のスナップショットを使用します。最新のファイルは、時折更新され、[こちら](https://raw.githubusercontent.com/ua-parser/uap-core/master/regexes.yaml)で見つけることができます。ユーザーは、以下で使用するCSVファイルにデータを読み込む手順を[こちら](/sql-reference/dictionaries#collecting-attribute-values)で確認できます。
:::

次のメモリテーブルを作成します。これには、デバイス、ブラウザ、およびオペレーティングシステムの解析に必要な正規表現が含まれています。

```sql
CREATE TABLE regexp_os
(
	id UInt64,
	parent_id UInt64,
	regexp String,
	keys   Array(String),
	values Array(String)
) ENGINE=Memory;

CREATE TABLE regexp_browser
(
	id UInt64,
	parent_id UInt64,
	regexp String,
	keys   Array(String),
	values Array(String)
) ENGINE=Memory;

CREATE TABLE regexp_device
(
	id UInt64,
	parent_id UInt64,
	regexp String,
	keys   Array(String),
	values Array(String)
) ENGINE=Memory;
```

これらのテーブルは、以下の公開されているCSVファイルから、urlテーブル関数を使用してポピュレートできます。

```sql
INSERT INTO regexp_os SELECT * FROM s3('https://datasets-documentation.s3.eu-west-3.amazonaws.com/user_agent_regex/regexp_os.csv', 'CSV', 'id UInt64, parent_id UInt64, regexp String, keys Array(String), values Array(String)')

INSERT INTO regexp_device SELECT * FROM s3('https://datasets-documentation.s3.eu-west-3.amazonaws.com/user_agent_regex/regexp_device.csv', 'CSV', 'id UInt64, parent_id UInt64, regexp String, keys Array(String), values Array(String)')

INSERT INTO regexp_browser SELECT * FROM s3('https://datasets-documentation.s3.eu-west-3.amazonaws.com/user_agent_regex/regexp_browser.csv', 'CSV', 'id UInt64, parent_id UInt64, regexp String, keys Array(String), values Array(String)')
```

メモリテーブルがポピュレートされたら、正規表現辞書をロードします。キー値をカラムとして指定する必要があることに注意してください。これらはユーザーエージェントから抽出できる属性です。

```sql
CREATE DICTIONARY regexp_os_dict
(
	regexp String,
	os_replacement String default 'Other',
	os_v1_replacement String default '0',
	os_v2_replacement String default '0',
	os_v3_replacement String default '0',
	os_v4_replacement String default '0'
)
PRIMARY KEY regexp
SOURCE(CLICKHOUSE(TABLE 'regexp_os'))
LIFETIME(MIN 0 MAX 0)
LAYOUT(REGEXP_TREE);

CREATE DICTIONARY regexp_device_dict
(
	regexp String,
	device_replacement String default 'Other',
	brand_replacement String,
	model_replacement String
)
PRIMARY KEY(regexp)
SOURCE(CLICKHOUSE(TABLE 'regexp_device'))
LIFETIME(0)
LAYOUT(regexp_tree);

CREATE DICTIONARY regexp_browser_dict
(
	regexp String,
	family_replacement String default 'Other',
	v1_replacement String default '0',
	v2_replacement String default '0'
)
PRIMARY KEY(regexp)
SOURCE(CLICKHOUSE(TABLE 'regexp_browser'))
LIFETIME(0)
LAYOUT(regexp_tree);
```

これらの辞書が読み込まれたら、サンプルユーザーエージェントを提供し、新しい辞書抽出機能をテストしましょう。

```sql
WITH 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0' AS user_agent
SELECT
	dictGet('regexp_device_dict', ('device_replacement', 'brand_replacement', 'model_replacement'), user_agent) AS device,
	dictGet('regexp_browser_dict', ('family_replacement', 'v1_replacement', 'v2_replacement'), user_agent) AS browser,
	dictGet('regexp_os_dict', ('os_replacement', 'os_v1_replacement', 'os_v2_replacement', 'os_v3_replacement'), user_agent) AS os

┌─device────────────────┬─browser───────────────┬─os─────────────────────────┐
│ ('Mac','Apple','Mac') │ ('Firefox','127','0') │ ('Mac OS X','10','15','0') │
└───────────────────────┴───────────────────────┴────────────────────────────┘

1 row in set. Elapsed: 0.003 sec.
```

ユーザーエージェントに関するルールはほとんど変わらないため、新しいブラウザ、オペレーティングシステム、およびデバイスに応じて辞書を更新する必要があるのは意味があります。このため、抽出 عملは、マテリアライズドカラムまたはマテリアライズドビューを使用して実行できます。以下では、先に使用したマテリアライズドビューを修正します。

```sql
CREATE MATERIALIZED VIEW otel_logs_mv TO otel_logs_v2
AS SELECT
	Body,
	CAST(Timestamp, 'DateTime') AS Timestamp,
	ServiceName,
	LogAttributes['status'] AS Status,
	LogAttributes['request_protocol'] AS RequestProtocol,
	LogAttributes['run_time'] AS RunTime,
	LogAttributes['size'] AS Size,
	LogAttributes['user_agent'] AS UserAgent,
	LogAttributes['referer'] AS Referer,
	LogAttributes['remote_user'] AS RemoteUser,
	LogAttributes['request_type'] AS RequestType,
	LogAttributes['request_path'] AS RequestPath,
	LogAttributes['remote_addr'] AS RemoteAddress,
	domain(LogAttributes['referer']) AS RefererDomain,
	path(LogAttributes['request_path']) AS RequestPage,
	multiIf(CAST(Status, 'UInt64') > 500, 'CRITICAL', CAST(Status, 'UInt64') > 400, 'ERROR', CAST(Status, 'UInt64') > 300, 'WARNING', 'INFO') AS SeverityText,
	multiIf(CAST(Status, 'UInt64') > 500, 20, CAST(Status, 'UInt64') > 400, 17, CAST(Status, 'UInt64') > 300, 13, 9) AS SeverityNumber,
	dictGet('regexp_device_dict', ('device_replacement', 'brand_replacement', 'model_replacement'), UserAgent) AS Device,
	dictGet('regexp_browser_dict', ('family_replacement', 'v1_replacement', 'v2_replacement'), UserAgent) AS Browser,
	dictGet('regexp_os_dict', ('os_replacement', 'os_v1_replacement', 'os_v2_replacement', 'os_v3_replacement'), UserAgent) AS Os
FROM otel_logs
```

これにより、ターゲットテーブル`otel_logs_v2`のスキーマを変更する必要があります。

```sql
CREATE TABLE default.otel_logs_v2
(
 `Body` String,
 `Timestamp` DateTime,
 `ServiceName` LowCardinality(String),
 `Status` UInt8,
 `RequestProtocol` LowCardinality(String),
 `RunTime` UInt32,
 `Size` UInt32,
 `UserAgent` String,
 `Referer` String,
 `RemoteUser` String,
 `RequestType` LowCardinality(String),
 `RequestPath` String,
 `remote_addr` IPv4,
 `RefererDomain` String,
 `RequestPage` String,
 `SeverityText` LowCardinality(String),
 `SeverityNumber` UInt8,
 `Device` Tuple(device_replacement LowCardinality(String), brand_replacement LowCardinality(String), model_replacement LowCardinality(String)),
 `Browser` Tuple(family_replacement LowCardinality(String), v1_replacement LowCardinality(String), v2_replacement LowCardinality(String)),
 `Os` Tuple(os_replacement LowCardinality(String), os_v1_replacement LowCardinality(String), os_v2_replacement LowCardinality(String), os_v3_replacement LowCardinality(String))
)
ENGINE = MergeTree
ORDER BY (ServiceName, Timestamp, Status)
```

コレクターを再起動して、前に文書化された手順に従って構造化されたログを取り込んだ後、抽出されたDevice、Browser、Osカラムをクエリできます。

```sql
SELECT Device, Browser, Os
FROM otel_logs_v2
LIMIT 1
FORMAT Vertical

Row 1:
──────
Device:  ('Spider','Spider','Desktop')
Browser: ('AhrefsBot','6','1')
Os:  	('Other','0','0','0')
```

:::note 複雑な構造のためのタプル
これらのユーザーエージェントカラムにタプルを使用していることに注意してください。タプルは、階層が事前に知られている複雑な構造に推奨されます。サブカラムは通常のカラムと同じパフォーマンスを提供します（マップキーとは異なり）が、異種型を許容します。
:::

### さらなる読み物 {#further-reading}

辞書に関するさらなる例と詳細については、以下の記事をお勧めします：

- [高度な辞書トピック](/dictionary#advanced-dictionary-topics)
- ["辞書を使用してクエリを加速する"](https://clickhouse.com/blog/faster-queries-dictionaries-clickhouse)
- [辞書](/sql-reference/dictionaries)

## クエリの加速 {#accelerating-queries}

ClickHouseはクエリパフォーマンスを加速するためのいくつかの手法をサポートしています。この後の節で説明する点を考慮する前に、最も人気のあるアクセスパターンを最適化し、圧縮を最大化するために適切な主キー/順序キーを選択してください。これが通常は最小限の労力で最大のパフォーマンスに影響を与えます。

### 集計のためのマテリアライズドビュー（増分）を使用 {#using-materialized-views-incremental-for-aggregations}

以前のセクションでは、データ変換やフィルタリングのためにマテリアライズドビューを使用する方法を探りました。しかし、マテリアライズドビューは、挿入時に集計を事前計算し、その結果を保存するためにも使用できます。この結果は、以降の挿入からの結果で更新することができ、実質的に挿入時に集計を事前計算できるのです。

ここでの主なアイデアは、結果がオリジナルのデータのより小さな表現（集計の場合は部分的なスケッチ）であることが多いということです。ターゲットテーブルから結果を読むためのよりシンプルなクエリと組み合わせると、同じ計算をオリジナルのデータの上で実行した場合よりもクエリ時間が速くなります。

構造化されたログを使用して、時間あたりのトラフィック合計を計算する次のクエリを考えてみましょう：

```sql
SELECT toStartOfHour(Timestamp) AS Hour,
	sum(toUInt64OrDefault(LogAttributes['size'])) AS TotalBytes
FROM otel_logs
GROUP BY Hour
ORDER BY Hour DESC
LIMIT 5

┌────────────────Hour─┬─TotalBytes─┐
│ 2019-01-26 16:00:00 │ 1661716343 │
│ 2019-01-26 15:00:00 │ 1824015281 │
│ 2019-01-26 14:00:00 │ 1506284139 │
│ 2019-01-26 13:00:00 │ 1580955392 │
│ 2019-01-26 12:00:00 │ 1736840933 │
└─────────────────────┴────────────┘

5 rows in set. Elapsed: 0.666 sec. Processed 10.37 million rows, 4.73 GB (15.56 million rows/s., 7.10 GB/s.)
Peak memory usage: 1.40 MiB.
```

これは、ユーザーがGrafanaでプロットするかもしれない一般的な折れ線グラフを考えることができます。このクエリは非常に速いですが、データセットが10m行しかなく、ClickHouseは高速です！ただし、これを数十億、数兆行に拡張すると、理想的にはこのクエリパフォーマンスを維持したいと考えます。

:::note
このクエリは、`LogAttributes`マップからサイズキーを抽出するマテリアライズドビューによって生成された`otel_logs_v2`テーブルを使用した場合、10倍速くなります。ここでは説明のために生データを使用していますが、一般的なクエリであれば前述のビューを使用することをお勧めします。
:::

この計算を挿入時に行うために、結果を受け取るためのテーブルが必要です。このテーブルは、時間ごとに1行だけ保持すべきです。既存の時間に対して更新が受信された場合、他のカラムは既存の時間の行とマージされるべきです。この増分状態のマージが行われるには、他のカラムの部分的な状態が保存されている必要があります。

これには、ClickHouseで特別なエンジンタイプが必要です：SummingMergeTree。これにより、同じ順序キーを持つすべての行が、数値カラムの合計値を含む1行に置き換えられます。以下のテーブルは、同じ日付の行をマージして、数値カラムを合計します。

```sql
CREATE TABLE bytes_per_hour
(
  `Hour` DateTime,
  `TotalBytes` UInt64
)
ENGINE = SummingMergeTree
ORDER BY Hour
```

このマテリアライズドビューをデモするために、`bytes_per_hour`テーブルが空でデータを受信していないと仮定します。マテリアライズドビューは、`otel_logs`に挿入されたデータに対して上記の`SELECT`を実行し、結果を`bytes_per_hour`に送信します。構文は以下の通りです：

```sql
CREATE MATERIALIZED VIEW bytes_per_hour_mv TO bytes_per_hour AS
SELECT toStartOfHour(Timestamp) AS Hour,
       sum(toUInt64OrDefault(LogAttributes['size'])) AS TotalBytes
FROM otel_logs
GROUP BY Hour
```

ここでの`TO`句は重要であり、結果が送信される先、すなわち`bytes_per_hour`を示します。

OTel Collectorを再起動し、ログを再送すると、`bytes_per_hour`テーブルは上記のクエリ結果で増分的にポピュレートされます。完了時に、`bytes_per_hour`のサイズを確認することができます。1時間ごとに1行が必要です：

```sql
SELECT count()
FROM bytes_per_hour
FINAL

┌─count()─┐
│ 	113 │
└─────────┘
```

ここで、私たちは`otel_logs`での行数10mを113に効果的に減少させて、私たちのクエリ結果を保存しています。ここでの重要な点は、`otel_logs`テーブルに新しいログが挿入されると、それぞれの時間に新しい値が`bytes_per_hour`に送信され、自動的にバックグラウンドでマージされることです。`bytes_per_hour`は、常に小さく、最新の状態を保ちます。

行のマージは非同期で行われるため、ユーザーがクエリを実行する際に、時間ごとに複数の行が存在する可能性があります。クエリ時に未処理の行がマージされることを確実にするためには、2つのオプションがあります：

- テーブル名に[`FINAL`修飾子](/sql-reference/statements/select/from#final-modifier)を使用します（上記のカウントクエリで行ったことです）。
- 最終テーブルで使用した順序キーで集計を行い、メトリックを合計します。

通常、2番目のオプションがより効率的かつ柔軟です（テーブルは他のことに使用できます）が、一部のクエリには最初の方が簡単である場合もあります。以下の両方を示します：

```sql
SELECT
	Hour,
	sum(TotalBytes) AS TotalBytes
FROM bytes_per_hour
GROUP BY Hour
ORDER BY Hour DESC
LIMIT 5

┌────────────────Hour─┬─TotalBytes─┐
│ 2019-01-26 16:00:00 │ 1661716343 │
│ 2019-01-26 15:00:00 │ 1824015281 │
│ 2019-01-26 14:00:00 │ 1506284139 │
│ 2019-01-26 13:00:00 │ 1580955392 │
│ 2019-01-26 12:00:00 │ 1736840933 │
└─────────────────────┴────────────┘

5 rows in set. Elapsed: 0.008 sec.

SELECT
	Hour,
	TotalBytes
FROM bytes_per_hour
FINAL
ORDER BY Hour DESC
LIMIT 5

┌────────────────Hour─┬─TotalBytes─┐
│ 2019-01-26 16:00:00 │ 1661716343 │
│ 2019-01-26 15:00:00 │ 1824015281 │
│ 2019-01-26 14:00:00 │ 1506284139 │
│ 2019-01-26 13:00:00 │ 1580955392 │
│ 2019-01-26 12:00:00 │ 1736840933 │
└─────────────────────┴────────────┘

5 rows in set. Elapsed: 0.005 sec.
```

これにより、クエリの時間が0.6秒から0.008秒に短縮され、75倍以上のスピードアップを達成しました！

:::note
これらのコスト削減は、大規模データセットでより複雑なクエリの場合にさらに大きくなる可能性があります。例は[こちら](https://github.com/ClickHouse/clickpy)を参照してください。
:::

#### より複雑な例 {#a-more-complex-example}

上記の例では、[SummingMergeTree](/engines/table-engines/mergetree-family/summingmergetree)を使用してシンプルな時間単位の集計を行いました。シンプルな合計を超える統計を必要とする場合は、異なるターゲットテーブルエンジンが必要です： [AggregatingMergeTree](/engines/table-engines/mergetree-family/aggregatingmergetree)です。

ユニークIPアドレス（またはユニークユーザー）の1日あたりの数を計算したいとしましょう。これのクエリは次の通りです：

```sql
SELECT toStartOfHour(Timestamp) AS Hour, uniq(LogAttributes['remote_addr']) AS UniqueUsers
FROM otel_logs
GROUP BY Hour
ORDER BY Hour DESC

┌────────────────Hour─┬─UniqueUsers─┐
│ 2019-01-26 16:00:00 │   	4763    │
…
│ 2019-01-22 00:00:00 │    	536     │
└─────────────────────┴─────────────┘

113 rows in set. Elapsed: 0.667 sec. Processed 10.37 million rows, 4.73 GB (15.53 million rows/s., 7.09 GB/s.)
```
```html
<p>インクリメンタル更新のためにカーディナリティカウントを永続化するには、<code>AggregatingMergeTree</code>が必要です。</p>

<pre><code>sql
CREATE TABLE unique_visitors_per_hour
(
  `Hour` DateTime,
  `UniqueUsers` AggregateFunction(uniq, IPv4)
)
ENGINE = AggregatingMergeTree
ORDER BY Hour
</code></pre>

<p>ClickHouseが集約状態を保存することを認識できるようにするために、<code>UniqueUsers</code>カラムをタイプ<code>[AggregateFunction]</code>として定義し、部分状態の関数ソース（uniq）とソースカラムのタイプ（IPv4）を指定します。SummingMergeTreeのように、同じ<code>ORDER BY</code>キー値を持つ行はマージされます（上記の例では<code>Hour</code>）。</p>

<p>関連するマテリアライズドビューは、以前のクエリを使います：</p>

<pre><code>sql
CREATE MATERIALIZED VIEW unique_visitors_per_hour_mv TO unique_visitors_per_hour AS
SELECT toStartOfHour(Timestamp) AS Hour,
	uniqState(LogAttributes['remote_addr']::IPv4) AS UniqueUsers
FROM otel_logs
GROUP BY Hour
ORDER BY Hour DESC
</code></pre>

<p>集約関数の末尾にサフィックス<code>State</code>を付加することに注意してください。これにより、関数の集約状態が最終結果の代わりに返されます。これには、この部分状態が他の状態とマージできるようにするための追加情報が含まれます。</p>

<p>データがリロードされると、Collectorの再起動を通じて、<code>unique_visitors_per_hour</code>テーブルに113行が存在することが確認できます。</p>

<pre><code>sql
SELECT count()
FROM unique_visitors_per_hour
FINAL
┌─count()─┐
│ 	113   │
└─────────┘

1 row in set. Elapsed: 0.009 sec.
</code></pre>

<p>最終的なクエリでは、関数に対してMergeサフィックスを利用する必要があります（列が部分集約状態を格納しているため）：</p>

<pre><code>sql
SELECT Hour, uniqMerge(UniqueUsers) AS UniqueUsers
FROM unique_visitors_per_hour
GROUP BY Hour
ORDER BY Hour DESC

┌────────────────Hour─┬─UniqueUsers─┐
│ 2019-01-26 16:00:00 │   	 4763   │

│ 2019-01-22 00:00:00 │		 536    │
└─────────────────────┴─────────────┘

113 rows in set. Elapsed: 0.027 sec.
</code></pre>

<p><code>FINAL</code>を使用するのではなく、ここでは<code>GROUP BY</code>を使用することに注目してください。</p>

<h3>マテリアライズドビューを使用した迅速なルックアップ（インクリメンタル） {#using-materialized-views-incremental--for-fast-lookups}</h3>

<p>ユーザーは、フィルターおよび集約句で頻繁に使用されるカラムを持つClickHouseの順序キーを選択する際、自分のアクセスパターンを考慮する必要があります。これは、ユーザーが単一のカラムセットにカプセル化できないより多様なアクセスパターンを持つObservabilityの使用例では制約が加わる可能性があります。これは、デフォルトのOTelスキーマに組み込まれた例で最もよく示されています。トレースのデフォルトスキーマを考慮してください：</p>

<pre><code>sql
CREATE TABLE otel_traces
(
	`Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
	`TraceId` String CODEC(ZSTD(1)),
	`SpanId` String CODEC(ZSTD(1)),
	`ParentSpanId` String CODEC(ZSTD(1)),
	`TraceState` String CODEC(ZSTD(1)),
	`SpanName` LowCardinality(String) CODEC(ZSTD(1)),
	`SpanKind` LowCardinality(String) CODEC(ZSTD(1)),
	`ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
	`ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`ScopeName` String CODEC(ZSTD(1)),
	`ScopeVersion` String CODEC(ZSTD(1)),
	`SpanAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
	`Duration` Int64 CODEC(ZSTD(1)),
	`StatusCode` LowCardinality(String) CODEC(ZSTD(1)),
	`StatusMessage` String CODEC(ZSTD(1)),
	`Events.Timestamp` Array(DateTime64(9)) CODEC(ZSTD(1)),
	`Events.Name` Array(LowCardinality(String)) CODEC(ZSTD(1)),
	`Events.Attributes` Array(Map(LowCardinality(String), String)) CODEC(ZSTD(1)),
	`Links.TraceId` Array(String) CODEC(ZSTD(1)),
	`Links.SpanId` Array(String) CODEC(ZSTD(1)),
	`Links.TraceState` Array(String) CODEC(ZSTD(1)),
	`Links.Attributes` Array(Map(LowCardinality(String), String)) CODEC(ZSTD(1)),
	INDEX idx_trace_id TraceId TYPE bloom_filter(0.001) GRANULARITY 1,
	INDEX idx_res_attr_key mapKeys(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
	INDEX idx_res_attr_value mapValues(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
	INDEX idx_span_attr_key mapKeys(SpanAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
	INDEX idx_span_attr_value mapValues(SpanAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
	INDEX idx_duration Duration TYPE minmax GRANULARITY 1
)
ENGINE = MergeTree
PARTITION BY toDate(Timestamp)
ORDER BY (ServiceName, SpanName, toUnixTimestamp(Timestamp), TraceId)
</code></pre>

<p>このスキーマは、<code>ServiceName</code>、<code>SpanName</code>、および<code>Timestamp</code>によるフィルタリングに最適化されています。トレーシングでは、ユーザーも特定の<code>TraceId</code>によるルックアップを行い、関連するトレースのスパンを取得する能力が必要です。これが順序キーに存在しますが、その位置が最後であるため、<a href="/optimize/sparse-primary-indexes#ordering-key-columns-efficiently">フィルタリングは効率的ではなくなる</a>可能性が高く、単一のトレースを取得する際にスキャンするデータの量がかなり多くなる可能性があります。</p>

<p>OTelコレクターは、この課題に対処するためにマテリアライズドビューと関連テーブルをインストールします。テーブルとビューは以下のようになります：</p>

<pre><code>sql
CREATE TABLE otel_traces_trace_id_ts
(
	`TraceId` String CODEC(ZSTD(1)),
	`Start` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
	`End` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
	INDEX idx_trace_id TraceId TYPE bloom_filter(0.01) GRANULARITY 1
)
ENGINE = MergeTree
ORDER BY (TraceId, toUnixTimestamp(Start))


CREATE MATERIALIZED VIEW otel_traces_trace_id_ts_mv TO otel_traces_trace_id_ts
(
	`TraceId` String,
	`Start` DateTime64(9),
	`End` DateTime64(9)
)
AS SELECT
	TraceId,
	min(Timestamp) AS Start,
	max(Timestamp) AS End
FROM otel_traces
WHERE TraceId != ''
GROUP BY TraceId
</code></pre>

<p>このビューは、テーブル<code>otel_traces_trace_id_ts</code>がトレースの最小および最大タイムスタンプを持つことを効果的に保証します。このテーブルは<code>TraceId</code>で順序付けされており、これによりこれらのタイムスタンプが効率的に取得できます。これらのタイムスタンプリングは、メインの<code>otel_traces</code>テーブルをクエリする際に使用できます。具体的には、IDでトレースを取得する際に、Grafanaは次のクエリを使用します：</p>

<pre><code>sql
WITH 'ae9226c78d1d360601e6383928e4d22d' AS trace_id,
	(
    	SELECT min(Start)
    	  FROM default.otel_traces_trace_id_ts
    	  WHERE TraceId = trace_id
	) AS trace_start,
	(
    	SELECT max(End) + 1
    	  FROM default.otel_traces_trace_id_ts
    	  WHERE TraceId = trace_id
	) AS trace_end
SELECT
	TraceId AS traceID,
	SpanId AS spanID,
	ParentSpanId AS parentSpanID,
	ServiceName AS serviceName,
	SpanName AS operationName,
	Timestamp AS startTime,
	Duration * 0.000001 AS duration,
	arrayMap(key -> map('key', key, 'value', SpanAttributes[key]), mapKeys(SpanAttributes)) AS tags,
	arrayMap(key -> map('key', key, 'value', ResourceAttributes[key]), mapKeys(ResourceAttributes)) AS serviceTags
FROM otel_traces
WHERE (traceID = trace_id) AND (startTime >= trace_start) AND (startTime <= trace_end)
LIMIT 1000
</code></pre>

<p>ここでのCTE（共通テーブル式）は、トレースID <code>ae9226c78d1d360601e6383928e4d22d</code>の最小および最大タイムスタンプを特定し、次にこれを使用して関連するスパンのためにメインの<code>otel_traces</code>をフィルタリングします。</p>

<p>同様のアクセスパターンにもこのアプローチを適用できます。同様の例については、データモデルの<a href="/materialized-view#lookup-table">こちら</a>を参照してください。</p>

<h3>プロジェクションの使用 {#using-projections}</h3>

<p>ClickHouseのプロジェクションを使用すると、ユーザーはテーブルに対して複数の<code>ORDER BY</code>句を指定できます。</p>

<p>前のセクションでは、マテリアライズドビューがClickHouseで集約を事前に計算し、行を変換し、さまざまなアクセスパターンのObservabilityクエリを最適化するためにどのように使用できるかを探りました。</p>

<p>マテリアライズドビューがターゲットテーブルに行を送信し、挿入を受け取る元のテーブルとは異なる順序キーで最適化されるように、例を提供しました。</p>

<p>プロジェクションは、プライマリキーの一部ではないカラムに対するクエリ最適化を可能にするため、同じ問題を解決するためにも使用できます。</p>

<p>理論的には、この機能はテーブルに対して複数の順序キーを提供するために使用できますが、一つの明確な欠点があります：データの重複です。具体的には、主なプライマリキーの順序に加えて、各プロジェクションの指定された順序でデータが書き込まれる必要があります。これにより、挿入速度が遅くなり、より多くのディスクスペースが消費されます。</p>

<aside class="note"><p><strong>プロジェクションとマテリアライズドビュー</strong><br />プロジェクションはマテリアライズドビューと同様の多くの機能を提供しますが、後者がしばしば優先されるため、控えめに使用するべきです。ユーザーは欠点を理解し、いつそれらが適切かを知る必要があります。たとえば、プロジェクションは集約の事前計算に使用できる一方で、ユーザーにはマテリアライズドビューの使用を推奨します。</p></aside>

<img src={require('./images/observability-13.png').default}    
  class="image"
  alt="NEEDS ALT"
  style={{width: '800px'}} />

<br />

<p>次のクエリを考えます。これは、<code>otel_logs_v2</code>テーブルを500エラーコードでフィルタリングします。これは、ユーザーがエラーコードでフィルタリングしたいと思っているログに対する一般的なアクセスパターンである可能性があります：</p>

<pre><code>sql
SELECT Timestamp, RequestPath, Status, RemoteAddress, UserAgent
FROM otel_logs_v2
WHERE Status = 500
FORMAT `Null`

Ok.

0 rows in set. Elapsed: 0.177 sec. Processed 10.37 million rows, 685.32 MB (58.66 million rows/s., 3.88 GB/s.)
Peak memory usage: 56.54 MiB.
</code></pre>

<aside class="note"><p><strong>パフォーマンスを測定するためにNullを使用</strong><br />ここでは<code>FORMAT Null</code>を使用して結果を出力しません。これにより、すべての結果が読み込まれますが返されず、LIMITによるクエリの早期終了を防ぎます。これは、すべての1000万行をスキャンするのにかかる時間を示すだけのものです。</p></aside>

<p>上記のクエリは、選択した順序キー（<code>(ServiceName, Timestamp)</code>）で線形スキャンを必要とします。上記のクエリのパフォーマンスを改善するために<code>Status</code>を順序キーの末尾に追加することもできますが、プロジェクションを追加することも可能です。</p>

<pre><code>sql
ALTER TABLE otel_logs_v2 (
  ADD PROJECTION status
  (
     SELECT Timestamp, RequestPath, Status, RemoteAddress, UserAgent ORDER BY Status
  )
)

ALTER TABLE otel_logs_v2 MATERIALIZE PROJECTION status
</code></pre>

<p>プロジェクションを最初に作成し、その後にそれをマテリアライズする必要があることに注意してください。この後者のコマンドは、データを2つの異なる順序でディスクに2倍保存する原因となります。データが作成される時にプロジェクションを定義することもでき、以下に示すように、データが挿入される際に自動的に維持されます。</p>

<pre><code>sql
CREATE TABLE otel_logs_v2
(
	`Body` String,
	`Timestamp` DateTime,
	`ServiceName` LowCardinality(String),
	`Status` UInt16,
	`RequestProtocol` LowCardinality(String),
	`RunTime` UInt32,
	`Size` UInt32,
	`UserAgent` String,
	`Referer` String,
	`RemoteUser` String,
	`RequestType` LowCardinality(String),
	`RequestPath` String,
	`RemoteAddress` IPv4,
	`RefererDomain` String,
	`RequestPage` String,
	`SeverityText` LowCardinality(String),
	`SeverityNumber` UInt8,
        PROJECTION status
	(
    	   SELECT Timestamp, RequestPath, Status, RemoteAddress, UserAgent
   	   ORDER BY Status
	)
)
ENGINE = MergeTree
ORDER BY (ServiceName, Timestamp)
</code></pre>

<p>重要なのは、プロジェクションが<code>ALTER</code>を介して作成された場合、その作成は<code>MATERIALIZE PROJECTION</code>コマンドが発行されると非同期になることです。ユーザーは次のクエリを使って、この操作の進捗を確認でき、<code>is_done=1</code>を待ちます。</p>

<pre><code>sql
SELECT parts_to_do, is_done, latest_fail_reason
FROM system.mutations
WHERE (`table` = 'otel_logs_v2') AND (command LIKE '%MATERIALIZE%')

┌─parts_to_do─┬─is_done─┬─latest_fail_reason─┐
│       	0 │   	1   │                	 │
└─────────────┴─────────┴────────────────────┘

1 row in set. Elapsed: 0.008 sec.
</code></pre>

<p>上記のクエリを繰り返すと、パフォーマンスが大幅に改善されたことが、追加のストレージコストの代償として確認できます（ディスクサイズと圧縮を測定する方法については<a href="#measuring-table-size--compression">こちら</a>を参照してください）。</p>

<pre><code>sql
SELECT Timestamp, RequestPath, Status, RemoteAddress, UserAgent
FROM otel_logs_v2
WHERE Status = 500
FORMAT `Null`

0 rows in set. Elapsed: 0.031 sec. Processed 51.42 thousand rows, 22.85 MB (1.65 million rows/s., 734.63 MB/s.)
Peak memory usage: 27.85 MiB.
</code></pre>

<p>上記の例では、以前のクエリで使用されたカラムをプロジェクションに指定しました。これにより、指定されたカラムのみがプロジェクションの一部としてディスクに保存され、Statusで順序付けされます。逆に、もしここで<code>SELECT * </code>を使用した場合、すべてのカラムが保存されることになります。これにより、プロジェクションから利点を得るクエリが増えることになりますが、追加のストレージ費用が発生します。ディスクスペースと圧縮の測定については<a href="#measuring-table-size--compression">こちら</a>を参照してください。</p>

<h3>セカンダリ/データスキッピングインデックス {#secondarydata-skipping-indices}</h3>

<p>ClickHouseにおいてプライマリキーがどれほど適切に調整されていても、一部のクエリは必然的に完全なテーブルスキャンを要求します。マテリアライズドビューや一部のクエリにプロジェクションを使用することでこの問題は軽減できますが、これらは追加のメンテナンスが必要で、ユーザーはそれらの利用可能性を認識しておく必要があります。従来のリレーショナルデータベースがこの問題をセカンダリインデックスで解決するのとは異なり、ClickHouseのような列指向データベースでは効果がありません。その代わりに、ClickHouseは「スキップ」インデックスを使用し、クエリパフォーマンスを大幅に向上させ、データベースが一致する値のない大きなデータチャンクをスキップできるようにします。</p>

<p>デフォルトのOTelスキーマは、マップアクセスへのアクセスを加速させるためにセカンダリインデックスを使用します。これらは一般的に効果がなく、カスタムスキーマにコピーすることを推奨しませんが、スキッピングインデックスは役立つことがあります。</p>

<p>ユーザーは、これらを適用する前に<a href="/optimize/skipping-indexes">セカンダリインデックスについてのガイド</a>を読むことをお勧めします。</p>

<p><strong>一般的に、プライマリキーと目標としている非プライマリカラム/式との間に強い相関関係が存在し、ユーザーが稀な値、すなわち多くのグラニュールに存在しない値を探している場合に効果的です。</strong></p>

<h3>テキスト検索のためのブルームフィルター {#bloom-filters-for-text-search}</h3>

<p>Observabilityクエリでは、ユーザーがテキスト検索を行う必要がある際に、セカンダリインデックスが役立つことがあります。特に、ngramおよびトークンベースのブルームフィルターインデックス<code>ngrambf_v1</code>および<code>tokenbf_v1</code>は、オペレーター<code>LIKE</code>、<code>IN</code>、<code>hasToken</code>を使用してStringカラムの検索を加速させるために使用できます。重要なことに、トークンベースのインデックスは、区切り文字として非英数字を使用してトークンを生成します。これにより、クエリ時にトークン（または単語全体）のみがマッチされます。より詳細なマッチングには、指定したサイズのngramsに文字列を分割する<N-gram bloom filter>を使用できます。</p>

<p>生成されるトークンを評価し、したがってマッチングを行うために、<code>tokens</code>関数を使用できます：</p>

<pre><code>sql
SELECT tokens('https://www.zanbil.ir/m/filter/b113')

┌─tokens────────────────────────────────────────────┐
│ ['https','www','zanbil','ir','m','filter','b113'] │
└───────────────────────────────────────────────────┘

1 row in set. Elapsed: 0.008 sec.
</code></pre>

<p><code>ngram</code>関数は、第二のパラメータとして<code>ngram</code>サイズを指定できる同様の機能を提供します：</p>

<pre><code>sql
SELECT ngrams('https://www.zanbil.ir/m/filter/b113', 3)

┌─ngrams('https://www.zanbil.ir/m/filter/b113', 3)────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ['htt','ttp','tps','ps:','s:/','://','//w','/ww','www','ww.','w.z','.za','zan','anb','nbi','bil','il.','l.i','.ir','ir/','r/m','/m/','m/f','/fi','fil','ilt','lte','ter','er/','r/b','/b1','b11','113'] │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

1 row in set. Elapsed: 0.008 sec.
</code></pre>

<aside class="note"><p><strong>逆インデックス</strong><br />ClickHouseは、セカンダリインデックスとしての逆インデックスの実験的サポートも提供しています。私たちは現在、ログデータセットにこれを推奨していませんが、商業生産の準備が整ったときにはトークンベースのブルームフィルターに取って代わることを期待しています。</p></aside>

<p>この例のために、構造化されたログデータセットを使用します。<code>Referer</code>カラムに「ultra」を含むログの数を数えたいとしましょう。</p>

<pre><code>sql
SELECT count()
FROM otel_logs_v2
WHERE Referer LIKE '%ultra%'

┌─count()─┐
│  114514 │
└─────────┘

1 row in set. Elapsed: 0.177 sec. Processed 10.37 million rows, 908.49 MB (58.57 million rows/s., 5.13 GB/s.)
</code></pre>

<p>ここでは、ngramサイズ3でマッチする必要があります。そのため、<code>ngrambf_v1</code>インデックスを作成します。</p>

<pre><code>sql
CREATE TABLE otel_logs_bloom
(
	`Body` String,
	`Timestamp` DateTime,
	`ServiceName` LowCardinality(String),
	`Status` UInt16,
	`RequestProtocol` LowCardinality(String),
	`RunTime` UInt32,
	`Size` UInt32,
	`UserAgent` String,
	`Referer` String,
	`RemoteUser` String,
	`RequestType` LowCardinality(String),
	`RequestPath` String,
	`RemoteAddress` IPv4,
	`RefererDomain` String,
	`RequestPage` String,
	`SeverityText` LowCardinality(String),
	`SeverityNumber` UInt8,
	INDEX idx_span_attr_value Referer TYPE ngrambf_v1(3, 10000, 3, 7) GRANULARITY 1
)
ENGINE = MergeTree
ORDER BY (Timestamp)
</code></pre>

<p>ここでのインデックス<code>ngrambf_v1(3, 10000, 3, 7)</code>は、4つのパラメータを取ります。これらの最後のもの（値7）はシードを表し、他はngramサイズ（3）、値<code>m</code>（フィルタサイズ）、ハッシュ関数の数<code>k</code>（7）を表します。<code>k</code>と<code>m</code>は調整が必要で、一意のngram/トークンの数やフィルターが真の負になった確率に基づく必要があります。そのために、これらの値を確立するのに役立つ<a href="/engines/table-engines/mergetree-family/mergetree#bloom-filter">これらの関数</a>を推奨します。</p>

<p>正しく調整されれば、ここでの速度向上はかなりのものになる可能性があります：</p>

<pre><code>sql
SELECT count()
FROM otel_logs_bloom
WHERE Referer LIKE '%ultra%'
┌─count()─┐
│ 	182   │
└─────────┘

1 row in set. Elapsed: 0.077 sec. Processed 4.22 million rows, 375.29 MB (54.81 million rows/s., 4.87 GB/s.)
Peak memory usage: 129.60 KiB.
</code></pre>

<aside class="note"><p><strong>例に過ぎない</strong><br />上記はあくまで説明のための例です。ユーザーは、ログからの構造を抽出することを推奨しますが、トークンベースのブルームフィルターを使用してテキスト検索を最適化しようとはしないでください。ただし、スタックトレースやその他の大きな文字列がある場合には、テキスト検索が役立つ場合があります。</p></aside>

<p>ブルームフィルターの使用に関する一般的なガイドライン：</p>

<p>ブルームの目的は、<a href="/optimize/sparse-primary-indexes#clickhouse-index-design">グラニュール</a>をフィルタリングし、カラムのすべての値を読み込み、線形スキャンを避けることです。<code>EXPLAIN</code>句を使ってパラメータ<code>indexes=1</code>を指定することで、スキップしたグラニュールの数を特定できます。以下に示す元のテーブル<code>otel_logs_v2</code>とブルームフィルターのあるテーブル<code>otel_logs_bloom</code>に対して考察してみます：</p>

<pre><code>sql
EXPLAIN indexes = 1
SELECT count()
FROM otel_logs_v2
WHERE Referer LIKE '%ultra%'

┌─explain────────────────────────────────────────────────────────────┐
│ Expression ((Project names + Projection))                      	 │
│   Aggregating                                                  	 │
│ 	Expression (Before GROUP BY)                               	     │
│   	Filter ((WHERE + Change column names to column identifiers)) │
│     	ReadFromMergeTree (default.otel_logs_v2)               	     │
│     	Indexes:                                               	     │
│       	PrimaryKey                                           	 │
│         	Condition: true                                    	     │
│         	Parts: 9/9                                         	     │
│         	Granules: 1278/1278                                	     │
└────────────────────────────────────────────────────────────────────┘

10 rows in set. Elapsed: 0.016 sec.


EXPLAIN indexes = 1
SELECT count()
FROM otel_logs_bloom
WHERE Referer LIKE '%ultra%'

┌─explain────────────────────────────────────────────────────────────┐
│ Expression ((Project names + Projection))                      	 │
│   Aggregating                                                  	 │
│ 	Expression (Before GROUP BY)                               	     │
│   	Filter ((WHERE + Change column names to column identifiers)) │
│     	ReadFromMergeTree (default.otel_logs_bloom)            	     │
│     	Indexes:                                               	     │
│       	PrimaryKey                                           	 │ 
│         	Condition: true                                    	     │
│         	Parts: 8/8                                         	     │
│         	Granules: 1276/1276                                 	 │
│       	Skip                                                 	 │
│         	Name: idx_span_attr_value                          	     │
│         	Description: ngrambf_v1 GRANULARITY 1              	     │
│         	Parts: 8/8                                         	     │
│         	Granules: 517/1276                                 	     │
└────────────────────────────────────────────────────────────────────┘
</code></pre>

<p>ブルームフィルターは、通常、対象のカラム自体よりも小さい場合にのみ速くなる傾向があります。大きい場合、性能に対する利益はほとんどないでしょう。フィルタのサイズとカラムのサイズを比較するために、次のクエリを使用します：</p>

<pre><code>sql
SELECT
	name,
	formatReadableSize(sum(data_compressed_bytes)) AS compressed_size,
	formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed_size,
	round(sum(data_uncompressed_bytes) / sum(data_compressed_bytes), 2) AS ratio
FROM system.columns
WHERE (`table` = 'otel_logs_bloom') AND (name = 'Referer')
GROUP BY name
ORDER BY sum(data_compressed_bytes) DESC

┌─name────┬─compressed_size─┬─uncompressed_size─┬─ratio─┐
│ Referer │ 56.16 MiB   	│ 789.21 MiB    	│ 14.05 │
└─────────┴─────────────────┴───────────────────┴───────┘

1 row in set. Elapsed: 0.018 sec.


SELECT
	`table`,
	formatReadableSize(data_compressed_bytes) AS compressed_size,
	formatReadableSize(data_uncompressed_bytes) AS uncompressed_size
FROM system.data_skipping_indices
WHERE `table` = 'otel_logs_bloom'

┌─table───────────┬─compressed_size─┬─uncompressed_size─┐
│ otel_logs_bloom │ 12.03 MiB   	│ 12.17 MiB     	│
└─────────────────┴─────────────────┴───────────────────┘

1 row in set. Elapsed: 0.004 sec.
</pre>

<p>上記の例では、セカンダリブルームフィルターインデックスは12MBで、カラム自体の圧縮サイズである56MBの約5倍小さいことがわかります。</p>

<p>ブルームフィルターは大規模な調整を必要とする場合があります。最適な設定を特定するのに役立つ、<a href="/engines/table-engines/mergetree-family/mergetree#bloom-filter">ここにあるノート</a>に従うことをお勧めします。ブルームフィルターは、挿入およびマージ時に高コストになる可能性があります。ユーザーは、ブルームフィルターを本番に追加する前に挿入パフォーマンスに与える影響を評価する必要があります。</p>

<p>セカンダリスキップインデックスに関する詳細は<a href="/optimize/skipping-indexes#skip-index-functions">こちら</a>を参照してください。</p>

<h3>マップからの抽出 {#extracting-from-maps}</h3>

<p>MapタイプはOTelスキーマで広く使われています。このタイプは、値とキーが同じ型であることを必要とし、Kubernetesラベルなどのメタデータに対しては適しています。Map型のサブキーをクエリすると、全体の親カラムがロードされることに注意してください。マップに多くのキーがある場合、キーが列として存在する場合よりも、ディスクから読み取る必要があるデータが多くなり、クエリペナルティが発生する可能性があります。</p>

<p>特定のキーを頻繁にクエリする場合は、それをルートの専用カラムに移動することを検討してください。これは通常、一般的なアクセスパターンに応じて行われ、導入後に発生するタスクであり、本番前に予測することは難しいことがあります。デプロイ後にスキーマを変更する方法については、<a href="/observability/managing-data#managing-schema-changes">こちら</a>を参照してください。</p>

<h2>テーブルのサイズと圧縮の測定 {#measuring-table-size--compression}</h2>

<p>ClickHouseがObservabilityに使用される主な理由の一つは圧縮です。</p>

<p>保存コストを大幅に削減することに加えて、ディスク上のデータが少ないことは、I/Oが少なく、クエリおよび挿入が速くなることを意味します。I/Oの削減は、CPUに関する圧縮アルゴリズムのオーバーヘッドを上回ります。したがって、ClickHouseのクエリが速いことを確認するための最初の焦点は、データの圧縮を改善することです。</p>

<p>圧縮の測定に関する詳細は<a href="/data-compression/compression-in-clickhouse">こちら</a>をご覧ください。</p>
```
