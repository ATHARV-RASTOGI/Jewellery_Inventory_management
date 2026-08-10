# Implementation Plan — Backend Code Analysis Report

## [Overview]

A comprehensive analysis of the Spring Boot backend (`inventory-backend`) covering bugs, business-logic flaws, data-integrity risks, and design issues — with prioritized recommendations and no code changes yet.

This report is the product of a full read-through of every backend source file: all entities, repositories, services, controllers, exception classes, configs, and `application.properties`. The system is a Jewelry ERP with four core domains — **Inventory (Products)**, **Sales**, **Loans (with interest payments)**, and **Custom Orders** — plus a metal-rate polling module (Gold/Silver via goldapi.io) and an Excel export module (Apache POI).

The codebase functions, but it has a number of **critical correctness bugs** (several of which silently corrupt financial data or show wrong numbers on the dashboard), **data-integrity gaps** (missing validation/constraints, no transactions on multi-step writes), and **design/structural weaknesses** (wrong data types for money, no DTOs, entities used as API payloads, hardcoded credentials in source). Issues are grouped by severity: **Critical** (wrong data / security / crash), **High** (business-logic flaws / integrity), **Medium** (design / maintainability), and **Low** (style / cleanup).

Each issue lists: **File → exact location**, **What is wrong**, **Why it matters**, and **Recommended fix**.

---

## [Types]

No type-system changes are made by this report itself (analysis only). However, the analysis surfaces systemic data-type problems that any future fix must address.

### 1. Money stored as `Double` everywhere (Critical data-integrity theme)
- `Product.price`, `Product.baseWeight` → `Double`
- `Sales.subtotal/gstAmount/grandTotal` → `Double`
- `Saleitem.pricePerPiece/lineTotal/weight` → `Double`
- `Loan.loanAmount/settlementAmount/weight` → `Double`
- `InterestPayment.amountPaid/balanceAfter` → `Double`
- **Why it's a problem:** IEEE-754 floating point cannot represent decimal currency exactly. Totals drift, rounding errors accumulate in `SalesService.createsales()` (`subtotal += pricePerPiece * quantity`) and in `LoanService` interest math, and `Math.round()` is sprinkled on outputs as a band-aid.
- **Recommendation:** Migrate all monetary/weight fields to `BigDecimal` (with `RoundingMode.HALF_EVEN` and explicit scale), or store paise as `long`. Define a `Money` policy: scale = 2 for currency, 3 for grams.

### 2. `CustomOrder` monetary fields are `String` (data model bug)
- `CustomOrder.advanceAmount` and `CustomOrder.totalAmount` are declared `String` (`@Column(name="Advance")`, `@Column(name="Total")`).
- **Why:** Money stored as text cannot be summed/validated/sorted numerically, and any non-numeric input is accepted silently.
- **Recommendation:** Change to `BigDecimal` (or `Double` at minimum) and add `@DecimalMin("0.0")`.

<!-- ### 3. `Loan.closeDate` is `String` while `issueDate` is `LocalDate` (inconsistent types)
- `Loan.issueDate` → `LocalDate`; `Loan.closeDate` → `String` (`@Column(name="close_date")`).
- **Why:** Settlement math elsewhere parses dates with `LocalDate.parse(...)`; a free-text close date can be stored in any format and will crash later parsing or make range queries impossible.
- **Recommendation:** Make `closeDate` a `LocalDate` and validate it. -->

<!-- ### 4. `status` fields are raw strings with no enum / constraint
- `Loan.status` (values like `"active"`/`"closed"` compared case-insensitively in places, `"Active"` in others), `CustomOrder.status`.
- **Why:** `ExportService` filters `"Active".equalsIgnoreCase(status)` while `LoanRepository.countActiveLoans()` uses `LOWER(status)='active'` — but `LoanService.saveLoan` sets `"active"` only when blank. A value like `"Active "` or `"ACTIVE"` silently breaks counts.
- **Recommendation:** Introduce a `LoanStatus { ACTIVE, CLOSED }` and `OrderStatus` enum (`@Enumerated(EnumType.STRING)`), or at minimum a DB `CHECK` constraint + normalize on write. -->

