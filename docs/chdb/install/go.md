---
title: 'chDB for Go'
sidebar_label: 'Go'
slug: /chdb/install/go
description: 'How to install and use chDB with Go'
keywords: ['chdb', 'go', 'golang', 'embedded', 'clickhouse', 'sql', 'olap']
---

# chDB for Go

chDB-go provides Go bindings for chDB, enabling you to run ClickHouse queries directly in your Go applications with zero external dependencies.

## Installation {#installation}

### Step 1: Install libchdb {#install-libchdb}

First, install the chDB library:

```bash
curl -sL https://lib.chdb.io | bash
```

### Step 2: Install chdb-go {#install-chdb-go}

Install the Go package:

```bash
go install github.com/chdb-io/chdb-go@latest
```

Or add it to your `go.mod`:

```bash
go get github.com/chdb-io/chdb-go
```

## Usage {#usage}

### Command line interface {#cli}

chDB-go includes a CLI for quick queries:

```bash
# Simple query
./chdb-go "SELECT 123"

# Interactive mode
./chdb-go

# Interactive mode with persistent storage
./chdb-go --path /tmp/chdb
```

### Go Library - quick start {#quick-start}

#### Stateless queries {#stateless-queries}

For simple, one-off queries:

```go
package main

import (
    "fmt"
    "github.com/chdb-io/chdb-go"
)

func main() {
    // Execute a simple query
    result, err := chdb.Query("SELECT version()", "CSV")
    if err != nil {
        panic(err)
    }
    fmt.Println(result)
}
```

#### Stateful queries with session {#stateful-queries}

For complex queries with persistent state:

```go
package main

import (
    "fmt"
    "github.com/chdb-io/chdb-go"
)

func main() {
    // Create a session with persistent storage
    session, err := chdb.NewSession("/tmp/chdb-data")
    if err != nil {
        panic(err)
    }
    defer session.Cleanup()

    // Create database and table
    _, err = session.Query(`
        CREATE DATABASE IF NOT EXISTS testdb;
        CREATE TABLE IF NOT EXISTS testdb.test_table (
            id UInt32,
            name String
        ) ENGINE = MergeTree() ORDER BY id
    `, "")
    
    if err != nil {
        panic(err)
    }

    // Insert data
    _, err = session.Query(`
        INSERT INTO testdb.test_table VALUES 
        (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')
    `, "")
    
    if err != nil {
        panic(err)
    }

    // Query data
    result, err := session.Query("SELECT * FROM testdb.test_table ORDER BY id", "Pretty")
    if err != nil {
        panic(err)
    }
    
    fmt.Println(result)
}
```

#### SQL driver interface {#sql-driver}

chDB-go implements Go's `database/sql` interface:

```go
package main

import (
    "database/sql"
    "fmt"
    _ "github.com/chdb-io/chdb-go/driver"
)

func main() {
    // Open database connection
    db, err := sql.Open("chdb", "")
    if err != nil {
        panic(err)
    }
    defer db.Close()

    // Query with standard database/sql interface
    rows, err := db.Query("SELECT COUNT(*) FROM url('https://datasets.clickhouse.com/hits/hits.parquet')")
    if err != nil {
        panic(err)
    }
    defer rows.Close()

    for rows.Next() {
        var count int
        err := rows.Scan(&count)
        if err != nil {
            panic(err)
        }
        fmt.Printf("Count: %d\n", count)
    }
}
```

#### Query streaming for large datasets {#query-streaming}

For processing large datasets that don't fit in memory, use streaming queries:

```go
package main

import (
    "fmt"
    "log"
    "github.com/chdb-io/chdb-go/chdb"
)

func main() {
    // Create a session for streaming queries
    session, err := chdb.NewSession("/tmp/chdb-stream")
    if err != nil {
        log.Fatal(err)
    }
    defer session.Cleanup()

    // Execute a streaming query for large dataset
    streamResult, err := session.QueryStreaming(
        "SELECT number, number * 2 as double FROM system.numbers LIMIT 1000000", 
        "CSV",
    )
    if err != nil {
        log.Fatal(err)
    }
    defer streamResult.Free()

    rowCount := 0
    
    // Process data in chunks
    for {
        chunk := streamResult.GetNext()
        if chunk == nil {
            // No more data
            break
        }
        
        // Check for streaming errors
        if err := streamResult.Error(); err != nil {
            log.Printf("Streaming error: %v", err)
            break
        }
        
        rowsRead := chunk.RowsRead()
        // You can process the chunk data here
        // For example, write to file, send over network, etc.
        fmt.Printf("Processed chunk with %d rows\n", rowsRead)
        rowCount += int(rowsRead)
        if rowCount%100000 == 0 {
            fmt.Printf("Processed %d rows so far...\n", rowCount)
        }
    }
    
    fmt.Printf("Total rows processed: %d\n", rowCount)
}
```

**Benefits of query streaming:**
- **Memory efficient** - Process large datasets without loading everything into memory
- **Real-time processing** - Start processing data as soon as first chunk arrives
- **Cancellation support** - Can cancel long-running queries with `Cancel()`
- **Error handling** - Check for errors during streaming with `Error()`

## API documentation {#api-documentation}

chDB-go provides both high-level and low-level APIs:

- **[High-Level API Documentation](https://github.com/chdb-io/chdb-go/blob/main/chdb.md)** - Recommended for most use cases
- **[Low-Level API Documentation](https://github.com/chdb-io/chdb-go/blob/main/lowApi.md)** - For advanced use cases requiring fine-grained control

## System requirements {#requirements}

- Go 1.21 or later
- Compatible with Linux, macOS
