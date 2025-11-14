import axios from 'axios'
import { WebhookEvent, Company, CompanyData } from '../types'

export class WebhookService {
  async sendWebhook(
    webhookUrl: string,
    event: WebhookEvent
  ): Promise<void> {
    try {
      await axios.post(webhookUrl, event, {
        headers: {
          'Content-Type': 'application/json',
          'X-DataVault-Event': event.event
        },
        timeout: 5000
      })

      console.log(`Webhook sent to ${webhookUrl}`)
    } catch (error) {
      console.error(` Webhook failed for ${webhookUrl}:`, error)
      // TODO: Implement retry logic
    }
  }


  async notifyRevocation(
    company: Company & CompanyData,
    accessToken: string
  ): Promise<void> {
    if (!company.webhookUrl) return

    const event: WebhookEvent = {
      event: 'authorization.revoked',
      companyId: company.companyId,
      data: { accessToken },
      timestamp: new Date()
    }

    await this.sendWebhook(company.webhookUrl, event)
  }
}