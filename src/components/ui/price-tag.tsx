import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";

interface PriceTagProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

export function PriceTag({ amount, size = 'md', showIcon = true, className }: PriceTagProps) {
  const sizeConfig = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const formattedAmount = amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className={cn("inline-flex items-center gap-1 font-bold text-primary", sizeConfig[size], className)}>
      {showIcon && <DollarSign className={iconSize[size]} />}
      <span>R$ {formattedAmount}</span>
    </div>
  );
}
