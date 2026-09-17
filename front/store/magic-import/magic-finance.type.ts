export interface MagicFinancePayload {
    start_date: string;
    end_date: string;
}

export type FinanceValue = string | number | null;

export interface MagicFinancialInsights {
    executive_summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

export interface MagicFinancePeriod {
    start: string;
    end: string;
}

export interface MagicPnlRevenue {
    total: FinanceValue;
    from_payments: FinanceValue;
    from_other: FinanceValue;
}

export interface MagicPnlCogs {
    total: FinanceValue;
    teachers_salary: FinanceValue;
}

export interface MagicPnlExpenseCategory {
    category: string;
    amount: FinanceValue;
}

export interface MagicPnlOperatingExpenses {
    total: FinanceValue;
    by_category: MagicPnlExpenseCategory[];
}

export interface MagicPnlChartItem {
    date: string;
    income: FinanceValue;
    expense: FinanceValue;
}

export interface MagicPnlCurrencySummary {
    revenue: MagicPnlRevenue;
    cogs: MagicPnlCogs;
    gross_profit: FinanceValue;
    operating_expenses: MagicPnlOperatingExpenses;
    net_profit: FinanceValue;
    gross_margin_percent: FinanceValue;
    net_margin_percent: FinanceValue;
    chart_data: MagicPnlChartItem[];
}

export interface MagicPnlReport {
    period: MagicFinancePeriod;
    summary: Record<string, MagicPnlCurrencySummary>;
}

export interface MagicBooksCurrencySummary {
    orders_count: number;
    total_books_amount: number;
    total_spent: FinanceValue;
}

export interface MagicBooksReport {
    period: MagicFinancePeriod;
    summary: Record<string, MagicBooksCurrencySummary>;
}

export interface MagicFinanceResponse {
    pnl: MagicPnlReport;
    books: MagicBooksReport;
    ai_insights: MagicFinancialInsights;
}