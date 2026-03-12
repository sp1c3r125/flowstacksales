import type { AppState, IngestData } from '../types';
import { packageOrder, recommendPackage, serviceCatalog, type PackageKey } from './catalog';

const packageRank: Record<PackageKey, number> = {
  lite: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

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
    recommended = packageRank[recommended] < packageRank.starter ? 'starter' : recommended;
  }

  return recommended;
};

export const buildQualificationReason = (packageKey: PackageKey, monthlyLeakage: number, ingest: IngestData): string => {
  const reasons: string[] = [];
  const volume = Number(ingest.messagesPerDay || 0);
  const sources = normalizeSourceList(ingest.leadSource);

  if (volume > 0) reasons.push(`${volume} messages/day`);
  if (sources.length > 0) reasons.push(`${sources.length} lead source${sources.length > 1 ? 's' : ''}`);
  if (ingest.needsBooking) reasons.push('needs booking flow');
  if (ingest.multipleOffers) reasons.push('multiple offers');
  if (ingest.needsStaffRouting) reasons.push('staff routing');
  if (ingest.bottleneck) reasons.push(`bottleneck: ${ingest.bottleneck.toLowerCase()}`);
  if (monthlyLeakage > 0) reasons.push(`estimated leakage ${monthlyLeakage.toLocaleString('en-PH', { maximumFractionDigits: 0 })}/mo`);

  return `${serviceCatalog[packageKey].name} recommended because of ${reasons.join(', ')}.`;
};

export const buildLeadCapturePayload = (appState: AppState) => {
  const monthlyLeakage = appState.calculatedMetrics?.monthlyLeakage ?? 0;
  const packageKey = recommendPackageFromInputs(monthlyLeakage, appState.ingest);
  const recommendedPackage = serviceCatalog[packageKey].name;
  const qualificationReason = buildQualificationReason(packageKey, monthlyLeakage, appState.ingest);
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
  };

  return {
    recommendedPackage,
    qualificationReason,
    packageKey,
    leadPayload: payload,
    airtableFields: {
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
