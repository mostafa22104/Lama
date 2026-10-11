# Lamma (لَمّة) — Design Handoff for Claude Code

Egyptian subscription & debt-collection web app. Owners (academies, buildings, tutors, nurseries) track who owes what; Lamma sends WhatsApp reminders; customers pay via InstaPay from a public link (no account) and upload a transfer screenshot; AI reads the screenshot and the owner confirms.

**Read this file first, then look at `screenshots/*.png` for the look and `screens/*.html` for exact markup/styles.**

## What's in this folder

| Path | What it is | How to use it |
|---|---|---|
| `screenshots/*.png` | Pixel render of every screen (2x) | Visual reference. Match these. |
| `screens/*.html` | Static HTML of every screen, initial state, links between screens work | Open in a browser. Copy exact spacing, colors, copy text, SVG icons. |
| `source-dc/*.dc.html` | Original prototype source incl. interaction logic (`class Component … renderVals()`) | Shows state + behaviour (toggles, send, confirm/reject, filters). `{{x}}` = binding, `<sc-if>` = conditional, `<sc-for>` = loop. |
| `design-tokens.json`, `tokens.css` | Colors, type, radii, sizes, status chip colors | Put into Tailwind theme / CSS variables. |

## Global rules (non-negotiable)

- Arabic, **RTL** (`<html dir="rtl" lang="ar">`), Egyptian dialect copy — keep the copy exactly as in the screens.
- Font: IBM Plex Sans Arabic (400/500/600/700).
- **Western digits** for amounts; currency suffix `ج.م` rendered smaller after the number (e.g. `450 ج.م`). Phone numbers & InstaPay addresses are `dir="ltr"`.
- Mobile-first at 375px. Owner dashboard also has a 1280px desktop layout (`DashboardDesktop`) with a right-side sidebar.
- Users are not tech-savvy: primary buttons 56px tall, min tap target 44px, few words per screen.
- Payment status chip (dot + label + color), used identically everywhere:
  - `paid` → مدفوع · `due_soon` → مستحق قريب · `overdue` → متأخر · `awaiting_confirmation` → في انتظار التأكيد
- Icons are inline stroke SVGs (Lucide-style, 24 viewBox, stroke 2). `lucide-react` is a fine substitute.
- The prototype uses fixed-height artboards; in the real app every screen should **scroll** normally with the bottom nav fixed.

## Screens

### Flow A — Business owner
| # | Screen | File | Notes |
|---|---|---|---|
| A1 | Landing page | `Main` | Hero «نلمّ لك فلوسك وإنت مرتاح», 3 benefits, how it works (3 steps), pricing (Free 0 ج/20 · Basic 199 ج/150 · Pro 399 ج/500 + auto WhatsApp), FAQ (`<details>`), CTA |
| A2 | Sign up | `Signup` | Phone/email segmented toggle, business name, business type (academy, building, tutor, nursery, other), InstaPay address. Step 1/4 |
| A3 | Add customers | `AddCustomers` | 3 big cards: صوّر الكشكول (notebook photo, AI), contacts, Excel. Step 2/4 |
| A3 | Notebook scanning (loading state) | `NotebookScan` | Scan animation + step checklist + skeleton rows |
| A3 | Review extracted table | `NotebookReview` | Editable table (name / phone / amount); low-confidence cells highlighted amber with a hint |
| A4 | Add charge | `AddCharge` | Type: monthly (amount + day of month) or one-time (name, amount, due date). Assign to all / selected customers. Step 3/4 |
| A5 | Reminder settings | `ReminderSettings` | Toggles: 3 days before / on due date / 3 days after + live WhatsApp message preview. Step 4/4 |
| A6 | Home dashboard | `Home` (mobile), `DashboardDesktop` (1280) | Collected vs expected progress, overdue amount, awaiting count, «تذكيرات النهارده (7)» + «ابعت الكل», overdue list |
| A7 | Today's reminders | `Reminders` | Row = customer, reason, amount, «ابعت على واتساب» → opens `wa.me` with prefilled text; sent rows show a check; progress "اتبعت X من 7" |
| A8 | Payment confirmation queue | `Confirmations` | Card per claim: screenshot thumbnail, AI-extracted fields (amount, date, transaction ID, recipient) each with ✓/⚠ indicator, overall verdict banner (all match / amount differs / duplicate screenshot), تأكيد / رفض; after action the card collapses to a result row with undo |
| — | Customers list | `Customers` | Search + status filter pills + customer rows |
| A9 | Customer profile | `CustomerProfile` | Balance + status, next due date, send reminder, edit, record cash payment, history timeline |
| A10 | Monthly report | `Report` | «لمّينا لك 23,400 ج الشهر ده», vs last month, paid count, still-late list, download Excel |
| A11 | Settings & plan | `Settings` | Business info, InstaPay address, plan usage + upgrade, team (Pro-locked), weekly Excel backup toggle, logout |

Bottom nav (owner, mobile): الرئيسية · العملاء · التأكيدات (badge count) · التقارير.

