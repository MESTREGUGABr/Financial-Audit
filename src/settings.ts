import { App, PluginSettingTab, Setting } from "obsidian";
import type FinancialAuditPlugin from "./main";

export class FinancialAuditSettingTab extends PluginSettingTab {
	plugin: FinancialAuditPlugin;

	constructor(app: App, plugin: FinancialAuditPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Finances folder")
			.setDesc(
				"Folder where monthly finance notes are stored. Will be created if it doesn't exist."
			)
			.addText((text) =>
				text
					.setPlaceholder("Finances")
					.setValue(this.plugin.settings.financesFolder)
					.onChange(async (value) => {
						this.plugin.settings.financesFolder = value || "Finances";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Currency symbol")
			.setDesc("Symbol displayed next to amounts.")
			.addText((text) =>
				text
					.setPlaceholder("R$")
					.setValue(this.plugin.settings.currency)
					.onChange(async (value) => {
						this.plugin.settings.currency = value || "R$";
						await this.plugin.saveSettings();
					})
			);

		// Categories section
		new Setting(containerEl).setName("Categories").setHeading();

		this.renderListSetting(
			containerEl,
			this.plugin.settings.categories,
			"Add category",
			"e.g. Food, Transport, Housing",
			async (updated) => {
				this.plugin.settings.categories = updated;
				await this.plugin.saveSettings();
			}
		);

		// Sources section
		new Setting(containerEl).setName("Sources").setHeading();

		this.renderListSetting(
			containerEl,
			this.plugin.settings.sources,
			"Add source",
			"e.g. Nubank, Cash, Itaú",
			async (updated) => {
				this.plugin.settings.sources = updated;
				await this.plugin.saveSettings();
			}
		);
	}

	private renderListSetting(
		containerEl: HTMLElement,
		items: string[],
		addLabel: string,
		placeholder: string,
		onUpdate: (updated: string[]) => Promise<void>
	): void {
		// Existing items
		for (let i = 0; i < items.length; i++) {
			new Setting(containerEl)
				.setName(items[i])
				.addButton((btn) =>
					btn
						.setButtonText("Remove")
						.setWarning()
						.onClick(async () => {
							items.splice(i, 1);
							await onUpdate([...items]);
							this.display();
						})
				);
		}

		// Add new item
		let newValue = "";
		new Setting(containerEl)
			.addText((text) =>
				text.setPlaceholder(placeholder).onChange((value) => {
					newValue = value;
				})
			)
			.addButton((btn) =>
				btn.setButtonText(addLabel).setCta().onClick(async () => {
					const trimmed = newValue.trim();
					if (!trimmed || items.includes(trimmed)) return;
					items.push(trimmed);
					await onUpdate([...items]);
					this.display();
				})
			);
	}
}
