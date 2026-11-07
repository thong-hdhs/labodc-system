import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { ProjectProposalRepository } from '../projects/project-proposal.repository';
import { FinanceEscrowService } from './finance-escrow.service';
import { MilestoneEscrowStatus } from './finance-escrow.types';
import {
  DisbursementPayoutOrderEntity,
  DistributeTeam70PoolDto,
  EnterpriseFinancialReceiptDto,
  ExecuteMilestonePayoutDto,
  MemberContributionInputDto,
  Team70DistributionResultDto,
  TeamMemberPayoutAllocationEntity,
} from './team-payout.types';

@Injectable()
export class TeamPayoutService {
  private readonly allocationsByMilestoneId = new Map<
    string,
    TeamMemberPayoutAllocationEntity[]
  >();
  private readonly payoutOrdersByMilestoneId = new Map<
    string,
    DisbursementPayoutOrderEntity[]
  >();
  private allocationSequence = 1;
  private payoutOrderSequence = 1;
  private receiptSequence = 1;

  constructor(
    private readonly proposalRepository: ProjectProposalRepository,
    private readonly financeEscrowService: FinanceEscrowService,
  ) {}

  /**
   * Thuật toán phân bổ Quỹ 70% của Nhóm sinh viên cho từng thành viên theo % đóng góp (số nguyên VND).
   * Mọi phần dư phép chia nguyên (remainder) được cộng cho Nhóm trưởng (TALENT_LEADER) để bảo toàn tổng 100%.
   */
  calculateTeam70MemberSplit(
    teamPool70AmountVnd: number,
    members: MemberContributionInputDto[],
  ): {
    totalAllocatedVnd: number;
    remainderAbsorbedByLeaderVnd: number;
    invariantHold: boolean;
    items: Array<{
      memberUserId: string;
      memberName: string;
      memberRole: 'TALENT_LEADER' | 'TALENT';
      contributionPercentage: number;
      allocatedAmount: number;
      remainderAbsorbed: number;
    }>;
  } {
    if (!Number.isInteger(teamPool70AmountVnd) || teamPool70AmountVnd <= 0) {
      throw new BadRequestException(
        'Quỹ thù lao 70% của nhóm (teamPool70AmountVnd) phải là số nguyên dương (VND).',
      );
    }

    if (!Array.isArray(members) || members.length === 0) {
      throw new BadRequestException(
        'Danh sách thành viên nhận phân bổ thù lao (members) không được để trống.',
      );
    }

    const leaderCount = members.filter(
      (m) => m.memberRole === 'TALENT_LEADER',
    ).length;
    if (leaderCount !== 1) {
      throw new BadRequestException(
        'Danh sách phân bổ thù lao phải có đúng 1 Nhóm trưởng (TALENT_LEADER) để nhận phần dư làm tròn.',
      );
    }

    let totalPercentage = 0;
    for (const m of members) {
      if (
        !Number.isInteger(m.contributionPercentage) ||
        m.contributionPercentage < 0 ||
        m.contributionPercentage > 100
      ) {
        throw new BadRequestException(
          `Tỷ lệ đóng góp của thành viên ${m.memberName} phải là số nguyên từ 0 đến 100.`,
        );
      }
      totalPercentage += m.contributionPercentage;
    }

    if (totalPercentage !== 100) {
      throw new BadRequestException(
        `Tổng tỷ lệ đóng góp của các thành viên trong nhóm phải bằng đúng 100% (hiện tại: ${totalPercentage}%).`,
      );
    }

    const baseItems = members.map((m) => ({
      memberUserId: m.memberUserId.trim(),
      memberName: m.memberName.trim(),
      memberRole: m.memberRole,
      contributionPercentage: m.contributionPercentage,
      baseAmount: Math.floor(
        (teamPool70AmountVnd * m.contributionPercentage) / 100,
      ),
    }));

    const sumBase = baseItems.reduce((acc, item) => acc + item.baseAmount, 0);
    const remainderAbsorbedByLeaderVnd = teamPool70AmountVnd - sumBase;

    const items = baseItems.map((item) => {
      const isLeader = item.memberRole === 'TALENT_LEADER';
      const remainderAbsorbed = isLeader ? remainderAbsorbedByLeaderVnd : 0;
      return {
        memberUserId: item.memberUserId,
        memberName: item.memberName,
        memberRole: item.memberRole,
        contributionPercentage: item.contributionPercentage,
        allocatedAmount: item.baseAmount + remainderAbsorbed,
        remainderAbsorbed,
      };
    });

    const totalAllocatedVnd = items.reduce(
      (acc, item) => acc + item.allocatedAmount,
      0,
    );

    return {
      totalAllocatedVnd,
      remainderAbsorbedByLeaderVnd,
      invariantHold: totalAllocatedVnd === teamPool70AmountVnd,
      items,
    };
  }

