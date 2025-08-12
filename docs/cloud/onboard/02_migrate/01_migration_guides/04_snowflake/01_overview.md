---
sidebar_label: 'Overview'
slug: /migrations/snowflake-overview
description: 'Migrating from Snowflake to ClickHouse'
keywords: ['Snowflake']
title: 'Migrate from Snowflake to ClickHouse'
show_related_blogs: true
---

import snowflake_architecture from '@site/static/images/cloud/onboard/discover/use_cases/snowflake_architecture.png';
import cloud_architecture from '@site/static/images/cloud/onboard/discover/use_cases/cloud_architecture.png';
import Image from '@theme/IdealImage';

# Snowflake to ClickHouse migration

> This document provides an introduction to migrating data from Snowflake to ClickHouse.

Snowflake is a cloud data warehouse primarily focused on migrating legacy on-premise
data warehousing workloads to the cloud. It is well-optimized for executing 
long-running reports at scale. As datasets migrate to the cloud, data owners start
thinking about how else they can extract value from this data, including using 
these datasets to power real-time applications for internal and external use cases.
When this happens, they often realize they need a database optimized for 
powering real-time analytics, like ClickHouse.

## Comparison {#comparison}

In this section, we'll compare the key features of ClickHouse and Snowflake.

### Similarities {#similarities}

Snowflake is a cloud-based data warehousing platform that provides a scalable 
and efficient solution for storing, processing, and analyzing large amounts of 
data. 
Like ClickHouse, Snowflake is not built on existing technologies but relies
on its own SQL query engine and custom architecture.

Snowflake’s architecture is described as a hybrid between a shared-storage (shared-disk)
architecture and a shared-nothing architecture. A shared-storage architecture is
one where data is both accessible from all compute nodes using object 
stores such as S3. A shared-nothing architecture is one where each compute node 
stores a portion of the entire data set locally to respond to queries. This, in 
theory, delivers the best of both models: the simplicity of a shared-disk 
architecture and the scalability of a shared-nothing architecture.

This design fundamentally relies on object storage as the primary storage medium,
which scales almost infinitely under concurrent access while providing high 
resilience and scalable throughput guarantees.

