---
sidebar_label: 'Overview'
slug: /migrations/redshift-overview
description: 'Migrating from Amazon Redshift to ClickHouse'
keywords: ['Redshift']
title: 'Comparing ClickHouse Cloud and Amazon Redshift'
---

# Amazon Redshift to ClickHouse migration

> This document provides an introduction to migrating data from Amazon
Redshift to ClickHouse.

## Introduction {#introduction}

Amazon Redshift is a cloud data warehouse that provides reporting and
analytics capabilities for structured and semi-structured data. It was
designed to handle analytical workloads on big data sets using
column-oriented database principles similar to ClickHouse. As part of the
AWS offering, it is often the default solution AWS users turn to for their
analytical data needs.

While attractive to existing AWS users due to its tight integration with the
Amazon ecosystem, Redshift users that adopt it to power real-time analytics
applications find themselves in need of a more optimized solution for this
purpose. As a result, they increasingly turn to ClickHouse to benefit from
superior query performance and data compression, either as a replacement or
a "speed layer" deployed alongside existing Redshift workloads.

## ClickHouse vs Redshift {#clickhouse-vs-redshift}

For users heavily invested in the AWS ecosystem, Redshift represents a
natural choice when faced with data warehousing needs. Redshift differs from
ClickHouse in this important aspect – it optimizes its engine for data
warehousing workloads requiring complex reporting and analytical queries.
Across all deployment modes, the following two limitations make it difficult
to use Redshift for real-time analytical workloads:
* Redshift [compiles code for each query execution plan](https://docs.aws.amazon.com/redshift/latest/dg/c-query-performance.html),
which adds significant overhead to first-time query execution. This overhead can
be justified when query patterns are predictable and compiled execution plans 
can be stored in a query cache. However, this introduces challenges for interactive
applications with variable queries. Even when Redshift is able to exploit this 
code compilation cache, ClickHouse is faster on most queries. See ["ClickBench"](https://benchmark.clickhouse.com/#system=+%E2%98%81w|%EF%B8%8Fr|C%20c|Rf&type=-&machine=-ca2|gl|6ax|6ale|3al&cluster_size=-&opensource=-&tuned=+n&metric=hot&queries=-).
* Redshift [limits concurrency to 50 across all queues](https://docs.aws.amazon.com/redshift/latest/dg/c_workload_mngmt_classification.html),
which (while adequate for BI) makes it inappropriate for highly concurrent 
analytical applications.

Conversely, while ClickHouse can also be utilized for complex analytical queries
it is optimized for real-time analytical workloads, either powering applications
or acting as a warehouse acceleration later. As a result, Redshift users typically
replace or augment Redshift with ClickHouse for the following reasons:

| Advantage                          | Description                                                                                                                                                                                                                                                                                                                                                                                               |
|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Lower query latencies**          | ClickHouse achieves lower query latencies, including for varied query patterns, under high concurrency and while subjected to streaming inserts. Even when your query misses a cache, which is inevitable in interactive user-facing analytics, ClickHouse can still process it fast.                                                                                                                     |
| **Higher concurrent query limits** | ClickHouse places much higher limits on concurrent queries, which is vital for real-time application experiences. In ClickHouse, self-managed as well as cloud, you can scale up your compute allocation to achieve the concurrency your application needs for each service. The level of permitted query concurrency is configurable in ClickHouse, with ClickHouse Cloud defaulting to a value of 1000. |
| **Superior data compression**      | ClickHouse offers superior data compression, which allows users to reduce their total storage (and thus cost) or persist more data at the same cost and derive more real-time insights from their data. See "ClickHouse vs Redshift Storage Efficiency" below.                                                                                                                                            |
