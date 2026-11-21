import { FinanceShell } from "@/components/finance/FinanceShell";

export default function FinanceLayout({ children }: LayoutProps<"/finance">) {
  return <FinanceShell>{children}</FinanceShell>;
}