  distributeMilestoneTeam70Pool(
    user: JwtPayload,
    milestoneId: string,
    dto: DistributeTeam70PoolDto,
  ): Team70DistributionResultDto {
    if (
      user.role !== UserRole.MENTOR &&
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.TALENT_LEADER
    ) {
      throw new ForbiddenException(
        'Chỉ MENTOR, LAB_ADMIN, SYSTEM_ADMIN hoặc TALENT_LEADER mới được phép phân bổ quỹ thù lao 70% của nhóm.',
      );
    }

    const found = this.findMilestoneAcrossProjects(user, milestoneId);
    const { project, milestone } = found;

    if (milestone.status !== MilestoneEscrowStatus.DISBURSED) {
      throw new ConflictException({
        code: 'MILESTONE_NOT_DISBURSED_YET',
        message: `Chỉ có thể phân bổ quỹ 70% cho thành viên khi cột mốc đã được nghiệm thu và giải ngân 70/20/10 (trạng thái hiện tại: ${milestone.status}).`,
      });
    }

    const split702010 = this.financeEscrowService.calculateRevenueSplit(
      milestone.amount,
    );
    const teamPool70AmountVnd = split702010.teamAmount70;

    const splitCalc = this.calculateTeam70MemberSplit(
      teamPool70AmountVnd,
      dto.members,
    );

    const now = new Date().toISOString();
    const allocations: TeamMemberPayoutAllocationEntity[] = splitCalc.items.map(
      (item) => ({
        id: `tm-pay-${String(this.allocationSequence++).padStart(5, '0')}`,
        projectId: project.id,
        milestoneId: milestone.id,
        memberUserId: item.memberUserId,
        memberName: item.memberName,
        memberRole: item.memberRole,
        contributionPercentage: item.contributionPercentage,
        allocatedAmount: item.allocatedAmount,
        remainderAbsorbed: item.remainderAbsorbed,
        currency: 'VND',
        createdBy: user.sub,
        createdAt: now,
      }),
    );

    this.allocationsByMilestoneId.set(milestone.id, allocations);

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'DISTRIBUTE_TEAM_70_POOL',
      fromStatus: project.status,
      toStatus: project.status,
      reasonNote:
        dto.note?.trim() ||
        `[${milestone.id}] Phân bổ quỹ 70% (${teamPool70AmountVnd} VND) cho ${allocations.length} thành viên nhóm.`,
    });

    return {
      projectId: project.id,
      milestoneId: milestone.id,
      teamPool70AmountVnd,
      totalAllocatedVnd: splitCalc.totalAllocatedVnd,
      remainderAbsorbedByLeaderVnd: splitCalc.remainderAbsorbedByLeaderVnd,
      invariantHold: splitCalc.invariantHold,
      allocations,
    };
  }

  executeMilestonePayoutOrders(
    user: JwtPayload,
    milestoneId: string,
    dto?: ExecuteMilestonePayoutDto,
  ): {
    milestoneId: string;
    projectId: string;
    totalPaidOutVnd: number;
    orders: DisbursementPayoutOrderEntity[];
  } {
    if (
      user.role !== UserRole.LAB_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ LAB_ADMIN hoặc SYSTEM_ADMIN mới có quyền phê duyệt và thực thi lệnh chi trả ngân hàng.',
      );
    }

    const existingOrders = this.payoutOrdersByMilestoneId.get(milestoneId);
    if (existingOrders && existingOrders.length > 0) {
      throw new ConflictException({
        code: 'PAYOUT_ALREADY_EXECUTED',
        message: `Cột mốc ${milestoneId} đã được thực thi lệnh chi trả giải ngân trước đó.`,
      });
    }

    const { project, milestone } = this.findMilestoneAcrossProjects(
      user,
      milestoneId,
    );

    if (milestone.status !== MilestoneEscrowStatus.DISBURSED) {
      throw new ConflictException({
        code: 'MILESTONE_NOT_READY_FOR_PAYOUT',
        message: `Cột mốc ${milestoneId} phải ở trạng thái DISBURSED trước khi thực thi lệnh chi trả ngân hàng (hiện tại: ${milestone.status}).`,
      });
    }

    const split = this.financeEscrowService.calculateRevenueSplit(
      milestone.amount,
    );
    const refPrefix =
      dto?.bankTransferRefPrefix?.trim() || `BNK-ODC-${milestone.orderCode}`;
    const now = new Date().toISOString();

    const orders: DisbursementPayoutOrderEntity[] = [
      {
        id: `payout-ord-${String(this.payoutOrderSequence++).padStart(5, '0')}`,
        projectId: project.id,
        milestoneId: milestone.id,
        recipientRole: 'TEAM_LEADER',
        amount: split.teamAmount70,
        currency: 'VND',
        status: 'PAID_OUT',
        bankTransferRef: `${refPrefix}-TEAM70`,
        note:
          dto?.note?.trim() ||
          `Chi trả 70% thù lao Nhóm sinh viên cho cột mốc "${milestone.title}".`,
        executedBy: user.sub,
        executedAt: now,
      },
      {
        id: `payout-ord-${String(this.payoutOrderSequence++).padStart(5, '0')}`,
        projectId: project.id,
        milestoneId: milestone.id,
        recipientRole: 'MENTOR',
        amount: split.mentorAmount20,
        currency: 'VND',
        status: 'PAID_OUT',
        bankTransferRef: `${refPrefix}-MENTOR20`,
        note:
          dto?.note?.trim() ||
          `Chi trả 20% thù lao Mentor hướng dẫn cho cột mốc "${milestone.title}".`,
        executedBy: user.sub,
        executedAt: now,
      },
      {
        id: `payout-ord-${String(this.payoutOrderSequence++).padStart(5, '0')}`,
        projectId: project.id,
        milestoneId: milestone.id,
        recipientRole: 'LAB_FUND',
        amount: split.labAmount10,
        currency: 'VND',
        status: 'PAID_OUT',
        bankTransferRef: `${refPrefix}-LAB10`,
        note:
          dto?.note?.trim() ||
          `Kết chuyển 10% Quỹ vận hành LabOdc cho cột mốc "${milestone.title}".`,
        executedBy: user.sub,
        executedAt: now,
      },
    ];

    this.payoutOrdersByMilestoneId.set(milestone.id, orders);

    this.proposalRepository.appendAuditLog({
      projectId: project.id,
      actorUserId: user.sub,
      actorRole: user.role,
      action: 'EXECUTE_PAYOUT_ORDERS',
      fromStatus: project.status,
      toStatus: project.status,
      reasonNote: `[${milestone.id}] Đã thực thi 3 lệnh chi trả ngân hàng (${refPrefix}).`,
    });

    return {
      milestoneId: milestone.id,
      projectId: project.id,
      totalPaidOutVnd:
        split.teamAmount70 + split.mentorAmount20 + split.labAmount10,
      orders,
    };
  }

  getEnterpriseFinancialReceipt(
    user: JwtPayload,
    milestoneId: string,
  ): EnterpriseFinancialReceiptDto {
    const { project, milestone } = this.findMilestoneAcrossProjects(
      user,
      milestoneId,
    );

    if (
      user.role === UserRole.ENTERPRISE &&
      project.ownerUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'Doanh nghiệp không được phép xem chứng từ biên lai tài chính của doanh nghiệp khác.',
      );
    }

    if (milestone.status !== MilestoneEscrowStatus.DISBURSED) {
      throw new ConflictException({
        code: 'RECEIPT_AVAILABLE_AFTER_DISBURSEMENT',
        message: `Chứng từ biên lai quyết toán cột mốc chỉ được cấp sau khi cột mốc đã DISBURSED (hiện tại: ${milestone.status}).`,
      });
    }

    const split = this.financeEscrowService.calculateRevenueSplit(
      milestone.amount,
    );
    const payoutOrders =
      this.payoutOrdersByMilestoneId.get(milestone.id) ?? [];
    const teamAllocations =
      this.allocationsByMilestoneId.get(milestone.id) ?? [];

    return {
      id: `rcpt-${milestone.id}`,
      receiptNumber: `RCPT-2026-${String(milestone.orderCode)}`,
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      companyName: project.companyName,
      enterpriseUserId: project.ownerUserId,
      grossAmountVnd: milestone.amount,
      splitBreakdown: {
        team70AmountVnd: split.teamAmount70,
        mentor20AmountVnd: split.mentorAmount20,
        lab10AmountVnd: split.labAmount10,
        remainderAbsorbedByLabVnd: split.remainderAbsorbedByLab,
      },
      payoutExecutionStatus:
        payoutOrders.length === 3
          ? 'PAID_OUT_COMPLETED'
          : 'PENDING_BANK_TRANSFER',
      teamMemberAllocations: teamAllocations,
      issuedAt: milestone.acceptedAt || new Date().toISOString(),
    };
  }

  private findMilestoneAcrossProjects(user: JwtPayload, milestoneId: string) {
    const allProjects = this.proposalRepository.findAll();
    const sysReader: JwtPayload = {
      sub: user.sub,
      email: user.email,
      role: UserRole.SYSTEM_ADMIN,
      status: user.status,
    };

    for (const proj of allProjects) {
      const ledger = this.financeEscrowService.getProjectFinanceLedger(
        sysReader,
        proj.id,
      );
      const foundMs = ledger.milestones.find((m) => m.id === milestoneId);
      if (foundMs) {
        return { project: proj, milestone: foundMs };
      }
    }

    throw new NotFoundException(`Không tìm thấy cột mốc ${milestoneId}.`);
  }
}