export type Loan = {
  _id: string;
  clientId: string;
  clientName: string;
  phone: string;
  pledgedProperties?: string[];
  principal: number;
  monthlyInterestAmount?: number;
  monthsElapsed?: number;
  accruedInterest?: number;
  totalAmount?: number;
  totalPaid?: number;
  remainingAmount?: number;
  interestRate: number;
  startDate: string;
  status: "active" | "closed";
};