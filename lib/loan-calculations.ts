type LoanStatus = "active" | "closed";
const msPerDay = 24 * 60 * 60 * 1000;

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

  return Math.floor((today.getTime() - startDate.getTime()) / msPerDay);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getLoanAnniversary(startDate: Date, yearsFromStart: number) {
  const targetYear = startDate.getFullYear() + yearsFromStart;
  const targetMonth = startDate.getMonth();
  const targetDay = Math.min(
    startDate.getDate(),
    getDaysInMonth(targetYear, targetMonth),
  );

  return new Date(targetYear, targetMonth, targetDay);
}

function getAccruedInterestFromMonthlyRate({
  principal,
  monthlyInterestRate,
  startDate,
  asOfDate,
}: {
  principal: number;
  monthlyInterestRate: number;
  startDate: Date;
  asOfDate: Date;
}) {
  if (asOfDate <= startDate) return 0;

  const monthlyInterestAmount = (principal * monthlyInterestRate) / 100;
  if (monthlyInterestAmount <= 0) return 0;

  let accruedInterest = 0;
  let cursor = new Date(startDate);

  while (cursor < asOfDate) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const monthEndExclusive = new Date(year, monthIndex + 1, 1);
    const segmentEnd = monthEndExclusive < asOfDate ? monthEndExclusive : asOfDate;
    const segmentDays = Math.floor((segmentEnd.getTime() - cursor.getTime()) / msPerDay);

    accruedInterest += (monthlyInterestAmount / daysInMonth) * segmentDays;
    cursor = segmentEnd;
  }

  return accruedInterest;
}

function getAccruedInterestWithAnnualCompounding({
  principal,
  monthlyInterestRate,
  startDate,
  asOfDate,
}: {
  principal: number;
  monthlyInterestRate: number;
  startDate: Date;
  asOfDate: Date;
}) {
  if (asOfDate <= startDate || principal <= 0 || monthlyInterestRate <= 0) {
    return {
      accruedInterest: 0,
      currentPrincipal: principal,
    };
  }

  let accruedInterest = 0;
  let currentPrincipal = principal;
  let cycleStart = new Date(startDate);
  let yearsElapsed = 0;

  while (cycleStart < asOfDate) {
    const nextAnniversary = getLoanAnniversary(startDate, yearsElapsed + 1);
    const cycleEnd = nextAnniversary < asOfDate ? nextAnniversary : asOfDate;

    const cycleInterest = getAccruedInterestFromMonthlyRate({
      principal: currentPrincipal,
      monthlyInterestRate,
      startDate: cycleStart,
      asOfDate: cycleEnd,
    });

    accruedInterest += cycleInterest;

    if (cycleEnd.getTime() === nextAnniversary.getTime()) {
      currentPrincipal += cycleInterest;
      cycleStart = nextAnniversary;
      yearsElapsed += 1;
      continue;
    }

    break;
  }

  return {
    accruedInterest,
    currentPrincipal,
  };
}

export function getLoanFinancials({
  principal,
  interestRate,
  startDate,
  endDate,
  totalPaid,
  storedStatus,
}: {
  principal: number;
  interestRate: number;
  startDate: string;
  endDate?: string;
  totalPaid: number;
  storedStatus?: string;
}) {
  const safePrincipal = Number(principal) || 0;
  const safeInterestRate = Number(interestRate) || 0;
  const safeTotalPaid = Number(totalPaid) || 0;

  const parsedStartDate = toDateOnly(startDate);
  const parsedEndDateRaw = endDate ? toDateOnly(endDate) : null;
  // Make endDate inclusive: push to start of next day so the end day is counted
  const parsedEndDate = parsedEndDateRaw
    ? new Date(parsedEndDateRaw.getFullYear(), parsedEndDateRaw.getMonth(), parsedEndDateRaw.getDate() + 1)
    : null;
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const asOfDate =
    parsedEndDate && parsedEndDate < todayDateOnly
      ? parsedEndDate
      : todayDateOnly;

  const daysElapsed = parsedStartDate ? getAccruedDays(startDate, asOfDate) : 0;

  const compoundingResult = parsedStartDate
    ? getAccruedInterestWithAnnualCompounding({
        principal: safePrincipal,
        monthlyInterestRate: safeInterestRate,
        startDate: parsedStartDate,
        asOfDate,
      })
    : {
        accruedInterest: 0,
        currentPrincipal: safePrincipal,
      };

  const monthlyInterestAmount =
    (compoundingResult.currentPrincipal * safeInterestRate) / 100;
  const currentMonthDays = getDaysInMonth(asOfDate.getFullYear(), asOfDate.getMonth());
  const dailyInterestAmount = currentMonthDays > 0 ? monthlyInterestAmount / currentMonthDays : 0;

  const accruedInterest = compoundingResult.accruedInterest;

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
