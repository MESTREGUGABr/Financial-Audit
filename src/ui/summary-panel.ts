import { MonthEntry } from "../types";

const PIE_COLORS = [
	"#4caf50", "#2196f3", "#ff9800", "#9c27b0",
	"#00bcd4", "#e91e63", "#8bc34a", "#ff5722",
	"#3f51b5", "#cddc39", "#795548", "#607d8b",
];

export class SummaryPanelRenderer {
	constructor(
		private container: HTMLElement,
		private month: MonthEntry,
		private currency: string
	) {}

	render(): void {
		this.container.empty();

		const wrapper = this.container.createDiv({ cls: "fa-summary" });

		// Balance cards
		const cards = wrapper.createDiv({ cls: "fa-summary-cards" });

		this.renderCard(cards, "Income", this.month.totalIncome, "fa-card-income");
		this.renderCard(cards, "Expenses", this.month.totalExpenses, "fa-card-expense");
		this.renderCard(cards, "Balance", this.month.balance,
			this.month.balance >= 0 ? "fa-card-positive" : "fa-card-negative"
		);

		// Pie charts
		const incomeByCategory = this.buildCategoryTotals("income");
		const expenseByCategory = this.buildCategoryTotals("expense");

		if (incomeByCategory.length > 0 || expenseByCategory.length > 0) {
			const chartsRow = wrapper.createDiv({ cls: "fa-charts-row" });

			if (incomeByCategory.length > 0) {
				this.renderPieChart(chartsRow, "Income", incomeByCategory);
			}
			if (expenseByCategory.length > 0) {
				this.renderPieChart(chartsRow, "Expenses", expenseByCategory);
			}
		}

		// Category breakdown
		const categoryMap = this.buildBreakdown("category");
		if (categoryMap.size > 0) {
			this.renderBreakdownTable(wrapper, "By category", categoryMap);
		}

		// Source breakdown
		const sourceMap = this.buildBreakdown("source");
		if (sourceMap.size > 0) {
			this.renderBreakdownTable(wrapper, "By source", sourceMap);
		}
	}

	private renderCard(
		parent: HTMLElement,
		label: string,
		amount: number,
		cls: string
	): void {
		const card = parent.createDiv({ cls: `fa-card ${cls}` });
		card.createDiv({ text: label, cls: "fa-card-label" });
		card.createDiv({
			text: `${this.currency} ${this.formatAmount(amount)}`,
			cls: "fa-card-value",
		});
	}

	private buildBreakdown(
		field: "category" | "source"
	): Map<string, { income: number; expense: number }> {
		const map = new Map<string, { income: number; expense: number }>();

		for (const t of this.month.frontmatter.transactions) {
			const key = t[field] || "Uncategorized";
			const entry = map.get(key) ?? { income: 0, expense: 0 };
			if (t.type === "income") {
				entry.income += t.amount;
			} else {
				entry.expense += t.amount;
			}
			map.set(key, entry);
		}

		return map;
	}

	private renderBreakdownTable(
		parent: HTMLElement,
		title: string,
		data: Map<string, { income: number; expense: number }>
	): void {
		const section = parent.createDiv({ cls: "fa-breakdown" });
		section.createEl("h4", { text: title, cls: "fa-breakdown-title" });

		const table = section.createEl("table", { cls: "fa-breakdown-table" });
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		["Name", "Income", "Expenses", "Net"].forEach((text) =>
			headerRow.createEl("th", { text })
		);

		const tbody = table.createEl("tbody");
		for (const [name, values] of data) {
			const row = tbody.createEl("tr");
			row.createEl("td", { text: name });
			row.createEl("td", {
				text: `${this.currency} ${this.formatAmount(values.income)}`,
				cls: "fa-amount-income",
			});
			row.createEl("td", {
				text: `${this.currency} ${this.formatAmount(values.expense)}`,
				cls: "fa-amount-expense",
			});
			const net = values.income - values.expense;
			row.createEl("td", {
				text: `${this.currency} ${this.formatAmount(net)}`,
				cls: net >= 0 ? "fa-amount-positive" : "fa-amount-negative",
			});
		}
	}

	private buildCategoryTotals(
		type: "income" | "expense"
	): { name: string; amount: number }[] {
		const map = new Map<string, number>();
		for (const t of this.month.frontmatter.transactions) {
			if (t.type !== type) continue;
			const key = t.category || "Uncategorized";
			map.set(key, (map.get(key) ?? 0) + t.amount);
		}
		return Array.from(map.entries())
			.map(([name, amount]) => ({ name, amount }))
			.sort((a, b) => b.amount - a.amount);
	}

	private renderPieChart(
		parent: HTMLElement,
		title: string,
		slices: { name: string; amount: number }[]
	): void {
		const total = slices.reduce((sum, s) => sum + s.amount, 0);
		if (total === 0) return;

		const chartContainer = parent.createDiv({ cls: "fa-pie-container" });
		chartContainer.createEl("h4", { text: title, cls: "fa-pie-title" });

		const size = 140;
		const cx = size / 2;
		const cy = size / 2;
		const radius = 55;

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", size.toString());
		svg.setAttribute("height", size.toString());
		svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
		svg.classList.add("fa-pie-svg");

		let startAngle = -Math.PI / 2;

		for (let i = 0; i < slices.length; i++) {
			const slice = slices[i];
			const sliceAngle = (slice.amount / total) * 2 * Math.PI;
			const endAngle = startAngle + sliceAngle;

			const x1 = cx + radius * Math.cos(startAngle);
			const y1 = cy + radius * Math.sin(startAngle);
			const x2 = cx + radius * Math.cos(endAngle);
			const y2 = cy + radius * Math.sin(endAngle);
			const largeArc = sliceAngle > Math.PI ? 1 : 0;

			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			const d = slices.length === 1
				? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
				: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
			path.setAttribute("d", d);
			path.setAttribute("fill", PIE_COLORS[i % PIE_COLORS.length]);
			svg.appendChild(path);

			startAngle = endAngle;
		}

		chartContainer.appendChild(svg);

		// Legend
		const legend = chartContainer.createDiv({ cls: "fa-pie-legend" });
		for (let i = 0; i < slices.length; i++) {
			const item = legend.createDiv({ cls: "fa-pie-legend-item" });
			const swatch = item.createEl("span", { cls: "fa-pie-swatch" });
			swatch.style.backgroundColor = PIE_COLORS[i % PIE_COLORS.length];
			const pct = ((slices[i].amount / total) * 100).toFixed(1);
			item.createEl("span", {
				text: `${slices[i].name} (${pct}%)`,
				cls: "fa-pie-legend-label",
			});
		}
	}

	private formatAmount(value: number): string {
		return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
}
