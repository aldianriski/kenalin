---
type: case_study
projectId: quickhub
title: QuickHub — approval workflow automation for a logistics SME
url: https://demo.kenalin.dev/case-studies/quickhub
topics: [process_automation, internal_tooling, approval, logistics]
---

# QuickHub

QuickHub replaced a WhatsApp-and-spreadsheet approval process at a mid-sized
logistics company with an auditable internal workflow tool.

## Role

Sari Wibowo acted as **tech lead** — owning the architecture and leading a small
delivery team of three. Responsibilities spanned data modeling, the approval
state machine, and the operations dashboard.

## Problem

Purchase and dispatch approvals moved through group chats. Three to five
approvers were involved depending on order value, and the trail was routinely
lost. Finance could not audit who approved what, or when.

## Approach

- Modeled the approval chain as an explicit state machine with role-based steps.
- Built a Go service for the approval engine and a React dashboard for operations.
- Added an immutable audit log so every decision is traceable.

## Outcome

Approval turnaround dropped from days to hours, and every approval became
auditable. The tool now handles the company's daily dispatch approvals.
