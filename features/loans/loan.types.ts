export type Loan = {
  _id: string;
  clientId: string;
  clientName: string;
  phone: string;
  pledgedProperties?: string[];
  principal: number;
  totalPaid?: number;
  remainingAmount?: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  status: "active" | "closed" | "overdue";
};