<!-- ### 5. `Rates.inr` is primitive `double` embedded in two entities
- `Rates` (`@Embeddable`) is shared by `Goldrates` and `Silver`, storing a single `inr` value as `double`, timestamp stored as `String`.
- **Why:** `timestamp` as `String` (ISO via `LocalDateTime.now().toString()`) prevents proper DB ordering/type safety (the "latest rate" native query `ORDER BY timestamp DESC` relies on lexicographic string ordering — works only by accident of ISO format).
- **Recommendation:** `timestamp` → `LocalDateTime`; `inr` → `BigDecimal`. -->

### 6. No DTO layer — JPA entities are the API contract
- Controllers bind directly to `Product`, `Sales`, `Loan`, `CustomOrder` (`@RequestBody`), and return entities. The `SalesController.createSales` and `LoanController` endpoints accept raw `Map<String,Object>` and cast by hand.
- **Why:** Mass-assignment risk (client can set `id`, `version`, computed totals), no input validation, fragile casts (`(Number) item.get("pricePerPiece")` → NPE/`ClassCastException` on bad input), and tight coupling of DB schema to API.
- **Recommendation:** Add request/response DTOs + Bean Validation (`@NotNull`, `@Positive`, `@Size`) and a mapper.

---

<!-- ## [Files]

This report itself creates/updates only one file: `implementation_plan.md` (this document). No source files are modified. Below is the inventory of files analyzed and the issues mapped to each.

### Files analyzed — Inventory module
- `inventory/model/Product.java` — money as `Double`; no validation annotations; `sku` not unique.
- `inventory/model/Goldrates.java`, `inventory/model/Silver.java`, `inventory/model/Rates.java` — `timestamp` as `String`, rate as primitive `double`.
- `inventory/repository/ProductRepository.java` — `getTotalvalue()` / `calculateTotalItemsInStock()` return types can be null-prone (`Integer` sum); `searchProducts` has no null guard; `findBySkuForUpdate` pessimistic lock OK but no timeout.
- `inventory/repository/GoldRateRepository.java`, `SilverRateRepository.java` — native `ORDER BY timestamp DESC LIMIT 1` on a string column (fragile); table name `Silver`/`goldrates` case-sensitivity on Postgres.
- `inventory/service/ProductService.java` — `updateProduct` does full overwrite incl. `stockQuantity` (clobbers concurrent sale deductions); `getTotalItems()` may NPE; field `GoldRateRepository` mis-cased (type name used as field name).
- `inventory/service/GoldRateService.java`, `SilverRateService.java` — API key from props but **also committed in `application.properties`**; raw `System.out.println` logging; `@Scheduled(cron="0 0 11 * * ?")` comment says "hourly" but cron = once daily at 11:00; no retry/backoff; swallows exceptions silently; `RestTemplate` field unused (creates its own `new RestTemplate()` ignoring the bean); blocking fetch in `@PostConstruct` delays startup and can crash boot if API down.
- `inventory/controller/ProductController.java` — returns `200 OK` on create (should be `201`); no validation; `deleteProduct` no existence check (silent no-op / 500 on FK).
- `inventory/controller/DashboardController.java` — **Critical bug:** `stats.put("totalInventoryValue", Math.round(SilverRatePerGram))` puts the *silver rate* into `totalInventoryValue` instead of `productService.getTotalvalue()`; `inventoryChangePercent` hardcoded `0.0`; commented-out constructor left in.
- `inventory/controller/GoldRateController.java`, `SilverRateController.java` — `update` endpoints don't validate `rate` presence (NPE on missing key); `silverrateservice` field is `public`; async fire-and-forget with no error surface.

