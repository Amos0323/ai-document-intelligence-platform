# Five-minute demo script

## 1. Frame the problem (30 seconds)

“Operations teams receive invoices, contracts and HR documents in inconsistent formats. Manual re-keying is slow, hard to audit and prone to missed risk signals. DocuIntel turns those files into review-ready structured data.”

## 2. Dashboard (45 seconds)

- Open the dashboard.
- Point out the operational KPIs, processing activity and review queue.
- Open **Acme Office Supplies — INV-2026-1842**.

## 3. Human review (2 minutes)

- Compare the source text with extracted invoice fields.
- Show the missing purchase-order validation warning.
- Explain the high-value payment and missing-bank-details risk flags.
- Correct a field, add a reviewer note and click **Save changes**.
- Approve the document and show the audit event.

## 4. Resilience (45 seconds)

- Explain that OpenAI Structured Outputs are used on the backend.
- Show the fallback extraction label in code or seed a low-confidence example.
- Emphasize that API failures still create a manually reviewable record.

## 5. Search and export (30 seconds)

- Filter documents to high-risk items.
- Export a reviewed item as JSON or CSV.

## 6. Technical close (30 seconds)

“The portfolio signal is the workflow, not just the model call: typed schemas, deterministic controls, duplicate checks, human approval, auditability, fallback behavior and tested exports.”

