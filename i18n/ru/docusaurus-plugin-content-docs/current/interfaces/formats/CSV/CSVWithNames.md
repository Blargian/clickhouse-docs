---
alias: []
description: 'Документация для формата CSV'
input_format: true
keywords: ['CSVWithNames']
output_format: true
slug: /interfaces/formats/CSVWithNames
title: 'CSVWithNames'
---

| Input | Output | Alias |
|-------|--------|-------|
| ✔     | ✔      |       |

## Description {#description}

Также выводит строку заголовка с именами столбцов, аналогично [TabSeparatedWithNames](/interfaces/formats/TabSeparatedWithNames).

## Example Usage {#example-usage}

## Format Settings {#format-settings}

:::note
Если настройка [`input_format_with_names_use_header`](../../../operations/settings/settings-formats.md/#input_format_with_names_use_header) установлена в `1`,
столбцы входных данных будут сопоставлены с столбцами таблицы по их именам; столбцы с неизвестными именами будут пропущены, если настройка [input_format_skip_unknown_fields](../../../operations/settings/settings-formats.md/#input_format_skip_unknown_fields) установлена в `1`.
В противном случае первая строка будет пропущена.
:::
