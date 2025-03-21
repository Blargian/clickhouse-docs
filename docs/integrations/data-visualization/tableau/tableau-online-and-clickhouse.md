---
sidebar_label: 'Tableau Online'
sidebar_position: 2
slug: /integrations/tableau-online
keywords: ['clickhouse', 'tableau', 'online', 'mysql', 'connect', 'integrate', 'ui']
description: 'Tableau Online streamlines the power of data to make people faster and more confident decision makers from anywhere.'
title: 'Tableau Online'
---

import MySQLCloudSetup from '@site/docs/_snippets/_clickhouse_mysql_cloud_setup.mdx';
import MySQLOnPremiseSetup from '@site/docs/_snippets/_clickhouse_mysql_on_premise_setup.mdx';
import tableau_online_01 from '@site/static/images/integrations/data-visualization/tableau_online_01.png';
import tableau_online_02 from '@site/static/images/integrations/data-visualization/tableau_online_02.png';
import tableau_online_03 from '@site/static/images/integrations/data-visualization/tableau_online_03.png';
import tableau_online_04 from '@site/static/images/integrations/data-visualization/tableau_online_04.png';
import tableau_desktop_01 from '@site/static/images/integrations/data-visualization/tableau_desktop_01.png';
import tableau_desktop_02 from '@site/static/images/integrations/data-visualization/tableau_desktop_02.png';
import tableau_desktop_03 from '@site/static/images/integrations/data-visualization/tableau_desktop_03.png';
import tableau_desktop_04 from '@site/static/images/integrations/data-visualization/tableau_desktop_04.png';
import tableau_desktop_05 from '@site/static/images/integrations/data-visualization/tableau_desktop_05.png';

# Tableau Online

Tableau Online can connect to ClickHouse Cloud or on-premise ClickHouse setup via MySQL interface using the official MySQL data source.

## ClickHouse Cloud Setup {#clickhouse-cloud-setup}
<MySQLCloudSetup />

## On-premise ClickHouse Server Setup {#on-premise-clickhouse-server-setup}
<MySQLOnPremiseSetup />

## Connecting Tableau Online to ClickHouse (on-premise without SSL) {#connecting-tableau-online-to-clickhouse-on-premise-without-ssl}

Login to your Tableau Cloud site and add a new Published Data Source.

<img src={tableau_online_01} class="image" alt="Creating a new published data source" style={{width: '75%', 'background-color': 'transparent'}}/>
<br/>

Select "MySQL" from the list of available connectors.

<img src={tableau_online_02} class="image" alt="Selecting MySQL connector" style={{width: '75%', 'background-color': 'transparent'}}/>
<br/>

Specify your connection details gathered during the ClickHouse setup.

<img src={tableau_online_03} class="image" alt="Specifying your connection details" style={{width: '75%', 'background-color': 'transparent'}}/>
<br/>

Tableau Online will introspect the database and provide a list of available tables. Drag the desired table to the canvas on the right. Additionally, you can click "Update Now" to preview the data, as well as fine-tune the introspected field types or names.

<img src={tableau_online_04} class="image" alt="Selecting the tables to use" style={{width: '75%', 'background-color': 'transparent'}}/>
<br/>

After that, all that remains is to click "Publish As" in the top right corner, and you should be able to use a newly created dataset in Tableau Online as usual.

NB: if you want to use Tableau Online in combination with Tableau Desktop and share ClickHouse datasets between them, make sure you use Tableau Desktop with the default MySQL connector as well, following the setup guide that is displayed [here](https://www.tableau.com/support/drivers) if you select MySQL from the Data Source drop-down. If you have an M1 Mac, check [this troubleshooting thread](https://community.tableau.com/s/question/0D58b0000Ar6OhvCQE/unable-to-install-mysql-driver-for-m1-mac) for a driver installation workaround.

## Connecting Tableau Online to ClickHouse (Cloud or on-premise setup with SSL) {#connecting-tableau-online-to-clickhouse-cloud-or-on-premise-setup-with-ssl}

As it is not possible to provide the SSL certificates via the Tableau Online MySQL connection setup wizard, 
the only way is to use Tableau Desktop to set the connection up, and then export it to Tableau Online. This process is, however, pretty straightforward.

Run Tableau Desktop on a Windows or Mac machine, and select "Connect" -> "To a Server" -> "MySQL".
Likely, it will be required to install the MySQL driver on your machine first. 
You can do that by following the setup guide that is displayed [here](https://www.tableau.com/support/drivers) if you select MySQL from the Data Source drop-down. 
If you have an M1 Mac, check [this troubleshooting thread](https://community.tableau.com/s/question/0D58b0000Ar6OhvCQE/unable-to-install-mysql-driver-for-m1-mac) for a driver installation workaround.

<img src={tableau_desktop_01} class="image" alt="Create a new data source" style={{width: '75%', 'background-color': 'transparent'}}/>
<br/>

:::note
In the MySQL connection setup UI, make sure that the "SSL" option is enabled. 
ClickHouse Cloud's SSL certificate is signed by [Let's Encrypt](https://letsencrypt.org/certificates/). 
You can download this root cert [here](https://letsencrypt.org/certs/isrgrootx1.pem).
:::

Provide your ClickHouse Cloud instance MySQL user credentials and the path to the downloaded root certificate.

<img src={tableau_desktop_02} class="image" alt="Specifying your credentials" style={{width: '50%', 'background-color': 'transparent'}}/>
<br/>

Choose the desired tables as usual (similarly to Tableau Online), 
and select "Server" -> "Publish Data Source" -> Tableau Cloud.

<img src={tableau_desktop_03} class="image" alt="Publish data source" style={{width: '75%', 'background-color': 'transparent'}}/>
<br/>

IMPORTANT: you need to select "Embedded password" in "Authentication" options.

<img src={tableau_desktop_04} class="image" alt="Data source publishing settings - embedding your credentials" style={{width: '50%', 'background-color': 'transparent'}}/>
<br/>

Additionally, choose "Update workbook to use the published data source".

<img src={tableau_desktop_05} class="image" alt="Data source publishing settings - updating the workbook for online usage" style={{width: '50%', 'background-color': 'transparent'}}/>
<br/>

Finally, click "Publish", and your datasource with embedded credentials will be opened automatically in Tableau Online.


## Known limitations (ClickHouse 23.11) {#known-limitations-clickhouse-2311}

All the known limitations has been fixed in ClickHouse `23.11`. If you encounter any other incompatibilities, please do not hesitate to [contact us](https://clickhouse.com/company/contact) or create a [new issue](https://github.com/ClickHouse/ClickHouse/issues).
