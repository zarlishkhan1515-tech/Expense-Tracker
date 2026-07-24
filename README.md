# ApexFinance — Personal Finance Manager & Expense Tracker Dashboard

> A production-quality Personal Finance Manager built **entirely** with pure **HTML5, CSS3, and Vanilla JavaScript (ES6 Modules)**. Zero dependencies, zero frameworks, zero external libraries.

---

## 📸 Overview

ApexFinance is a full-featured financial dashboard allowing users to:
- Track income, expenses, savings and net balance in real-time
- Visualize spending with custom-built SVG charts (no Chart.js)
- Manage transaction history with filtering, sorting, searching, and pagination
- Export/import financial data as JSON backups
- Support Dark and Light theme modes with smooth transitions

---

## ✨ Features

### Core Dashboard
- **Live Summary Cards** — Total Balance, Income, Expenses, Savings, Largest Income/Expense, Daily Avg
- **Monthly Cashflow SVG Bar Chart** — Income vs Expense comparison per month (last 6 months)
- **Category Breakdown SVG Donut Chart** — Expense distribution by category with percentage legend
- **Category Progress Bars** — Animated percentage bars per spending category

### Transaction Management
- Add / Edit / Delete transactions with full form validation
- **Duplicate Transaction** — One-click clone of any transaction
- **View Full Details** — Dedicated details modal showing all transaction metadata
- Each transaction includes: ID, Title, Description, Amount, Category, Date, Payment Method, Type, CreatedAt, UpdatedAt

### Search, Filter & Sort
- **Debounced Live Search** — Searches title and description fields with 300ms debounce
- **Category Filter** — Dropdown by all or specific category
- **Type Filter** — Income / Expense / All
- **Month Filter** — Date picker to restrict by YYYY-MM
- **Multi-column Sorting** — Date (asc/desc), Amount (asc/desc), Title A-Z
- **Reset Filters** — One-click reset to defaults

### Category Manager
- 9 built-in default categories with distinct color coding
- Create custom categories with a color picker
- Delete custom categories (defaults protected)
- Categories sync instantly across all dropdowns

### Import / Export
- **Export JSON** — Download all transactions, categories and settings as a `.json` file
- **Import JSON** — Upload and restore from a backup with schema validation
- **Clear All Data** — Danger zone with confirmation dialog before wiping state

### Dark / Light Theme
- Smooth CSS variable transitions between themes
- Saved in LocalStorage and auto-applied on page load

### Notifications
- Animated toast notifications (success, info, danger, warning) for all actions
- Auto-dismiss with manual close button

### Recently Deleted Bin
- Soft-delete moves transactions to a bin (not permanently erased)
- **Undo Last Delete** — Click "Recently Deleted" in sidebar to instantly restore last deleted item
- Bin count badge updates in real-time

### Bonus Features
- **Keyboard Shortcuts**: `N` (New), `Ctrl+F` (Focus Search), `Esc` (Close Modal), `?` (Shortcuts Menu), `T` (Toggle Theme), `C` (Categories)
- **Drag & Drop** — Drag rows in the transaction table to manually reorder
- **Custom Right-Click Context Menu** — Edit, Duplicate, View Details, or Delete via right-click
- **Loading Screen** — Branded animated loader on initial render
- **Skeleton Loaders** — Shimmer placeholders for chart area before data renders
- **Pagination** — 8 transactions per page with Previous/Next controls
- **Currency Selector** — Switch between USD, EUR, GBP, PKR, INR, CAD (exchange rate simulation)

---

## 📁 Folder Structure

```text
expense-tracker/
│── index.html                  # Semantic HTML5 markup with all UI components
│
├── css/
│   ├── style.css               # Core CSS design system (glassmorphism, tokens, animations)
│   └── responsive.css          # Mobile-first responsive breakpoints
│
├── js/
│   ├── app.js                  # Main App class — state orchestration & event delegation
│   ├── storage.js              # StorageManager — LocalStorage persistence & import/export
│   ├── ui.js                   # UIManager — DOM rendering, modals, toasts, context menus
│   ├── validation.js           # Form validation engine for transactions and categories
│   ├── chart.js                # ChartEngine — Pure SVG donut/bar charts & progress bars
│   └── utils.js                # Utilities — debounce, throttle, format, sanitize, ID generation
│
├── assets/                     # Images and icons (if any)
├── screenshots/                # Project screenshots for documentation
└── README.md                   # This file
```

