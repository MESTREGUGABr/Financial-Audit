import { ItemView, WorkspaceLeaf, TFile, Modal, Setting, setIcon } from "obsidian";
import { VIEW_TYPE_FINANCE } from "../constants";
import { MonthEntry, Transaction } from "../types";
import { FinanceService } from "../services/finance-service";
import { SummaryPanelRenderer } from "../ui/summary-panel";
import { TransactionTableRenderer } from "../ui/transaction-table";
import { AddTransactionModal } from "../modals/add-transaction-modal";
import { EditTransactionModal } from "../modals/edit-transaction-modal";
import type FinancialAuditPlugin from "../main";

class ConfirmDeleteModal extends Modal {
	constructor(
		app: import("obsidian").App,
		private message: string,
		private onConfirm: () => Promise<void>
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Delete")
					.setWarning()
					.onClick(async () => {
						await this.onConfirm();
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class FinanceView extends ItemView {
	private plugin: FinancialAuditPlugin;
	private financeService: FinanceService;
	private currentMonth: string;
	private monthEntry: MonthEntry | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: FinancialAuditPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.financeService = new FinanceService(plugin.app, plugin.settings);
		this.currentMonth = this.getCurrentYearMonth();
	}

	getViewType(): string {
		return VIEW_TYPE_FINANCE;
	}

	getDisplayText(): string {
		return "Financial Audit";
	}

	getIcon(): string {
		return "wallet";
	}

	async onOpen(): Promise<void> {
		await this.refresh();
	}

	onClose(): Promise<void> {
		this.contentEl.empty();
		return Promise.resolve();
	}

	async refresh(): Promise<void> {
		this.financeService = new FinanceService(this.plugin.app, this.plugin.settings);
		this.monthEntry = await this.financeService.getMonth(this.currentMonth);
		this.render();
	}

	private getCurrentYearMonth(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = (now.getMonth() + 1).toString().padStart(2, "0");
		return `${year}-${month}`;
	}

	private navigateMonth(delta: number): void {
		const [yearStr, monthStr] = this.currentMonth.split("-");
		let year = parseInt(yearStr);
		let month = parseInt(monthStr) + delta;

		if (month > 12) {
			month = 1;
			year++;
		} else if (month < 1) {
			month = 12;
			year--;
		}

		this.currentMonth = `${year}-${month.toString().padStart(2, "0")}`;
		void this.refresh();
	}

	private formatMonthLabel(yearMonth: string): string {
		const [year, month] = yearMonth.split("-");
		const date = new Date(parseInt(year), parseInt(month) - 1);
		return date.toLocaleString("default", { month: "long", year: "numeric" });
	}

	private render(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("fa-container");

		// Toolbar
		const toolbar = container.createDiv({ cls: "fa-toolbar" });

		const navLeft = toolbar.createEl("button", {
			cls: "fa-btn fa-nav-btn",
			attr: { "aria-label": "Previous month" },
		});
		setIcon(navLeft, "chevron-left");
		navLeft.addEventListener("click", () => this.navigateMonth(-1));

		toolbar.createEl("span", {
			text: this.formatMonthLabel(this.currentMonth),
			cls: "fa-month-label",
		});

		const navRight = toolbar.createEl("button", {
			cls: "fa-btn fa-nav-btn",
			attr: { "aria-label": "Next month" },
		});
		setIcon(navRight, "chevron-right");
		navRight.addEventListener("click", () => this.navigateMonth(1));

		const addBtn = toolbar.createEl("button", {
			text: "Add transaction",
			cls: "fa-btn fa-btn-primary",
		});
		setIcon(addBtn, "plus");
		addBtn.prepend(addBtn.querySelector(".svg-icon")!);
		addBtn.addEventListener("click", () => this.openAddModal());

		const popoutBtn = toolbar.createEl("button", {
			cls: "fa-btn",
			attr: { "aria-label": "Open in popout window" },
		});
		setIcon(popoutBtn, "external-link");
		popoutBtn.addEventListener("click", () => {
			void this.plugin.activatePopoutView();
		});

		// Content
		const content = container.createDiv({ cls: "fa-content" });

		if (!this.monthEntry || this.monthEntry.frontmatter.transactions.length === 0) {
			if (!this.monthEntry) {
				const empty = content.createDiv({ cls: "fa-empty-state" });
				empty.createEl("p", {
					text: "No data for this month yet. Add a transaction to get started!",
				});
			} else {
				// Month exists but no transactions
				const summaryContainer = content.createDiv({ cls: "fa-summary-section" });
				new SummaryPanelRenderer(
					summaryContainer,
					this.monthEntry,
					this.plugin.settings.currency
				).render();

				const empty = content.createDiv({ cls: "fa-empty-state" });
				empty.createEl("p", {
					text: "No transactions this month. Add one!",
				});
			}
			return;
		}

		// Summary
		const summaryContainer = content.createDiv({ cls: "fa-summary-section" });
		new SummaryPanelRenderer(
			summaryContainer,
			this.monthEntry,
			this.plugin.settings.currency
		).render();

		// Transactions table
		const tableContainer = content.createDiv({ cls: "fa-table-section" });
		tableContainer.createEl("h4", { text: "Transactions", cls: "fa-section-title" });

		new TransactionTableRenderer(
			tableContainer,
			this.monthEntry.frontmatter.transactions,
			this.plugin.settings.currency,
			{
				onEdit: (index, transaction) =>
					this.openEditModal(index, transaction),
				onDelete: (index) => this.handleDelete(index),
			}
		).render();
	}

	private openAddModal(): void {
		new AddTransactionModal(
			this.app,
			this.plugin.settings,
			async (transaction) => {
				const entry = await this.financeService.getOrCreateMonth(
					this.currentMonth
				);
				await this.financeService.addTransaction(entry.file, transaction);
				await this.refresh();
			}
		).open();
	}

	private openEditModal(index: number, transaction: Transaction): void {
		if (!this.monthEntry) return;
		const file = this.monthEntry.file;

		new EditTransactionModal(
			this.app,
			this.plugin.settings,
			transaction,
			async (updated) => {
				await this.financeService.updateTransaction(file, index, updated);
				await this.refresh();
			}
		).open();
	}

	private handleDelete(index: number): void {
		if (!this.monthEntry) return;
		const file = this.monthEntry.file;
		const t = this.monthEntry.frontmatter.transactions[index];

		new ConfirmDeleteModal(
			this.app,
			`Delete transaction "${t.description}" (${this.plugin.settings.currency} ${t.amount.toFixed(2)})?`,
			async () => {
				await this.financeService.removeTransaction(file, index);
				await this.refresh();
			}
		).open();
	}
}
