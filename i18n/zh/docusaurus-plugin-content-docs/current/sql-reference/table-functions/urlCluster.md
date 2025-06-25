---
'description': '允许从指定集群的多个节点并行处理来自 URL 的文件。'
'sidebar_label': 'urlCluster'
'sidebar_position': 201
'slug': '/sql-reference/table-functions/urlCluster'
'title': 'urlCluster'
---


# urlCluster 表函数

允许从指定集群中的多个节点并行处理来自 URL 的文件。在发起者上，它创建与集群中所有节点的连接，公开 URL 文件路径中的星号，并动态分派每个文件。在工作节点上，它向发起者询问下一个需要处理的任务并进行处理。这个过程会重复，直到所有任务完成。

## 语法 {#syntax}

```sql
urlCluster(cluster_name, URL, format, structure)
```

## 参数 {#arguments}

| 参数            | 描述                                                                                                                                               |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `cluster_name`  | 用于构建远程和本地服务器的地址和连接参数集合的集群名称。                                                                                      |
| `URL`           | 可以接受 `GET` 请求的 HTTP 或 HTTPS 服务器地址。类型: [String](../../sql-reference/data-types/string.md)。                                        |
| `format`        | 数据的 [格式](/sql-reference/formats)。类型: [String](../../sql-reference/data-types/string.md)。                                                 |
| `structure`     | 表结构，格式为 `'UserID UInt64, Name String'`。确定列名和类型。类型: [String](../../sql-reference/data-types/string.md)。                       |

## 返回值 {#returned_value}

一个具有指定格式和结构、包含来自定义 `URL` 数据的表。

## 示例 {#examples}

获取来自返回 [CSV](../../interfaces/formats.md#csv) 格式的 HTTP 服务器的包含 `String` 和 [UInt32](../../sql-reference/data-types/int-uint.md) 类型列的表的前 3 行。

1. 使用标准的 Python 3 工具创建一个基本的 HTTP 服务器并启动它：

```python
from http.server import BaseHTTPRequestHandler, HTTPServer

class CSVHTTPServer(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/csv')
        self.end_headers()

        self.wfile.write(bytes('Hello,1\nWorld,2\n', "utf-8"))

if __name__ == "__main__":
    server_address = ('127.0.0.1', 12345)
    HTTPServer(server_address, CSVHTTPServer).serve_forever()
```

```sql
SELECT * FROM urlCluster('cluster_simple','http://127.0.0.1:12345', CSV, 'column1 String, column2 UInt32')
```

## URL 中的通配符 {#globs-in-url}

大括号 `{ }` 中的模式用于生成一组分片或指定故障转移地址。支持的模式类型和示例见于 [remote](remote.md#globs-in-addresses) 函数的描述。
模式中的字符 `|` 用于指定故障转移地址。它们以与模式中列出的顺序相同的顺序进行迭代。生成的地址数量受 [glob_expansion_max_elements](../../operations/settings/settings.md#glob_expansion_max_elements) 设置的限制。

## 相关内容 {#related}

-   [HDFS 引擎](../../engines/table-engines/special/url.md)
-   [URL 表函数](../../sql-reference/table-functions/url.md)
