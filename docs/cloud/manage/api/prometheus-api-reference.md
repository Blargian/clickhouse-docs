---
sidebar_label: Prometheus
title: Prometheus
---

## Get organization metrics

Returns prometheus metrics for all services in an organization.

| Method | Path |
| :----- | :--- |
| GET | `/v1/organizations/{organizationId}/prometheus` |

### Request

#### Path Params

| Name | Type | Description |
| :--- | :--- | :---------- |
| organizationId | uuid | ID of the requested organization. | 
| filtered_metrics | boolean | Return a filtered list of Prometheus metrics. | 

