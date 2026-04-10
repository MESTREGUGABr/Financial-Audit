import { App, Modal, Setting } from "obsidian";
import { FinancialAuditSettings, Transaction, TransactionType } from "../types";

export class AddTransactionModal extends Modal {
	private description = "";
	private amount = 0;
	private type: TransactionType = "expense";
	private category = "";
	private source = "";
	private date: string;

	constructor(
		app: App,
		private settings: FinancialAuditSettings,
		private onSubmit: (transaction: Transaction) => void | Promise<void>
	) {
		super(app);
		this.date = new Date().toISOString().split("T")[0];
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Add transaction" });

		new Setting(contentEl).setName("Description").addText((text) =>
			text.setPlaceholder("e.g. Grocery shopping").onChange((value) => {
				this.description = value;
			})
		);

		new Setting(contentEl).setName("Amount").addText((text) =>
			text
				.setPlaceholder("0.00")
				.onChange((value) => {
					this.amount = parseFloat(value) || 0;
				})
		);

		new Setting(contentEl).setName("Type").addDropdown((dropdown) =>
			dropdown
				.addOptions({
					expense: "Expense",
					income: "Income",
				})
				.setValue(this.type)
				.onChange((value) => {
					this.type = value as TransactionType;
				})
		);

		new Setting(contentEl).setName("Category").addDropdown((dropdown) => {
			const options: Record<string, string> = { "": "-- Select --" };
			for (const cat of this.settings.categories) {
				options[cat] = cat;
			}
			dropdown
				.addOptions(options)
				.setValue(this.category)
				.onChange((value) => {
					this.category = value;
				});
		});

		new Setting(contentEl).setName("Source").addDropdown((dropdown) => {
			const options: Record<string, string> = { "": "-- Select --" };
			for (const src of this.settings.sources) {
				options[src] = src;
			}
			dropdown
				.addOptions(options)
				.setValue(this.source)
				.onChange((value) => {
					this.source = value;
				});
		});

		new Setting(contentEl).setName("Date").addText((text) =>
			text
				.setValue(this.date)
				.setPlaceholder("YYYY-MM-DD")
				.onChange((value) => {
					this.date = value;
				})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Add transaction")
				.setCta()
				.onClick(() => {
					if (!this.description.trim() || this.amount <= 0) {
						return;
					}
					void this.onSubmit({
						description: this.description.trim(),
						amount: this.amount,
						type: this.type,
						category: this.category,
						source: this.source,
						date: this.date,
					});
					this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
