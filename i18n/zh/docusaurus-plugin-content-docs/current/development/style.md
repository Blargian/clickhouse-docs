---
'description': 'ClickHouse C++ 开发的编码风格指南'
'sidebar_label': 'C++ 风格指南'
'sidebar_position': 70
'slug': '/development/style'
'title': 'C++ 风格指南'
---




# C++ 风格指南

## 一般建议 {#general-recommendations}

以下是建议，而不是强制要求。
如果您正在编辑代码，遵循现有代码的格式是有意义的。
代码风格对于一致性是必要的，一致性使得阅读代码更容易，也使得搜索代码更轻松。
许多规则没有逻辑原因；它们是由既定实践决定的。

## 格式化 {#formatting}

**1.** 大部分格式化是通过 `clang-format` 自动完成的。

**2.** 缩进为 4 个空格。配置您的开发环境，使制表符添加四个空格。

**3.** 开括号和闭括号必须放在单独的一行上。

```cpp
inline void readBoolText(bool & x, ReadBuffer & buf)
{
    char tmp = '0';
    readChar(tmp, buf);
    x = tmp != '0';
}
```

**4.** 如果整个函数体是一个 `statement`，可以放在一行上。括号周围放置空格（除了行尾的空格）。

```cpp
inline size_t mask() const                { return buf_size() - 1; }
inline size_t place(HashValue x) const    { return x & mask(); }
```

**5.** 对于函数，不要在括号周围放置空格。

```cpp
void reinsert(const Value & x)
```

```cpp
memcpy(&buf[place_value], &x, sizeof(x));
```

**6.** 在 `if`、`for`、`while` 和其他表达式中，开括号前会插入一个空格（与函数调用相反）。

```cpp
for (size_t i = 0; i < rows; i += storage.index_granularity)
```

**7.** 在二元运算符（`+`、`-`、`*`、`/`、`%` 等）和三元运算符 `?:` 周围添加空格。

```cpp
UInt16 year = (s[0] - '0') * 1000 + (s[1] - '0') * 100 + (s[2] - '0') * 10 + (s[3] - '0');
UInt8 month = (s[5] - '0') * 10 + (s[6] - '0');
UInt8 day = (s[8] - '0') * 10 + (s[9] - '0');
```

**8.** 如果输入了换行符，将运算符放在新的一行，并在前面增加缩进。

```cpp
if (elapsed_ns)
    message << " ("
        << rows_read_on_server * 1000000000 / elapsed_ns << " rows/s., "
        << bytes_read_on_server * 1000.0 / elapsed_ns << " MB/s.) ";
```

**9.** 如果需要，可以在行内使用空格对齐。

```cpp
dst.ClickLogID         = click.LogID;
dst.ClickEventID       = click.EventID;
dst.ClickGoodEvent     = click.GoodEvent;
```

**10.** 不要在运算符`.`、`->`周围使用空格。

如果需要，可以将运算符换到下一行。在这种情况下，前面的缩进增加。

**11.** 不要在一元运算符（`--`、`++`、`*`、`&` 等）与其参数之间使用空格。

**12.** 在逗号后放一个空格，但在逗号前不放。这个规则也适用于 `for` 表达式中的分号。

**13.** 不要在 `[]` 运算符之间放置空格。

**14.** 在 `template <...>` 表达式中，在 `template` 和 `<` 之间使用空格；`<` 后面和 `>` 前面不需要空格。

```cpp
template <typename TKey, typename TValue>
struct AggregatedStatElement
{}
```

**15.** 在类和结构中，`public`、`private` 和 `protected` 应该与 `class/struct` 保持在同一层级，其他代码缩进。

```cpp
template <typename T>
class MultiVersion
{
public:
    /// Version of object for usage. shared_ptr manage lifetime of version.
    using Version = std::shared_ptr<const T>;
    ...
}
```

**16.** 如果整个文件使用相同的 `namespace`，并且没有其他重要内容，`namespace` 内部不需要缩进。

**17.** 如果 `if`、`for`、`while` 或其他表达式的代码块由单一的 `statement` 组成，括号是可选的。将 `statement` 放在单独的一行上。这条规则也适用于嵌套的 `if`、`for`、`while` 等。

但如果内部的 `statement` 包含大括号或 `else`，外部块应使用大括号编写。

```cpp
/// Finish write.
for (auto & stream : streams)
    stream.second->finalize();
```

**18.** 行尾不应有空格。

**19.** 源文件是 UTF-8 编码的。

