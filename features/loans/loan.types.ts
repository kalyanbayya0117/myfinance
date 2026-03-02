export type Loan = {
  _id: string;
  loanId?: string;
  clientId: string;
  clientName: string;
  phone: string;
  pledgedProperties?: string[];
  principal: number;
  dailyInterestAmount?: number;
  daysElapsed?: number;
  accruedInterest?: number;
  totalAmount?: number;
  totalPaid?: number;
  remainingAmount?: number;
  interestRate: number;
  startDate: string;
  status: "active" | "closed";
};