---
title: 'chDB for Bun'
sidebar_label: 'Bun'
slug: /chdb/install/bun
description: 'How to install and use chDB with Bun runtime'
keywords: ['chdb', 'bun', 'javascript', 'typescript', 'embedded', 'clickhouse', 'sql', 'olap']
---

# chDB for Bun

chDB-bun provides experimental FFI (Foreign Function Interface) bindings for chDB, enabling you to run ClickHouse queries directly in your Bun applications with zero external dependencies.

## Installation {#installation}

### Step 1: Install System Dependencies {#install-system-dependencies}

First, install the required system dependencies:

#### Install libchdb {#install-libchdb}

```bash
curl -sL https://lib.chdb.io | bash
```

#### Install Build Tools {#install-build-tools}

You'll need either `gcc` or `clang` installed on your system:

### Step 2: Install chDB-bun {#install-chdb-bun}

```bash
# Install from the GitHub repository
bun add github:chdb-io/chdb-bun

# Or clone and build locally
git clone https://github.com/chdb-io/chdb-bun.git
cd chdb-bun
bun install
bun run build
```

## Usage {#usage}

chDB-bun supports two query modes: ephemeral queries for one-time operations and persistent sessions for maintaining database state.

### Ephemeral Queries {#ephemeral-queries}

For simple, one-off queries that don't require persistent state:

```typescript
import { query } from 'chdb-bun';

// Basic query
const result = query("SELECT version()", "CSV");
console.log(result); // "23.10.1.1"

// Query with different output formats
const jsonResult = query("SELECT 1 as id, 'Hello' as message", "JSON");
console.log(jsonResult);

// Query with calculations
const mathResult = query("SELECT 2 + 2 as sum, pi() as pi_value", "Pretty");
console.log(mathResult);

// Query system information
const systemInfo = query("SELECT * FROM system.functions LIMIT 5", "CSV");
console.log(systemInfo);
```

### Persistent Sessions {#persistent-sessions}

For complex operations that require maintaining state across queries:

```typescript
import { Session } from 'chdb-bun';

// Create a session with persistent storage
const sess = new Session('./chdb-bun-tmp');

try {
    // Create a database and table
    sess.query(`
        CREATE DATABASE IF NOT EXISTS mydb;
        CREATE TABLE IF NOT EXISTS mydb.users (
            id UInt32,
            name String,
            email String
        ) ENGINE = MergeTree() ORDER BY id
    `, "CSV");

    // Insert data
    sess.query(`
        INSERT INTO mydb.users VALUES 
        (1, 'Alice', 'alice@example.com'),
        (2, 'Bob', 'bob@example.com'),
        (3, 'Charlie', 'charlie@example.com')
    `, "CSV");

    // Query the data
    const users = sess.query("SELECT * FROM mydb.users ORDER BY id", "JSON");
    console.log("Users:", users);

    // Create and use custom functions
    sess.query("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'Hello chDB'", "CSV");
    const greeting = sess.query("SELECT hello() as message", "Pretty");
    console.log(greeting);

    // Aggregate queries
    const stats = sess.query(`
        SELECT 
            COUNT(*) as total_users,
            MAX(id) as max_id,
            MIN(id) as min_id
        FROM mydb.users
    `, "JSON");
    console.log("Statistics:", stats);

} finally {
    // Always cleanup the session to free resources
    sess.cleanup(); // This deletes the database files
}
```
