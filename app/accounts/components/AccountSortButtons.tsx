"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { swapAccountOrder } from "@/app/actions/accounts";
import { useState } from "react";

interface AccountSortButtonsProps {
  accountId: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  prevAccountId?: number;
  nextAccountId?: number;
}

export function AccountSortButtons({
  accountId,
  canMoveUp,
  canMoveDown,
  prevAccountId,
  nextAccountId,
}: AccountSortButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMoveUp = async () => {
    if (!prevAccountId) return;
    setIsLoading(true);
    try {
      await swapAccountOrder(accountId, prevAccountId);
    } catch (error) {
      console.error("Move up failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveDown = async () => {
    if (!nextAccountId) return;
    setIsLoading(true);
    try {
      await swapAccountOrder(accountId, nextAccountId);
    } catch (error) {
      console.error("Move down failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handleMoveUp}
        disabled={!canMoveUp || isLoading}
        title="往上移"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handleMoveDown}
        disabled={!canMoveDown || isLoading}
        title="往下移"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
