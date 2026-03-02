type LoanStatus = "active" | "closed";

function toDateOnly(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getAccruedDays(startDateInput: string, asOfDate: Date = new Date()) {
  const startDate = toDateOnly(startDateInput);
  if (!startDate) return 0;

  const today = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate());
  if (today <= startDate) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((today.getTime() - startDate.getTime()) / msPerDay);
}

export function getLoanFinancials({
  principal,
  interestRate,
  startDate,
  totalPaid,
  storedStatus,
}: {
  principal: number;
  interestRate: number;
  startDate: string;
  totalPaid: number;
  storedStatus?: string;
}) {
  const safePrincipal = Number(principal) || 0;
  const safeInterestRate = Number(interestRate) || 0;
  const safeTotalPaid = Number(totalPaid) || 0;

  const daysElapsed = getAccruedDays(startDate);
  const dailyInterestAmount = (safePrincipal * safeInterestRate) / 100;
  const accruedInterest = dailyInterestAmount * daysElapsed;
  const totalAmount = safePrincipal + accruedInterest;
  const remainingAmount = Math.max(totalAmount - safeTotalPaid, 0);

  const status: LoanStatus =
    remainingAmount === 0 || storedStatus === "closed" ? "closed" : "active";

  return {
    daysElapsed,
    dailyInterestAmount,
    accruedInterest,
    totalAmount,
    totalPaid: safeTotalPaid,
    remainingAmount,
    status,
  };
}
