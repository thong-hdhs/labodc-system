import { BadRequestException } from '@nestjs/common';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';
import { TeamPayoutService } from './team-payout.service';

describe('TeamPayoutService Unit Tests (D17 - Team 70% Member Split & Remainder Invariant)', () => {
  let service: TeamPayoutService;

  beforeEach(() => {
    const proposalRepo = new ProjectProposalRepository();
    const financeEscrowService = new FinanceEscrowService(proposalRepo);
    service = new TeamPayoutService(proposalRepo, financeEscrowService);
  });

  it('Phân bổ chính xác Quỹ 70% của nhóm theo % đóng góp và cộng phần dư phép chia nguyên cho TALENT_LEADER', () => {
    // Quỹ 70% lẻ: 7,000,002 VND chia cho 3 thành viên (33% + 33% + 34% = 100%)
    const split = service.calculateTeam70MemberSplit(7_000_002, [
      {
        memberUserId: 'leader-1',
        memberName: 'Nhóm Trưởng',
        memberRole: 'TALENT_LEADER',
        contributionPercentage: 34,
      },
      {
        memberUserId: 'member-2',
        memberName: 'Thành Viên 2',
        memberRole: 'TALENT',
        contributionPercentage: 33,
      },
      {
        memberUserId: 'member-3',
        memberName: 'Thành Viên 3',
        memberRole: 'TALENT',
        contributionPercentage: 33,
      },
    ]);

    // Math.floor(7000002 * 34 / 100) = 2,380,000
    // Math.floor(7000002 * 33 / 100) = 2,310,000 (x2)
    // Tổng base = 7,000,000 -> Phần dư = 2 VND được cộng cho TALENT_LEADER -> 2,380,002 VND
    expect(split.remainderAbsorbedByLeaderVnd).toBe(2);
    expect(split.totalAllocatedVnd).toBe(7_000_002);
    expect(split.invariantHold).toBe(true);
    expect(split.items[0].allocatedAmount).toBe(2_380_002);
    expect(split.items[1].allocatedAmount).toBe(2_310_000);
    expect(split.items[2].allocatedAmount).toBe(2_310_000);
  });

  it('Chặn phân bổ khi tổng tỷ lệ đóng góp không bằng 100% hoặc thiếu TALENT_LEADER (400 Bad Request)', () => {
    expect(() =>
      service.calculateTeam70MemberSplit(7_000_000, [
        {
          memberUserId: 'leader-1',
          memberName: 'Nhóm Trưởng',
          memberRole: 'TALENT_LEADER',
          contributionPercentage: 50,
        },
        {
          memberUserId: 'member-2',
          memberName: 'Thành Viên 2',
          memberRole: 'TALENT',
          contributionPercentage: 40,
        },
      ]),
    ).toThrow(BadRequestException);
  });
});