**20.** 字符串字面量中可以使用非 ASCII 字符。

```cpp
<< ", " << (timer.elapsed() / chunks_stats.hits) << " μsec/hit.";
```

**21.** 不要在一行中写多个表达式。

**22.** 在函数内部将代码块分组，并用不超过一个空行进行分隔。

**23.** 使用一到两个空行分隔函数、类等。

**24.** `A const`（与值相关）必须在类型名称前书写。

```cpp
//correct
const char * pos
const std::string & s
//incorrect
char const * pos
```

**25.** 当声明指针或引用时，`*` 和 `&` 符号两侧要有空格。

```cpp
//correct
const char * pos
//incorrect
const char* pos
const char *pos
```

**26.** 使用模板类型时，使用 `using` 关键字别名（简单情况除外）。

换句话说，模板参数仅在 `using` 中指定，不在代码中重复。

`using` 可以局部声明，例如在函数内部。

```cpp
//correct
using FileStreams = std::map<std::string, std::shared_ptr<Stream>>;
FileStreams streams;
//incorrect
std::map<std::string, std::shared_ptr<Stream>> streams;
```

**27.** 不要在一个语句中声明多个不同类型的变量。

```cpp
//incorrect
int x, *y;
```

**28.** 不要使用 C 风格的强制转换。

```cpp
//incorrect
std::cerr << (int)c <<; std::endl;
//correct
std::cerr << static_cast<int>(c) << std::endl;
```

**29.** 在类和结构中，按照可见性范围分别分组成员和函数。

**30.** 对于小型类和结构，方法声明与实现之间不需要隔开。

小型方法在任何类或结构中也是如此。

对于模板类和结构，不要将方法声明与实现分开（因为否则它们必须在同一翻译单元中定义）。

**31.** 可以在 140 字符处换行，而不是 80 字符。

**32.** 如果不需要后缀递增/递减运算符，始终使用前缀递增/递减运算符。

```cpp
for (Names::const_iterator it = column_names.begin(); it != column_names.end(); ++it)
```

## 注释 {#comments}

**1.** 确保为所有非平凡的代码部分添加注释。

这非常重要。写注释可能帮助你意识到代码是不必要的，或者设计得不正确。

```cpp
/** Part of piece of memory, that can be used.
  * For example, if internal_buffer is 1MB, and there was only 10 bytes loaded to buffer from file for reading,
  * then working_buffer will have size of only 10 bytes
  * (working_buffer.end() will point to position right after those 10 bytes available for read).
  */
```

**2.** 注释可以详细到必要的程度。

**3.** 将注释放在它们描述的代码之前。在少数情况下，注释可以放在代码之后，同一行。

```cpp
/** Parses and executes the query.
*/
void executeQuery(
    ReadBuffer & istr, /// Where to read the query from (and data for INSERT, if applicable)
    WriteBuffer & ostr, /// Where to write the result
    Context & context, /// DB, tables, data types, engines, functions, aggregate functions...
    BlockInputStreamPtr & query_plan, /// Here could be written the description on how query was executed
    QueryProcessingStage::Enum stage = QueryProcessingStage::Complete /// Up to which stage process the SELECT query
    )
```

**4.** 注释应仅用英语书写。

**5.** 如果您正在编写库，请在主头文件中包含详细的注释进行解释。

**6.** 不要添加不提供附加信息的注释。特别是，不要留下像这样的空注释：

```cpp
/*
* Procedure Name:
* Original procedure name:
* Author:
* Date of creation:
* Dates of modification:
* Modification authors:
* Original file name:
* Purpose:
* Intent:
* Designation:
* Classes used:
* Constants:
* Local variables:
* Parameters:
* Date of creation:
* Purpose:
*/
```

示例借用自 http://home.tamk.fi/~jaalto/course/coding-style/doc/unmaintainable-code。

**7.** 不要在每个文件的开头写无意义的注释（作者，创建日期等）。

**8.** 单行注释以三个斜杠开始：`///`，多行注释以 `/**` 开始。这些注释被视为“文档”。

注意：您可以使用 Doxygen 从这些注释中生成文档。但是 Doxygen 并不常用，因为在 IDE 中导航代码更方便。

**9.** 多行注释开始和结束时不得有空行（除了关闭多行注释的那一行）。

**10.** 对于注释代码，使用基本注释，而不是“文档”注释。

**11.** 在提交之前删除被注释掉的代码部分。

