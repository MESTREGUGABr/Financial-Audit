import { App, TFile, parseYaml, stringifyYaml } from "obsidian";
import { MonthFrontmatter, Transaction } from "../types";

interface RawTransaction {
	description?: string;
	amount?: number;
	type?: string;
	category?: string;
	source?: string;
	date?: string;
}

export async function readMonthFrontmatter(
	app: App,
	file: TFile
): Promise<MonthFrontmatter | null> {
	const content = await app.vault.read(file);
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	try {
		const data = parseYaml(match[1]) as Record<string, unknown>;
		if (!data || !data.month) return null;

		const rawTransactions = Array.isArray(data.transactions)
			? data.transactions as RawTransaction[]
			: [];

		return {
			month: data.month as string,
			transactions: rawTransactions.map(
				(t): Transaction => ({
					description: t.description || "",
					amount: typeof t.amount === "number" ? t.amount : 0,
					type: t.type === "income" ? "income" : "expense",
					category: t.category || "",
					source: t.source || "",
					date: t.date || "",
				})
			),
		};
	} catch {
		return null;
	}
}

export async function updateMonthFrontmatter(
	app: App,
	file: TFile,
	mutator: (fm: Record<string, unknown>) => void
): Promise<void> {
	await app.fileManager.processFrontMatter(file, mutator);
}

export function buildMonthNoteContent(data: MonthFrontmatter): string {
	const yaml = stringifyYaml({
		month: data.month,
		transactions: data.transactions.map((t) => ({
			description: t.description,
			amount: t.amount,
			type: t.type,
			category: t.category,
			source: t.source,
			date: t.date,
		})),
	});
	return `---\n${yaml}---\n\n## Notes\n`;
}
