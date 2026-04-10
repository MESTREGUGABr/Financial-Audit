import { setIcon } from "obsidian";
import { Transaction } from "../types";

export interface TransactionTableCallbacks {
	onEdit: (index: number, transaction: Transaction) => void;
	onDelete: (index: number) => void;
}

export class TransactionTableRenderer {
	constructor(
		private container: HTMLElement,
		private transactions: Transaction[],
		private currency: string,
		private callbacks: TransactionTableCallbacks
	) {}

	render(): void {
		this.container.empty();

		if (this.transactions.length === 0) {
			const empty = this.container.createDiv({ cls: "fa-empty-state" });
			empty.createEl("p", {
				text: "No transactions yet. Add one to get started!",
			});
			return;
		}

		const table = this.container.createEl("table", { cls: "fa-transaction-table" });

		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		["Date", "Description", "Category", "Source", "Amount", ""].forEach(
			(text) => headerRow.createEl("th", { text })
		);

		const tbody = table.createEl("tbody");
		for (let i = 0; i < this.transactions.length; i++) {
			this.renderRow(tbody, this.transactions[i], i);
		}
	}

	private renderRow(tbody: HTMLElement, t: Transaction, index: number): void {
		const rowCls = t.type === "income"
			? "fa-transaction-row fa-row-income"
			: "fa-transaction-row fa-row-expense";
		const row = tbody.createEl("tr", { cls: rowCls });

		row.createEl("td", { text: t.date, cls: "fa-date" });
		row.createEl("td", { text: t.description, cls: "fa-description" });
		row.createEl("td", { text: t.category, cls: "fa-category" });
		row.createEl("td", { text: t.source, cls: "fa-source" });

		const amountText = t.type === "income"
			? `+${this.currency} ${this.formatAmount(t.amount)}`
			: `-${this.currency} ${this.formatAmount(t.amount)}`;
		const amountCls = t.type === "income" ? "fa-amount-income" : "fa-amount-expense";
		row.createEl("td", { text: amountText, cls: amountCls });

		// Actions
		const actionsCell = row.createEl("td", { cls: "fa-actions" });

		const editBtn = actionsCell.createEl("button", {
			cls: "fa-icon-btn",
			attr: { "aria-label": "Edit transaction" },
		});
		setIcon(editBtn, "pencil");
		editBtn.addEventListener("click", () => {
			this.callbacks.onEdit(index, t);
		});

		const deleteBtn = actionsCell.createEl("button", {
			cls: "fa-icon-btn fa-delete-btn",
			attr: { "aria-label": "Delete transaction" },
		});
		setIcon(deleteBtn, "trash-2");
		deleteBtn.addEventListener("click", () => {
			this.callbacks.onDelete(index);
		});
	}

	private formatAmount(value: number): string {
		return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
}
