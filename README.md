
# Jewellers — Inventory & Loan Management System

A full-stack shop management system . Built with Spring Boot (Java) on the backend and React + TypeScript on the frontend.

---

## Tech Stack

**Backend**
- Java 21, Spring Boot 3.5
- Spring Data JPA + Hibernate
- PostgreSQL
- Lombok
- Jackson (with JSR310 for LocalDate)

**Frontend**
- React 18 + TypeScript
- TanStack Router (file-based routing)
- TanStack Query (server state)
- Tailwind CSS
- Axios
- Sonner (toasts)
- Lucide React (icons)

---

## Features

### Dashboard
- Live gold rate (fetched from GoldAPI, MCX-adjusted)
- Live silver rate
- Total items in stock
- Active loans count
- Low stock alerts

### Inventory Management
- Add, edit, delete products
- Categories: Rings, Necklaces, Bangles, Earrings, Chains, Anklets, Bracelets, Maang Tikka, Nose Pins, Coins & Bars, Jewellery Sets
- Auto-calculates price from live gold/silver rate × weight × purity + making charge
- Supports Gold (18K / 22K / 24K) and Silver
- Stock quantity tracking with low stock warnings
- Product drawer with full details

### Loan Ledger
- Issue new loans with customer details, collateral description, metal type, weight
- 2% monthly compound interest calculation
- Interest payments — reduces outstanding principal, records payment history
- Settle loans with agreed amount on a chosen close date
- Filter by All / Active / Closed

### Sales
- New sale with multiple items (Gold + Silver) in one bill
- Add items by SKU with autocomplete suggestions
- Adjustable quantity per item with stock validation
- Auto-calculates subtotal + GST @ 3%
- Printable GST receipt with customer details, itemised list, and shop footer
- Sales ledger showing all past transactions
- Stock auto-reduces on sale confirmation

---

## Project Structure

### Backend — `inventory-backend/`

```text
inventory-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── ems/
│   │   │           ├── config/
│   │   │           │   ├── CorsConfig.java
│   │   │           │   └── JacksonConfig.java
│   │   │           ├── inventory/
│   │   │           │   ├── controller/
│   │   │           │   │   ├── DashboardController.java
│   │   │           │   │   ├── GoldRateController.java
│   │   │           │   │   └── ProductController.java
│   │   │           │   ├── model/
│   │   │           │   │   ├── Goldrates.java
│   │   │           │   │   ├── Product.java
│   │   │           │   │   ├── Rates.java
│   │   │           │   │   └── Silver.java
│   │   │           │   ├── repository/
│   │   │           │   │   ├── GoldRateRepository.java
│   │   │           │   │   ├── InterestPaymentRepository.java
│   │   │           │   │   ├── ProductRepository.java
│   │   │           │   │   └── SilverRateRepository.java
│   │   │           │   └── service/
│   │   │           │       ├── GoldRateService.java
│   │   │           │       ├── ProductService.java
│   │   │           │       └── SilverRateService.java
│   │   │           ├── loan/
│   │   │           │   ├── controller/
│   │   │           │   │   └── LoanController.java
│   │   │           │   ├── model/
│   │   │           │   │   ├── InterestPayment.java
│   │   │           │   │   └── Loan.java
│   │   │           │   ├── repository/
│   │   │           │   │   └── LoanRepository.java
│   │   │           │   └── service/
│   │   │           │       └── LoanService.java
│   │   │           ├── sales/
│   │   │           │   ├── controller/
│   │   │           │   │   └── SalesController.java
│   │   │           │   ├── model/
│   │   │           │   │   ├── Saleitem.java
│   │   │           │   │   └── Sales.java
│   │   │           │   ├── repository/
│   │   │           │   │   ├── SaleItemRepository.java
│   │   │           │   │   └── SalesRepository.java
│   │   │           │   └── service/
│   │   │           │       └── SalesService.java
│   │   │           └── MainApplication.java
│   │   └── resources/
│   │       ├── static/
│   │       ├── templates/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/
│               └── ems/
│                   └── inventory/
├── target/
├── HELP.md
├── mvnw
├── mvnw.cmd
└── pom.xml

```

### Frontend — `inventory-frontend/`

