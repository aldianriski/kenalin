---
title: MetricBoard — a self-hosted analytics dashboard
type: case_study
projectId: metricboard
url: https://alex.example/work/metricboard
---

# MetricBoard

**MetricBoard** is a self-hosted analytics dashboard (a demo project) for teams
that want product metrics without shipping their data to a third party. It turns
raw events into a handful of dashboards anyone on the team can read.

Alex built the ingestion pipeline, a query layer with sensible caching, and a
dashboard builder where non-engineers can assemble charts from saved metrics. The
emphasis was on privacy (your data stays on your infrastructure) and speed
(dashboards that load instantly even over large event tables).

**Stack:** TypeScript, Node, ClickHouse-style columnar store, React charts.
**Outcome:** real-time operational visibility, fully self-hosted.
