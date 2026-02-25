# Data schema – quality over quantity, parse later

We record **every useful field** from Propwire and CBC so you can filter and prioritize later. Prefer **quality over quantity**; use these columns to build a shortlist.

---

## propwire_addresses.csv (from Propwire)

| Column | Required | Description | Use for parsing later |
|--------|----------|-------------|------------------------|
| **Address** | Yes | Full street, city, state, zip | Join key for CBC lookups and merging with leads |
| **Lead_Type** | No | Absentee, High Equity, Pre-Foreclosure, etc. | Prioritize: Absentee/High Equity for tree work |
| **Property_Type** | No | Single Family, etc. | Filter to Single Family only |
| **Lot_Size** | No | Acres or sqft if shown | Filter lot size > 0.5 acre |
| **Est_Value** | No | If visible on Propwire | Optional prioritization |
| **Equity_Pct** | No | If visible | High equity = more likely to spend |
| **Notes** | No | Any other useful text | Manual tags, filters |

When capturing in Cursor browser: **always capture Address**; capture Lead_Type, Property_Type, Lot_Size, etc. when visible on the Propwire result row so we can merge into leads later.

---

## tree_service_leads.csv (from CBC + Propwire)

| Column | Required | Description | Use for parsing later |
|--------|----------|-------------|------------------------|
| **Full_Name** | Yes | Person name from CBC | Outreach |
| **Address** | Yes | Property address (normalized) | Service address; join to Propwire |
| **Phone_Number** | Yes | Phone from CBC | Contact |
| **Phone_Type** | No | Mobile, Cell, Landline, Unknown | Filter to Mobile/Cell only when known |
| **Resident_Type** | No | Lives at, Used to live | Prefer "Lives at" (current resident/owner) |
| **Lead_Type** | No | From Propwire: Absentee, High Equity, etc. | Prioritize outreach |
| **Lot_Size** | No | From Propwire | Filter by lot size |
| **Property_Type** | No | From Propwire | Filter Single Family |
| **Source_Address** | No | Exact address string we looked up on CBC | Dedupe / match back to Propwire |
| **CBC_Result_Count** | No | Number of results for this address on CBC | Quality signal |
| **Notes** | No | Any useful note | Manual tags, VIEW DETAILS findings |

When recording from CBC: **always record Full_Name, Address, Phone_Number**. Add **Resident_Type** when you can tell "Lives at" vs "Used to live"; add **Phone_Type** when you get it from VIEW DETAILS. Merge in **Lead_Type**, **Lot_Size**, **Property_Type** from propwire_addresses when joining on Address.

---

## Parsing later (quality filters)

Example logic to build a **quality shortlist** from the CSVs:

1. **Merge** tree_service_leads with propwire_addresses on Address (or Source_Address) to get Lead_Type, Lot_Size, Property_Type.
2. **Filter** (when columns exist):
   - `Resident_Type == "Lives at"` (current resident)
   - `Phone_Type` in (`Mobile`, `Cell`)
   - `Property_Type == "Single Family"` (if present)
   - `Lot_Size` meets your minimum (e.g. > 0.5 acre)
   - `Lead_Type` in (`Absentee Owners`, `High Equity`, `Pre-Foreclosure`) if you want those segments
3. **Dedupe** by Phone_Number (keep one row per number).
4. **One lead per address** (optional): keep first "Lives at" per Address.

Empty/missing columns are fine; only apply filters when the column is present and filled.