### Files analyzed — Sales module
- `sales/model/Sales.java` — `itemCount` is `@Transient` with manual getters overriding Lombok (dead duplication); `@Size` on `customerPhoneNo` never triggers (no `@Valid`); money as `Double`.
- `sales/model/Saleitem.java` — `getSaleId()` `@Transient` getter is fine but no validation on `quantity/pricePerPiece` (negatives allowed at DB level).
- `sales/repository/SalesRepository.java` — `MONTH(s.saleDate)` JPQL is DB-specific; revenue queries include no status filter (cancelled/refunded would still count, if such a concept existed).
- `sales/repository/SaleItemRepository.java` — OK; `findMaterialTotalsBetween` joins through `sale.saleDate`.
- `sales/service/SalesService.java` — **Critical:** `createsales()` saves `Sales` first (orphan row if items list is empty); negative-quantity check `product.getStockQuantity() < quantity || quantity < 0` allows `quantity == 0` and the negative branch is unreachable after the first condition ordering; no `@Valid`; GST hardcoded `0.03`; `pricePerPiece` taken from client (price tampering risk) instead of DB product price; double `saleRepository.save()`; `getMonthlyRevenue`/`getWeeklySales`/`getSalesByMaterial` compute in Java instead of letting DB aggregate fully (fine for volume but note `Math.round` hides paise).
- `sales/controller/SalesController.java` — **High:** `createSales` casts raw map entries with no validation → `NullPointerException`/`ClassCastException` on malformed payload; no `@Valid`; negative `limit` guarded but `limit=0` returns empty 200 (inconsistent with the 400 for out-of-range).

### Files analyzed — Loan module
- `loan/model/Loan.java` — `@Data` + redundant `@Setter`; `closeDate` is `String`; `status` free string; `@Version` field named `Version` (capital → getter `getVersion` mismatch risk); money as `Double`.
- `loan/model/InterestPayment.java` — `customer_name`/`address` denormalized onto each payment (data duplication, can drift from `Loan`); field `customer_name` uses snake_case in Java (convention break); money as `Double`.
- `loan/repository/LoanRepository.java` — `countActiveLoans` uses `LOWER(status)='active'` but `saveLoan` only defaults when blank (case/whitespace drift).
- `loan/repository/InterestPaymentRepository.java` — fine.
- `loan/service/LoanService.java` — **Critical business-logic flaws:**
  - `recordInterestPayment` mutates `loan.loanAmount` to "newBalance" computed as `totalWithInterest - amountPaid` — this **conflates principal with accrued interest**, permanently rewriting the principal. The next calculation then compounds on the inflated/deflated amount. Conceptually the outstanding principal and the interest ledger are mixed into one column.
  - `closeLoan` has no transaction, no validation that `settlementAmount` covers computed settlement, and lets you close an already-closed loan (no status guard) — and `recordInterestPayment` guards on closed but `closeLoan` doesn't guard on re-close.
  - `calculateInterestData` uses a 30/360 day-count with year-by-year **simple** multiplication loop (`amount*(1+rate*12)` per year) then a fractional-month simple add — this is **neither proper compound nor proper simple** interest; mixed model produces wrong totals for multi-year loans.
  - `MONTHLY_INTEREST_RATE = 0.02` hardcoded default vs `2.0` default in controller — inconsistent sources of truth.
  - `saveLoan` doesn't validate `loanAmount > 0`.
- `loan/controller/LoanController.java` — `System.out.println("DATA RECEIVED FROM REACT: ...")` debug logging leaks PII/financial data to logs; `payInterest` defaults rate to `2.0` (magic number duplicating service constant); no validation; `closeLoan` reads map without null checks.

