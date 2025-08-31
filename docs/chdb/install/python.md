---
title: 'Installing chDB for Python'
sidebar_label: 'Python'
slug: /chdb/install/python
description: 'How to install chDB for Python'
keywords: ['chdb', 'embedded', 'clickhouse-lite', 'python', 'install']
---

## Requirements {#requirements}

- Python 3.8+ 
- Supported platforms: macOS and Linux (x86_64 and ARM64)

## Installation {#install}

```bash
pip install chdb
```

## Usage 

### Command Line Interface

Run SQL queries directly from the command line:

```bash
# Basic query
python3 -m chdb "SELECT 1, 'abc'" Pretty

# Query with formatting
python3 -m chdb "SELECT version()" JSON
```

### Basic Python Usage

```python
import chdb

# Simple query
result = chdb.query("SELECT 1 as id, 'Hello World' as message", "CSV")
print(result)

# Get query statistics
print(f"Rows read: {result.rows_read()}")
print(f"Bytes read: {result.bytes_read()}")
print(f"Execution time: {result.elapsed()} seconds")
```

### Connection-Based API (Recommended)

For better resource management and performance:

```python
import chdb

# Create connection (in-memory by default)
conn = chdb.connect(":memory:")
# Or use file-based: conn = chdb.connect("mydata.db")

# Create cursor for query execution
cur = conn.cursor()

# Execute queries
cur.execute("SELECT number, toString(number) as str FROM system.numbers LIMIT 3")

# Fetch results in different ways
print(cur.fetchone())    # Single row: (0, '0')
print(cur.fetchmany(2))  # Multiple rows: ((1, '1'), (2, '2'))

# Get metadata
print(cur.column_names())  # ['number', 'str']
print(cur.column_types())  # ['UInt64', 'String']

# Use cursor as iterator
for row in cur:
    print(row)

# Always close resources
cur.close()
conn.close()
```


## Data Input Methods {#data-input}

### File-Based Data Sources

chDB supports 70+ data formats for direct file querying:

```python
import chdb

# Query Parquet files
result = chdb.query("""
    SELECT customer_id, sum(amount) as total
    FROM file('sales.parquet', Parquet) 
    GROUP BY customer_id 
    ORDER BY total DESC 
    LIMIT 10
""", 'JSONEachRow')

# Query CSV with headers
result = chdb.query("""
    SELECT * FROM file('data.csv', CSVWithNames) 
    WHERE column1 > 100
""", 'DataFrame')

# Multiple file formats
result = chdb.query("""
    SELECT * FROM file('logs*.jsonl', JSONEachRow)
    WHERE timestamp > '2024-01-01'
""", 'Pretty')
```

### Output Format Examples

```python
# DataFrame for analysis
df = chdb.query('SELECT * FROM system.numbers LIMIT 5', 'DataFrame')
print(type(df))  # <class 'pandas.core.frame.DataFrame'>

# Arrow Table for interoperability  
arrow_table = chdb.query('SELECT * FROM system.numbers LIMIT 5', 'ArrowTable')
print(type(arrow_table))  # <class 'pyarrow.lib.Table'>

# JSON for APIs
json_result = chdb.query('SELECT version()', 'JSON')
print(json_result)

# Pretty format for debugging
pretty_result = chdb.query('SELECT * FROM system.numbers LIMIT 3', 'Pretty')
print(pretty_result)
```

### DataFrame Operations {#dataframe-operations}

#### Legacy DataFrame API

```python
import chdb.dataframe as cdf
import pandas as pd

# Join multiple DataFrames
df1 = pd.DataFrame({'a': [1, 2, 3], 'b': ["one", "two", "three"]})
df2 = pd.DataFrame({'c': [1, 2, 3], 'd': ["①", "②", "③"]})

result_df = cdf.query(
    sql="SELECT * FROM __tbl1__ t1 JOIN __tbl2__ t2 ON t1.a = t2.c",
    tbl1=df1, 
    tbl2=df2
)
print(result_df)

# Query the result DataFrame
summary = result_df.query('SELECT b, sum(a) FROM __table__ GROUP BY b')
print(summary)
```

