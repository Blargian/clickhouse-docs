
# hdfsCluster 表函数

允许从指定集群中的多个节点并行处理 HDFS 中的文件。在启动节点上，它创建与集群中所有节点的连接，使用星号分隔 HDFS 文件路径，并动态分配每个文件。在工作节点上，它询问启动节点下一个待处理的任务并进行处理。这个过程会重复，直到所有任务完成。

## 语法 {#syntax}

```sql
hdfsCluster(cluster_name, URI, format, structure)
```

## 参数 {#arguments}

| 参数            | 描述                                                                                                                                                                                                                                                                                          |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `cluster_name`  | 用于构建远程和本地服务器的地址和连接参数集的集群名称。                                                                                                                                                                                                                                         |
| `URI`           | 一个文件或一组文件的 URI。支持以下只读模式下的通配符：`*`、`**`、`?`、`{'abc','def'}` 和 `{N..M}`，其中 `N`、`M` 是数字，`abc`、`def` 是字符串。有关更多信息，请参见 [路径中的通配符](../../engines/table-engines/integrations/s3.md#wildcards-in-path)。                    |
| `format`        | 文件的 [格式](/sql-reference/formats)。                                                                                                                                                                                                                                                     |
| `structure`     | 表的结构。格式为 `'column1_name column1_type, column2_name column2_type, ...'`。                                                                                                                                                                                                          |

## 返回值 {#returned_value}

具有指定结构的表，用于读取指定文件中的数据。

## 示例 {#examples}

1.  假设我们有一个名为 `cluster_simple` 的 ClickHouse 集群，以及 HDFS 上具有以下 URI 的多个文件：

- 'hdfs://hdfs1:9000/some_dir/some_file_1'
- 'hdfs://hdfs1:9000/some_dir/some_file_2'
- 'hdfs://hdfs1:9000/some_dir/some_file_3'
- 'hdfs://hdfs1:9000/another_dir/some_file_1'
- 'hdfs://hdfs1:9000/another_dir/some_file_2'
- 'hdfs://hdfs1:9000/another_dir/some_file_3'

2.  查询这些文件中的行数：

```sql
SELECT count(*)
FROM hdfsCluster('cluster_simple', 'hdfs://hdfs1:9000/{some,another}_dir/some_file_{1..3}', 'TSV', 'name String, value UInt32')
```

3.  查询这两个目录中所有文件的行数：

```sql
SELECT count(*)
FROM hdfsCluster('cluster_simple', 'hdfs://hdfs1:9000/{some,another}_dir/*', 'TSV', 'name String, value UInt32')
```

:::note
如果文件列表包含带有前导零的数字范围，请分别为每个数字使用带括号的构造，或使用 `?`。
:::

## 相关 {#related}

- [HDFS 引擎](../../engines/table-engines/integrations/hdfs.md)
- [HDFS 表函数](../../sql-reference/table-functions/hdfs.md)