**12.** 不要在注释或代码中使用粗俗的语言。

**13.** 不要使用大写字母。不要使用过多的标点符号。

```cpp
/// WHAT THE FAIL???
```

**14.** 不要在注释中使用分隔符。

```cpp
///******************************************************
```

**15.** 不要在注释中开始讨论。

```cpp
/// Why did you do this stuff?
```

**16.** 不需要在代码块结束时写一个注释来描述它的内容。

```cpp
/// for
```

## 命名 {#names}

**1.** 在变量和类成员的名称中使用小写字母和下划线。

```cpp
size_t max_block_size;
```

**2.** 对于函数（方法）的名称，使用 camelCase 并以小写字母开头。

```cpp
std::string getName() const override { return "Memory"; }
```

**3.** 对于类（结构）的名称，使用 CamelCase 并以大写字母开头。除了 I 外，不使用其他前缀作为接口的前缀。

```cpp
class StorageMemory : public IStorage
```

**4.** `using` 的命名方式与类相同。

**5.** 模板类型参数的名称：在简单情况下使用 `T`；`T`、`U`；`T1`、`T2`。

在更复杂的情况下，遵循类名称的规则，或添加前缀 `T`。

```cpp
template <typename TKey, typename TValue>
struct AggregatedStatElement
```

**6.** 模板常量参数的名称：要么遵循变量名称的规则，要么在简单情况下使用 `N`。

```cpp
template <bool without_www>
struct ExtractDomain
```

**7.** 对于抽象类（接口），可以添加 `I` 前缀。

```cpp
class IProcessor
```

**8.** 如果您在本地使用变量，可以使用简短名称。

在所有其他情况下，使用描述意义的名称。

```cpp
bool info_successfully_loaded = false;
```

**9.** `define` 和全局常量的名称使用全部大写字母和下划线。

```cpp
#define MAX_SRC_TABLE_NAMES_TO_STORE 1000
```

**10.** 文件名称应与其内容使用相同的风格。

如果文件包含单个类，文件名应与类相同（CamelCase）。

如果文件包含单个函数，文件名应与函数相同（camelCase）。

**11.** 如果名称包含缩写，则：

- 对于变量名称，缩写使用小写字母 `mysql_connection`（而不是 `mySQL_connection`）。
- 对于类和函数的名称，保留缩写中的大写字母 `MySQLConnection`（而不是 `MySqlConnection`）。

**12.** 构造函数参数仅用于初始化类成员，名称应与类成员相同，但后面加下划线。

```cpp
FileQueueProcessor(
    const std::string & path_,
    const std::string & prefix_,
    std::shared_ptr<FileHandler> handler_)
    : path(path_),
    prefix(prefix_),
    handler(handler_),
    log(&Logger::get("FileQueueProcessor"))
{
}
```

如果参数在构造函数体中未使用，则可以省略下划线后缀。

**13.** 局部变量和类成员的名称没有区别（不需要前缀）。

```cpp
timer (not m_timer)
```

**14.** 对于 `enum` 中的常量，使用大写字母的 CamelCase。全部大写字母也是合适的。如果 `enum` 非本地，使用 `enum class`。

```cpp
enum class CompressionMethod
{
    QuickLZ = 0,
    LZ4     = 1,
};
```

**15.** 所有名称必须使用英语。禁止翻译希伯来词。

    not T_PAAMAYIM_NEKUDOTAYIM

**16.** 如果缩写是众所周知的（当您可以轻松在维基百科或搜索引擎找到缩写的意思时），缩写是可以接受的。

    `AST`、`SQL`。

    不是 `NVDH`（一些随机字母）

不完整的单词是可以接受的，如果缩写版本是常用的。

如果全名在旁边的注释中包含，也可以使用缩写。

**17.** C++ 源代码文件必须具有 `.cpp` 扩展名。头文件必须具有 `.h` 扩展名。

## 如何编写代码 {#how-to-write-code}

**1.** 内存管理。

手动内存释放（`delete`）只能在库代码中使用。

在库代码中，`delete` 运算符只能在析构函数中使用。

在应用程序代码中，内存必须由拥有它的对象释放。

示例：

- 最简单的方式是将一个对象放在栈上，或使其成为另一个类的成员。
- 对于大量小对象，使用容器。
- 对于在堆中驻留的少量对象的自动释放，使用 `shared_ptr/unique_ptr`。

**2.** 资源管理。

使用 `RAII`，见上文。

**3.** 错误处理。

