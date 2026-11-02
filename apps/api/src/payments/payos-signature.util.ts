import * as crypto from 'crypto';
import { PayosWebhookDataPayload } from './payos-spike.types';

export function getPayosChecksumKey(): string {
  return (
    process.env.PAYOS_CHECKSUM_KEY ||
    'labodc_payos_sandbox_checksum_secret_2026'
  );
}

export function createPayosOrderSignature(params: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
  checksumKey?: string;
}): string {
  const key = params.checksumKey || getPayosChecksumKey();
  const canonicalData = [
    `amount=${params.amount}`,
    `cancelUrl=${params.cancelUrl}`,
    `description=${params.description}`,
    `orderCode=${params.orderCode}`,
    `returnUrl=${params.returnUrl}`,
  ].join('&');

  return crypto.createHmac('sha256', key).update(canonicalData).digest('hex');
}

export function createPayosWebhookSignature(
  data: PayosWebhookDataPayload,
  checksumKey?: string,
): string {
  const key = checksumKey || getPayosChecksumKey();
  const sortedEntries = Object.entries(data)
    .filter(([, val]) => val !== undefined && val !== null)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return crypto.createHmac('sha256', key).update(sortedEntries).digest('hex');
}

export function verifyPayosWebhookSignature(
  data: PayosWebhookDataPayload,
  signature: string,
  checksumKey?: string,
): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }
  const expected = createPayosWebhookSignature(data, checksumKey);
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signature.trim(), 'utf8');

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}