---

## 🚀 Installation & Running Locally

No build tools or package managers required for the core app.

### Option 1: Static File Server (Recommended for ES6 Modules)

ES6 Modules require a proper HTTP server to work (browsers block file:// for modules).

```bash
# Using npx serve (requires Node.js 18+)
npx -y serve -l 3000
# Then open: http://localhost:3000
```

### Option 2: VS Code Live Server Extension
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option 3: Python HTTP Server
```bash
python -m http.server 3000
# Then open: http://localhost:3000
```

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic markup, accessibility, native form elements |
| **CSS3** | Variables, glassmorphism, flexbox, grid, animations |
| **Vanilla JavaScript (ES6+)** | All application logic |
| **ES6 Modules** | Code organization and encapsulation |
| **Web Storage API** | LocalStorage and SessionStorage |
| **Web Crypto API** | UUID generation (`crypto.randomUUID`) |
| **SVG** | Native chart rendering |
| **HTML5 Drag & Drop API** | Transaction row reordering |
| **Blob / FileReader API** | JSON import and export |
| **Google Fonts (Inter & Outfit)** | Typography |

---

## 🧠 JavaScript Concepts Demonstrated

| Concept | Where Used |
|---|---|
| **DOM Manipulation** | `ui.js` — `renderTransactionsTable`, `updateDashboardCards` |
| **Event Delegation** | `app.js` — Single listener on `tableBody` handles all row actions |
| **Event Bubbling** | Table buttons bubble to parent tbody listener |
| **Closures** | `utils.js` — `debounce()` and `throttle()` return closure functions |
| **Higher-Order Functions** | `debounce`, `throttle` accept and wrap functions |
| **Callback Functions** | `reader.onload`, `setTimeout` callbacks |
| **Arrays** | Transactions stored and processed as arrays |
| **Objects** | Transaction and category data objects |
| **Array Methods** | `.filter()`, `.sort()`, `.find()`, `.findIndex()`, `.map()`, `.forEach()`, `.every()` |
| **Object Methods** | `Object.keys()`, spread, destructuring |
| **Classes** | `App`, `StorageManager`, `UIManager`, `ChartEngine` |
| **ES6 Modules** | All files use `import`/`export` |
| **Template Literals** | HTML rendering in `ui.js` and `chart.js` |
| **Arrow Functions** | Throughout event listeners and array methods |
| **Destructuring** | `const { isValid, errors } = validate(...)`, spread `{...tx}` |
| **Spread Operator** | `[...list]`, `{...tx, id: newId}` |
| **Rest Operator** | `function (...args)` in debounce/throttle |
| **Promises / Async** | `FileReader.onload`, `setTimeout` in animations |
| **try...catch** | `storage.js` — all LocalStorage parsing |
| **Local Storage** | Transactions, categories, theme, currency, bin |
| **Debouncing** | `utils.js` — `debounce(fn, 300ms)` for live search |
| **Throttling** | `utils.js` — `throttle(fn, 200ms)` for resize/scroll |
| **Dynamic Rendering** | Entire dashboard re-renders on each state change |
| **Custom Validation** | `validation.js` — dedicated validation engine |
| **Custom Modal** | All modals built from scratch (no Bootstrap) |

---

## 📊 Statistics Calculated Automatically

- Total Income (all time)
- Total Expense (all time)
- Net Balance (Income − Expense)
- Total Savings (max of 0 and net balance)
- Savings Rate (%)
- Largest Single Income
- Largest Single Expense
- Average Daily Expense (30-day period)

---

## 🔮 Future Improvements

- [ ] Budget Goal Setting per category with over-budget alerts
- [ ] Recurring Transaction Scheduler
- [ ] Export to CSV / Excel format
- [ ] Cloud sync via Firebase Firestore
- [ ] User Authentication with multi-profile support
- [ ] AI-powered spending insights
- [ ] PWA (Progressive Web App) with offline support
- [ ] Bank Statement PDF import and auto-parsing

---

## 📝 License

MIT License — Built as a professional frontend internship assessment project.

---

*Built with ❤️ using pure Vanilla JavaScript, HTML5, and CSS3. No frameworks, no dependencies.*
