import { Search } from "lucide-react";

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function TabsHeader({ query, onQueryChange }: Props) {
  return (
    <CardHeader className="space-y-4 pb-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-base">Керування</CardTitle>
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted/50 p-1 md:w-fit md:grid-cols-4">
          <TabsTrigger className="rounded-lg" value="tests">Тести</TabsTrigger>
          <TabsTrigger className="rounded-lg" value="assignments">Призначення</TabsTrigger>
          <TabsTrigger className="rounded-lg" value="questions">Питання</TabsTrigger>
          <TabsTrigger className="rounded-lg" value="results">Результати</TabsTrigger>
        </TabsList>
      </div>

      <div className="relative md:hidden">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Пошук..."
          className="pl-9"
        />
      </div>
    </CardHeader>
  );
}