使用异常。在大多数情况下，您只需抛出异常，而不需要捕获它（因为 `RAII`）。

在离线数据处理应用程序中，通常可以不捕获异常。

在处理用户请求的服务器中，通常只需在连接处理器的顶层捕获异常即可。

在线程函数中，应捕获并保留所有异常，以便在 `join` 后在主线程中重新抛出。

```cpp
/// If there weren't any calculations yet, calculate the first block synchronously
if (!started)
{
    calculate();
    started = true;
}
else /// If calculations are already in progress, wait for the result
    pool.wait();

if (exception)
    exception->rethrow();
```

切勿在未处理的情况下隐藏异常。切勿盲目将所有异常记录。

```cpp
//Not correct
catch (...) {}
```

如果需要忽略某些异常，仅对特定异常如此，重新抛出其余异常。

```cpp
catch (const DB::Exception & e)
{
    if (e.code() == ErrorCodes::UNKNOWN_AGGREGATE_FUNCTION)
        return nullptr;
    else
        throw;
}
```

在使用响应代码或 `errno` 的函数时，始终检查结果，并在错误情况下抛出异常。

```cpp
if (0 != close(fd))
    throw ErrnoException(ErrorCodes::CANNOT_CLOSE_FILE, "Cannot close file {}", file_name);
```

您可以使用 assert 检查代码中的不变性。

**4.** 异常类型。

在应用程序代码中，不必使用复杂的异常层次结构。异常文本应该对系统管理员可理解。

**5.** 从析构函数抛出异常。

这不推荐，但允许。

使用以下选项：

- 创建一个函数（`done()` 或 `finalize()`），预先完成可能导致异常的所有工作。如果该函数被调用，后续的析构函数中就不应有异常。
- 过于复杂的任务（例如通过网络发送消息）可以放在单独的方法中，类的使用者必须在销毁前调用。
- 如果析构函数中有异常，最好记录，而不是隐藏它（如果日志记录器可用）。
- 在简单应用程序中，可以依赖 `std::terminate`（对于 C++11 中默认情况下 `noexcept` 的情况）来处理异常。

**6.** 匿名代码块。

您可以在单个函数内部创建一个单独的代码块，以使某些变量成为本地，从而在退出块时调用析构函数。

```cpp
Block block = data.in->read();

{
    std::lock_guard<std::mutex> lock(mutex);
    data.ready = true;
    data.block = block;
}

ready_any.set();
```

**7.** 多线程。

在离线数据处理程序中：

- 尽量在单个 CPU 核心上获得最佳性能。如果需要，可以再行并行化代码。

在服务器应用程序中：

- 使用线程池来处理请求。目前，我们没有需要用户空间上下文切换的任务。

未使用 fork 进行并行化。

**8.** 线程同步。

通常，可以使不同线程使用不同的内存单元（甚至更好的是：不同的缓存行），并且不使用任何线程同步（除了 `joinAll`）。

如果需要同步，在大多数情况下，使用 `lock_guard` 下的互斥体即可。

在其他情况下使用系统同步原语。不使用忙等待。

原子操作仅应在最简单的情况下使用。

除非这是您的主要专业领域，否则不要尝试实现无锁数据结构。

**9.** 指针与引用。

在大多数情况下，优先使用引用。

**10.** `const`。

使用常量引用、指向常量的指针、`const_iterator` 和 `const` 方法。

将 `const` 视为默认，仅在必要时使用非 `const`。

当按值传递变量时，通常使用 `const` 没有意义。

**11.** 无符号数。

如有必要，请使用 `unsigned`。

**12.** 数值类型。

使用 `UInt8`、`UInt16`、`UInt32`、`UInt64`、`Int8`、`Int16`、`Int32` 和 `Int64`，以及 `size_t`、`ssize_t` 和 `ptrdiff_t`。

不要使用这些类型表示数字：`signed/unsigned long`、`long long`、`short`、`signed/unsigned char`、`char`。

**13.** 传递参数。

如果要移动复杂值，请按值传递并使用 std::move；如果要在循环中更新值，请按引用传递。

如果函数捕获堆中创建的对象的所有权，请使参数类型为 `shared_ptr` 或 `unique_ptr`。

**14.** 返回值。

在大多数情况下，只需使用 `return`。不要写 `return std::move(res)`。

如果函数在堆上分配对象并返回，请使用 `shared_ptr` 或 `unique_ptr`。

在少数情况下（在循环中更新值），您可能需要通过参数返回值。在这种情况下，参数应为引用。