```text
src/
├── components/
│   ├── dashboard/
│   │   ├── AddProductModal.tsx      # Add/edit product with live price calc
│   │   ├── DashboardShell.tsx       # Main layout + view router
│   │   ├── InventoryView.tsx        # Product grid with search/filter
│   │   ├── LoanIssueForm.tsx        # New loan form
│   │   ├── LoanLedger.tsx           # Loans table + settle + interest dialogs
│   │   ├── ProductDrawer.tsx        # Product detail slide-over
│   │   ├── SalesLedger.tsx          # Sales table + new sale modal + receipt
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   └── TopStats.tsx             # Dashboard stat cards
│   └── ui/                          # shadcn/ui component library
├── lib/
│   ├── api/
│   │   ├── client.ts                # Axios instance + interceptors
│   │   ├── dashboard.ts             # Dashboard stats + gold rate fetch
│   │   ├── inventory.ts             # Product CRUD
│   │   ├── loans.ts                 # Loan + interest payment API
│   │   ├── query-keys.ts            # TanStack Query key constants
│   │   └── sales.ts                 # Sales API
│   └── utils.ts                     # formatINR, calculateLoanSettlement, etc.
└── routes/
    ├── __root.tsx                   # App shell with QueryClientProvider
    └── index.tsx                    # Root route → DashboardShell

```

---

## Database Tables

| Table | Description |
| --- | --- |
| `product` | Inventory items with SKU, weight, purity, stock, price |
| `loan` | Customer loans with collateral, amount, status |
| `interest_payment` | Interest payments per loan (FK → loan) |
| `sales` | Sale header — customer info, totals, GST |
| `sale_item` | Line items per sale (FK → sales) |
| `goldrates` | Gold rate snapshots (per 10g, MCX-adjusted) |
| `silver` | Silver rate snapshots (per gram) |

---

## Getting Started

### Prerequisites

* Java 21+
* Node.js 18+ or Bun
* PostgreSQL running locally

### Backend Setup

1. Configure `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/Shop
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.mapper.require-handlers-for-java8-times=false

```

2. Run the application:

```bash
cd inventory-backend
./mvnw spring-boot:run

```

Backend starts on `http://localhost:8080`

### Frontend Setup

1. Install dependencies:

```bash
cd inventory-frontend
npm install

```

2. Start the dev server:

```bash
npm run dev

```

Frontend starts on `http://localhost:5173` and proxies `/api/*` to `:8080`.

---

## API Endpoints

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/dashboard/stats` | Gold rate, silver rate, stock count, active loans |

### Gold & Silver Rates

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/gold-rate/latest` | Latest gold rate |
| GET | `/api/gold-rate/fetch-now` | Manually trigger gold rate fetch |
| GET | `/api/silver-rate/latest` | Latest silver rate |

### Inventory

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/inventory/products` | All products (filterable by category) |
| POST | `/api/inventory/products` | Add new product |
| PUT | `/api/inventory/products/{id}` | Update product |
| DELETE | `/api/inventory/products/{id}` | Delete product |

### Loans

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/loans` | All loans |
| POST | `/api/loans` | Issue new loan |
| PATCH | `/api/loans/{id}/close` | Settle a loan |
| POST | `/api/loans/{id}/pay-interest` | Record interest payment |
| GET | `/api/loans/{id}/interest-payments` | Payment history for a loan |

### Sales

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/sales` | All sales |
| POST | `/api/sales` | Create new sale (reduces stock) |
| GET | `/api/sales/{id}/items` | Line items for a sale (for receipt) |

---

## Sample Business Logic (Can be changed)

### Price Calculation (Inventory)

```text
Gold price  = (live rate per 10g ÷ 10) × weight × purity factor × (1 + making charge %)
Silver price = live rate per gram × weight × (1 + making charge %)

Purity factors: 24K = 1.0, 22K = 0.9167, 18K = 0.75
Making charge:  Gold = 12%, Silver = 8%

```

### Loan Interest

```text
Monthly compound interest = 2% per month
Settlement amount = principal × (1 + 0.02)^months

Interest payments reduce the outstanding principal directly.
Final settlement is calculated on the reduced balance.

```

### GST on Sales

```text
GST rate = 3% (standard for gold/silver jewellery in India)
Grand total = subtotal + (subtotal × 0.03)

```

---

## Known Setup Notes

* Gold rate is fetched from [GoldAPI.io](https://www.goldapi.io) on server startup and every hour. A multiplier of `1.18` is applied to approximate MCX market price.
* The `jackson-datatype-jsr310` dependency is required for `LocalDate` serialization. Ensure `write-dates-as-timestamps=false` is set in `application.properties`.
* New loans always default to `"active"` status via `LoanService.saveLoan()`. If migrating from an older version of this codebase, run `UPDATE loan SET status = 'active' WHERE status IS NULL` once.

---

## License

Private — K.K Jewellers internal use only.

```

```
