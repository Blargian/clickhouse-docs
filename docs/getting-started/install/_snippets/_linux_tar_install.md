# Install ClickHouse using tgz archives

> It is recommended to use official pre-compiled `tgz` archives for all Linux distributions, where installation of `deb` or `rpm` packages is not possible.

<VerticalStepper>

## Download and install latest stable version {#install-latest-stable}

The required version can be downloaded with `curl` or `wget` from repository https://packages.clickhouse.com/tgz/.
After that downloaded archives should be unpacked and installed with installation scripts.

Below is an example of how to install the latest stable version.

:::note
For production environments, it's recommended to use the latest `stable`-version.
You can find the release number on this [GitHub page](https://github.com/ClickHouse/ClickHouse/tags)
with postfix `-stable`.
:::

## Get the latest ClickHouse version {#get-latest-version}

Get the latest ClickHouse version from GitHub and store it in `LATEST_VERSION` variable.

```bash
LATEST_VERSION=$(curl -s https://raw.githubusercontent.com/ClickHouse/ClickHouse/master/utils/list-versions/version_date.tsv | \
    grep -Eo '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort -V -r | head -n 1)
export LATEST_VERSION
```

## Detect your system architecture {#detect-system-architecture}

Detect the system architecture and set the ARCH variable accordingly:

```bash
case $(uname -m) in
  x86_64) ARCH=amd64 ;;         # For Intel/AMD 64-bit processors
  aarch64) ARCH=arm64 ;;        # For ARM 64-bit processors
  *) echo "Unknown architecture $(uname -m)"; exit 1 ;; # Exit if architecture isn't supported
esac
```

## Download tarballs for each ClickHouse component {#download-tarballs}

Download tarballs for each ClickHouse component. The loop tries architecture-specific 
packages first, then falls back to generic ones.

```bash
for PKG in clickhouse-common-static clickhouse-common-static-dbg clickhouse-server clickhouse-client clickhouse-keeper
do
  curl -fO "https://packages.clickhouse.com/tgz/stable/$PKG-$LATEST_VERSION-${ARCH}.tgz" \
    || curl -fO "https://packages.clickhouse.com/tgz/stable/$PKG-$LATEST_VERSION.tgz"
done
```

## Extract and install packages {#extract-and-install}

Run the commands below to extract and install the following packages:
- `clickhouse-common-static`

```bash
# Extract and install clickhouse-common-static package
tar -xzvf "clickhouse-common-static-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-common-static-$LATEST_VERSION.tgz"
sudo "clickhouse-common-static-$LATEST_VERSION/install/doinst.sh"
```


- `clickhouse-common-static-dbg`

```bash
# Extract and install debug symbols package
tar -xzvf "clickhouse-common-static-dbg-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-common-static-dbg-$LATEST_VERSION.tgz"
sudo "clickhouse-common-static-dbg-$LATEST_VERSION/install/doinst.sh"
```

- `clickhouse-server`

```bash
# Extract and install server package with configuration
tar -xzvf "clickhouse-server-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-server-$LATEST_VERSION.tgz"
sudo "clickhouse-server-$LATEST_VERSION/install/doinst.sh" configure
sudo /etc/init.d/clickhouse-server start  # Start the server
```

- `clickhouse-client`

```bash
# Extract and install client package
tar -xzvf "clickhouse-client-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-client-$LATEST_VERSION.tgz"
sudo "clickhouse-client-$LATEST_VERSION/install/doinst.sh"
```



</VerticalStepper>
