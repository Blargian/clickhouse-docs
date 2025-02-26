---
slug: /native-protocol/columns
sidebar_position: 4
---

# カラムタイプ

一般的な参照については[データ型](/sql-reference/data-types/)を参照してください。

## 数値型 {#numeric-types}

:::tip

数値型のエンコーディングは、AMD64やARM64などのリトルエンディアンCPUのメモリレイアウトと一致します。

これにより、非常に効率的なエンコーディングとデコーディングが実装可能です。

:::

### 整数 {#integers}

IntおよびUIntの8, 16, 32, 64, 128または256ビットの列で、リトルエンディアンで表現されます。

### 浮動小数点数 {#floats}

IEEE 754バイナリ表現のFloat32およびFloat64です。

## 文字列 {#string}

単なる文字列の配列、すなわち（長さ、値）です。

## 固定文字列(N) {#fixedstringn}

Nバイトのシーケンスの配列です。

## IP {#ip}

IPv4は`UInt32`数値型のエイリアスで、UInt32として表現されます。

IPv6は`FixedString(16)`のエイリアスで、バイナリとして直接表現されます。

## タプル {#tuple}

タプルは単なるカラムの配列です。例えば、Tuple(String, UInt8)は連続してエンコードされた2つのカラムです。

## マップ {#map}

`Map(K, V)`は3つのカラムから成ります：`Offsets ColUInt64, Keys K, Values V`。

`Keys`および`Values`カラム内の行数は`Offsets`の最後の値です。

## 配列 {#array}

`Array(T)`は2つのカラムから成ります：`Offsets ColUInt64, Data T`。

`Data`内の行数は`Offsets`の最後の値です。

## Nullable {#nullable}

`Nullable(T)`は`Nulls ColUInt8, Values T`で構成され、同じ行数を持っています。

```go
// NullsはValuesカラム上のnullable "マスク" です。
// 例えば、[null, "", "hello", null, "world"]をエンコードするには、
//	Values: ["", "", "hello", "", "world"] (長さ: 5)
//	Nulls:  [ 1,  0,       0,  1,       0] (長さ: 5)
```

## UUID {#uuid}

`FixedString(16)`のエイリアスで、UUID値はバイナリで表現されます。

## 列挙型 {#enum}

`Int8`または`Int16`のエイリアスですが、各整数は特定の`String`値にマッピングされます。

## 低カーディナリティ {#low-cardinality}

`LowCardinality(T)`は`Index T, Keys K`で構成され、`K`は`Index`のサイズに応じて(UInt8, UInt16, UInt32, UInt64)のいずれかです。

```go
// Index（すなわち辞書）カラムにはユニークな値が含まれ、Keysカラムには
// 実際の値を表すIndexカラムのインデックスのシーケンスが含まれています。
//
// 例えば、["Eko", "Eko", "Amadela", "Amadela", "Amadela", "Amadela"]は
// 次のようにエンコードできます：
//	Index: ["Eko", "Amadela"] (String)
//	Keys:  [0, 0, 1, 1, 1, 1] (UInt8)
//
// CardinalityKeyはIndexのサイズに応じて選択され、選択された型の最大値は
// Index要素の任意のインデックスを表すことができる必要があります。
```

## Bool {#bool}

`UInt8`のエイリアスで、`0`は偽で`1`は真です。
