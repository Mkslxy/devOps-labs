"use client";

import { useEffect, useState } from "react";

import { useLazyGetPnlTransactionsQuery } from "@/store/pnl/pnl.api";
import type { Transaction } from "@/store/pnl/pnl.type";

type UseAllPnlTransactionsArgs = {
  currency?: number;
  school?: number;
  createdAfter?: string;
  createdBefore?: string;
};

export function useAllPnlTransactions({
  currency,
  school,
  createdAfter,
  createdBefore,
}: UseAllPnlTransactionsArgs) {
  const [loadTransactions] = useLazyGetPnlTransactionsQuery();
  const [items, setItems] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAllPages() {
      setIsLoading(true);

      try {
        const nextItems: Transaction[] = [];
        let page = 1;
        let hasNext = true;

        while (hasNext && !cancelled) {
          const response = await loadTransactions({
            page,
            page_size: 100,
            currency,
            school,
            created_at_after: createdAfter,
            created_at_before: createdBefore,
            ordering: "created_at",
          }).unwrap();

          nextItems.push(...(response.results ?? []));
          hasNext = Boolean(response.next);
          page += 1;
        }

        if (!cancelled) setItems(nextItems);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAllPages();

    return () => {
      cancelled = true;
    };
  }, [createdAfter, createdBefore, currency, school, loadTransactions]);

  return { items, isLoading };
}