### Flow B — Customer (no account, public link)
| # | Screen | File | Notes |
|---|---|---|---|
| B1 | WhatsApp reminder in chat | `WaReminder` | Reference for the message text + link preview card (OG image/title). Not an app screen. |
| B2 | Payment page `/p/:token` | `PayPage` | Business name/logo, customer name, amount + month + status, InstaPay address with copy button, «افتح InstaPay», primary «دفعت», secondary «هدفع يوم…» → day picker → promise confirmation |
| B3 | Upload screenshot | `UploadProof` | Drop/pick zone → preview → «ابعت الإثبات» → `PayThanks` |
| — | Error: unreadable screenshot | `UploadError` | Blurred preview, tips, «ارفع صورة تانية» |
| B4 | Thank you | `PayThanks` | «استلمنا إثبات الدفع، وهيتأكد قريب», status = awaiting confirmation |
| B4 | WhatsApp confirmation | `WaConfirmed` | Message «تم تأكيد دفعك ✅» with receipt link |
| B5 | Already paid | `AlreadyPaid` | What the link shows after confirmation |

### States & reference
- `EmptyCustomers`, `EmptyReminders` — empty states.
- `NotebookScan` — loading state. `UploadError` — error state.
- `Components` — component sheet (colors, type, buttons, chips, inputs, customer row, amount display, toggle, bottom nav).
- `Start` — prototype index only; don't build it.

## Navigation map (links present in the prototype)

- Main → Signup (all CTAs), Home (دخول)
- Signup → AddCustomers
- AddCustomers → NotebookScan (notebook), NotebookReview (Excel), Customers (contacts), EmptyCustomers (later)
- NotebookScan → NotebookReview → AddCharge → ReminderSettings → Home
- Home → Reminders, Confirmations, Customers, CustomerProfile, Report, Settings, AddCharge
- Reminders → WaReminder ("how the customer sees it")
- Customers → CustomerProfile, AddCustomers
- CustomerProfile → Reminders (send reminder), AddCharge (edit)
- Report → CustomerProfile, Reminders
- WaReminder → PayPage → UploadProof → PayThanks → WaConfirmed → AlreadyPaid
- UploadError → UploadProof

## Suggested data model (MVP)

```
Business  { id, name, type: academy|building|tutor|nursery|other, instapayAddress, phone|email, plan: free|basic|pro, logoUrl }
Customer  { id, businessId, name, phone, note }                       // e.g. "ولي أمر يوسف"
Charge    { id, businessId, kind: monthly|one_time, title, amount, dayOfMonth?, dueDate?, customerIds[] }
Invoice   { id, chargeId, customerId, period ("2026-09"), amount, dueDate,
            status: due_soon|overdue|awaiting_confirmation|paid, publicToken }
ReminderRule { businessId, beforeDays: 3|null, onDueDate: bool, afterDays: 3|null }
ReminderLog  { invoiceId, type: before|on|after, sentAt, channel: whatsapp_link|whatsapp_api }
PaymentClaim { id, invoiceId, screenshotUrl, extracted: { amount, date, transactionId, recipient },
               checks: { amountMatches, dateOk, duplicateOf?, recipientMatches },
               status: pending|confirmed|rejected, promisedDate? }
```

Status rules: `due_soon` within 3 days of dueDate · `overdue` after dueDate · `awaiting_confirmation` when a PaymentClaim is pending · `paid` when confirmed (or cash recorded).

## Behaviour notes

- **WhatsApp sending (Free/Basic):** button opens `https://wa.me/<phone>?text=<encoded message>`; mark as sent when clicked. **Pro:** sent automatically via WhatsApp Business API.
- **Message templates** (see `source-dc/ReminderSettings.dc.html`): before / on due / after, each includes the public pay link `lamma.app/p/<token>`.
- **Screenshot check:** OCR/vision extracts amount, date, transaction ID, recipient; compare with invoice amount, InstaPay address, and previous transaction IDs (duplicate detection). Owner always makes the final call.
- **«هدفع يوم…»** stores a promised date and schedules a reminder that day.
- **Notebook photo import:** vision model → table; mark low-confidence cells for review before saving.
- **Weekly backup:** email an Excel export every Friday when enabled.

## Sample data used in the designs
Business: أكاديمية النجوم للكرة — owner "كابتن وليد" — InstaPay `nogoum.academy@instapay`. September 2026: expected 31,500 ج.م, collected 23,400 (74%), last month 19,800, overdue 2,850 ج.م (4 customers), 68 customers, 3 awaiting confirmation, 7 reminders today. Customers: محمود حسن 450 (overdue), سارة عادل 450 (due soon), كريم فتحي 900, أحمد السيد 600 (awaiting), منى إبراهيم 450 (paid), عمر خالد 1,200 كامب الصيف, هبة مصطفى, ياسمين طارق, يوسف رمضان 300, نورهان سامي 750, دينا أشرف 150 تيشيرت.