#### Python Table Engine (Recommended)

```python
import chdb
import pandas as pd
import pyarrow as pa

# Query Pandas DataFrame directly
df = pd.DataFrame({
    "customer_id": [1, 2, 3, 1, 2],
    "product": ["A", "B", "A", "C", "A"],
    "amount": [100, 200, 150, 300, 250],
    "metadata": [
        {'category': 'electronics', 'priority': 'high'},
        {'category': 'books', 'priority': 'low'},
        {'category': 'electronics', 'priority': 'medium'},
        {'category': 'clothing', 'priority': 'high'},
        {'category': 'books', 'priority': 'low'}
    ]
})

# Direct DataFrame querying with JSON support
result = chdb.query("""
    SELECT 
        customer_id,
        sum(amount) as total_spent,
        metadata.category as category
    FROM Python(df) 
    WHERE metadata.priority = 'high'
    GROUP BY customer_id, metadata.category
    ORDER BY total_spent DESC
""").show()

# Query Arrow Table
arrow_table = pa.table({
    "id": [1, 2, 3, 4],
    "name": ["Alice", "Bob", "Charlie", "David"],
    "scores": [[95, 87], [78, 92], [88, 95], [92, 89]]
})

chdb.query("""
    SELECT name, arraySum(scores) as total_score 
    FROM Python(arrow_table) 
    ORDER BY total_score DESC
""").show()
```

### Stateful Sessions {#stateful-sessions}

Sessions maintain query state across multiple operations, enabling complex workflows:

```python
from chdb import session

# Temporary session (auto-cleanup)
sess = session.Session()

# Or persistent session with specific path
# sess = session.Session("/path/to/data")

# Create database and tables
sess.query("CREATE DATABASE IF NOT EXISTS analytics ENGINE = Atomic")
sess.query("USE analytics")

sess.query("""
    CREATE TABLE sales (
        id UInt64,
        product String,
        amount Decimal(10,2),
        sale_date Date
    ) ENGINE = MergeTree() 
    ORDER BY (sale_date, id)
""")

# Insert data
sess.query("""
    INSERT INTO sales VALUES 
        (1, 'Laptop', 999.99, '2024-01-15'),
        (2, 'Mouse', 29.99, '2024-01-16'),
        (3, 'Keyboard', 79.99, '2024-01-17')
""")

# Create materialized views
sess.query("""
    CREATE MATERIALIZED VIEW daily_sales AS
    SELECT 
        sale_date,
        count() as orders,
        sum(amount) as revenue
    FROM sales 
    GROUP BY sale_date
""")

# Query the view
result = sess.query("SELECT * FROM daily_sales ORDER BY sale_date", "Pretty")
print(result)

# Session automatically manages resources
sess.close()  # Optional - auto-closed when object is deleted
```

### Advanced Session Features

```python
# Session with custom settings
sess = session.Session(
    path="/tmp/analytics_db",
    
)

# Batch operations
sess.query("BEGIN TRANSACTION")
try:
    sess.query("INSERT INTO sales VALUES (4, 'Monitor', 299.99, '2024-01-18')")
    sess.query("INSERT INTO sales VALUES (5, 'Speakers', 89.99, '2024-01-18')")
    sess.query("COMMIT")
except Exception as e:
    sess.query("ROLLBACK")
    print(f"Transaction failed: {e}")

# Query performance optimization
result = sess.query("""
    SELECT product, sum(amount) as total
    FROM sales 
    GROUP BY product
    ORDER BY total DESC
    SETTINGS max_threads = 4
""", "JSON")
```

