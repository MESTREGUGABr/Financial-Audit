import { Plugin, TFile } from "obsidian";
import { FinancialAuditSettings, DEFAULT_SETTINGS } from "./types";
import { FinancialAuditSettingTab } from "./settings";
import { FinanceView } from "./views/finance-view";
import { FinanceService } from "./services/finance-service";
import { AddTransactionModal } from "./modals/add-transaction-modal";
import { VIEW_TYPE_FINANCE } from "./constants";

export default class FinancialAuditPlugin extends Plugin {
	settings: FinancialAuditSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_FINANCE,
			(leaf) => new FinanceView(leaf, this)
		);

		this.addRibbonIcon("wallet", "Open Financial Audit", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-financial-audit",
			name: "Open tracker",
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: "open-financial-audit-popout",
			name: "Open tracker in popout window",
			callback: () => {
				void this.activatePopoutView();
			},
		});

		this.addCommand({
			id: "add-transaction",
			name: "Add transaction",
			callback: () => {
				const now = new Date();
				const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
				const service = new FinanceService(this.app, this.settings);

				new AddTransactionModal(
					this.app,
					this.settings,
					async (transaction) => {
						const entry = await service.getOrCreateMonth(yearMonth);
						await service.addTransaction(entry.file, transaction);
						this.refreshFinanceView();
					}
				).open();
			},
		});

		this.addSettingTab(new FinancialAuditSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (
					file instanceof TFile &&
					file.path.startsWith(this.settings.financesFolder + "/")
				) {
					this.refreshFinanceView();
				}
			})
		);
	}

	onunload(): void {
		// View is automatically deregistered by Obsidian
	}

	async loadSettings(): Promise<void> {
		const saved = await this.loadData() as FinancialAuditSettings | null;
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			saved ?? {}
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_FINANCE)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_FINANCE,
					active: true,
				});
				leaf = rightLeaf;
			}
		}
		if (leaf) {
			void workspace.revealLeaf(leaf);
		}
	}

	async activatePopoutView(): Promise<void> {
		const leaf = this.app.workspace.openPopoutLeaf();
		await leaf.setViewState({
			type: VIEW_TYPE_FINANCE,
			active: true,
		});
		void this.app.workspace.revealLeaf(leaf);
	}

	refreshFinanceView(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FINANCE);
		for (const leaf of leaves) {
			const view = leaf.view as unknown as FinanceView;
			if (view && typeof view.refresh === "function") {
				void view.refresh();
			}
		}
	}
}
