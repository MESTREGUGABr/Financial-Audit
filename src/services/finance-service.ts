import { App, TFile } from "obsidian";
import { FinancialAuditSettings, MonthEntry, MonthFrontmatter, Transaction } from "../types";
import {
	readMonthFrontmatter,
	updateMonthFrontmatter,
	buildMonthNoteContent,
} from "./frontmatter-parser";

interface FrontmatterData {
	transactions: {
		description: string;
		amount: number;
		type: string;
		category: string;
		source: string;
		date: string;
	}[];
}

export class FinanceService {
	constructor(
		private app: App,
		private settings: FinancialAuditSettings
	) {}

	async getAllMonths(): Promise<MonthEntry[]> {
		const folder = this.settings.financesFolder;
		const files = this.app.vault.getMarkdownFiles().filter((f) =>
			f.path.startsWith(folder + "/")
		);

		const entries: MonthEntry[] = [];
		for (const file of files) {
			const fm = await readMonthFrontmatter(this.app, file);
			if (!fm) continue;

			const totalIncome = fm.transactions
				.filter((t) => t.type === "income")
				.reduce((sum, t) => sum + t.amount, 0);
			const totalExpenses = fm.transactions
				.filter((t) => t.type === "expense")
				.reduce((sum, t) => sum + t.amount, 0);

			entries.push({
				file,
				frontmatter: fm,
				totalIncome,
				totalExpenses,
				balance: totalIncome - totalExpenses,
			});
		}

		return entries.sort((a, b) => b.frontmatter.month.localeCompare(a.frontmatter.month));
	}

	async getMonth(yearMonth: string): Promise<MonthEntry | null> {
		const months = await this.getAllMonths();
		return months.find((m) => m.frontmatter.month === yearMonth) ?? null;
	}

	async createMonthNote(yearMonth: string): Promise<TFile> {
		const folder = this.settings.financesFolder;
		const folderExists = this.app.vault.getAbstractFileByPath(folder);
		if (!folderExists) {
			await this.app.vault.createFolder(folder);
		}

		const data: MonthFrontmatter = {
			month: yearMonth,
			transactions: [],
		};
		const path = `${folder}/${yearMonth}.md`;
		const content = buildMonthNoteContent(data);
		return await this.app.vault.create(path, content);
	}

	async getOrCreateMonth(yearMonth: string): Promise<MonthEntry> {
		const existing = await this.getMonth(yearMonth);
		if (existing) return existing;

		const file = await this.createMonthNote(yearMonth);
		return {
			file,
			frontmatter: { month: yearMonth, transactions: [] },
			totalIncome: 0,
			totalExpenses: 0,
			balance: 0,
		};
	}

	async addTransaction(file: TFile, transaction: Transaction): Promise<void> {
		await updateMonthFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.transactions)) {
				data.transactions = [];
			}
			data.transactions.push({
				description: transaction.description,
				amount: transaction.amount,
				type: transaction.type,
				category: transaction.category,
				source: transaction.source,
				date: transaction.date,
			});
		});
	}

	async updateTransaction(
		file: TFile,
		index: number,
		updated: Transaction
	): Promise<void> {
		await updateMonthFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.transactions)) return;
			if (index < 0 || index >= data.transactions.length) return;
			data.transactions[index] = {
				description: updated.description,
				amount: updated.amount,
				type: updated.type,
				category: updated.category,
				source: updated.source,
				date: updated.date,
			};
		});
	}

	async removeTransaction(file: TFile, index: number): Promise<void> {
		await updateMonthFrontmatter(this.app, file, (fm) => {
			const data = fm as unknown as FrontmatterData;
			if (!Array.isArray(data.transactions)) return;
			if (index < 0 || index >= data.transactions.length) return;
			data.transactions.splice(index, 1);
		});
	}

	async deleteMonth(file: TFile): Promise<void> {
		await this.app.fileManager.trashFile(file);
	}
}