```cpp
using AggregateFunctionPtr = std::shared_ptr<IAggregateFunction>;

/** Allows creating an aggregate function by its name.
  */
class AggregateFunctionFactory
{
public:
    AggregateFunctionFactory();
    AggregateFunctionPtr get(const String & name, const DataTypes & argument_types) const;
```

**15.** `namespace`。

应用程序代码通常不需要使用单独的 `namespace`。

小型库也不需要这个。

对于中型到大型库，将所有内容放入一个 `namespace` 中。

在库的 `.h` 文件中，您可以使用 `namespace detail` 来隐藏不需要的实现细节。

在 `.cpp` 文件中，您可以使用 `static` 或匿名 `namespace` 隐藏符号。

此外，可以为 `enum` 使用 `namespace` 来防止相应名称落入外部 `namespace`（但最好使用 `enum class`）。

**16.** 延迟初始化。

如果初始化时需要参数，则通常不应编写默认构造函数。

如果将来需要延迟初始化，可以添加一个创建无效对象的默认构造函数。或者，对于少量对象，您可以使用 `shared_ptr/unique_ptr`。

```cpp
Loader(DB::Connection * connection_, const std::string & query, size_t max_block_size_);

/// For deferred initialization
Loader() {}
```

**17.** 虚函数。

如果类不打算进行多态性使用，则不需要使函数为虚函数。这也适用于析构函数。

**18.** 编码。

到处使用 UTF-8。使用 `std::string` 和 `char *`。不要使用 `std::wstring` 和 `wchar_t`。

**19.** 日志记录。

请参见代码中的示例。

在提交之前，删除所有无意义和调试日志，以及任何其他类型的调试输出。

在循环中进行日志记录应避免，即使是在 Trace 级别。

日志必须在任何日志级别上可读。

日志记录应主要用于应用程序代码。

日志消息必须用英语写成。

日志最好对系统管理员可理解。

在日志中不要使用粗俗的语言。

在日志中使用 UTF-8 编码。极少数情况下可以在日志中使用非 ASCII 字符。

**20.** 输入输出。

在对应用程序性能至关重要的内部循环中，不要使用 `iostreams`（也不使用 `stringstream`）。

使用 `DB/IO` 库。

**21.** 日期和时间。

请参见 `DateLUT` 库。

**22.** include。

始终使用 `#pragma once`，而不是包含保护。

**23.** using。

不使用 `using namespace`。您可以使用 `using` 与特定内容。但是使其局部化在类或函数内部。

**24.** 除非必要，不要为函数使用 `trailing return type`。

```cpp
auto f() -> void
```

**25.** 变量的声明和初始化。

```cpp
//right way
std::string s = "Hello";
std::string s{"Hello"};

//wrong way
auto s = std::string{"Hello"};
```

**26.** 对于虚函数，在基类中写 `virtual`，但在派生类中用 `override` 替代 `virtual`。

## C++ 的未使用特性 {#unused-features-of-c}

**1.** 不使用虚继承。

**2.** 在现代 C++ 中具有方便语法糖的构造，例如：

```cpp
// Traditional way without syntactic sugar
template <typename G, typename = std::enable_if_t<std::is_same<G, F>::value, void>> // SFINAE via std::enable_if, usage of ::value
std::pair<int, int> func(const E<G> & e) // explicitly specified return type
{
    if (elements.count(e)) // .count() membership test
    {
        // ...
    }

    elements.erase(
        std::remove_if(
            elements.begin(), elements.end(),
            [&](const auto x){
                return x == 1;
            }),
        elements.end()); // remove-erase idiom

    return std::make_pair(1, 2); // create pair via make_pair()
}

// With syntactic sugar (C++14/17/20)
template <typename G>
requires std::same_v<G, F> // SFINAE via C++20 concept, usage of C++14 template alias
auto func(const E<G> & e) // auto return type (C++14)
{
    if (elements.contains(e)) // C++20 .contains membership test
    {
        // ...
    }

    elements.erase_if(
        elements,
        [&](const auto x){
            return x == 1;
        }); // C++20 std::erase_if

    return {1, 2}; // or: return std::pair(1, 2); // create pair via initialization list or value initialization (C++17)
}
```

## 平台 {#platform}

**1.** 我们编写特定平台的代码。

但在其他条件相同的情况下，更倾向于跨平台或可移植的代码。

