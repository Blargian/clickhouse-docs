# Install ClickHouse on Windows with WSL

## Requirements

:::note
To install ClickHouse on Windows you will need WSL (Windows Subsystem for Linux).
:::

<VerticalStepper>

## Install WSL

Open Windows PowerShell as administrator and run the following command:

```bash
wsl --install
```

You will be prompted to enter a new UNIX username and password. After you have
entered your desired username and password you should see a message similar to:

```bash
Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 5.15.133.1-microsoft-WSL2 x86_64)
```

## Install ClickHouse via script using curl

Run the following command to install ClickHouse via script using curl:

```bash
curl https://clickhouse.com/ | sh
```

If the script has successfully run you will see the message:

```bash
Successfully downloaded the ClickHouse binary, you can run it as:
  ./clickhouse
```

## Start clickhouse-local

`clickhouse-local` allows you to process local and remote files using ClickHouse's
powerful SQL syntax and without the need for configuration. Table data is stored
in a temporary location, meaning that after a restart of `clickhouse-local`
previously created tables are no longer available.

Run the following command to start [clickhouse-local](../operations/utilities/clickhouse-local.md):

```bash
./clickhouse
```

## Start clickhouse-server

Should you wish to persist data, you'll want to run `clickhouse-server`. You can
start the ClickHouse server using the following command:

```bash
./clickhouse server
```

## Start clickhouse-client

With the server up and running, open a new terminal window and run the following command
to launch `clickhouse-client`:

```bash
./clickhouse client
```

You will see something like this:

```response
./clickhouse client
ClickHouse client version 24.5.1.117 (official build).
Connecting to localhost:9000 as user default.
Connected to ClickHouse server version 24.5.1.

local-host :)
```

Table data is stored in the current directory and still available after a restart
of ClickHouse server. If necessary, you can pass
`-C config.xml` as an additional command line argument to `./clickhouse server`
and provide further configuration in a configuration
file. All available configuration settings are documented [here](../operations/settings/settings.md) and in the
[example configuration file
template](https://github.com/ClickHouse/ClickHouse/blob/master/programs/server/config.xml).

You are now ready to start sending SQL commands to ClickHouse!

</VerticalStepper>