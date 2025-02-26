---
title : Pretty
slug: /interfaces/formats/Pretty
keywords : [Pretty]
input_format: false
output_format: true
alias: []
---

import PrettyFormatSettings from './_snippets/common-pretty-format-settings.md';

| 入力 | 出力  | エイリアス |
|-------|---------|-------|
| ✗     | ✔       |       |

## 説明 {#description}

`Pretty`形式は、データをUnicodeアートのテーブルとして出力し、端末で色を表示するためにANSIエスケープシーケンスを使用します。
テーブルの完全なグリッドが描画され、各行は端末で二行を占めます。
各結果ブロックは別々のテーブルとして出力されます。 
これは、ブロックをバッファリングなしで出力できるようにするために必要です（結果を事前に計算するためにはバッファリングが必要です）。

[NULL](/sql-reference/syntax.md)は`ᴺᵁᴸᴸ`として出力されます。

## 使用例 {#example-usage}

例（[`PrettyCompact`](./PrettyCompact.md)形式のために示されています）:

```sql title="クエリ"
SELECT * FROM t_null
```

```response title="レスポンス"
┌─x─┬────y─┐
│ 1 │ ᴺᵁᴸᴸ │
└───┴──────┘
```

行は`Pretty`形式のどれにおいてもエスケープされません。以下の例は、[`PrettyCompact`](./PrettyCompact.md)形式のために示されています:

```sql title="クエリ"
SELECT 'String with \'quotes\' and \t character' AS Escaping_test
```

```response title="レスポンス"
┌─Escaping_test────────────────────────┐
│ String with 'quotes' and      character │
└──────────────────────────────────────┘
```

端末にあまりにも多くのデータを出力しないように、最初の`10,000`行だけが印刷されます。 
行数が`10,000`以上の場合、「最初の10 000を表示しました」というメッセージが印刷されます。

:::note
この形式はクエリ結果を出力するためには適していますが、データを解析するためには適していません。
:::

Pretty形式は、合計値（`WITH TOTALS`を使用する場合）や極値（'extremes'が1に設定されている場合）を出力することをサポートしています。 
これらの場合、合計値と極値は主なデータの後に別のテーブルで出力されます。 
以下の例は、[`PrettyCompact`](./PrettyCompact.md)形式を使用しています:

```sql title="クエリ"
SELECT EventDate, count() AS c 
FROM test.hits 
GROUP BY EventDate 
WITH TOTALS 
ORDER BY EventDate 
FORMAT PrettyCompact
```

```response title="レスポンス"
┌──EventDate─┬───────c─┐
│ 2014-03-17 │ 1406958 │
│ 2014-03-18 │ 1383658 │
│ 2014-03-19 │ 1405797 │
│ 2014-03-20 │ 1353623 │
│ 2014-03-21 │ 1245779 │
│ 2014-03-22 │ 1031592 │
│ 2014-03-23 │ 1046491 │
└────────────┴─────────┘

合計:
┌──EventDate─┬───────c─┐
│ 1970-01-01 │ 8873898 │
└────────────┴─────────┘

極値:
┌──EventDate─┬───────c─┐
│ 2014-03-17 │ 1031592 │
│ 2014-03-23 │ 1406958 │
└────────────┴─────────┘
```

## フォーマット設定 {#format-settings}

<PrettyFormatSettings/>
