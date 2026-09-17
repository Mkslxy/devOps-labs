import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type Props = {
  title: string;
  subtitle?: string;
  query: string;
  onQueryChange: (value: string) => void;
  onCreate?: () => void;
  createLabel?: string;
};

export function PageHeader({ title, subtitle, query, onQueryChange }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="relative w-full md:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Пошук..."
          className="h-10 rounded-xl pl-9"
        />
      </div>
    </div>
  );
}
