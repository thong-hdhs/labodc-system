import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';

describe('FinanceEscrowService Unit Tests (D12 - 70/20/10 Split & Remainder Invariant)', () => {
  let service: FinanceEscrowService;

  beforeEach(() => {
    const proposalRepo = new ProjectProposalRepository();
    service = new FinanceEscrowService(proposalRepo);
  });

  it('Tính chính xác tỷ lệ 70% / 20% / 10% với số tiền VNĐ chẵn', () => {
    const result = service.calculateRevenueSplit(100_000_000);
    expect(result.teamAmount70).toBe(70_000_000);
    expect(result.mentorAmount20).toBe(20_000_000);
    expect(result.labAmount10).toBe(10_000_000);
    expect(result.remainderAbsorbedByLab).toBe(0);
    expect(result.invariantHold).toBe(true);
  });

  it('Cộng phần dư phép chia nguyên (remainder) vào Quỹ Lab (10%) để bảo toàn tổng 100% không lệch 1 đồng', () => {
    const result = service.calculateRevenueSplit(10_000_003);
    expect(result.teamAmount70).toBe(7_000_002);
    expect(result.mentorAmount20).toBe(2_000_000);
    expect(result.labAmount10).toBe(1_000_001);
    expect(result.remainderAbsorbedByLab).toBe(1);
    expect(
      result.teamAmount70 + result.mentorAmount20 + result.labAmount10,
    ).toBe(10_000_003);
    expect(result.invariantHold).toBe(true);
  });
});