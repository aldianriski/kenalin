---
type: case_study
projectId: ledgerlens
title: LedgerLens — reconciliation dashboard for a payments team
url: https://demo.kenalin.dev/case-studies/ledgerlens
topics: [data_visibility, reconciliation, dashboard, payments]
---

# LedgerLens

LedgerLens is an operational reconciliation dashboard built for a payments
operations team drowning in end-of-day mismatches.

## Role

Sari Wibowo led architecture and front-end delivery as **engineering lead**,
coordinating a cross-functional team of eight.

## Problem

Reconciliation ran on nightly CSV exports compared by hand. Mismatches surfaced
late and were hard to trace to a source transaction.

## Approach

- Streamed settlement events into a normalized store.
- Built a React dashboard surfacing mismatches with drill-down to the source txn.
- Automated the previously manual nightly comparison.

## Outcome

Mismatch detection moved from next-morning to near-real-time, and investigation
time per mismatch fell sharply.
