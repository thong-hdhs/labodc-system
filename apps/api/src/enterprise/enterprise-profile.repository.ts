import { Injectable } from '@nestjs/common';
import {
  EnterpriseProfileEntity,
  EnterpriseVerificationStatus,
  UpsertEnterpriseProfileDto,
} from './enterprise-profile.types';

@Injectable()
export class EnterpriseProfileRepository {
  private readonly profilesById = new Map<string, EnterpriseProfileEntity>();
  private sequence = 1;

  findById(id: string): EnterpriseProfileEntity | null {
    return this.profilesById.get(id) ?? null;
  }

  findByOwnerUserId(ownerUserId: string): EnterpriseProfileEntity | null {
    for (const profile of this.profilesById.values()) {
      if (profile.ownerUserId === ownerUserId) {
        return profile;
      }
    }
    return null;
  }

  findByTaxCode(taxCode: string): EnterpriseProfileEntity | null {
    const normalized = taxCode.trim();
    for (const profile of this.profilesById.values()) {
      if (profile.taxCode === normalized) {
        return profile;
      }
    }
    return null;
  }

  findAll(): EnterpriseProfileEntity[] {
    return Array.from(this.profilesById.values());
  }

  create(
    ownerUserId: string,
    dto: UpsertEnterpriseProfileDto,
  ): EnterpriseProfileEntity {
    const now = new Date().toISOString();
    const id = `ent-profile-${this.sequence++}`;
    const entity: EnterpriseProfileEntity = {
      id,
      ownerUserId,
      companyName: dto.companyName.trim(),
      taxCode: dto.taxCode.trim(),
      industry: dto.industry.trim(),
      address: dto.address.trim(),
      website: dto.website?.trim() || '',
      description: dto.description?.trim() || '',
      representativeName: dto.representativeName.trim(),
      contactEmail: dto.contactEmail.trim().toLowerCase(),
      contactPhone: dto.contactPhone.trim(),
      verificationStatus: EnterpriseVerificationStatus.PENDING_VERIFICATION,
      verifiedBy: null,
      verifiedAt: null,
      verificationNote: null,
      createdAt: now,
      updatedAt: now,
    };

    this.profilesById.set(id, entity);
    return entity;
  }

  update(
    id: string,
    dto: Partial<UpsertEnterpriseProfileDto>,
  ): EnterpriseProfileEntity | null {
    const existing = this.profilesById.get(id);
    if (!existing) return null;

    const updated: EnterpriseProfileEntity = {
      ...existing,
      companyName:
        dto.companyName !== undefined
          ? dto.companyName.trim()
          : existing.companyName,
      taxCode:
        dto.taxCode !== undefined ? dto.taxCode.trim() : existing.taxCode,
      industry:
        dto.industry !== undefined ? dto.industry.trim() : existing.industry,
      address:
        dto.address !== undefined ? dto.address.trim() : existing.address,
      website:
        dto.website !== undefined ? dto.website.trim() : existing.website,
      description:
        dto.description !== undefined
          ? dto.description.trim()
          : existing.description,
      representativeName:
        dto.representativeName !== undefined
          ? dto.representativeName.trim()
          : existing.representativeName,
      contactEmail:
        dto.contactEmail !== undefined
          ? dto.contactEmail.trim().toLowerCase()
          : existing.contactEmail,
      contactPhone:
        dto.contactPhone !== undefined
          ? dto.contactPhone.trim()
          : existing.contactPhone,
      updatedAt: new Date().toISOString(),
    };

    this.profilesById.set(id, updated);
    return updated;
  }

  updateVerification(
    id: string,
    status: EnterpriseVerificationStatus.VERIFIED | EnterpriseVerificationStatus.REJECTED,
    actorId: string,
    note?: string,
  ): EnterpriseProfileEntity | null {
    const existing = this.profilesById.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: EnterpriseProfileEntity = {
      ...existing,
      verificationStatus: status,
      verifiedBy: actorId,
      verifiedAt: now,
      verificationNote: note?.trim() || null,
      updatedAt: now,
    };

    this.profilesById.set(id, updated);
    return updated;
  }

  clearAll(): void {
    this.profilesById.clear();
    this.sequence = 1;
  }
}