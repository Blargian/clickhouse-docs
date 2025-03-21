---
sidebar_label: 'Mitzu'
slug: /integrations/mitzu
keywords: ['clickhouse', 'Mitzu', 'connect', 'integrate', 'ui']
description: 'Mitzu is a no-code warehouse-native product analytics application.'
title: 'Connecting Mitzu to ClickHouse'
---

import ConnectionDetails from '@site/docs/_snippets/_gather_your_details_http.mdx';
import mitzu_01 from '@site/static/images/integrations/data-visualization/mitzu_01.png';
import mitzu_02 from '@site/static/images/integrations/data-visualization/mitzu_02.png';
import mitzu_03 from '@site/static/images/integrations/data-visualization/mitzu_03.png';
import mitzu_04 from '@site/static/images/integrations/data-visualization/mitzu_04.png';
import mitzu_05 from '@site/static/images/integrations/data-visualization/mitzu_05.png';
import mitzu_06 from '@site/static/images/integrations/data-visualization/mitzu_06.png';
import mitzu_07 from '@site/static/images/integrations/data-visualization/mitzu_07.png';
import mitzu_08 from '@site/static/images/integrations/data-visualization/mitzu_08.png';
import mitzu_09 from '@site/static/images/integrations/data-visualization/mitzu_09.png';
import mitzu_10 from '@site/static/images/integrations/data-visualization/mitzu_10.png';
import mitzu_11 from '@site/static/images/integrations/data-visualization/mitzu_11.png';

# Connecting Mitzu to ClickHouse

Mitzu is a no-code, warehouse-native product analytics application. Similar to tools like Amplitude, Mixpanel, and PostHog, Mitzu empowers users to analyze product usage data without requiring SQL or Python expertise. 

However, unlike these platforms, Mitzu does not duplicate the company’s product usage data. Instead, it generates native SQL queries directly on the company’s existing data warehouse or lake.

## Goal {#goal}

In this guide, we are going to cover the following:

- Warehouse-native product analytics
- How to integrate Mitzu to ClickHouse

:::tip Example datasets
If you do not have a data set to use for Mitzu, you can work with NYC Taxi Data.
This dataset is available in ClickHouse Cloud or [can be loaded with these instructions](/getting-started/example-datasets/nyc-taxi).
:::

This guide is just a brief overview of how to use Mitzu. You can find more detailed information in the [Mitzu documentation](https://docs.mitzu.io/).

## 1. Gather your connection details {#1-gather-your-connection-details}

<ConnectionDetails />

## 2. Sign in or sign up to Mitzu {#2-sign-in-or-sign-up-to-mitzu}

As a first step, head to [https://app.mitzu.io](https://app.mitzu.io) to sign up.

<img src={mitzu_01} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Sign in" />

## 3. Configure your workspace {#3-configure-your-workspace}

After creating an organization, follow the `Set up your workspace` onboarding guide in the left sidebar. Then, click on the `Connect Mitzu with your data warehouse` link.

<img src={mitzu_02} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Create workspace" ></img>

## 4. Connect Mitzu to ClickHouse {#4-connect-mitzu-to-clickhouse}

First, select ClickHouse as the connection type and set the connection details. Then, click the `Test connection & Save` button to save the settings.

<img src={mitzu_03} class="image" style={{width: '50%', 'background-color': 'transparent'}}alt="Setup connection details" ></img>

## 5. Configure event tables {#5-configure-event-tables}

Once the connection is saved, select the `Event tables` tab and click the `Add table` button. In the modal, select your database and the tables you want to add to Mitzu.

Use the checkboxes to select at least one table and click on the `Configure table` button. This will open a modal window where you can set the key columns for each table.

<img src={mitzu_04} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Setup table connection"></img>
<br/>

> To run product analytics on your ClickHouse setup, you need to > specify a few key columns from your table.
>
> These are the following:
>
> - **User id** - the column for the unique identifier for the users.
> - **Event time** - the timestamp column of your events.
> - Optional[**Event name**] - This column segments the events if the table contains multiple event types.

<img src={mitzu_05} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Create event catalog" ></img>
<br/>
Once all tables are configured, click on the `Save & update event catalog` button, and  Mitzu will find all events and their properties from the above-defined table. This step may take up to a few minutes, depending on the size of your dataset.

## 4. Run segmentation queries {#4-run-segmentation-queries}

User segmentation in Mitzu is as easy as in Amplitude, Mixpanel, or PostHog.

The Explore page has a left-hand selection area for events, while the top section allows you to configure the time horizon.

<img src={mitzu_06} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Segmentation" ></img>

<br/>

:::tip Filters and Breakdown
Filtering is done as you would expect: pick a property (ClickHouse column) and select the values from the dropdown that you want to filter.
You can choose any event or user property for breakdowns (see below for how to integrate user properties).
:::

## 5. Run funnel queries {#5-run-funnel-queries}

Select up to 9 steps for a funnel. Choose the time window within which your users can complete the funnel.
Get immediate conversion rate insights without writing a single line of SQL code.

<img src={mitzu_07} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Funnel" ></img>

<br/>

:::tip Visualize trends
Pick `Funnel trends` to visualize funnel trends over time.
:::

## 6. Run retention queries {#6-run-retention-queries}

Select up to 2 steps for a retention rate calculation. Choose the retention window for the recurring window for
Get immediate conversion rate insights without writing a single line of SQL code.

<img src={mitzu_08} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Retention" ></img>

<br/>

:::tip Cohort retention
Pick `Weekly cohort retention` to visualize how your retention rates change over time.
:::


## 7. Run journey queries {#7-run-journey-queries}
Select up to 9 steps for a funnel. Choose the time window within which your users can finish the journey. The Mitzu journey chart gives you a visual map of every path users take through the selected events.

<img src={mitzu_09} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Journey" ></img>
<br/>

:::tip Break down steps
You can select a property for the segment `Break down` to distinguish users within the same step.
:::

<br/>

## 8. Run revenue queries {#8-run-revenue-queries}
If revenue settings are configured, Mitzu can calculate the total MRR and subscription count based on your payment events.

<img src={mitzu_10} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="Revenue" ></img>

## 9. SQL native {#9-sql-native}

Mitzu is SQL Native, which means it generates native SQL code from your chosen configuration on the Explore page.

<img src={mitzu_11} class="image" style={{width: '50%', 'background-color': 'transparent'}} alt="SQL Native" ></img>

<br/>

:::tip Continue your work in a BI tool
If you encounter a limitation with Mitzu UI, copy the SQL code and continue your work in a BI tool.
:::

## Mitzu support {#mitzu-support}

If you are lost, feel free to contact us at [support@mitzu.io](email://support@mitzu.io)

Or you our Slack community [here](https://join.slack.com/t/mitzu-io/shared_invite/zt-1h1ykr93a-_VtVu0XshfspFjOg6sczKg)

## Learn more {#learn-more}

Find more information about Mitzu at [mitzu.io](https://mitzu.io)

Visit our documentation page at [docs.mitzu.io](https://docs.mitzu.io)
