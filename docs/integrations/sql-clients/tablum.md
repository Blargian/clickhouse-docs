---
sidebar_label: TABLUM.IO
slug: /integrations/tablumio
description: TABLUM.IO is a data management SaaS that supports ClickHouse out of the box.
---

import tablum_ch_0 from '@site/static/images/integrations/sql-clients/tablum-ch-0.png';
import tablum_ch_1 from '@site/static/images/integrations/sql-clients/tablum-ch-1.png';
import tablum_ch_2 from '@site/static/images/integrations/sql-clients/tablum-ch-2.png';
import tablum_ch_3 from '@site/static/images/integrations/sql-clients/tablum-ch-3.png';

# Connecting TABLUM.IO to ClickHouse

## Open the TABLUM.IO startup page {#open-the-tablumio-startup-page}

Cloud version of TABLUM.IO is available at [https://go.tablum.io/](https://go.tablum.io/)

:::note
  You can install a self-hosted version of TABLUM.IO on your Linux server in docker.
:::


## 1. Sign up or sign in to the service {#1-sign-up-or-sign-in-to-the-service}

  First, sign up to TABLUM.IO using your email or use a quick-login via accounts in Google or Facebook.

<img src={tablum_ch_0} class="image" alt="TABLUM.IO 0" />

## 2. Add a ClickHouse connector {#2-add-a-clickhouse-connector}

Gather your ClickHouse connection details, navigate to the **Connector** tab, and fill in the host URL, port, username, password, database name, and connector's name. After completing these fields, click on **Test connection** button to validate the details and then click on  **Save connector for me** to make it persistent.

:::tip
Make sure that you specify the correct **HTTP** port and toggle **SSL** mode according to your connection details.
:::

:::tip
Typically, the port is 8443 when using TLS or 8123 when not using TLS.
:::

<img src={tablum_ch_1} class="image" alt="TABLUM.IO 01" />

## 3. Select the connector {#3-select-the-connector}

Navigate to the **Dataset** tab. Select recently created ClickHouse connector in the dropdown. In the right panel, you will see the list of available tables and schemas.

<img src={tablum_ch_2} class="image" alt="TABLUM.IO 02" />

## 4. Input a SQL query and run it {#4-input-a-sql-query-and-run-it}

Type a query in the SQL Console and press **Run Query**. The results will be displayed as a spreadsheet.

:::tip
Right-click on the column name to open the dropdown menu with sort, filter and other actions.
:::

<img src={tablum_ch_3} class="image" alt="TABLUM.IO 03" />

:::note
With TABLUM.IO you can
* create and utilise multiple ClickHouse connectors within your TABLUM.IO account,
* run queries on any loaded data regardless of the data source,
* share the results as a new ClickHouse database.
:::

## Learn more {#learn-more}

Find more information about TABLUM.IO at https://tablum.io.