The image below from [docs.snowflake.com](https://docs.snowflake.com/en/user-guide/intro-key-concepts)
shows this architecture:

<Image img={snowflake_architecture} size="md" alt="Snowflake architecture" />

Conversely, as an open-source and cloud-hosted product, ClickHouse can be deployed
in both shared-disk and shared-nothing architectures. The latter is typical for 
self-managed deployments. While allowing for CPU and memory to be easily scaled, 
shared-nothing configurations introduce classic data management challenges and 
overhead of data replication, especially during membership changes.

For this reason, ClickHouse Cloud utilizes a shared-storage architecture that is
conceptually similar to Snowflake. Data is stored once in an object store 
(single copy), such as S3 or GCS, providing virtually infinite storage with 
strong redundancy guarantees. Each node has access to this single copy of the 
data as well as its own local SSDs for cache purposes. Nodes can, in turn, be 
scaled to provide additional CPU and memory resources as required. Like Snowflake,
S3’s scalability properties address the classic limitation of shared-disk 
architectures (disk I/O and network bottlenecks) by ensuring the I/O throughput 
available to current nodes in a cluster is not impacted as additional nodes are 
added.

<Image img={cloud_architecture} size="md" alt="ClickHouse Cloud architecture" />

### Differences {#differences}

Aside from the underlying storage formats and query engines, these architectures
differ in a few subtle ways:

* Compute resources in Snowflake are provided through a concept of [warehouses](https://docs.snowflake.com/en/user-guide/warehouses).
  These consist of a number of nodes, each of a set size. While Snowflake
  doesn't publish the specific architecture of their warehouses, it is
  [generally understood](https://select.dev/posts/snowflake-warehouse-sizing) 
  that each node consists of 8 vCPUs, 16GiB, and 200GB of local storage (for cache).
  The number of nodes depends on a t-shirt size, e.g. an x-small has one node, 
  a small 2, medium 4, large 8, etc. These warehouses are independent of the data
  and can be used to query any database residing on object storage. When idle 
  and not subjected to query load, warehouses are paused - resuming when a query 
  is received. While storage costs are always reflected in billing, warehouses 
  are only charged when active.

* ClickHouse Cloud utilizes a similar principle of nodes with local cache 
  storage. Rather than t-shirt sizes, users deploy a service with a total 
  amount of compute and available RAM. This, in turn, transparently 
  auto-scales (within defined limits) based on the query load - either 
  vertically by increasing (or decreasing) the resources for each node or 
  horizontally by raising/lowering the total number of nodes. ClickHouse 
  Cloud nodes currently have a 1 CPU-to-memory ratio, unlike Snowflake's 1. 
  While a looser coupling is possible, services are currently coupled to the 
  data, unlike Snowflake warehouses. Nodes will also pause if idle and 
  resume if subjected to queries. Users can also manually resize services if 
  needed.

* ClickHouse Cloud's query cache is currently node specific, unlike 
  Snowflake's, which is delivered at a service layer independent of the 
  warehouse. Based on benchmarks, ClickHouse Cloud's node cache outperforms 
  Snowflake's.

* Snowflake and ClickHouse Cloud take different approaches to scaling to 
  increase query concurrency. Snowflake addresses this through a feature 
  known as [multi-cluster warehouses](https://docs.snowflake.com/en/user-guide/warehouses-multicluster#benefits-of-multi-cluster-warehouses).
  This feature allows users to add clusters to a warehouse. While this offers no 
  improvement to query latency, it does provide additional parallelization and 
  allows higher query concurrency. ClickHouse achieves this by adding more memory 
  and CPU to a service through vertical or horizontal scaling. We do not explore the 
  capabilities of these services to scale to higher concurrency in this blog, 
  focusing instead on latency, but acknowledge that this work should be done 
  for a complete comparison. However, we would expect ClickHouse to perform 
  well in any concurrency test, with Snowflake explicitly limiting the number 
  of concurrent queries allowed for a [warehouse to 8 by default](https://docs.snowflake.com/en/sql-reference/parameters#max-concurrency-level).
  In comparison, ClickHouse Cloud allows up to 1000 queries to be executed per 
  node.

* Snowflake's ability to switch compute size on a dataset, coupled with fast 
  resume times for warehouses, makes it an excellent experience for ad hoc 
  querying. For data warehouse and data lake use cases, this provides an 
  advantage over other systems.

### Real-time analytics {#real-time-analytics}

Based on public [benchmark](https://benchmark.clickhouse.com/#system=+%E2%98%81w|%EF%B8%8Fr|C%20c|nfe&type=-&machine=-ca2|gl|6ax|6ale|3al&cluster_size=-&opensource=-&tuned=+n&metric=hot&queries=-) data,
ClickHouse outperforms Snowflake for real-time analytics applications in the following areas:

* **Query latency**: Snowflake queries have a higher query latency even 
  when clustering is applied to tables to optimize performance. In our 
  testing, Snowflake requires over twice the compute to achieve equivalent 
  ClickHouse performance on queries where a filter is applied that is part 
  of the Snowflake clustering key or ClickHouse primary key. While 
  Snowflake's [persistent query cache](https://docs.snowflake.com/en/user-guide/querying-persisted-results) 
  offsets some of these latency challenges, this is ineffective in cases 
  where the filter criteria are more diverse. This query cache effectiveness 
  can be further impacted by changes to the underlying data, with cache 
  entries invalidated when the table changes. While this is not the case in 
  the benchmark for our application, a real deployment would require the new, 
  more recent data to be inserted. Note that ClickHouse's query cache is 
  node specific and not [transactionally consistent](https://clickhouse.com/blog/introduction-to-the-clickhouse-query-cache-and-design), 
  making it [better suited ](https://clickhouse.com/blog/introduction-to-the-clickhouse-query-cache-and-design)
  to real-time analytics. Users also have granular control over its use 
  with the ability to control its use on a [per-query basis](/operations/settings/settings#use_query_cache), 
  its [precise size](/operations/settings/settings#query_cache_max_size_in_bytes), 
  whether a [query is cached](/operations/settings/settings#enable_writes_to_query_cache) 
  (limits on duration or required number of executions), and whether it is 
  only [passively used](https://clickhouse.com/blog/introduction-to-the-clickhouse-query-cache-and-design#using-logs-and-settings).

* **Lower cost**: Snowflake warehouses can be configured to suspend after 
  a period of query inactivity. Once suspended, charges are not incurred. 
  Practically, this inactivity check can [only be lowered to 60s](https://docs.snowflake.com/en/sql-reference/sql/alter-warehouse). 
  Warehouses will automatically resume, within several seconds, once a query 
  is received. With Snowflake only charging for resources when a warehouse 
  is under use, this behavior caters to workloads that often sit idle, like 
  ad-hoc querying.

  However, many real-time analytics workloads require ongoing real-time data 
  ingestion and frequent querying that doesn't benefit from idling (like 
  customer-facing dashboards). This means warehouses must often be fully 
  active and incurring charges. This negates the cost-benefit of idling as 
  well as any performance advantage that may be associated with Snowflake's 
  ability to resume a responsive state faster than alternatives. This active 
  state requirement, when combined with ClickHouse Cloud's lower per-second 
  cost for an active state, results in ClickHouse Cloud offering a 
  significantly lower total cost for these kinds of workloads.

* **Predictable pricing of features:** Features such as materialized views 
  and clustering (equivalent to ClickHouse's ORDER BY) are required to reach 
  the highest levels of performance in real-time analytics use cases. These 
  features incur additional charges in Snowflake, requiring not only a 
  higher tier, which increases costs per credit by 1.5x, but also 
  unpredictable background costs. For instance, materialized views incur a 
  background maintenance cost, as does clustering, which is hard to predict 
  prior to use. In contrast, these features incur no additional cost in 
  ClickHouse Cloud, except additional CPU and memory usage at insert time, 
  typically negligible outside of high insert workload use cases. We have 
  observed in our benchmark that these differences, along with lower query 
  latencies and higher compression, result in significantly lower costs with 
  ClickHouse.
