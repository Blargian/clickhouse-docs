---
title: 'Installing chDB for Rust'
sidebar_label: 'Rust'
slug: /chdb/install/rust
description: 'How to install and use chDB Rust bindingsd'
keywords: ['chdb', 'embedded', 'clickhouse-lite', 'rust', 'install', 'ffi', 'bindings']
---

# chDB for Rust {#chdb-for-rust}

chDB-rust provides experimental FFI (Foreign Function Interface) bindings for chDB, enabling you to run ClickHouse queries directly in your Rust applications with zero external dependencies.

## Installation {#installation}

### Install libchdb {#install-libchdb}

Install the chDB library:

```bash
curl -sL https://lib.chdb.io | bash
```

## Usage {#usage}

chDB Rust provides both stateless and stateful query execution modes.

### Stateless Usage {#stateless-usage}

For simple queries without persistent state:

```rust
use chdb_rust::{execute, arg::Arg, format::OutputFormat};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Execute a simple query
    let result = execute(
        "SELECT version()",
        Some(&[Arg::OutputFormat(OutputFormat::JSONEachRow)])
    )?;
    println!("ClickHouse version: {}", result.data_utf8()?);
    
    // Query with CSV file
    let result = execute(
        "SELECT * FROM file('data.csv', 'CSV')",
        Some(&[Arg::OutputFormat(OutputFormat::JSONEachRow)])
    )?;
    println!("CSV data: {}", result.data_utf8()?);
    
    Ok(())
}
```

### Stateful Usage (Sessions) {#stateful-usage-sessions}

For queries requiring persistent state like databases and tables:

```rust
use chdb_rust::{
    session::SessionBuilder,
    arg::Arg,
    format::OutputFormat,
    log_level::LogLevel
};
use tempdir::TempDir;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a temporary directory for database storage
    let tmp = TempDir::new("chdb-rust")?;
    
    // Build session with configuration
    let session = SessionBuilder::new()
        .with_data_path(tmp.path())
        .with_arg(Arg::LogLevel(LogLevel::Debug))
        .with_auto_cleanup(true)  // Cleanup on drop
        .build()?;

    // Create database and table
    session.execute(
        "CREATE DATABASE demo; USE demo", 
        Some(&[Arg::MultiQuery])
    )?;

    session.execute(
        "CREATE TABLE logs (id UInt64, msg String) ENGINE = MergeTree() ORDER BY id",
        None,
    )?;

    // Insert data
    session.execute(
        "INSERT INTO logs (id, msg) VALUES (1, 'Hello'), (2, 'World')",
        None,
    )?;

    // Query data
    let result = session.execute(
        "SELECT * FROM logs ORDER BY id",
        Some(&[Arg::OutputFormat(OutputFormat::JSONEachRow)]),
    )?;

    println!("Query results:\n{}", result.data_utf8()?);
    
    // Get query statistics
    println!("Rows read: {}", result.rows_read());
    println!("Bytes read: {}", result.bytes_read());
    println!("Query time: {:?}", result.elapsed());

    Ok(())
}
```

## Building and Testing {#building-testing}

### Build the Project {#build-the-project}

```bash
cargo build
```

### Run Tests {#run-tests}

```bash
cargo test
```

### Development Dependencies {#development-dependencies}

The project includes these development dependencies:
- `bindgen` (v0.70.1) - Generate FFI bindings from C headers
- `tempdir` (v0.3.7) - Temporary directory handling in tests
- `thiserror` (v1) - Error handling utilities

## Error Handling {#error-handling}

chDB Rust provides comprehensive error handling through the `Error` enum:

```rust
use chdb_rust::{execute, error::Error};

match execute("SELECT 1", None) {
    Ok(result) => {
        println!("Success: {}", result.data_utf8()?);
    },
    Err(Error::QueryError(msg)) => {
        eprintln!("Query failed: {}", msg);
    },
    Err(Error::NoResult) => {
        eprintln!("No result returned");
    },
    Err(Error::NonUtf8Sequence(e)) => {
        eprintln!("Invalid UTF-8: {}", e);
    },
    Err(e) => {
        eprintln!("Other error: {}", e);
    }
}
```

## GitHub Repository {#github-repository}

You can find the GitHub repository for the project at [chdb-io/chdb-rust](https://github.com/chdb-io/chdb-rust).
