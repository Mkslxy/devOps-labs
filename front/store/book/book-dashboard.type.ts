export interface BookDashboardPayload {
    start_date: string;
    end_date: string;
}

export interface BookDashboardCurrencySummary {
    orders_count: number;
    total_books_amount: number;
    total_spent: string;
}

export interface BookDashboardResponse {
    period: {
        start: string;
        end: string;
    };
    summary: Record<string, BookDashboardCurrencySummary>;
}