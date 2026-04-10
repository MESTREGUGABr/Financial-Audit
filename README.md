# Financial Audit

An Obsidian plugin for tracking personal finances directly inside your vault. Log incomes and expenses, organize them by category and source, and visualize where your money is going with monthly breakdowns and pie charts.

## Features

- **Monthly notes** — Each month gets its own note (e.g., `Finances/2026-04.md`) with all transactions stored in YAML frontmatter
- **Sidebar tracker** — Dedicated panel with month-by-month navigation, accessible from the ribbon icon or command palette
- **Balance summary** — Cards showing total income, total expenses, and net balance at a glance
- **Pie charts** — Visual breakdown of income and expenses by category using SVG charts rendered natively (no external dependencies)
- **Category & source breakdown** — Tables showing totals grouped by category (Food, Transport, etc.) and by source (Nubank, Cash, etc.)
- **Transaction management** — Add, edit, and delete transactions with modals. Each transaction tracks description, amount, type (income/expense), category, source, and date
- **Fully customizable** — Define your own categories and payment sources in plugin settings. No forced defaults
- **Popout window** — Open the tracker in a separate window for side-by-side use
- **Quick add command** — Add a transaction from anywhere using the command palette

## Installation

1. Copy the plugin folder into your vault's `.obsidian/plugins/financial-audit/` directory
2. Enable the plugin in **Settings > Community Plugins**
3. Configure your categories, sources, and currency in **Settings > Financial Audit**

### Build from source

```bash
npm install
npm run build
```

## Usage

1. **Set up categories and sources** — Go to **Settings > Financial Audit** and add your categories (e.g., Food, Transport, Housing, Salary) and sources (e.g., Nubank, Cash, Credit Card)
2. **Open the tracker** — Click the wallet icon in the ribbon or run "Financial Audit: Open tracker" from the command palette
3. **Add transactions** — Click "Add transaction" and fill in the details. The transaction is saved to the current month's note
4. **Navigate months** — Use the arrow buttons to browse previous and future months
5. **Review your finances** — The summary cards, pie charts, and breakdown tables update automatically

## Data format

All data is stored as standard Obsidian markdown notes with YAML frontmatter:

```yaml
---
month: "2026-04"
transactions:
  - description: "Salary"
    amount: 5000.00
    type: "income"
    category: "Salary"
    source: "Company"
    date: "2026-04-05"
  - description: "Groceries"
    amount: 150.00
    type: "expense"
    category: "Food"
    source: "Nubank"
    date: "2026-04-06"
---

## Notes
```

Your data stays in your vault, versioned with git, and fully portable.

## License

[MIT](LICENSE)
