export class Withdraw {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

  user_id: string;
  type: string;
  withdraw_via: string;
  provider: string;
  reference_number: string;
  status: string;
  amount: number;
  currency: string;
}
