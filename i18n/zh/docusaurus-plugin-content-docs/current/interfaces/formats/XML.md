---
title: 'XML'
slug: '/interfaces/formats/XML'
keywords: ['XML']
input_format: false
output_format: true
alias: []
---

| Input | Output | Alias |
|-------|--------|-------|
| ✗     | ✔      |       |

## Description {#description}

`XML` 格式仅适用于输出，而不适用于解析。

如果列名没有可接受的格式，则使用 'field' 作为元素名称。一般来说，XML 结构遵循 JSON 结构。
正如 JSON 一样，无效的 UTF-8 序列将被替换字符 `�` 替换，因此输出文本将由有效的 UTF-8 序列组成。

在字符串值中，字符 `<` 和 `&` 将被转义为 `<` 和 `&`。

数组输出为 `<array><elem>Hello</elem><elem>World</elem>...</array>`，元组输出为 `<tuple><elem>Hello</elem><elem>World</elem>...</tuple>`。

## Example Usage {#example-usage}

示例：

```xml
<?xml version='1.0' encoding='UTF-8' ?>
<result>
        <meta>
                <columns>
                        <column>
                                <name>SearchPhrase</name>
                                <type>String</type>
                        </column>
                        <column>
                                <name>count()</name>
                                <type>UInt64</type>
                        </column>
                </columns>
        </meta>
        <data>
                <row>
                        <SearchPhrase></SearchPhrase>
                        <field>8267016</field>
                </row>
                <row>
                        <SearchPhrase>bathroom interior design</SearchPhrase>
                        <field>2166</field>
                </row>
                <row>
                        <SearchPhrase>clickhouse</SearchPhrase>
                        <field>1655</field>
                </row>
                <row>
                        <SearchPhrase>2014 spring fashion</SearchPhrase>
                        <field>1549</field>
                </row>
                <row>
                        <SearchPhrase>freeform photos</SearchPhrase>
                        <field>1480</field>
                </row>
                <row>
                        <SearchPhrase>angelina jolie</SearchPhrase>
                        <field>1245</field>
                </row>
                <row>
                        <SearchPhrase>omsk</SearchPhrase>
                        <field>1112</field>
                </row>
                <row>
                        <SearchPhrase>photos of dog breeds</SearchPhrase>
                        <field>1091</field>
                </row>
                <row>
                        <SearchPhrase>curtain designs</SearchPhrase>
                        <field>1064</field>
                </row>
                <row>
                        <SearchPhrase>baku</SearchPhrase>
                        <field>1000</field>
                </row>
        </data>
        <rows>10</rows>
        <rows_before_limit_at_least>141137</rows_before_limit_at_least>
</result>
```

## Format Settings {#format-settings}

## XML {#xml}
