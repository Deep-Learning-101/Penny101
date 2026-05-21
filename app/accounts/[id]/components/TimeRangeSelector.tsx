"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimeRangeSelectorProps {
  currentRange: '3m' | '6m' | '1y' | 'all';
  accountId: number;
}

export function TimeRangeSelector({ currentRange, accountId }: TimeRangeSelectorProps) {
  const router = useRouter();

  const handleRangeChange = (range: string) => {
    router.push(`/accounts/${accountId}?range=${range}`);
  };

  return (
    <Tabs value={currentRange} onValueChange={handleRangeChange}>
      <TabsList>
        <TabsTrigger value="3m">近 3 個月</TabsTrigger>
        <TabsTrigger value="6m">近 6 個月</TabsTrigger>
        <TabsTrigger value="1y">近 1 年</TabsTrigger>
        <TabsTrigger value="all">全部</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
