import { describe, expect, it, vi } from 'vitest';
import { PaymentsService } from './payments.service.js';
import type { PaymentsRepository } from './payments.repository.js';
import { Clock } from '../../common/clock/clock.js';

describe('PaymentsService', () => {
  const mockRepo = {
    findPendingClaims: vi.fn(),
    confirmClaim: vi.fn(),
    rejectClaim: vi.fn(),
    undoClaim: vi.fn(),
  } as unknown as PaymentsRepository;

  const clock = { now: () => new Date('2026-10-14T12:00:00.000Z') } as Clock;
  const service = new PaymentsService(mockRepo, clock);

  it('lists pending claims formatted as dtos', async () => {
    vi.mocked(mockRepo.findPendingClaims).mockResolvedValueOnce([
      {
        id: 'cl-1',
        invoiceId: 'inv-1',
        screenshotKey: 'claims/ahmed.png',
        status: 'pending',
        extractedAmount: 600,
        extractedDate: new Date('2026-10-14'),
        transactionId: 'TX-1',
        recipient: 'acc@instapay',
        rawText: 'text',
        checkAmount: true,
        checkDate: true,
        checkRecipient: true,
        duplicateOfClaimId: null,
        verdict: 'all_match',
        createdAt: new Date('2026-10-14T10:00:00.000Z'),
        invoice: {
          id: 'inv-1',
          amount: 600,
          customer: { id: 'c-1', name: 'أحمد', phone: '+201012345678' },
          charge: { title: 'اشتراك أكتوبر' },
        },
      } as never,
    ]);

    const result = await service.listClaims('b-1');
    expect(result).toHaveLength(1);
    expect(result[0].customerName).toBe('أحمد');
    expect(result[0].verdict).toBe('all_match');
  });

  it('confirms a claim', async () => {
    vi.mocked(mockRepo.confirmClaim).mockResolvedValueOnce('ok');
    const result = await service.confirm('b-1', 'cl-1');
    expect(result).toEqual({ success: true });
  });

  it('rejects a claim', async () => {
    vi.mocked(mockRepo.rejectClaim).mockResolvedValueOnce('ok');
    const result = await service.reject('b-1', 'cl-1');
    expect(result).toEqual({ success: true });
  });

  it('undoes a claim decision', async () => {
    vi.mocked(mockRepo.undoClaim).mockResolvedValueOnce('ok');
    const result = await service.undo('b-1', 'cl-1');
    expect(result).toEqual({ success: true });
  });
});
