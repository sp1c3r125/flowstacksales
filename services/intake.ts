import type { AppState, IngestData } from '../types';
<<<<<<< HEAD
import { recommendPackage, serviceCatalog, type PackageKey } from './catalog';
=======
import { packageOrder, recommendPackage, serviceCatalog, type PackageKey } from './catalog';
>>>>>>> origin/main

const packageRank: Record<PackageKey, number> = {
  lite: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

<<<<<<< HEAD
export const recommendPackageFromInputs = (monthlyLeakage: number, ingest: IngestData): PackageKey => {
  let recommended = recommendPackage(monthlyLeakage);

  const sourceCount = ingest.leadSources.length;
  const volume = Number(ingest.messagesPerDay || 0);

  if (ingest.needsStaffRouting || ingest.multipleOffers || volume >= 40 || sourceCount >= 3) {
    recommended = packageRank[recommended] < packageRank.scale ? 'scale' : recommended;
  } else if (ingest.needsBooking && (volume >= 10 || sourceCount >= 2 || monthlyLeakage >= 60000)) {
    recommended = packageRank[recommended] < packageRank.growth ? 'growth' : recommended;
  } else if (ingest.needsBooking || volume >= 3 || sourceCount >= 1) {
=======
const toTitleCase = (value: string) => value
  .split(' ')
  .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word)
  .join(' ');

const normalizeSourceList = (leadSource: string) => leadSource
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)
  .map(toTitleCase);

export const recommendPackageFromInputs = (monthlyLeakage: number, ingest: IngestData): PackageKey => {
  let recommended = recommendPackage(monthlyLeakage);

  const leadSources = normalizeSourceList(ingest.leadSource);
  const volume = Number(ingest.messagesPerDay || 0);

  if (ingest.needsStaffRouting || ingest.multipleOffers || volume >= 40 || leadSources.length >= 3) {
    recommended = packageRank[recommended] < packageRank.scale ? 'scale' : recommended;
  } else if (ingest.needsBooking && (volume >= 10 || leadSources.length >= 2 || monthlyLeakage >= 60000)) {
    recommended = packageRank[recommended] < packageRank.growth ? 'growth' : recommended;
  } else if (ingest.needsBooking || volume >= 3 || leadSources.length >= 1) {
>>>>>>> origin/main
    recommended = packageRank[recommended] < packageRank.starter ? 'starter' : recommended;
  }

  return recommended;
};

export const buildQualificationReason = (packageKey: PackageKey, monthlyLeakage: number, ingest: IngestData): string => {
  const reasons: string[] = [];
  const volume = Number(ingest.messagesPerDay || 0);
<<<<<<< HEAD
  const sourceCount = ingest.leadSources.length;

  if (volume > 0) reasons.push(`${volume} messages/day`);
  if (sourceCount > 0) reasons.push(`${sourceCount} lead source${sourceCount > 1 ? 's' : ''}`);
  if (ingest.needsBooking) reasons.push('needs booking flow');
  if (ingest.multipleOffers) reasons.push('multiple offers');
  if (ingest.needsStaffRouting) reasons.push('staff routing');
  if (ingest.primaryProblem) reasons.push(`main problem: ${ingest.primaryProblem.toLowerCase()}`);
=======
  const sources = normalizeSourceList(ingest.leadSource);

  if (volume > 0) reasons.push(`${volume} messages/day`);
  if (sources.length > 0) reasons.push(`${sources.length} lead source${sources.length > 1 ? 's' : ''}`);
  if (ingest.needsBooking) reasons.push('needs booking flow');
  if (ingest.multipleOffers) reasons.push('multiple offers');
  if (ingest.needsStaffRouting) reasons.push('staff routing');
  if (ingest.bottleneck) reasons.push(`bottleneck: ${ingest.bottleneck.toLowerCase()}`);
>>>>>>> origin/main
  if (monthlyLeakage > 0) reasons.push(`estimated leakage ${monthlyLeakage.toLocaleString('en-PH', { maximumFractionDigits: 0 })}/mo`);

  return `${serviceCatalog[packageKey].name} recommended because of ${reasons.join(', ')}.`;
};

export const buildLeadCapturePayload = (appState: AppState) => {
  const monthlyLeakage = appState.calculatedMetrics?.monthlyLeakage ?? 0;
  const packageKey = recommendPackageFromInputs(monthlyLeakage, appState.ingest);
  const recommendedPackage = serviceCatalog[packageKey].name;
  const qualificationReason = buildQualificationReason(packageKey, monthlyLeakage, appState.ingest);
<<<<<<< HEAD
  const qualificationStatus = 'Qualified';
  const sourceLabel = appState.ingest.leadSources.join(', ');
  const problemDetail = appState.ingest.problemDetail?.trim() ?? '';

  const payload = {
    lead_id: `fs_lead_${Date.now()}`,
    created_at: new Date().toISOString(),
    name: appState.ingest.contactName,
    email: appState.ingest.contactEmail,
    phone: appState.ingest.phone,
    company: appState.ingest.agencyName,
    source: sourceLabel || 'Website',
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
    next_action: 'Review new inbound lead',
    notes: problemDetail
      ? `Primary problem: ${appState.ingest.primaryProblem}. ${problemDetail}`.trim()
      : `Primary problem: ${appState.ingest.primaryProblem}.`,
    lead_sources: appState.ingest.leadSources,
    niche: appState.ingest.niche,
=======
  const leadSources = normalizeSourceList(appState.ingest.leadSource);
  const salesStage = 'New';

  const payload = {
    requestId: `fs_lead_${Date.now()}`,
    source: 'FlowStackOS Intake',
    status: 'New',
    salesStage,
    fullName: appState.ingest.contactName,
    businessName: appState.ingest.agencyName,
    email: appState.ingest.contactEmail,
    phone: appState.ingest.phone,
    niche: appState.ingest.niche,
    leadSource: leadSources,
    messagesPerDay: appState.ingest.messagesPerDay,
    currentProblem: appState.ingest.currentProblem,
    needsBooking: appState.ingest.needsBooking,
    multipleOffers: appState.ingest.multipleOffers,
    needsStaffRouting: appState.ingest.needsStaffRouting,
    crmUsed: appState.ingest.crmUsed,
    bookingLink: appState.ingest.bookingLink,
    recommendedPackage,
    qualificationReason,
    packageInterest: appState.ingest.packageInterest || 'Not Sure',
    notes: `${appState.ingest.bottleneck ? `Primary bottleneck: ${appState.ingest.bottleneck}. ` : ''}${appState.ingest.currentProblem}`.trim(),
>>>>>>> origin/main
  };

  return {
    recommendedPackage,
    qualificationReason,
    packageKey,
    leadPayload: payload,
    airtableFields: {
<<<<<<< HEAD
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      source: payload.source,
      service_need: payload.service_need,
      package_interest: payload.package_interest,
      recommended_package: payload.recommended_package,
      qualification_status: payload.qualification_status,
      qualification_reason: payload.qualification_reason,
      crm_used: payload.crm_used,
      booking_link: payload.booking_link,
      current_problem: payload.current_problem,
      messages_per_day: payload.messages_per_day,
      needs_booking: payload.needs_booking,
      multiple_offers: payload.multiple_offers,
      needs_staff_routing: payload.needs_staff_routing,
      owner: payload.owner,
      next_action: payload.next_action,
      notes: payload.notes,
      lead_id: payload.lead_id,
      created_at: payload.created_at,
      niche: payload.niche,
      lead_sources: payload.lead_sources.join(', '),
    },
  };
};
=======
      'Lead Name': payload.fullName,
      Email: payload.email,
      Phone: payload.phone,
      Company: payload.businessName,
      Source: payload.source,
      Status: payload.status,
      'Sales Stage': payload.salesStage,
      'Messages Per Day': payload.messagesPerDay,
      'Current Problem': payload.currentProblem,
      'Needs Booking': payload.needsBooking,
      'Multiple Offers': payload.multipleOffers,
      'Needs Staff Routing': payload.needsStaffRouting,
      'CRM Used': payload.crmUsed,
      'Booking Link': payload.bookingLink,
      'Recommended Package': payload.recommendedPackage,
      'Qualification Reason': payload.qualificationReason,
      'Package Interest': payload.packageInterest,
      Notes: payload.notes,
      CreatedAt: new Date().toISOString(),
    },
  };
};
>>>>>>> origin/main