See also: [test_stateful.py](https://github.com/chdb-io/chdb/blob/main/tests/test_stateful.py).

### Python DB-API 2.0 Interface {#python-db-api-20}

Standard database interface for compatibility with existing Python applications:

```python
import chdb.dbapi as dbapi

# Check driver information
print(f"chDB driver version: {dbapi.get_client_info()}")

# Create connection
conn = dbapi.connect()
cursor = conn.cursor()

# Execute queries with parameters
cursor.execute("""
    SELECT number, number * ? as doubled 
    FROM system.numbers 
    LIMIT ?
""", (2, 5))

# Get metadata
print("Column descriptions:", cursor.description)
print("Row count:", cursor.rowcount)

# Fetch results
print("First row:", cursor.fetchone())
print("Next 2 rows:", cursor.fetchmany(2))

# Fetch remaining rows
for row in cursor.fetchall():
    print("Row:", row)

# Batch operations
data = [(1, 'Alice'), (2, 'Bob'), (3, 'Charlie')]
cursor.executemany(
    "INSERT INTO temp_users (id, name) VALUES (?, ?)", 
    data
)
```

### User Defined Functions (UDF) {#user-defined-functions}

Extend SQL with custom Python functions:

#### Basic UDF Usage

```python
from chdb.udf import chdb_udf
from chdb import query

# Simple mathematical function
@chdb_udf()
def add_numbers(a, b):
    return int(a) + int(b)

# String processing function
@chdb_udf()
def reverse_string(text):
    return text[::-1]

# JSON processing function  
@chdb_udf()
def extract_json_field(json_str, field):
    import json
    try:
        data = json.loads(json_str)
        return str(data.get(field, ''))
    except:
        return ''

# Use UDFs in queries
result = query("""
    SELECT 
        add_numbers('10', '20') as sum_result,
        reverse_string('hello') as reversed,
        extract_json_field('{"name": "John", "age": 30}', 'name') as name
""")
print(result)
```

#### Advanced UDF with Custom Return Types

```python
# UDF with specific return type
@chdb_udf(return_type="Float64")
def calculate_bmi(height_str, weight_str):
    height = float(height_str) / 100  # Convert cm to meters
    weight = float(weight_str)
    return weight / (height * height)

# UDF for data validation
@chdb_udf(return_type="UInt8") 
def is_valid_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return 1 if re.match(pattern, email) else 0

# Use in complex queries
result = query("""
    SELECT 
        name,
        calculate_bmi(height, weight) as bmi,
        is_valid_email(email) as has_valid_email
    FROM (
        SELECT 
            'John' as name, '180' as height, '75' as weight, 'john@example.com' as email
        UNION ALL
        SELECT 
            'Jane' as name, '165' as height, '60' as weight, 'invalid-email' as email
    )
""", "Pretty")
print(result)
```

#### UDF Best Practices

1. **Stateless Functions**: UDFs should be pure functions without side effects
2. **Import Inside Functions**: All required modules must be imported within the UDF
3. **String Input/Output**: All UDF parameters are strings (TabSeparated format)
4. **Error Handling**: Include try-catch blocks for robust UDFs
5. **Performance**: UDFs are called for each row, so optimize for performance

```python
# Well-structured UDF with error handling
@chdb_udf(return_type="String")
def safe_json_extract(json_str, path):
    import json
    try:
        data = json.loads(json_str)
        keys = path.split('.')
        result = data
        for key in keys:
            if isinstance(result, dict) and key in result:
                result = result[key]
            else:
                return 'null'
        return str(result)
    except Exception as e:
        return f'error: {str(e)}'

# Use with complex nested JSON
query("""
    SELECT safe_json_extract(
        '{"user": {"profile": {"name": "Alice", "age": 25}}}',
        'user.profile.name'
    ) as extracted_name
""")
```

### Streaming Query Processing {#streaming-queries}

Process large datasets with constant memory usage:

```python
from chdb import session

sess = session.Session()

# Setup large dataset
sess.query("""
    CREATE TABLE large_data AS 
    SELECT number as id, toString(number) as data 
    FROM numbers(1000000)
""")

# Example 1: Basic streaming with context manager
total_rows = 0
with sess.send_query("SELECT * FROM large_data", "CSV") as stream:
    for chunk in stream:
        chunk_rows = len(chunk.data().split('\n')) - 1
        total_rows += chunk_rows
        print(f"Processed chunk: {chunk_rows} rows")
        
        # Early termination if needed
        if total_rows > 100000:
            break

print(f"Total rows processed: {total_rows}")

# Example 2: Manual iteration with explicit cleanup
stream = sess.send_query("SELECT * FROM large_data WHERE id % 100 = 0", "JSONEachRow")
processed_count = 0

while True:
    chunk = stream.fetch()
    if chunk is None:
        break
    
    # Process chunk data
    lines = chunk.data().strip().split('\n')
    for line in lines:
        if line:  # Skip empty lines
            processed_count += 1
    
    print(f"Processed {processed_count} records so far...")
    
stream.close()  # Important: explicit cleanup

# Example 3: Arrow integration for external libraries
import pyarrow as pa
from deltalake import write_deltalake

# Stream results in Arrow format
stream = sess.send_query("SELECT * FROM large_data LIMIT 100000", "Arrow")

# Create RecordBatchReader with custom batch size
batch_reader = stream.record_batch(rows_per_batch=10000)

# Export to Delta Lake
write_deltalake(
    table_or_uri="./my_delta_table",
    data=batch_reader,
    mode="overwrite"
)

stream.close()
sess.close()
```

### Python Table Engine {#python-table-engine}

#### Query Pandas DataFrames

```python
import chdb
import pandas as pd

# Complex DataFrame with nested data
df = pd.DataFrame({
    "customer_id": [1, 2, 3, 4, 5, 6],
    "customer_name": ["Alice", "Bob", "Charlie", "Alice", "Bob", "David"],
    "orders": [
        {"order_id": 101, "amount": 250.50, "items": ["laptop", "mouse"]},
        {"order_id": 102, "amount": 89.99, "items": ["book"]},
        {"order_id": 103, "amount": 1299.99, "items": ["phone", "case", "charger"]},
        {"order_id": 104, "amount": 45.50, "items": ["pen", "paper"]},
        {"order_id": 105, "amount": 199.99, "items": ["headphones"]},
        {"order_id": 106, "amount": 15.99, "items": ["cable"]}
    ]
})

# Advanced querying with JSON operations
result = chdb.query("""
    SELECT 
        customer_name,
        count() as order_count,
        sum(orders.amount) as total_spent,
        arrayStringConcat(
            arrayDistinct(
                arrayFlatten(
                    groupArray(orders.items)
                )
            ), 
            ', '
        ) as all_items
    FROM Python(df)
    GROUP BY customer_name
    HAVING total_spent > 100
    ORDER BY total_spent DESC
""").show()

# Window functions on DataFrames
window_result = chdb.query("""
    SELECT 
        customer_name,
        orders.amount,
        sum(orders.amount) OVER (
            PARTITION BY customer_name 
            ORDER BY orders.order_id
        ) as running_total
    FROM Python(df)
    ORDER BY customer_name, orders.order_id
""", "Pretty")
print(window_result)
```

#### Query Arrow Tables

```python
import chdb
import pyarrow as pa
import numpy as np

# Create Arrow table with complex data types
arrow_data = {
    "user_id": [1, 2, 3, 4, 5],
    "username": ["alice", "bob", "charlie", "diana", "eve"],
    "scores": [[95, 87, 92], [78, 85, 90], [88, 95, 87], [92, 89, 94], [85, 88, 91]],
    "metadata": [
        {"country": "US", "premium": True, "signup_date": "2023-01-15"},
        {"country": "UK", "premium": False, "signup_date": "2023-02-10"},
        {"country": "CA", "premium": True, "signup_date": "2023-01-20"},
        {"country": "US", "premium": True, "signup_date": "2023-03-05"},
        {"country": "DE", "premium": False, "signup_date": "2023-02-28"}
    ],
    "activity_timestamps": [
        [1640995200, 1641081600, 1641168000],  # Unix timestamps
        [1641254400, 1641340800],
        [1641427200, 1641513600, 1641600000, 1641686400],
        [1641772800],
        [1641859200, 1641945600]
    ]
}

arrow_table = pa.table(arrow_data)

# Complex analytical queries
analysis = chdb.query("""
    SELECT 
        metadata.country,
        count() as users,
        avg(arraySum(scores)) as avg_total_score,
        countIf(metadata.premium) as premium_users,
        avg(length(activity_timestamps)) as avg_activities
    FROM Python(arrow_table)
    GROUP BY metadata.country
    ORDER BY avg_total_score DESC
""", "Pretty")
print(analysis)

# Time series analysis
time_analysis = chdb.query("""
    SELECT 
        username,
        arrayMap(
            x -> toDateTime(x), 
            activity_timestamps
        ) as activity_dates,
        arrayMap(
            x -> formatDateTime(toDateTime(x), '%Y-%m-%d'), 
            activity_timestamps
        ) as formatted_dates
    FROM Python(arrow_table)
    WHERE metadata.premium = true
""", "JSONEachRow")
print(time_analysis)
```

#### Custom Data Sources with PyReader

Implement custom data readers for specialized data sources:

```python
import chdb
from typing import List, Tuple, Any
import json

class DatabaseReader(chdb.PyReader):
    """Custom reader for database-like data sources"""
    
    def __init__(self, connection_string: str):
        # Simulate database connection
        self.data = self._load_data(connection_string)
        self.cursor = 0
        self.batch_size = 1000
        super().__init__(self.data)
    
    def _load_data(self, conn_str):
        # Simulate loading from database
        return {
            "id": list(range(1, 10001)),
            "name": [f"user_{i}" for i in range(1, 10001)],
            "score": [i * 10 + (i % 7) for i in range(1, 10001)],
            "metadata": [
                json.dumps({"level": i % 5, "active": i % 3 == 0})
                for i in range(1, 10001)
            ]
        }
    
    def get_schema(self) -> List[Tuple[str, str]]:
        """Define table schema with explicit types"""
        return [
            ("id", "UInt64"),
            ("name", "String"),
            ("score", "Int64"),
            ("metadata", "String")  # JSON stored as string
        ]
    
    def read(self, col_names: List[str], count: int) -> List[List[Any]]:
        """Read data in batches"""
        if self.cursor >= len(self.data["id"]):
            return []  # No more data
        
        end_pos = min(self.cursor + min(count, self.batch_size), len(self.data["id"]))
        
        # Return data for requested columns
        result = []
        for col in col_names:
            if col in self.data:
                result.append(self.data[col][self.cursor:end_pos])
            else:
                # Handle missing columns
                result.append([None] * (end_pos - self.cursor))
        
        self.cursor = end_pos
        return result

# Use custom reader
reader = DatabaseReader("postgresql://127.0.0.1/mydb")

# Query with complex operations
result = chdb.query("""
    SELECT 
        name,
        score,
        JSONExtractString(metadata, 'level') as user_level,
        JSONExtractBool(metadata, 'active') as is_active
    FROM Python(reader)
    WHERE score > 5000
    ORDER BY score DESC
    LIMIT 10
""", "Pretty")
print(result)

# Aggregation queries
aggregation = chdb.query("""
    SELECT 
        JSONExtractString(metadata, 'level') as level,
        count() as user_count,
        avg(score) as avg_score,
        countIf(JSONExtractBool(metadata, 'active')) as active_users
    FROM Python(reader)
    GROUP BY level
    ORDER BY level
""", "JSONEachRow")
print(aggregation)
```

### JSON Type Inference and Handling

chDB automatically handles complex nested data structures:

```python
import pandas as pd
import chdb

# DataFrame with mixed JSON objects
df_with_json = pd.DataFrame({
    "user_id": [1, 2, 3, 4],
    "profile": [
        {"name": "Alice", "age": 25, "preferences": ["music", "travel"]},
        {"name": "Bob", "age": 30, "location": {"city": "NYC", "country": "US"}},
        {"name": "Charlie", "skills": ["python", "sql", "ml"], "experience": 5},
        {"score": 95, "rank": "gold", "achievements": [{"title": "Expert", "date": "2024-01-01"}]}
    ]
})

# Control JSON inference with settings
result = chdb.query("""
    SELECT 
        user_id,
        profile.name as name,
        profile.age as age,
        arrayLength(profile.preferences) as pref_count,
        profile.location.city as city
    FROM Python(df_with_json)
    SETTINGS pandas_analyze_sample = 1000  -- Analyze all rows for JSON detection
""", "Pretty")
print(result)

# Advanced JSON operations
complex_json = chdb.query("""
    SELECT 
        user_id,
        JSONLength(toString(profile)) as json_fields,
        JSONType(toString(profile), 'preferences') as pref_type,
        if(
            JSONHas(toString(profile), 'achievements'),
            JSONExtractString(toString(profile), 'achievements[0].title'),
            'None'
        ) as first_achievement
    FROM Python(df_with_json)
""", "JSONEachRow")
print(complex_json)
```

## Performance and Optimization {#performance-optimization}

### Benchmarks

chDB consistently outperforms other embedded engines:
- **DataFrame operations**: 2-5x faster than Pandas for analytical queries
- **Parquet processing**: Competitive with DuckDB, faster than Polars
- **Memory efficiency**: Lower memory footprint than alternatives

### Performance Tips

```python
import chdb

# 1. Use appropriate output formats
df_result = chdb.query("SELECT * FROM large_table", "DataFrame")  # For analysis
arrow_result = chdb.query("SELECT * FROM large_table", "Arrow")    # For interop
native_result = chdb.query("SELECT * FROM large_table", "Native")   # For chDB-to-chDB

# 2. Optimize queries with settings
fast_result = chdb.query("""
    SELECT customer_id, sum(amount) 
    FROM sales 
    GROUP BY customer_id
    SETTINGS 
        max_threads = 8,
        max_memory_usage = '4G',
        use_uncompressed_cache = 1
""", "DataFrame")

# 3. Leverage streaming for large datasets
from chdb import session
sess = session.Session()

# Setup large dataset
sess.query("""
    CREATE TABLE large_sales AS 
    SELECT 
        number as sale_id,
        number % 1000 as customer_id,
        rand() % 1000 as amount
    FROM numbers(10000000)
""")

# Stream processing with constant memory usage
total_amount = 0
processed_rows = 0

with sess.send_query("SELECT customer_id, sum(amount) as total FROM large_sales GROUP BY customer_id", "JSONEachRow") as stream:
    for chunk in stream:
        lines = chunk.data().strip().split('\n')
        for line in lines:
            if line:  # Skip empty lines
                import json
                row = json.loads(line)
                total_amount += row['total']
                processed_rows += 1
        
        print(f"Processed {processed_rows} customer records, running total: {total_amount}")
        
        # Early termination for demo
        if processed_rows > 1000:
            break

print(f"Final result: {processed_rows} customers processed, total amount: {total_amount}")

# Stream to external systems (e.g., Delta Lake)
stream = sess.send_query("SELECT * FROM large_sales LIMIT 1000000", "Arrow")
batch_reader = stream.record_batch(rows_per_batch=50000)

# Process in batches
for batch in batch_reader:
    print(f"Processing batch with {batch.num_rows} rows...")
    # Transform or export each batch
    # df_batch = batch.to_pandas()
    # process_batch(df_batch)

stream.close()
sess.close()
```

## GitHub Repository {#github-repository}

- **Main Repository**: [chdb-io/chdb](https://github.com/chdb-io/chdb)
- **Issues and Support**: Report issues on the [GitHub repository](https://github.com/chdb-io/chdb/issues)
- **C API Documentation**: [Bindings Documentation](https://github.com/chdb-io/chdb/blob/main/bindings.md)
