import type { AppState, IngestData } from '../types';
import {
  recommendPackage,
  serviceCatalog,
  type PackageKey,
  getEnterpriseReasons,
  enterpriseSetupFloor,
} from './catalog';

const packageRank: Record<PackageKey, number> = {
  lite: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

type IntakeRecommendation = {
  packageKey: PackageKey;
  recommendedLabel: string;
  enterpriseReasons: string[];
  needsEnterprise: boolean;
};

export const recommendPackageFromInputs = (monthlyLeakage: number, ingest: IngestData): IntakeRecommendation => {
  let packageKey = recommendPackage(monthlyLeakage);

  const sourceCount = ingest.leadSources.length;
  const volume = Number(ingest.messagesPerDay || 0);

  if (ingest.needsStaffRouting || ingest.multipleOffers || volume >= 40 || sourceCount >= 3) {
    packageKey = packageRank[packageKey] < packageRank.scale ? 'scale' : packageKey;
  } else if (ingest.needsBooking && (volume >= 10 || sourceCount >= 2 || monthlyLeakage >= 60000)) {
    packageKey = packageRank[packageKey] < packageRank.growth ? 'growth' : packageKey;
  } else if (ingest.needsBooking || volume >= 3 || sourceCount >= 1) {
    packageKey = packageRank[packageKey] < packageRank.starter ? 'starter' : packageKey;
  }

  const enterpriseReasons =
    packageKey === 'scale'
      ? getEnterpriseReasons({
          leadSources: sourceCount,
          offers: ingest.multipleOffers ? 5 : 1,
          pipelines: ingest.needsStaffRouting ? 6 : ingest.needsBooking ? 2 : 1,
          sequences: volume >= 40 ? 5 : ingest.needsBooking ? 2 : 1,
          multiLocation: false,
          customDashboard: Boolean(ingest.crmUsed && ingest.crmUsed.trim()),
          heavyCompliance: false,
          complexRoleRouting: ingest.needsStaffRouting,
          nonStandardIntegrations: false,
          unlimitedCustomWork: false,
        })
      : [];

  const needsEnterprise = packageKey === 'scale' && enterpriseReasons.length > 0;
  const recommendedLabel = needsEnterprise ? 'Custom / Enterprise' : serviceCatalog[packageKey].name;

  return {
    packageKey,
    recommendedLabel,
    enterpriseReasons,
    needsEnterprise,
  };
};

export const buildQualificationReason = (
  recommendation: IntakeRecommendation,
  monthlyLeakage: number,
  ingest: IngestData
): string => {
  const reasons: string[] = [];
  const volume = Number(ingest.messagesPerDay || 0);
  const sourceCount = ingest.leadSources.length;

  if (volume > 0) reasons.push(`${volume} messages/day`);
  if (sourceCount > 0) reasons.push(`${sourceCount} lead source${sourceCount > 1 ? 's' : ''}`);
  if (ingest.needsBooking) reasons.push('needs booking flow');
  if (ingest.multipleOffers) reasons.push('multiple offers');
  if (ingest.needsStaffRouting) reasons.push('staff routing');
  if (ingest.primaryProblem) reasons.push(`main problem: ${ingest.primaryProblem.toLowerCase()}`);
  if (monthlyLeakage > 0) {
    reasons.push(`estimated leakage ${monthlyLeakage.toLocaleString('en-PH', { maximumFractionDigits: 0 })}/mo`);
  }

  if (recommendation.needsEnterprise) {
    reasons.push(`enterprise triggers: ${recommendation.enterpriseReasons.join(', ')}`);
    return `Custom / Enterprise required because ${reasons.join(', ')}. Internal enterprise floor starts from ${enterpriseSetupFloor}.`;
  }

  return `${serviceCatalog[recommendation.packageKey].name} recommended because of ${reasons.join(', ')}.`;
};

export const buildLeadCapturePayload = (appState: AppState) => {
  const monthlyLeakage = appState.calculatedMetrics?.monthlyLeakage ?? 0;
  const recommendation = recommendPackageFromInputs(monthlyLeakage, appState.ingest);
  const recommendedPackage = recommendation.recommendedLabel;
  const qualificationReason = buildQualificationReason(recommendation, monthlyLeakage, appState.ingest);
  const qualificationStatus = 'Qualified';
  const leadId = `fs_lead_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const tenantId = 'demo-client';
  const sourceLabel = appState.ingest.leadSources.join(', ');
  const problemDetail = appState.ingest.problemDetail?.trim() ?? '';

  const leadPayload = {
    lead_id: leadId,
    created_at: createdAt,
    name: appState.ingest.contactName,
    email: appState.ingest.contactEmail,
    phone: appState.ingest.phone,
    company: appState.ingest.agencyName,
    source: sourceLabel || 'Website',
    lead_sources: appState.ingest.leadSources,
    niche: appState.ingest.niche,
    service_need: appState.ingest.primaryProblem,
    package_interest: '',
    recommended_package: recommendedPackage,
    qualification_status: qualificationStatus,
    qualification_reason: qualificationReason,
    crm_used: appState.ingest.crmUsed || '',
    booking_link: appState.ingest.bookingLink || '',
    current_problem: problemDetail,
    messages_per_day: appState.ingest.messagesPerDay,
    needs_booking: appState.ingest.needsBooking,
    multiple_offers: appState.ingest.multipleOffers,
    needs_staff_routing: appState.ingest.needsStaffRouting,
    owner: '',
    next_action: recommendation.needsEnterprise ? 'Review enterprise scope' : 'Review new inbound lead',
    notes: problemDetail
      ? `Primary problem: ${appState.ingest.primaryProblem}. ${problemDetail}`.trim()
      : `Primary problem: ${appState.ingest.primaryProblem}.`,
  };

  const airtableFields = {
    lead_id: leadPayload.lead_id,
    created_at: leadPayload.created_at,
    name: leadPayload.name,
    email: leadPayload.email,
    phone: leadPayload.phone,
    company: leadPayload.company,
    source: leadPayload.source,
    service_need: leadPayload.service_need,
    package_interest: leadPayload.package_interest,
    recommended_package: leadPayload.recommended_package,
    qualification_status: leadPayload.qualification_status,
    qualification_reason: leadPayload.qualification_reason,
    crm_used: leadPayload.crm_used,
    booking_link: leadPayload.booking_link,
    current_problem: leadPayload.current_problem,
    messages_per_day: leadPayload.messages_per_day,
    needs_booking: leadPayload.needs_booking,
    multiple_offers: leadPayload.multiple_offers,
    needs_staff_routing: leadPayload.needs_staff_routing,
    owner: leadPayload.owner,
    next_action: leadPayload.next_action,
    notes: leadPayload.notes,
    niche: leadPayload.niche,
    lead_sources: leadPayload.lead_sources.join(', '),
  };

  const activityPayload = {
    activity_id: `act_${Date.now()}`,
    lead_id: leadId,
    tenant_id: tenantId,
    event_name: 'website_intake_submitted',
    event_timestamp: createdAt,
    actor: 'website',
    status: 'success',
    details: `Website intake submitted. Recommended package: ${recommendedPackage}. Qualification: ${qualificationReason}`,
  };

  const metadata = {
    source_app: 'flowstacksales',
    source_step: 'proposal',
    tenant_id: tenantId,
    event_name: 'website_intake_submitted',
    submitted_at: createdAt,
    package_key: recommendation.packageKey,
    package_label: recommendedPackage,
    needs_enterprise_scope: recommendation.needsEnterprise,
  };

  return {
    recommendedPackage,
    qualificationReason,
    packageKey: recommendation.packageKey,
    leadPayload,
    airtableFields,
    activityPayload,
    metadata,
  };
};