**2.** 语言：C++20（请查看可用的 [C++20 特性](https://en.cppreference.com/w/cpp/compiler_support#C.2B.2B20_features)）。

**3.** 编译器：`clang`。在写作时（2025 年 3 月），代码使用 clang 版本 >= 19 进行编译。

使用标准库（`libc++`）。

**4.** 操作系统：Linux Ubuntu，版本不低于 Precise。

**5.** 代码是为 x86_64 CPU 架构编写的。

CPU 指令集是在我们的服务器中支持的最小集。目前为 SSE 4.2。

**6.** 使用 `-Wall -Wextra -Werror -Weverything` 编译标志，且有几个例外。

**7.** 所有库都使用静态链接，除非那些难以静态连接的库（请参见 `ldd` 命令的输出）。

**8.** 代码在发布设置下进行开发和调试。

## 工具 {#tools}

**1.** KDevelop 是一个不错的 IDE。

**2.** 对于调试，使用 `gdb`、`valgrind`（`memcheck`）、`strace`、`-fsanitize=...` 或 `tcmalloc_minimal_debug`。

**3.** 对于性能分析，使用 `Linux Perf`、`valgrind`（`callgrind`）或 `strace -cf`。

**4.** 源代码使用 Git。

**5.** 汇编使用 `CMake`。

**6.** 程序通过 `deb` 包发布。

**7.** 对主分支的提交不得破坏 build。

尽管只有选定修订版被视为可工作。

**8.** 尽可能频繁地进行提交，即使代码仅部分完成。

为此目的使用分支。

如果您在 `master` 分支中的代码尚不能构建，请在 `push` 之前将其排除在构建之外。您需要在几天内完成或删除它。

**9.** 对于非平凡的更改，使用分支并将其发布到服务器上。

**10.** 未使用的代码会从存储库中删除。

## 库 {#libraries}

**1.** 使用 C++20 标准库（允许实验性扩展），以及 `boost` 和 `Poco` 框架。

**2.** 不允许使用 OS 包中的库。也不允许使用预安装的库。所有库应以源代码的形式放在 `contrib` 目录中，并与 ClickHouse 一起构建。有关详细信息，请参见 [添加和维护第三方库的指南](/development/contrib#adding-and-maintaining-third-party-libraries)。

**3.** 始终优先考虑已在使用中的库。

## 一般建议 {#general-recommendations-1}

**1.** 写尽可能少的代码。

**2.** 尝试最简单的解决方案。

**3.** 在您知道代码将如何工作以及内部循环将如何运作之前，请勿编写代码。

**4.** 在最简单的情况下，使用 `using` 而不是类或结构。

**5.** 如果可能，请勿编写拷贝构造函数、赋值运算符、析构函数（除非是虚拟的，如果类包含至少一个虚函数）、移动构造函数或移动赋值运算符。换句话说，编译器生成的函数必须正常工作。您可以使用 `default`。

**6.** 鼓励简化代码。尽可能减少代码的规模。

## 其他建议 {#additional-recommendations}

**1.** 明确指定 `std::` 类型来自 `stddef.h` 是不推荐的。换句话说，我们建议使用 `size_t` 而不是 `std::size_t`，因为它更简短。

添加 `std::` 是可以接受的。

**2.** 明确指定 `std::` 对于标准 C 库中的函数是不推荐的。换句话说，写 `memcpy` 而不是 `std::memcpy`。

原因是有类似的非标准函数，例如 `memmem`。我们偶尔使用这些函数。这些函数在 `namespace std` 中不存在。

如果您到处都写 `std::memcpy` 而不是 `memcpy`，那么 `memmem` 不带 `std::` 看起来会很奇怪。

但如果您倾向于使用 `std::`，仍然可以使用。

**3.** 在 C 中使用函数，而在标准 C++ 库中可以使用相同的函数是可以接受的。这样做的效率更高。

例如，使用 `memcpy` 而不是 `std::copy` 来复制大量内存块。

**4.** 多行函数参数。

允许任何以下包裹样式：

```cpp
function(
  T1 x1,
  T2 x2)
```

```cpp
function(
  size_t left, size_t right,
  const & RangesInDataParts ranges,
  size_t limit)
```

```cpp
function(size_t left, size_t right,
  const & RangesInDataParts ranges,
  size_t limit)
```

```cpp
function(size_t left, size_t right,
      const & RangesInDataParts ranges,
      size_t limit)
```

```cpp
function(
      size_t left,
      size_t right,
      const & RangesInDataParts ranges,
      size_t limit)
```
