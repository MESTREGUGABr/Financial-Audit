import { TFile } from "obsidian";

export type TransactionType = "income" | "expense";

export interface Transaction {
	description: string;
	amount: number;
	type: TransactionType;
	category: string;
	source: string;
	date: string;
}

export interface MonthFrontmatter {
	month: string;
	transactions: Transaction[];
}

export interface MonthEntry {
	file: TFile;
	frontmatter: MonthFrontmatter;
	totalIncome: number;
	totalExpenses: number;
	balance: number;
}

export interface FinancialAuditSettings {
	financesFolder: string;
	currency: string;
	categories: string[];
	sources: string[];
}

export const DEFAULT_SETTINGS: FinancialAuditSettings = {
	financesFolder: "Finances",
	currency: "R$",
	categories: [],
	sources: [],
};