### Files analyzed — Custom Order module
- `custom_order/model/CustomOrder.java` — `advanceAmount`/`totalAmount` are `String`; `linkedSaleId` is `String` (should be FK to `Sales`); no status enum; `orderDate`/`pickupDate` have no default/`@PrePersist`.
- `custom_order/repository/CustomOrderRepository.java` — `findByIdForUpdate` OK.
- `custom_order/service/CustomOrderService.java` — **High:** `getCustomOrderById` uses `.get()` on Optional → `NoSuchElementException` (500) instead of 404; `updateCustomOrder` overwrites only some fields (partial update semantics unclear) and never touches `customerName/phone/address/totalAmount/orderDate/pickupDate`; `deleteCustomOrder` returns `null` (dead return) and no existence check; `saveCustomOrder` no validation (negative amounts as strings, missing dates).
- `custom_order/controller/CustomOrderController.java` — **High:** `getById` (`/get-all-ordedrd/{id}` — typo in path) fetches **all** orders then linear-searches in Java instead of `findById` (O(n), loads whole table); `System.out.println` debug leak; inconsistent REST naming (`/create-new-order`, `/get-all-orders` vs. RESTful plural).

### Files analyzed — Cross-cutting
- `Exception/Controller/GlobalExceptionClass.java` — no handler for `MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `NoSuchElementException`, `IllegalArgumentException`, or generic `Exception` → many errors surface as default 500 HTML/whitelabel with no consistent `ErrorMessage`; `ItemNotFountException` maps to 404 but `CustomOrderNotFoundException` has **no handler at all** (falls through to 500); `System.out.println(em)` instead of logger.
- `Exception/Custom_Exception/ItemNotFountException.java` — class name typo ("Fount"); should be `ItemNotFoundException`.
- `Exception/Custom_Exception/NoDataSaved.java`, `BackendNotResponding.java` — extend checked `Exception` but are never thrown anywhere (dead code) — and checked exceptions don't fit the runtime flow used.
- `Exception/model/ErrorMessage.java` — fine, but `timeStamp` naming; no `status`/`path` fields.
- `config/CorsConfig.java` — `allowedOrigins("http://localhost:5173")` hardcoded (no env profile); defines a `RestTemplate` bean that `GoldRateService`/`SilverRateService` ignore; defines a plain `ObjectMapper` bean that can conflict with Spring's configured one / `JacksonConfig`.
- `config/JacksonConfig.java` — duplicates what `application.properties` already sets (`write-dates-as-timestamps=false`), redundant with the per-field `@JsonFormat`/serializers on entities (triple redundancy).
- `Exportdata/service/ExportService.java` — loads **entire tables** into memory (`findAll()` × many) to build Excel — OOM risk at scale, no streaming (SXSSF) or pagination; `writeSummarySheet` recomputes aggregates in Java instead of DB; no transaction/read-only isolation; file name `KK.J<date>.xlsx` hardcoded brand string.
- `Exportdata/controller/ExportController.java` — no auth; synchronous large export can block threads.
- `MainApplication.java` — `@EnableScheduling` present (needed by rate fetchers) — OK.
- `Main/resources/application.properties` — **Critical security:** DB password (`atharv`) and `goldapi.key` committed in plaintext; `spring.jpa.show-sql=true` left on (verbose, leaks data in logs); `ddl-auto=update` in what may be a shared/prod DB (risky); no connection-pool tuning. -->

---

## [Functions]

No functions are modified by this report. Below are the specific function-level defects to be fixed in a future remediation pass.

### Critical / High
- Also `inventoryChangePercent` hardcoded `0.0`.
 `LoanService.recordInterestPayment(...)` — rewrites `loan.loanAmount` to `totalWithInterest - amountPaid`, mixing principal and interest; subsequent interest compounds on corrupted principal. Needs a separate `outstandingPrincipal` + interest-ledger model. < But i already have a Intestpayment Model that recoreds the intrest payed wiht refrence to id >
<!-- - `LoanService.calculateInterestData(...)` — hybrid 30/360 + per-year loop is mathematically inconsistent; define one convention (simple or compound, 30/360) and implement it uniformly.
- `LoanService.closeLoan(...)` — not `@Transactional`; no guard against closing an already-closed loan; no check that settlement ≥ computed amount.
- `SalesService.createsales(...)` — persists `Sales` header before validating items (empty `items` → orphan row); trusts client `pricePerPiece` (tampering); unreachable negative-quantity branch; `quantity==0` allowed.
- `CustomOrderService.getCustomOrderById(...)` — `Optional.get()` → 500 on missing id; should throw `CustomOrderNotFoundException`.
- `CustomOrderController.getById(...)` — loads all rows and loops in Java; fix to `findById`; path typo `/get-all-ordedrd/{id}`.
- `GlobalExceptionClass` — add handlers: `CustomOrderNotFoundException`→404, `MethodArgumentNotValidException`→400, `HttpMessageNotReadableException`→400, `IllegalArgumentException`→400, `NoSuchElementException`→404, generic `Exception`→500 (consistent `ErrorMessage`). --> -->

### Medium
- `ProductService.updateProduct(...)` — full-field overwrite incl. `stockQuantity`; should not allow stock to be set here (or must use locking/delta) to avoid clobbering sale deductions.
- `ProductService.getTotalItems()` — `Integer` sum from `calculateTotalItemsInStock()` can be null; guard like `getTotalvalue()`.
- `SalesController.createSales(...)` — replace `Map<String,Object>` casting with a `CreateSaleRequest` DTO + `@Valid`.
- `LoanController.payInterest(...)` / `createLoan(...)` / `closeLoan(...)` — replace map payload with DTOs; remove `System.out.println` PII logging; move `2.0` default to a single constant.
- `GoldRateService.fetchAndSaveGoldRate()` / `SilverRateService.fetchAndSaveSilverRate()` — don't run blocking fetch in `@PostConstruct`; add retry/backoff; use injected `RestTemplate` bean; replace `System.out` with SLF4J; align cron with intent (comment says hourly, cron is daily).
- `ExportService.exportToExcel(...)` — switch to streaming `SXSSFWorkbook`, paginate `findAll()`, compute aggregates via DB queries, mark read-only transaction.

<!-- ### Low
- Rename `ItemNotFountException` → `ItemNotFoundException`.
- Remove dead exceptions `NoDataSaved`, `BackendNotResponding` (or wire them in properly).
- Remove `Sales.itemCount` manual getters (Lombok `@Data` already generates them) or drop `@Transient` duplication.
- Remove commented constructor in `DashboardController`.
- Make `SilverRateController.silverrateservice` private.
- Fix `Loan.Version` field casing → `version`. -->

---

## [Classes]

No classes are modified by this report. Recommended class-level changes for a future pass.

### New classes (recommended)
- `dto/CreateSaleRequest.java`, `dto/SaleItemRequest.java` — typed sale creation payload with validation.
- `dto/CloseLoanRequest.java`, `dto/PayInterestRequest.java`, `dto/CreateLoanRequest.java` — replace `Map` payloads.
- `dto/CustomOrderRequest.java`, `dto/UpdateCustomOrderRequest.java` — typed order payloads.
- `LoanStatus.java` (enum `ACTIVE`,`CLOSED`), `OrderStatus.java` (enum) — replace magic strings.
- `exception/LoanNotFoundException.java`, `exception/ProductNotFoundException.java` — specific 404s instead of `RuntimeException`.

### Modified classes (recommended)
- `Product`, `Sales`, `Saleitem`, `Loan`, `InterestPayment`, `CustomOrder`, `Rates` — migrate money/weight to `BigDecimal`; add Bean Validation; fix `closeDate`→`LocalDate`; `CustomOrder` amounts→`BigDecimal`; add `sku` unique constraint; add `status` enums; normalize `Rates.timestamp`→`LocalDateTime`.
- `Loan` — split `loanAmount` into `principal` + `outstandingPrincipal`; keep interest separate.
- `GlobalExceptionClass` — broaden handler coverage; use a logger.
- `SalesService`, `LoanService`, `CustomOrderService`, `ProductService` — add transactions/validation/locking per the function list above.
<!-- 
### Removed / relocated
- None deleted outright; `NoDataSaved`/`BackendNotResponding` deprecated unless wired in. -->

---

## [Dependencies]

No dependency changes are made by this report. Recommended for remediation.

- **No new dependencies strictly required** for most fixes (Bean Validation already present via `spring-boot-starter-validation`).
- Consider adding **MapStruct** (`org.mapstruct:mapstruct`) for Entity↔DTO mapping to reduce boilerplate.
- Consider **Flyway** or **Liquibase** to replace `ddl-auto=update` with versioned migrations (important because changing `Double`→`BigDecimal`, `closeDate` String→date, and `CustomOrder` amounts String→numeric are **schema migrations** on a live Postgres DB).
- Consider **spring-boot-starter-security** before exposing export/mutation endpoints beyond localhost.
- Apache POI already present; for large exports consider using `SXSSFWorkbook` (built into POI, no new dep).

---

## [Testing]

This report proposes no tests yet (analysis only). Recommended validation strategy for the remediation pass.

- **Unit tests (JUnit 5 + Mockito, already on classpath via `spring-boot-starter-test`):**
  - `LoanService.calculateInterestData` — table-driven tests for known principal/rate/date ranges (single convention), boundary (same-day, 31st, leap years, multi-year).
  - `SalesService.createsales` — empty items, zero qty, insufficient stock, price tampering rejected, subtotal/GST correctness with `BigDecimal`.
  - `CustomOrderService` — get-by-id 404 path, update partial fields.
- **Repository/Data tests (`@DataJpaTest` + H2 or Testcontainers-Postgres):** unique `sku`, status enum persistence, `closeDate` date type, aggregate queries (`findMonthlyRevenueBetween`, `getTotalvalue`).
- **API slice tests (`@WebMvcTest`):** DTO validation (400 on bad payload), exception handler mappings (404/400/500 shapes), `DashboardController` returns real `totalInventoryValue`.
- **Integration test:** full sale creation decrements stock atomically (concurrency test for the pessimistic lock), loan close + interest flow end-to-end.
- **Migration test:** Flyway migration from old→new schema verified against a copy of the prod schema.

---

## [Implementation Order]

This report recommends the following sequence for the (separate) remediation effort — ordered to fix data-corrupting and security bugs first, then integrity, then design, each step independently shippable.

1. **Stop the bleeding — correctness & security (no schema change).**
   - Fix `DashboardController` `totalInventoryValue` bug.
   - Add missing exception handlers (`CustomOrderNotFoundException`, validation, generic) so errors stop surfacing as 500s.
   - Fix `CustomOrderService.getCustomOrderById` (`.get()`→404) and `CustomOrderController.getById` (use `findById`, fix path typo).
   - Remove `System.out.println` PII/financial logging; move secrets (DB password, `goldapi.key`) out of `application.properties` into env vars; set `show-sql=false`.
2. **Loan business-logic correctness.** Split principal vs. interest; make `closeLoan` transactional + guarded; define & implement a single interest convention; add `LoanStatus` enum and normalize status writes; add `LoanNotFoundException`.
3. **Sales integrity.** Introduce `CreateSaleRequest` DTO + validation; validate items before persisting header; take price from DB not client; reject zero/negative qty properly; keep the pessimistic lock; make GST configurable.
4. **Schema migrations (with Flyway).** Money→`BigDecimal`; `closeDate`→date; `CustomOrder` amounts→numeric; `sku` unique; `Rates.timestamp`→timestamp; status enums/CHECK constraints. Add `update`/migration scripts and backfill.
5. **Product/custom-order validation & locking.** Prevent `updateProduct` from clobbering stock; validate custom-order amounts/dates; `OrderStatus` enum; link `linkedSaleId` as a real FK.
6. **Design & maintainability.** Introduce DTO/MapStruct layer across all controllers; remove dead exceptions and redundant Jackson config; fix naming/typos; replace `System.out` with SLF4J everywhere; align rate-fetch cron with intent and add retry/backoff; don't block startup in `@PostConstruct`.
7. **Scale & hardening.** Streaming Excel export + DB-side aggregates; externalize CORS origins; add connection-pool settings; (optional) add Spring Security; add the test suite described in [Testing].
