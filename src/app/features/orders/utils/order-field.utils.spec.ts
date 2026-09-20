import { Order } from '../models/order.model';
import { asOrderFileValue, findOrderField, formatOrderFieldValue } from './order-field.utils';

describe('order field utilities', () => {
  const order = {
    id: 1,
    campaignId: 2,
    branchId: 3,
    senderName: 'Sender',
    senderPhone: '999999999',
    recipientName: 'Recipient',
    recipientPhone: '988888888',
    district: 'Lima',
    address: 'Av. Principal 123',
    optionalFields: {
      dedication: {
        key: 'dedication',
        label: 'Dedicatoria',
        value: 'Feliz cumpleaños',
        filled: true,
      },
    },
    customFields: [],
    status: 'pending',
    createdAt: '2026-01-01',
  } as Order;

  it('formats nested values without exposing object internals', () => {
    expect(formatOrderFieldValue(['Lima', { label: 'Centro' }])).toBe('Lima, Centro');
    expect(formatOrderFieldValue({ value: 'Texto' })).toBe('Texto');
    expect(formatOrderFieldValue({ unexpected: true })).toBe('');
  });

  it('finds an optional field by its display label', () => {
    expect(findOrderField(order, 'Dedicatoria')?.key).toBe('dedication');
    expect(findOrderField(order, 'No existe')).toBeUndefined();
  });

  it('normalizes valid file metadata and rejects other values', () => {
    expect(
      asOrderFileValue({
        id: 10,
        name: 'evidencia.jpg',
        mimeType: 'image/jpeg',
      }),
    ).toEqual({ id: 10, name: 'evidencia.jpg', mimeType: 'image/jpeg' });
    expect(asOrderFileValue({ name: 'sin-id.jpg' })).toBeNull();
  });
});
