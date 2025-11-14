export interface WebhookEvent {
  event: 'authorization.approved' | 'authorization.denied' | 'authorization.revoked';
  data: any;
  timestamp: Date;
  companyId: string;
}
