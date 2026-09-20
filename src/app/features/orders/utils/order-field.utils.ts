import { Order, OrderFieldValue, OrderFileValue } from '../models/order.model';

export function orderFields(order: Order): OrderFieldValue[] {
  return [...Object.values(order.optionalFields ?? {}), ...(order.customFields ?? [])];
}

export function findOrderField(order: Order, label: string): OrderFieldValue | undefined {
  return orderFields(order).find((field) => field.label === label);
}

export function formatOrderFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(formatOrderFieldValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred = record['name'] ?? record['label'] ?? record['value'];
    return preferred === undefined ? '' : formatOrderFieldValue(preferred);
  }
  return '';
}

export function asOrderFileValue(value: unknown): OrderFileValue | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<OrderFileValue>;
  if (typeof candidate.id !== 'number' || typeof candidate.name !== 'string') return null;

  const file: OrderFileValue = { id: candidate.id, name: candidate.name };
  if (candidate.mimeType !== undefined) file.mimeType = candidate.mimeType;
  if (candidate.size !== undefined) file.size = candidate.size;
  if (candidate.url !== undefined) file.url = candidate.url;
  return file;
}
