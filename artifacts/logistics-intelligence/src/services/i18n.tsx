import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

/**
 * Centralized Internationalization (i18n) Service & State
 *
 * Single Source of Truth for Language across the complete Driver Field APK.
 * Updates the entire application immediately when language is changed.
 */

export type AppLanguage = 'en' | 'hi' | 'bn' | 'as';

export interface SupportedLanguage {
  code: AppLanguage;
  name: string;
  nativeName: string;
  englishName: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    englishName: 'English',
    script: 'Latin',
  },
  {
    code: 'hi',
    name: 'हिन्दी — Hindi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    script: 'Devanagari',
  },
  {
    code: 'bn',
    name: 'বাংলা — Bengali',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    script: 'Bengali',
  },
  {
    code: 'as',
    name: 'অসমীয়া — Assamese',
    nativeName: 'অসমীয়া',
    englishName: 'Assamese',
    script: 'Assamese',
  },
];

const STORAGE_LANG_KEY = 'field_app_language';
const STORAGE_ONBOARDED_KEY = 'field_language_onboarded';

type LanguageChangeListener = (lang: AppLanguage) => void;
const listeners: Set<LanguageChangeListener> = new Set();

export function detectDeviceLanguage(): AppLanguage {
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('hi')) return 'hi';
      if (navLang.startsWith('bn')) return 'bn';
      if (navLang.startsWith('as')) return 'as';
    }
  } catch {
    // fallback
  }
  return 'en';
}

export function isLanguageOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_ONBOARDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLanguageOnboarded(onboarded: boolean): void {
  try {
    if (onboarded) {
      localStorage.setItem(STORAGE_ONBOARDED_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_ONBOARDED_KEY);
    }
  } catch {
    // ignore
  }
}

export function getAppLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY) as AppLanguage | null;
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return detectDeviceLanguage();
}

export function setAppLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => {
    try {
      listener(lang);
    } catch (e) {
      console.error('Error in language listener:', e);
    }
  });
}

export function subscribeAppLanguage(listener: LanguageChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface TranslationDictionary {
  // Common & Actions
  continueBtn: string;
  saveLanguageBtn: string;
  cancel: string;
  save: string;
  back: string;
  close: string;
  search: string;
  all: string;
  retry: string;
  loading: string;
  yes: string;
  no: string;
  submit: string;

  // 1. Language Screen
  chooseLanguageTitle: string;
  chooseLanguageSubtitle: string;
  searchLanguagePlaceholder: string;

  // 2. Authentication Entry & Brand
  platformTitle: string;
  appTitle: string;
  appSubtitle: string;
  chooseAccessTitle: string;
  roleDriverTitle: string;
  roleDriverDesc: string;
  roleGovTitle: string;
  roleGovDesc: string;
  login: string;
  welcomeBack: string;
  loginSubtitle: string;
  emailOrMobile: string;
  loginPlaceholder: string;
  newHereCreateAccount: string;
  alreadyHaveAccount: string;
  prototypeModeBtn: string;
  prototypeModeSub: string;
  devEvaluation: string;
  govAccessNotice: string;
  govEmailLabel: string;
  govEmailPlaceholder: string;
  govCodeLabel: string;
  govCodePlaceholder: string;
  verifyGovBtn: string;
  govDemoHint: string;
  govUnauthorized: string;

  // 3. Login OTP
  verifyMobileTitle: string;
  verifyMobileSub: (phone: string) => string;
  verifyEmailTitle: string;
  verifyEmailSub: (email: string) => string;
  otpLabel: string;
  verifyAndContinue: string;
  resendCode: string;
  resendIn: (seconds: number) => string;
  changeContact: string;
  otpHint: string;

  // 4. Create New Account & Driver Onboarding
  whoIsThisForTitle: string;
  whoIsThisForSub: string;
  createAccountTitle: string;
  createAccountSub: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  vehicleRegLabel: string;
  vehicleRegPlaceholder: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  emailOptionalLabel: string;
  emailOptionalPlaceholder: string;
  requiredNote: string;
  operationalIdentifierNote: string;
  verifyingVehicle: string;
  checkingVehicle: string;
  vehicleVerified: string;
  authorizedRecordFound: string;
  vehicleFailure: string;
  vehicleFailureSub: string;
  retryVehicleBtn: string;
  accountCreatedTitle: string;
  welcome: (name: string) => string;
  accountLinkedMessage: string;
  continueToDriverApp: string;

  // 5. Navigation & Common
  navHome: string;
  navDelivery: string;
  navRoute: string;
  navAlerts: string;
  navReports: string;
  navProfile: string;
  reportBtn: string;
  unitBadge: string;
  connectedText: string;
  offlineText: string;
  offlineSavedCount: (count: number) => string;
  syncingText: string;
  waitingToSyncText: (count: number) => string;
  offlineTooltip: string;
  pendingSyncTooltip: string;
  openDriverProfile: string;

  // 6. Home View
  operationalDutyHeader: string;
  fleetUnitSubtitle: string;
  currentStatus: string;
  onDuty: string;
  offDuty: string;
  assignedVehicle: string;
  activeDelivery: string;
  assignedRoute: string;
  quickActions: string;
  reportDisruptionAction: string;
  viewDeliveryAction: string;
  viewRouteAction: string;
  alertsSectionTitle: string;
  noActiveAlerts: string;
  recentDisruptionsTitle: string;
  noRecentDisruptions: string;
  viewAllAlerts: string;
  viewAllReports: string;
  quickReportTitle: string;
  quickReportSub: string;
  primaryAlertNotice: string;
  primaryAlertDesc: string;

  // 7. My Delivery View
  consignmentConsignment: string;
  assignedToVehicleSubtitle: (vehId: string) => string;
  reportBlockageBtn: string;
  deliveryDelayedTitle: string;
  deliveryDelayedDesc: string;
  cargoSpecifications: string;
  commodityLabel: string;
  consignmentIdLabel: string;
  weightLabel: string;
  cargoCategoryLabel: string;
  originHubLabel: string;
  destinationDepotLabel: string;
  currentEtaLabel: string;
  etaDelayedNotice: string;
  routeCorridorLabel: string;
  transitTimelineTitle: string;
  departedOrigin: string;
  checkpointAlpha: string;
  haltedMile42: string;
  destinationPending: string;

  // 8. My Route View
  routeTacticalHeader: string;
  reportHazardBtn: string;
  corridorStatusLabel: string;
  aiRouteRiskAssessment: string;
  riskIndexLabel: string;
  corridorMetrics: string;
  totalDistanceLabel: string;
  estimatedTravelTimeLabel: string;
  routeTypeLabel: string;
  roadConditionLabel: string;
  alternateRouteTitle: string;
  alternateRouteSubtitle: string;
  requestRerouteAuth: string;
  incidentsOnRouteTitle: string;
  noIncidentsOnRoute: string;
  rerouteRequested: string;
  rerouteRequestedDesc: string;
  routeMapLabel: string;
  whereAmI: string;
  whatRouteAmIOn: string;
  isRouteSafe: string;
  routeNotSafeVerdict: string;
  routeNotSafeSub: string;
  travelImpactLabel: string;
  whyRouteRisky: string;
  verifiedIncidentsTitle: string;
  clickForDetails: string;
  statusOpen: string;
  routeComparisonTitle: string;
  currentRouteLabel: string;
  alternateRouteLabel: string;

  // 9. Alerts View
  alertsHeaderTitle: string;
  alertsSubtitle: string;
  searchAlertsPlaceholder: string;
  noAlertsFound: string;
  noAlertsFoundDesc: string;
  acknowledgeBtn: string;
  acknowledgedBtn: string;
  viewAffectedRoute: string;
  viewAffectedDelivery: string;
  reportRelatedIncident: string;
  affectedVehicleLabel: string;
  affectedCorridorLabel: string;

  // 10. My Reports View
  myReportsHeaderTitle: string;
  myReportsSubtitle: string;
  newReportBtn: string;
  searchReportsPlaceholder: string;
  noReportsFound: string;
  noReportsFoundDesc: string;
  createNewReport: string;
  viewDetails: string;
  gpsBadge: string;
  photoBadge: string;
  syncFailedBadge: string;
  syncedBadge: string;

  // 11. Report Incident View
  reportIncidentTitle: string;
  reportIncidentSubtitle: string;
  incidentTypeLabel: string;
  incidentTypeSelectPlaceholder: string;
  affectedRouteFormLabel: string;
  locationFormLabel: string;
  locationPlaceholder: string;
  captureGpsBtn: string;
  gpsLocating: string;
  gpsCaptured: (acc: number) => string;
  severityLevelLabel: string;
  observationsLabel: string;
  observationsPlaceholder: string;
  fieldPhotoLabel: string;
  optionalText: string;
  localAttachmentText: string;
  captureOrSelectPhoto: string;
  photoNotice: string;
  submitIncidentBtn: string;
  recordingBtn: string;
  selectSeverityRequired: string;
  selectTypeRequired: string;
  selectDisruptionTypeError: string;
  specifyLocationError: string;
  provideDescriptionError: string;
  failedToRecordIncident: string;
  backToFieldPortal: string;
  reportRoadDisruption: string;
  officialIncidentSubmission: string;
  offlineReadyNoticeTitle: string;
  offlineReadyNoticeDesc: string;
  operatingOfflineNoticeTitle: string;
  operatingOfflineNoticeDesc: string;
  disruptionTypeLabel: string;
  selectedType: string;
  tapToSelect: string;
  affectedCorridorRoute: string;
  optionalLabel: string;
  selectKnownCorridor: string;
  locationCoordinates: string;
  acquiringGps: string;
  useCurrentGps: string;
  hideDetailsAction: string;
  viewDetailsAction: string;
  physicalLocationDesc: string;
  fieldObservationsDesc: string;
  fieldPhotograph: string;
  captureSelectPhoto: string;
  photoLocalNotice: string;
  recording: string;
  submitIncidentReport: string;

  // Incident types
  typeRoadBlockage: string;
  typeLandslide: string;
  typeFlood: string;
  typeAccident: string;
  typeRoadDamage: string;
  typeVehicleIssue: string;
  typeBridgeDamage: string;
  typeOtherIncident: string;

  // Severity labels & descriptions
  sevLow: string;
  sevLowDesc: string;
  sevMedium: string;
  sevMediumDesc: string;
  sevHigh: string;
  sevHighDesc: string;
  sevCritical: string;
  sevCriticalDesc: string;

  // 12. Incident Detail View
  incidentRecordNotFound: string;
  incidentRecordNotFoundDesc: string;
  returnToMyReports: string;
  backToReportsList: string;
  incidentLifecycleProgression: string;
  stepReported: string;
  stepReportedDesc: string;
  stepUnderReview: string;
  stepUnderReviewDesc: string;
  stepResolved: string;
  stepResolvedDesc: string;
  incidentInfoTitle: string;
  timestampFiled: string;
  reportedByLabel: string;
  corridorLocationLabel: string;
  gpsCoordinatesLabel: string;
  fieldObservationsHeader: string;
  attachedPhotoHeader: string;
  dispatchAdvisoryHeader: string;
  dispatchAdvisoryNotice: string;

  // 13. Profile & Settings View
  profileTitle: string;
  backToOperations: string;
  personalInfoTitle: string;
  editProfileBtn: string;
  saveProfileChangesBtn: string;
  fullNameField: string;
  tacticalCallsignField: string;
  contactPhoneField: string;
  officialEmailField: string;
  emergencyContactField: string;
  driverIdSystemField: string;
  unitAssignmentSystemField: string;
  operationalAssignmentTitle: string;
  operationalAssignmentDesc: string;
  assignmentParametersNotice: string;
  accountSettingsTitle: string;
  languageSettingTitle: string;
  languageSettingDesc: string;
  changeLanguageBtn: string;
  changePasswordBtn: string;
  changePasswordDesc: string;
  notificationPreferencesTitle: string;
  criticalCorridorAlerts: string;
  criticalCorridorAlertsDesc: string;
  routeRiskUpdates: string;
  routeRiskUpdatesDesc: string;
  dispatchDirectives: string;
  dispatchDirectivesDesc: string;
  logOut: string;
  logOutDesc: string;
  connectivitySettingsTitle: string;
  bleTitle: string;
  bluetoothModeOn: string;
  bluetoothModeOff: string;
  bluetoothModeDesc: string;
  howItWorksTitle: string;
  howItWorksOnline: string;
  howItWorksOnlineSub: string;
  howItWorksOnlineDesc: string;
  howItWorksOfflineRelay: string;
  howItWorksOfflineRelaySub: string;
  howItWorksOfflineRelayDesc: string;
  howItWorksNoRelay: string;
  howItWorksNoRelaySub: string;
  howItWorksNoRelayDesc: string;
  howItWorksConnReturns: string;
  howItWorksConnReturnsSub: string;
  howItWorksConnReturnsDesc: string;

  // Dynamic status & badge labels
  statusOnDuty: string;
  statusOffDuty: string;
  statusConnected: string;
  statusOffline: string;
  statusPendingSync: string;
  statusSyncing: string;
  statusSynced: string;
  statusSyncFailed: string;
  statusBtRelayed: string;
  statusBtReceived: string;
  statusBlocked: string;
  statusDelayed: string;
  statusAtRisk: string;
  statusAccessible: string;
  statusReported: string;
  statusUnderReview: string;
  statusResolved: string;
  statusCritical: string;
  statusHigh: string;
  statusMedium: string;
  statusLow: string;
  statusWarning: string;
  statusInfo: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    continueBtn: 'Continue →',
    saveLanguageBtn: 'Save Language',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    close: 'Close',
    search: 'Search',
    all: 'All',
    retry: 'Retry',
    loading: 'Loading...',
    yes: 'Yes',
    no: 'No',
    submit: 'Submit',

    chooseLanguageTitle: 'Choose your language',
    chooseLanguageSubtitle: 'Select the language you want to use. You can change this anytime in Settings.',
    searchLanguagePlaceholder: 'Search language...',

    platformTitle: 'GOV LOGISTICS & OPS',
    appTitle: 'VECTOR',
    appSubtitle: 'SAFER ROUTES • STRONGER NORTHEAST',
    chooseAccessTitle: 'Choose your access',
    roleDriverTitle: 'Driver',
    roleDriverDesc: 'Assigned deliveries, routes and field operations',
    roleGovTitle: 'Government Member',
    roleGovDesc: 'Authorized logistics management and monitoring',
    login: 'Login',
    welcomeBack: 'Welcome back',
    loginSubtitle: 'Login to continue to your account.',
    emailOrMobile: 'Email or mobile number',
    loginPlaceholder: 'Enter your registered email or mobile number',
    newHereCreateAccount: 'New here? Create New Account',
    alreadyHaveAccount: 'Already have an account? Login',
    prototypeModeBtn: 'Continue in Prototype Mode',
    prototypeModeSub: 'Prototype Mode: Launches mock session as Driver V. Rawat (BR01AB2044) for interface review.',
    devEvaluation: 'DEVELOPMENT / EVALUATION',
    govAccessNotice:
      'Government access is restricted to authorized logistics directorate officials and requires verified government credentials (@gov.in / @nic.in). Selecting Government Member alone does NOT grant government privileges.',
    govEmailLabel: 'Official Government Email',
    govEmailPlaceholder: 'name@logistics.gov.in',
    govCodeLabel: 'Authorization / Departmental Code (Optional)',
    govCodePlaceholder: 'e.g. GOV-AUTH-2026',
    verifyGovBtn: 'Verify Government Authorization →',
    govDemoHint: 'Demo authorized account: s.sharma@logistics.gov.in',
    govUnauthorized: 'Access requires official department authorization. Check credentials or contact your zonal logistics directorate.',

    verifyMobileTitle: 'Verify your mobile number',
    verifyMobileSub: (phone: string) => `We sent a 6-digit verification code to: ${phone}`,
    verifyEmailTitle: 'Verify your email',
    verifyEmailSub: (email: string) => `We sent a 6-digit verification code to: ${email}`,
    otpLabel: '6-digit OTP input',
    verifyAndContinue: 'Verify & Continue',
    resendCode: 'Resend Code',
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    changeContact: 'Change Email or Mobile Number',
    otpHint: 'Demo verification code: 123456 (or any 6 digits)',

    whoIsThisForTitle: 'Who is this account for?',
    whoIsThisForSub: 'Select your operational role to begin onboarding.',
    createAccountTitle: 'Create your account',
    createAccountSub: 'Register your account to access authorized field operations.',
    fullNameLabel: 'Full name',
    fullNamePlaceholder: 'Enter your full name',
    vehicleRegLabel: 'Vehicle registration number',
    vehicleRegPlaceholder: 'e.g. BR01AB2044',
    mobileLabel: 'Mobile number',
    mobilePlaceholder: '+91 Enter mobile number',
    emailOptionalLabel: 'Email address (Optional)',
    emailOptionalPlaceholder: 'name@example.com',
    requiredNote: 'Mobile is REQUIRED. Email is OPTIONAL.',
    operationalIdentifierNote: 'Vehicle registration number is the operational identifier used during onboarding.',
    verifyingVehicle: 'Verifying vehicle…',
    checkingVehicle: 'Checking vehicle registration and authorized enrollment details.',
    vehicleVerified: 'Vehicle verified',
    authorizedRecordFound: 'Authorized operational record found.',
    vehicleFailure: "We couldn't verify this vehicle.",
    vehicleFailureSub: 'Check the registration number and try again.',
    retryVehicleBtn: 'Check Registration & Retry',
    accountCreatedTitle: 'Account created',
    welcome: (name: string) => `Welcome, ${name}`,
    accountLinkedMessage: 'Your account has been verified and linked to your authorized field operation.',
    continueToDriverApp: 'Continue to VECTOR →',

    navHome: 'Home',
    navDelivery: 'My Delivery',
    navRoute: 'My Route',
    navAlerts: 'Alerts',
    navReports: 'My Reports',
    navProfile: 'Profile',
    reportBtn: 'Report',
    unitBadge: 'Unit 4',
    connectedText: 'Connected • Driver Rawat',
    offlineText: 'Offline • Reports saved on device',
    offlineSavedCount: (count: number) => `Offline • ${count} saved on device`,
    syncingText: 'Syncing...',
    waitingToSyncText: (count: number) =>
      count === 1 ? '1 report waiting to sync' : `${count} reports waiting to sync`,
    offlineTooltip: 'Operating offline. All reports will be saved locally.',
    pendingSyncTooltip: 'Connected. Reports waiting to sync with backend endpoint.',
    openDriverProfile: 'Open Driver Profile',

    operationalDutyHeader: 'Driver Operational Duty',
    fleetUnitSubtitle: 'Fleet Logistics Unit 4 • Corridor Delta Assignment',
    currentStatus: 'Current Status',
    onDuty: 'On Duty',
    offDuty: 'Off Duty',
    assignedVehicle: 'Assigned Vehicle',
    activeDelivery: 'Active Delivery',
    assignedRoute: 'Assigned Route',
    quickActions: 'Quick Actions',
    reportDisruptionAction: 'Report Road Disruption',
    viewDeliveryAction: 'View Delivery',
    viewRouteAction: 'View Route',
    alertsSectionTitle: 'Active System Alerts',
    noActiveAlerts: 'No active critical alerts on your corridor.',
    recentDisruptionsTitle: 'Recent Road Disruptions',
    noRecentDisruptions: 'No disruptions reported recently.',
    viewAllAlerts: 'View All Alerts',
    viewAllReports: 'View All Reports',
    quickReportTitle: 'Need to report a new hazard?',
    quickReportSub: 'Submit road obstructions, weather events, or vehicle incidents directly to Central Dispatch.',
    primaryAlertNotice: 'Corridor Stoppage Alert • Critical',
    primaryAlertDesc: 'Transit halted on Corridor Delta near Mile 42 due to verified blockage.',

    consignmentConsignment: 'Consignment',
    assignedToVehicleSubtitle: (vehId: string) => `Assigned to Vehicle ${vehId} • Officer V. Rawat`,
    reportBlockageBtn: 'Report Blockage',
    deliveryDelayedTitle: 'Delivery Delayed — Corridor Stoppage',
    deliveryDelayedDesc:
      'Transit is currently halted near Mile 42 on Corridor Delta due to verified road blockage. Cargo is secure aboard vehicle. Awaiting road clearance or reroute authorization via ALT-104.',
    cargoSpecifications: 'Cargo & Consignment Specifications',
    commodityLabel: 'Commodity',
    consignmentIdLabel: 'Consignment ID',
    weightLabel: 'Cargo Weight',
    cargoCategoryLabel: 'Cargo Category',
    originHubLabel: 'Origin Hub',
    destinationDepotLabel: 'Destination Depot',
    currentEtaLabel: 'Current ETA',
    etaDelayedNotice: 'Delayed due to Corridor Delta stoppage',
    routeCorridorLabel: 'Route Corridor',
    transitTimelineTitle: 'Transit Progress & Milestones',
    departedOrigin: 'Departed Origin Hub',
    checkpointAlpha: 'Corridor Alpha Checkpoint Cleared',
    haltedMile42: 'Halted at Corridor Delta (Mile 42)',
    destinationPending: 'Destination Arrival (Pending Clearance)',

    routeTacticalHeader: 'My Route & Tactical Navigation',
    reportHazardBtn: 'Report Hazard',
    corridorStatusLabel: 'Corridor Status',
    aiRouteRiskAssessment: 'Corridor Risk & Hazard Assessment',
    riskIndexLabel: 'Corridor Risk Index',
    corridorMetrics: 'Corridor Operating Metrics',
    totalDistanceLabel: 'Total Distance',
    estimatedTravelTimeLabel: 'Estimated Travel Time',
    routeTypeLabel: 'Route Type',
    roadConditionLabel: 'Road Condition',
    alternateRouteTitle: 'Alternate Bypass Route Available',
    alternateRouteSubtitle: 'Authorized detour via Lowland Arterial Bypass',
    requestRerouteAuth: 'Request Reroute Authorization',
    incidentsOnRouteTitle: 'Reported Hazards on Route',
    noIncidentsOnRoute: 'No active hazards reported on this route.',
    rerouteRequested: 'Reroute Authorization Requested',
    rerouteRequestedDesc: 'Central Dispatch is evaluating the detour request for Corridor Delta.',
    routeMapLabel: 'Tactical Corridor Map',
    whereAmI: 'Where Am I?',
    whatRouteAmIOn: 'What Route Am I On?',
    isRouteSafe: 'Is My Route Safe?',
    routeNotSafeVerdict: 'IMMEDIATE SAFETY WARNING: ROUTE NOT SAFE FOR TRANSIT',
    routeNotSafeSub: 'Active critical hazards identified along Corridor Delta. Severe risk of stranding or damage.',
    travelImpactLabel: 'Travel Impact',
    whyRouteRisky: 'Why Is This Route Risky?',
    verifiedIncidentsTitle: 'Verified Incidents on Corridor Delta',
    clickForDetails: 'Tap any card for incident assessment and detour notes',
    statusOpen: 'OPEN',
    routeComparisonTitle: 'Corridor Risk Comparison & Alternate Detour',
    currentRouteLabel: 'Current Route',
    alternateRouteLabel: 'Alternate Bypass Route',

    alertsHeaderTitle: 'Corridor Alerts & Advisories',
    alertsSubtitle: 'Operational notifications for Corridor Delta & Unit 4',
    searchAlertsPlaceholder: 'Search alerts by keyword, corridor, or code...',
    noAlertsFound: 'No alerts found',
    noAlertsFoundDesc: 'No notifications match your selected filter.',
    acknowledgeBtn: 'Acknowledge',
    acknowledgedBtn: 'Acknowledged',
    viewAffectedRoute: 'View Route',
    viewAffectedDelivery: 'View Delivery',
    reportRelatedIncident: 'Report Hazard',
    affectedVehicleLabel: 'Vehicle',
    affectedCorridorLabel: 'Corridor',

    myReportsHeaderTitle: 'My Field Reports',
    myReportsSubtitle: 'Filed by Officer V. Rawat (Unit 4) • Corridor Delta',
    newReportBtn: 'New Report',
    searchReportsPlaceholder: 'Search by ID, route, location...',
    noReportsFound: 'No reports found',
    noReportsFoundDesc: 'No incident reports logged in this filter.',
    createNewReport: 'Create a New Report',
    viewDetails: 'View details',
    gpsBadge: 'GPS',
    photoBadge: 'Photo',
    syncFailedBadge: 'Sync Failed',
    syncedBadge: 'Synced',

    reportIncidentTitle: 'Report Road Disruption',
    reportIncidentSubtitle: 'Submit field incident report to Central Dispatch & Corridor Network',
    incidentTypeLabel: 'Incident Type',
    incidentTypeSelectPlaceholder: 'Select incident type',
    affectedRouteFormLabel: 'Affected Route Corridor',
    locationFormLabel: 'Physical Location / Landmark Description',
    locationPlaceholder: 'e.g. Corridor Delta — Mile 42, 2km north of South Bridge',
    captureGpsBtn: 'Auto-detect via GPS',
    gpsLocating: 'Locating...',
    gpsCaptured: (acc: number) => `GPS captured (±${acc}m accuracy)`,
    severityLevelLabel: 'Severity Level',
    observationsLabel: 'Field Observations & Description',
    observationsPlaceholder: 'Specify extent of blockage, estimated clearance requirements, or equipment needed...',
    fieldPhotoLabel: 'Field Photograph',
    optionalText: '(Optional)',
    localAttachmentText: 'Local Attachment',
    captureOrSelectPhoto: 'Capture or Select Photo',
    photoNotice: 'Honesty Notice: Photos are loaded locally into browser session memory. No remote cloud storage is active in Phase 1.',
    submitIncidentBtn: 'Submit Incident Report',
    recordingBtn: 'Recording...',
    selectSeverityRequired: 'Please select severity level',
    selectTypeRequired: 'Please select incident type',
    selectDisruptionTypeError: 'Please select a disruption type before submitting.',
    specifyLocationError: 'Please specify the corridor or landmark location.',
    provideDescriptionError: 'Please provide observations about the disruption.',
    failedToRecordIncident: 'Failed to record incident.',
    backToFieldPortal: 'Back to Operations',
    reportRoadDisruption: 'Report Road Disruption',
    officialIncidentSubmission: 'Field Incident Submission & Dispatch Relay',
    offlineReadyNoticeTitle: 'Store & Forward Offline Mode Active',
    offlineReadyNoticeDesc: 'Report will be stored locally and relayed via Bluetooth / synchronized automatically upon connection.',
    operatingOfflineNoticeTitle: 'Offline Mode Active',
    operatingOfflineNoticeDesc: 'Your report will be saved locally on this device and synced when connectivity returns.',
    disruptionTypeLabel: 'Disruption Type',
    selectedType: 'Selected',
    tapToSelect: 'Tap to select',
    affectedCorridorRoute: 'Affected Corridor / Route',
    optionalLabel: 'Optional',
    selectKnownCorridor: 'Select a known corridor...',
    locationCoordinates: 'Location & Coordinates',
    acquiringGps: 'Acquiring GPS Fix...',
    useCurrentGps: 'Use Current GPS Fix',
    hideDetailsAction: 'Hide Details',
    viewDetailsAction: 'View Details',
    physicalLocationDesc: 'Physical Location / Landmark Description',
    fieldObservationsDesc: 'Field Observations & Obstruction Description',
    fieldPhotograph: 'Field Photograph',
    captureSelectPhoto: 'Capture / Select Photograph',
    photoLocalNotice: 'Photos remain locally on this device and sync when bandwidth permits.',
    recording: 'Recording incident...',
    submitIncidentReport: 'Submit Incident Report',

    typeRoadBlockage: 'Road Blockage',
    typeLandslide: 'Landslide',
    typeFlood: 'Flood',
    typeAccident: 'Accident',
    typeRoadDamage: 'Road Damage',
    typeVehicleIssue: 'Vehicle Issue',
    typeBridgeDamage: 'Bridge Damage',
    typeOtherIncident: 'Other Field Incident',

    sevLow: 'Low',
    sevLowDesc: 'Minor slowdown, passable',
    sevMedium: 'Medium',
    sevMediumDesc: 'Partial disruption, single lane',
    sevHigh: 'High',
    sevHighDesc: 'Severe obstruction, heavy delay',
    sevCritical: 'Critical',
    sevCriticalDesc: 'Total blockage / Structural collapse',

    incidentRecordNotFound: 'Incident Record Not Found',
    incidentRecordNotFoundDesc: 'The selected report could not be located in current records.',
    returnToMyReports: 'Return to My Reports',
    backToReportsList: 'Back to reports list',
    incidentLifecycleProgression: 'Incident Lifecycle Progression',
    stepReported: 'Reported',
    stepReportedDesc: 'Incident logged by field unit',
    stepUnderReview: 'Under Review',
    stepUnderReviewDesc: 'Control room assessment underway',
    stepResolved: 'Resolved',
    stepResolvedDesc: 'Road cleared & verified',
    incidentInfoTitle: 'Incident Information',
    timestampFiled: 'Timestamp Filed',
    reportedByLabel: 'Reported By',
    corridorLocationLabel: 'Corridor Location',
    gpsCoordinatesLabel: 'GPS Coordinates',
    fieldObservationsHeader: 'Field Observations',
    attachedPhotoHeader: 'Attached Field Photograph',
    dispatchAdvisoryHeader: 'Central Dispatch Advisory',
    dispatchAdvisoryNotice:
      'This report has been prioritized by Central Dispatch. Road maintenance teams and rerouting units have been notified.',

    profileTitle: 'Driver Profile & Account Settings',
    backToOperations: 'Back to Operations',
    personalInfoTitle: 'Personal Information',
    editProfileBtn: 'Edit Profile',
    saveProfileChangesBtn: 'Save Profile Changes',
    fullNameField: 'Full Name',
    tacticalCallsignField: 'Tactical Callsign',
    contactPhoneField: 'Contact Phone',
    officialEmailField: 'Official Email',
    emergencyContactField: 'Emergency Contact / HQ Frequency',
    driverIdSystemField: 'Driver ID (System Controlled)',
    unitAssignmentSystemField: 'Unit Assignment (System Controlled)',
    operationalAssignmentTitle: 'Operational Assignment Context',
    operationalAssignmentDesc: 'Fleet operations assignment managed by Zonal Logistics Directorate',
    assignmentParametersNotice:
      'Assignment parameters (vehicle, route corridor, risk level, and cargo manifest) are controlled by Central Dispatch and cannot be modified by the field operator.',
    accountSettingsTitle: 'Account Settings',
    languageSettingTitle: 'Language',
    languageSettingDesc: 'Select the language you want to use. You can change this anytime.',
    changeLanguageBtn: 'Change Language',
    changePasswordBtn: 'Change Password',
    changePasswordDesc: 'Update security PIN / access password (adapter boundary)',
    notificationPreferencesTitle: 'Notification Preferences',
    criticalCorridorAlerts: 'Critical Corridor Alerts',
    criticalCorridorAlertsDesc: 'Immediate notification for road blockages and disruptions',
    routeRiskUpdates: 'Route Risk Updates',
    routeRiskUpdatesDesc: 'Updates when Corridor Delta weather or hazard index changes',
    dispatchDirectives: 'Dispatch Directives',
    dispatchDirectivesDesc: 'Official advisories regarding ALT-104 bypass routes',
    logOut: 'Log Out',
    logOutDesc: 'Logging out ends this session and returns to the Login screen.',
    connectivitySettingsTitle: 'Connectivity',
    bleTitle: 'Bluetooth Mode',
    bluetoothModeOn: 'Bluetooth Mode ON',
    bluetoothModeOff: 'Bluetooth Mode OFF',
    bluetoothModeDesc: 'Master switch for BLE communication and store-and-forward relay',
    howItWorksTitle: 'How it works',
    howItWorksOnline: 'Online',
    howItWorksOnlineSub: 'Internet available',
    howItWorksOnlineDesc: '→ Operational data can sync normally with the backend.',
    howItWorksOfflineRelay: 'Offline + Nearby Relay',
    howItWorksOfflineRelaySub: 'No internet connection + nearby field device with relay capability.',
    howItWorksOfflineRelayDesc: '→ Data remains locally stored and can be forwarded over Bluetooth.',
    howItWorksNoRelay: 'No Relay Available',
    howItWorksNoRelaySub: 'No internet + no suitable nearby relay device.',
    howItWorksNoRelayDesc: '→ Data remains safely stored locally until connectivity or a relay becomes available.',
    howItWorksConnReturns: 'Connectivity Returns',
    howItWorksConnReturnsSub: 'A device with internet connectivity becomes available.',
    howItWorksConnReturnsDesc: '→ Stored data can be forwarded and synchronized with the backend.',

    statusOnDuty: 'On Duty',
    statusOffDuty: 'Off Duty',
    statusConnected: 'Connected',
    statusOffline: 'Offline',
    statusPendingSync: 'Pending Sync',
    statusSyncing: 'Syncing...',
    statusSynced: 'Synced',
    statusSyncFailed: 'Sync Failed',
    statusBtRelayed: 'Bluetooth Relayed',
    statusBtReceived: 'Bluetooth Received',
    statusBlocked: 'Blocked',
    statusDelayed: 'Delayed',
    statusAtRisk: 'At Risk',
    statusAccessible: 'Accessible',
    statusReported: 'Reported',
    statusUnderReview: 'Under Review',
    statusResolved: 'Resolved',
    statusCritical: 'Critical',
    statusHigh: 'High',
    statusMedium: 'Medium',
    statusLow: 'Low',
    statusWarning: 'Warning',
    statusInfo: 'Info',
  },

  hi: {
    continueBtn: 'आगे बढ़ें →',
    saveLanguageBtn: 'भाषा सहेजें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    back: 'पीछे',
    close: 'बंद करें',
    search: 'खोजें',
    all: 'सभी',
    retry: 'पुनः प्रयास करें',
    loading: 'लोड हो रहा है...',
    yes: 'हाँ',
    no: 'नहीं',
    submit: 'जमा करें',

    chooseLanguageTitle: 'अपनी भाषा चुनें',
    chooseLanguageSubtitle: 'आप जिस भाषा का उपयोग करना चाहते हैं उसे चुनें। आप इसे कभी भी सेटिंग्स में बदल सकते हैं।',
    searchLanguagePlaceholder: 'भाषा खोजें...',

    platformTitle: 'GOV LOGISTICS & OPS',
    appTitle: 'VECTOR',
    appSubtitle: 'SAFER ROUTES • STRONGER NORTHEAST',
    chooseAccessTitle: 'अपनी पहुंच चुनें',
    roleDriverTitle: 'ड्राइवर',
    roleDriverDesc: 'आवंटित डिलीवरी, मार्ग और फील्ड संचालन',
    roleGovTitle: 'सरकारी सदस्य',
    roleGovDesc: 'अधिकृत लॉजिस्टिक्स प्रबंधन और निगरानी',
    login: 'लॉगिन',
    welcomeBack: 'वापसी पर स्वागत है',
    loginSubtitle: 'अपने खाते में जारी रखने के लिए लॉगिन करें।',
    emailOrMobile: 'ईमेल या मोबाइल नंबर',
    loginPlaceholder: 'अपना पंजीकृत ईमेल या मोबाइल नंबर दर्ज करें',
    newHereCreateAccount: 'नए हैं? नया खाता बनाएं',
    alreadyHaveAccount: 'पहले से खाता है? लॉगिन करें',
    prototypeModeBtn: 'प्रोटोटाइप मोड में जारी रखें',
    prototypeModeSub: 'प्रोटोटाइप मोड: समीक्षा के लिए ड्राइवर वी. रावत (BR01AB2044) के रूप में सत्र शुरू करता है।',
    devEvaluation: 'विकास / मूल्यांकन',
    govAccessNotice:
      'सरकारी पहुंच अधिकृत लॉजिस्टिक्स निदेशालय के अधिकारियों तक सीमित है और सत्यापित सरकारी क्रेडेंशियल्स (@gov.in / @nic.in) की आवश्यकता होती है। केवल सरकारी सदस्य चुनने से विशेषाधिकार नहीं मिलते हैं।',
    govEmailLabel: 'आधिकारिक सरकारी ईमेल',
    govEmailPlaceholder: 'name@logistics.gov.in',
    govCodeLabel: 'प्राधिकरण / विभागीय कोड (वैकल्पिक)',
    govCodePlaceholder: 'उदा. GOV-AUTH-2026',
    verifyGovBtn: 'सरकारी प्राधिकरण सत्यापित करें →',
    govDemoHint: 'डेमो अधिकृत खाता: s.sharma@logistics.gov.in',
    govUnauthorized: 'पहुंच के लिए आधिकारिक विभागीय प्राधिकरण की आवश्यकता है।',

    verifyMobileTitle: 'अपना मोबाइल नंबर सत्यापित करें',
    verifyMobileSub: (phone: string) => `हमने इस नंबर पर 6-अंकों का सत्यापन कोड भेजा है: ${phone}`,
    verifyEmailTitle: 'अपना ईमेल सत्यापित करें',
    verifyEmailSub: (email: string) => `हमने इस ईमेल पर 6-अंकों का सत्यापन कोड भेजा है: ${email}`,
    otpLabel: '6-अंकों का ओटीपी इनपुट',
    verifyAndContinue: 'सत्यापित करें और आगे बढ़ें',
    resendCode: 'कोड पुनः भेजें',
    resendIn: (seconds: number) => `${seconds} सेकंड में पुनः भेजें`,
    changeContact: 'ईमेल या मोबाइल नंबर बदलें',
    otpHint: 'डेमो सत्यापन कोड: 123456 (या कोई भी 6 अंक)',

    whoIsThisForTitle: 'यह खाता किसके लिए है?',
    whoIsThisForSub: 'ऑनबोर्डिंग शुरू करने के लिए अपनी परिचालन भूमिका चुनें।',
    createAccountTitle: 'अपना खाता बनाएं',
    createAccountSub: 'अधिकृत फील्ड संचालन तक पहुंच के लिए अपना खाता पंजीकृत करें।',
    fullNameLabel: 'पूरा नाम',
    fullNamePlaceholder: 'अपना पूरा नाम दर्ज करें',
    vehicleRegLabel: 'वाहन पंजीकरण संख्या',
    vehicleRegPlaceholder: 'उदा. BR01AB2044',
    mobileLabel: 'मोबाइल नंबर',
    mobilePlaceholder: '+91 मोबाइल नंबर दर्ज करें',
    emailOptionalLabel: 'ईमेल पता (वैकल्पिक)',
    emailOptionalPlaceholder: 'name@example.com',
    requiredNote: 'मोबाइल अनिवार्य है। ईमेल वैकल्पिक है।',
    operationalIdentifierNote: 'वाहन पंजीकरण संख्या ऑनबोर्डिंग के दौरान उपयोग किया जाने वाला परिचालन पहचानकर्ता है।',
    verifyingVehicle: 'वाहन का सत्यापन हो रहा है…',
    checkingVehicle: 'वाहन पंजीकरण और अधिकृत नामांकन विवरण की जांच की जा रही है।',
    vehicleVerified: 'वाहन सत्यापित',
    authorizedRecordFound: 'अधिकृत परिचालन रिकॉर्ड पाया गया।',
    vehicleFailure: 'हम इस वाहन का सत्यापन नहीं कर सके।',
    vehicleFailureSub: 'पंजीकरण संख्या जांचें और पुनः प्रयास करें।',
    retryVehicleBtn: 'पंजीकरण जांचें और पुनः प्रयास करें',
    accountCreatedTitle: 'खाता बन गया',
    welcome: (name: string) => `स्वागत है, ${name}`,
    accountLinkedMessage: 'आपका खाता सत्यापित हो गया है और आपके अधिकृत फील्ड ऑपरेशन से जुड़ गया है।',
    continueToDriverApp: 'VECTOR जारी रखें →',

    navHome: 'होम',
    navDelivery: 'मेरी डिलीवरी',
    navRoute: 'मेरा मार्ग',
    navAlerts: 'अलर्ट',
    navReports: 'मेरी रिपोर्टें',
    navProfile: 'प्रोफ़ाइल',
    reportBtn: 'रिपोर्ट',
    unitBadge: 'यूनिट 4',
    connectedText: 'कनेक्टेड • ड्राइवर रावत',
    offlineText: 'ऑफ़लाइन • रिपोर्टें डिवाइस पर सहेजी गईं',
    offlineSavedCount: (count: number) => `ऑफ़लाइन • ${count} रिपोर्टें डिवाइस पर सहेजी गईं`,
    syncingText: 'सिंक हो रहा है...',
    waitingToSyncText: (count: number) =>
      count === 1 ? '1 रिपोर्ट सिंक होने की प्रतीक्षा में' : `${count} रिपोर्टें सिंक होने की प्रतीक्षा में`,
    offlineTooltip: 'ऑफ़लाइन कार्य कर रहे हैं। सभी रिपोर्टें डिवाइस पर सहेजी जाएंगी।',
    pendingSyncTooltip: 'कनेक्टेड। रिपोर्टें बैकएंड से सिंक होने की प्रतीक्षा में हैं।',
    openDriverProfile: 'ड्राइवर प्रोफ़ाइल खोलें',

    operationalDutyHeader: 'ड्राइवर परिचालन कर्तव्य',
    fleetUnitSubtitle: 'फ्लीट लॉजिस्टिक्स यूनिट 4 • कॉरिडोर डेल्टा असाइनमेंट',
    currentStatus: 'वर्तमान स्थिति',
    onDuty: 'ड्यूटी पर',
    offDuty: 'ड्यूटी से बाहर',
    assignedVehicle: 'आवंटित वाहन',
    activeDelivery: 'सक्रिय डिलीवरी',
    assignedRoute: 'आवंटित मार्ग',
    quickActions: 'त्वरित कार्रवाई',
    reportDisruptionAction: 'सड़क व्यवधान की रिपोर्ट करें',
    viewDeliveryAction: 'डिलीवरी देखें',
    viewRouteAction: 'मार्ग देखें',
    alertsSectionTitle: 'सक्रिय सिस्टम अलर्ट',
    noActiveAlerts: 'आपके कॉरिडोर पर कोई सक्रिय गंभीर अलर्ट नहीं है।',
    recentDisruptionsTitle: 'हालिया सड़क व्यवधान',
    noRecentDisruptions: 'हाल ही में कोई व्यवधान दर्ज नहीं हुआ।',
    viewAllAlerts: 'सभी अलर्ट देखें',
    viewAllReports: 'सभी रिपोर्टें देखें',
    quickReportTitle: 'क्या नए खतरे की रिपोर्ट करनी है?',
    quickReportSub: 'सड़क अवरोध, मौसम की घटनाओं या वाहन संबंधी समस्याओं की रिपोर्ट सीधे केंद्रीय डिस्पैच को भेजें।',
    primaryAlertNotice: 'कॉरिडोर रुकावट चेतावनी • गंभीर',
    primaryAlertDesc: 'सत्यापित रुकावट के कारण मील 42 के पास कॉरिडोर डेल्टा पर पारगमन रुका हुआ है।',

    consignmentConsignment: 'कंसाइनमेंट',
    assignedToVehicleSubtitle: (vehId: string) => `वाहन ${vehId} को आवंटित • चालक वी. रावत`,
    reportBlockageBtn: 'अवरोध रिपोर्ट करें',
    deliveryDelayedTitle: 'डिलीवरी में देरी — कॉरिडोर रुकावट',
    deliveryDelayedDesc:
      'सत्यापित सड़क रुकावट के कारण वर्तमान में कॉरिडोर डेल्टा पर मील 42 के पास पारगमन रुका हुआ है। माल वाहन पर सुरक्षित है। सड़क निकासी या ALT-104 के माध्यम से मार्ग परिवर्तन की प्रतीक्षा है।',
    cargoSpecifications: 'कार्गो एवं कंसाइनमेंट विनिर्देश',
    commodityLabel: 'सामग्री / वस्तु',
    consignmentIdLabel: 'कंसाइनमेंट आईडी',
    weightLabel: 'कार्गो वजन',
    cargoCategoryLabel: 'कार्गो श्रेणी',
    originHubLabel: 'प्रारंभिक हब',
    destinationDepotLabel: 'गंतव्य डिपो',
    currentEtaLabel: 'वर्तमान अनुमानित समय',
    etaDelayedNotice: 'कॉरिडोर डेल्टा रुकावट के कारण विलंबित',
    routeCorridorLabel: 'मार्ग कॉरिडोर',
    transitTimelineTitle: 'पारगमन प्रगति और मील के पत्थर',
    departedOrigin: 'प्रारंभिक हब से रवाना',
    checkpointAlpha: 'कॉरिडोर अल्फा चेकपॉइंट पार',
    haltedMile42: 'कॉरिडोर डेल्टा (मील 42) पर रुका',
    destinationPending: 'गंतव्य आगमन (निकासी प्रतीक्षित)',

    routeTacticalHeader: 'मेरा मार्ग एवं सामरिक नेविगेशन',
    reportHazardBtn: 'खतरे की रिपोर्ट करें',
    corridorStatusLabel: 'कॉरिडोर स्थिति',
    aiRouteRiskAssessment: 'कॉरिडोर जोखिम एवं खतरा मूल्यांकन',
    riskIndexLabel: 'कॉरिडोर जोखिम सूचकांक',
    corridorMetrics: 'कॉरिडोर परिचालन मेट्रिक्स',
    totalDistanceLabel: 'कुल दूरी',
    estimatedTravelTimeLabel: 'अनुमानित यात्रा समय',
    routeTypeLabel: 'मार्ग प्रकार',
    roadConditionLabel: 'सड़क की स्थिति',
    alternateRouteTitle: 'वैकल्पिक बाईपास मार्ग उपलब्ध',
    alternateRouteSubtitle: 'लोलैंड आर्टेरियल बाईपास के माध्यम से अधिकृत मोड़',
    requestRerouteAuth: 'मार्ग परिवर्तन प्राधिकरण का अनुरोध करें',
    incidentsOnRouteTitle: 'मार्ग पर रिपोर्ट किए गए खतरे',
    noIncidentsOnRoute: 'इस मार्ग पर कोई सक्रिय खतरा दर्ज नहीं है।',
    rerouteRequested: 'मार्ग परिवर्तन प्राधिकरण का अनुरोध किया गया',
    rerouteRequestedDesc: 'केंद्रीय डिस्पैच कॉरिडोर डेल्टा के लिए बाईपास अनुरोध की समीक्षा कर रहा है।',
    routeMapLabel: 'सामरिक कॉरिडोर मानचित्र',
    whereAmI: 'मैं कहाँ हूँ?',
    whatRouteAmIOn: 'मैं किस मार्ग पर हूँ?',
    isRouteSafe: 'क्या मेरा मार्ग सुरक्षित है?',
    routeNotSafeVerdict: 'तात्कालिक सुरक्षा चेतावनी: मार्ग पारगमन के लिए सुरक्षित नहीं है',
    routeNotSafeSub: 'कॉरिडोर डेल्टा पर सक्रिय गंभीर खतरे पाए गए हैं। फंसने या क्षति का अत्यधिक जोखिम है।',
    travelImpactLabel: 'यात्रा प्रभाव',
    whyRouteRisky: 'यह मार्ग जोखिम भरा क्यों है?',
    verifiedIncidentsTitle: 'मार्ग पर सत्यापित घटनाएँ',
    clickForDetails: 'घटना के विवरण और डायवर्जन के लिए किसी भी कार्ड पर टैप करें',
    statusOpen: 'खुला',
    routeComparisonTitle: 'कॉरिडोर जोखिम तुलना और वैकल्पिक मार्ग',
    currentRouteLabel: 'वर्तमान मार्ग',
    alternateRouteLabel: 'वैकल्पिक बाईपास मार्ग',

    alertsHeaderTitle: 'कॉरिडोर अलर्ट एवं सलाह',
    alertsSubtitle: 'कॉरिडोर डेल्टा और यूनिट 4 के लिए परिचालन सूचनाएं',
    searchAlertsPlaceholder: 'कीवर्ड, कॉरिडोर या कोड द्वारा अलर्ट खोजें...',
    noAlertsFound: 'कोई अलर्ट नहीं मिला',
    noAlertsFoundDesc: 'आपके चयनित फ़िल्टर से कोई सूचना मेल नहीं खाती।',
    acknowledgeBtn: 'स्वीकार करें',
    acknowledgedBtn: 'स्वीकार किया गया',
    viewAffectedRoute: 'मार्ग देखें',
    viewAffectedDelivery: 'डिलीवरी देखें',
    reportRelatedIncident: 'खतरे की रिपोर्ट करें',
    affectedVehicleLabel: 'वाहन',
    affectedCorridorLabel: 'कॉरिडोर',

    myReportsHeaderTitle: 'मेरी फील्ड रिपोर्टें',
    myReportsSubtitle: 'अधिकारी वी. रावत (यूनिट 4) द्वारा दर्ज • कॉरिडोर डेल्टा',
    newReportBtn: 'नई रिपोर्ट',
    searchReportsPlaceholder: 'आईडी, मार्ग, स्थान से खोजें...',
    noReportsFound: 'कोई रिपोर्ट नहीं मिली',
    noReportsFoundDesc: 'इस फ़िल्टर में कोई घटना रिपोर्ट दर्ज नहीं है।',
    createNewReport: 'नई रिपोर्ट बनाएं',
    viewDetails: 'विवरण देखें',
    gpsBadge: 'जीपीएस',
    photoBadge: 'फोटो',
    syncFailedBadge: 'सिंक विफल',
    syncedBadge: 'सिंक हो गया',

    reportIncidentTitle: 'सड़क व्यवधान की रिपोर्ट करें',
    reportIncidentSubtitle: 'केंद्रीय डिस्पैच और कॉरिडोर नेटवर्क को फील्ड घटना रिपोर्ट प्रस्तुत करें',
    incidentTypeLabel: 'घटना का प्रकार',
    incidentTypeSelectPlaceholder: 'घटना का प्रकार चुनें',
    affectedRouteFormLabel: 'प्रभावित मार्ग कॉरिडोर',
    locationFormLabel: 'भौतिक स्थान / मील का पत्थर विवरण',
    locationPlaceholder: 'उदा. कॉरिडोर डेल्टा — मील 42, साउथ ब्रिज से 2 किमी उत्तर',
    captureGpsBtn: 'जीपीएस से स्थान पता करें',
    gpsLocating: 'स्थान खोजा जा रहा है...',
    gpsCaptured: (acc: number) => `जीपीएस प्राप्त (±${acc}मी सटीकता)`,
    severityLevelLabel: 'गंभीरता का स्तर',
    observationsLabel: 'फील्ड अवलोकन और विवरण',
    observationsPlaceholder: 'रुकावट की सीमा, निकासी आवश्यकताओं या आवश्यक उपकरणों का विवरण दें...',
    fieldPhotoLabel: 'फील्ड फोटो',
    optionalText: '(वैकल्पिक)',
    localAttachmentText: 'स्थानीय संलग्नक',
    captureOrSelectPhoto: 'फोटो लें या चुनें',
    photoNotice: 'सूचना: तस्वीरें स्थानीय रूप से डिवाइस मेमोरी में लोड होती हैं।',
    submitIncidentBtn: 'घटना रिपोर्ट जमा करें',
    recordingBtn: 'दर्ज किया जा रहा है...',
    selectSeverityRequired: 'कृपया गंभीरता का स्तर चुनें',
    selectTypeRequired: 'कृपया घटना का प्रकार चुनें',
    selectDisruptionTypeError: 'कृपया सबमिट करने से पहले रुकावट का प्रकार चुनें।',
    specifyLocationError: 'कृपया कॉरिडोर या लैंडमार्क स्थान दर्ज करें।',
    provideDescriptionError: 'कृपया रुकावट के बारे में विवरण प्रदान करें।',
    failedToRecordIncident: 'घटना दर्ज करने में विफल।',
    backToFieldPortal: 'ऑपरेशंस पर वापस जाएं',
    reportRoadDisruption: 'सड़क रुकावट की रिपोर्ट करें',
    officialIncidentSubmission: 'फील्ड घटना रिपोर्ट और डिस्पैच रिले',
    offlineReadyNoticeTitle: 'स्टोर और फॉरवर्ड ऑफलाइन मोड सक्रिय',
    offlineReadyNoticeDesc: 'रिपोर्ट स्थानीय रूप से संग्रहीत की जाएगी और ब्लूटूथ द्वारा रिले होगी या कनेक्शन मिलने पर सिंक होगी।',
    operatingOfflineNoticeTitle: 'ऑफलाइन मोड सक्रिय',
    operatingOfflineNoticeDesc: 'आपकी रिपोर्ट इस डिवाइस पर स्थानीय रूप से सुरक्षित रहेगी और कनेक्टिविटी बहाल होने पर सिंक होगी।',
    disruptionTypeLabel: 'रुकावट का प्रकार',
    selectedType: 'चयनित',
    tapToSelect: 'चुनने के लिए टैप करें',
    affectedCorridorRoute: 'प्रभावित कॉरिडोर / मार्ग',
    optionalLabel: 'वैकल्पिक',
    selectKnownCorridor: 'एक ज्ञात कॉरिडोर चुनें...',
    locationCoordinates: 'स्थान और निर्देशांक',
    acquiringGps: 'जीपीएस निर्देशांक प्राप्त कर रहे हैं...',
    useCurrentGps: 'वर्तमान जीपीएस स्थिति का उपयोग करें',
    hideDetailsAction: 'विवरण छिपाएं',
    viewDetailsAction: 'विवरण देखें',
    physicalLocationDesc: 'भौतिक स्थान / लैंडमार्क विवरण',
    fieldObservationsDesc: 'फील्ड अवलोकन और बाधा का विवरण',
    fieldPhotograph: 'फील्ड फोटो',
    captureSelectPhoto: 'फोटो लें / चुनें',
    photoLocalNotice: 'तस्वीरें डिवाइस पर स्थानीय रूप से संग्रहीत रहेंगी और नेटवर्क उपलब्ध होने पर सिंक होंगी।',
    recording: 'घटना दर्ज हो रही है...',
    submitIncidentReport: 'घटना रिपोर्ट जमा करें',

    typeRoadBlockage: 'सड़क रुकावट',
    typeLandslide: 'भूस्खलन',
    typeFlood: 'बाढ़',
    typeAccident: 'दुर्घटना',
    typeRoadDamage: 'सड़क क्षति',
    typeVehicleIssue: 'वाहन समस्या',
    typeBridgeDamage: 'पुल क्षति',
    typeOtherIncident: 'अन्य फील्ड घटना',

    sevLow: 'कम',
    sevLowDesc: 'मामूली धीमापन, रास्ता चालू',
    sevMedium: 'मध्यम',
    sevMediumDesc: 'आंशिक व्यवधान, एकल लेन',
    sevHigh: 'उच्च',
    sevHighDesc: 'गंभीर बाधा, भारी देरी',
    sevCritical: 'अत्यंत गंभीर',
    sevCriticalDesc: 'पूर्ण रुकावट / संरचनात्मक क्षति',

    incidentRecordNotFound: 'घटना रिकॉर्ड नहीं मिला',
    incidentRecordNotFoundDesc: 'वर्तमान रिकॉर्ड में चयनित रिपोर्ट नहीं मिल सकी।',
    returnToMyReports: 'मेरी रिपोर्टों पर लौटें',
    backToReportsList: 'रिपोर्ट सूची पर वापस जाएं',
    incidentLifecycleProgression: 'घटना जीवनचक्र प्रगति',
    stepReported: 'रिपोर्ट की गई',
    stepReportedDesc: 'फील्ड यूनिट द्वारा घटना दर्ज',
    stepUnderReview: 'समीक्षाधीन',
    stepUnderReviewDesc: 'नियंत्रण कक्ष द्वारा मूल्यांकन जारी',
    stepResolved: 'समाधान हुआ',
    stepResolvedDesc: 'मार्ग साफ एवं सत्यापित',
    incidentInfoTitle: 'घटना की जानकारी',
    timestampFiled: 'दर्ज करने का समय',
    reportedByLabel: 'रिपोर्टकर्ता',
    corridorLocationLabel: 'कॉरिडोर स्थान',
    gpsCoordinatesLabel: 'जीपीएस निर्देशांक',
    fieldObservationsHeader: 'फील्ड अवलोकन',
    attachedPhotoHeader: 'संलग्न फील्ड फोटो',
    dispatchAdvisoryHeader: 'केंद्रीय डिस्पैच सलाह',
    dispatchAdvisoryNotice:
      'इस रिपोर्ट को केंद्रीय डिस्पैच द्वारा प्राथमिकता दी गई है। सड़क रखरखाव दल और मार्ग-परिवर्तन इकाइयों को सूचित कर दिया गया है।',

    profileTitle: 'ड्राइवर प्रोफ़ाइल और खाता सेटिंग्स',
    backToOperations: 'ऑपरेशंस पर वापस जाएं',
    personalInfoTitle: 'व्यक्तिगत जानकारी',
    editProfileBtn: 'प्रोफ़ाइल संपादित करें',
    saveProfileChangesBtn: 'परिवर्तन सहेजें',
    fullNameField: 'पूरा नाम',
    tacticalCallsignField: 'सामरिक कॉलसाइन',
    contactPhoneField: 'संपर्क फोन',
    officialEmailField: 'आधिकारिक ईमेल',
    emergencyContactField: 'आपातकालीन संपर्क / मुख्यालय आवृत्ति',
    driverIdSystemField: 'ड्राइवर आईडी (सिस्टम नियंत्रित)',
    unitAssignmentSystemField: 'यूनिट असाइनमेंट (सिस्टम नियंत्रित)',
    operationalAssignmentTitle: 'परिचालन असाइनमेंट संदर्भ',
    operationalAssignmentDesc: 'जोनल लॉजिस्टिक्स निदेशालय द्वारा प्रबंधित फ्लीट संचालन असाइनमेंट',
    assignmentParametersNotice:
      'असाइनमेंट पैरामीटर (वाहन, मार्ग कॉरिडोर, जोखिम स्तर, और कार्गो) केंद्रीय डिस्पैच द्वारा नियंत्रित होते हैं और इन्हें फील्ड ऑपरेटर द्वारा संशोधित नहीं किया जा सकता है।',
    accountSettingsTitle: 'खाता सेटिंग्स',
    languageSettingTitle: 'भाषा',
    languageSettingDesc: 'आप जिस भाषा का उपयोग करना चाहते हैं उसे चुनें। आप इसे कभी भी बदल सकते हैं।',
    changeLanguageBtn: 'भाषा बदलें',
    changePasswordBtn: 'पासवर्ड बदलें',
    changePasswordDesc: 'सुरक्षा पिन / एक्सेस पासवर्ड अपडेट करें',
    notificationPreferencesTitle: 'अधिसूचना प्राथमिकताएं',
    criticalCorridorAlerts: 'गंभीर कॉरिडोर अलर्ट',
    criticalCorridorAlertsDesc: 'सड़क रुकावटों और व्यवधानों के लिए तत्काल सूचना',
    routeRiskUpdates: 'मार्ग जोखिम अपडेट',
    routeRiskUpdatesDesc: 'कॉरिडोर डेल्टा मौसम या खतरे का सूचकांक बदलने पर अपडेट',
    dispatchDirectives: 'डिस्पैच निर्देश',
    dispatchDirectivesDesc: 'ALT-104 बाईपास मार्गों से संबंधित आधिकारिक सलाह',
    logOut: 'लॉग आउट',
    logOutDesc: 'लॉग आउट करने से यह सत्र समाप्त हो जाता है और लॉगिन स्क्रीन पर लौट आता है।',
    connectivitySettingsTitle: 'कनेक्टिविटी',
    bleTitle: 'ब्लूटूथ मोड',
    bluetoothModeOn: 'ब्लूटूथ मोड चालू',
    bluetoothModeOff: 'ब्लूटूथ मोड बंद',
    bluetoothModeDesc: 'बीएलई संचार और स्टोर-एंड-फॉरवर्ड रिले के लिए मास्टर स्विच',
    howItWorksTitle: 'यह कैसे काम करता है',
    howItWorksOnline: 'ऑनलाइन',
    howItWorksOnlineSub: 'इंटरनेट उपलब्ध है',
    howItWorksOnlineDesc: '→ परिचालन डेटा सामान्य रूप से बैकएंड से सिंक हो सकता है।',
    howItWorksOfflineRelay: 'ऑफ़लाइन + नजदीकी रिले',
    howItWorksOfflineRelaySub: 'कोई इंटरनेट कनेक्शन नहीं + रिले क्षमता वाला नजदीकी फील्ड डिवाइस।',
    howItWorksOfflineRelayDesc: '→ डेटा डिवाइस पर सहेजा रहता है और ब्लूटूथ के जरिए भेजा जा सकता है।',
    howItWorksNoRelay: 'कोई रिले उपलब्ध नहीं',
    howItWorksNoRelaySub: 'इंटरनेट नहीं + कोई उपयुक्त नजदीकी रिले डिवाइस नहीं।',
    howItWorksNoRelayDesc: '→ डेटा कनेक्टिविटी या रिले उपलब्ध होने तक सुरक्षित रूप से डिवाइस पर रहता है।',
    howItWorksConnReturns: 'कनेक्टिविटी वापस आ गई',
    howItWorksConnReturnsSub: 'इंटरनेट कनेक्टिविटी वाला डिवाइस उपलब्ध हो जाता है।',
    howItWorksConnReturnsDesc: '→ सहेजा गया डेटा बैकएंड के साथ अग्रेषित और सिंक किया जा सकता है।',

    statusOnDuty: 'ड्यूटी पर',
    statusOffDuty: 'ड्यूटी समाप्त',
    statusConnected: 'कनेक्टेड',
    statusOffline: 'ऑफ़लाइन',
    statusPendingSync: 'सिंक प्रतीक्षित',
    statusSyncing: 'सिंक हो रहा है...',
    statusSynced: 'सिंक हुआ',
    statusSyncFailed: 'सिंक विफल',
    statusBtRelayed: 'ब्लूटूथ रिले हुआ',
    statusBtReceived: 'ब्लूटूथ प्राप्त हुआ',
    statusBlocked: 'अवरुद्ध',
    statusDelayed: 'विलंबित',
    statusAtRisk: 'जोखिम में',
    statusAccessible: 'सुगम',
    statusReported: 'रिपोर्ट किया गया',
    statusUnderReview: 'समीक्षाधीन',
    statusResolved: 'समाधान हुआ',
    statusCritical: 'अत्यंत गंभीर',
    statusHigh: 'उच्च',
    statusMedium: 'मध्यम',
    statusLow: 'कम',
    statusWarning: 'चेतावनी',
    statusInfo: 'सूचना',
  },

  bn: {
    continueBtn: 'এগিয়ে যান →',
    saveLanguageBtn: 'ভাষা সংরক্ষণ করুন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ',
    back: 'ফিরে যান',
    close: 'বন্ধ করুন',
    search: 'সন্ধান করুন',
    all: 'সমস্ত',
    retry: 'পুনরায় চেষ্টা করুন',
    loading: 'লোড হচ্ছে...',
    yes: 'হ্যাঁ',
    no: 'না',
    submit: 'জমা দিন',

    chooseLanguageTitle: 'আপনার ভাষা চয়ন করুন',
    chooseLanguageSubtitle: 'আপনি যে ভাষা ব্যবহার করতে চান তা নির্বাচন করুন। আপনি সেটিংসে যেকোনো সময় এটি পরিবর্তন করতে পারেন।',
    searchLanguagePlaceholder: 'ভাষা খুঁজুন...',

    platformTitle: 'GOV LOGISTICS & OPS',
    appTitle: 'VECTOR',
    appSubtitle: 'SAFER ROUTES • STRONGER NORTHEAST',
    chooseAccessTitle: 'আপনার অ্যাক্সেস চয়ন করুন',
    roleDriverTitle: 'ড্রাইভার',
    roleDriverDesc: 'নির্ধারিত ডেলিভারি, রুট এবং ফিল্ড অপারেশন',
    roleGovTitle: 'সরকারি সদস্য',
    roleGovDesc: 'অনুমোদিত লজিস্টিকস ব্যবস্থাপনা এবং পর্যবেক্ষণ',
    login: 'লগইন',
    welcomeBack: 'স্বাগতম',
    loginSubtitle: 'আপনার অ্যাকাউন্টে চালিয়ে যেতে লগইন করুন।',
    emailOrMobile: 'ইমেল বা মোবাইল নম্বর',
    loginPlaceholder: 'আপনার নিবন্ধিত ইমেল বা মোবাইল নম্বর লিখুন',
    newHereCreateAccount: 'নতুন এখানে? নতুন অ্যাকাউন্ট তৈরি করুন',
    alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন',
    prototypeModeBtn: 'প্রোটোটাইপ মোডে চালিয়ে যান',
    prototypeModeSub: 'প্রোটোটাইপ মোড: পর্যালোচনার জন্য ড্রাইভার ভি. রাওয়াত (BR01AB2044) হিসাবে মক সেশন চালু করে।',
    devEvaluation: 'উন্নয়ন / মূল্যায়ন',
    govAccessNotice:
      'সরকারি অ্যাক্সেস অনুমোদিত লজিস্টিক অধিদপ্তরের কর্মকর্তাদের জন্য সীমাবদ্ধ এবং সরকারি প্রমাণপত্র প্রয়োজন।',
    govEmailLabel: 'অফিসিয়াল সরকারি ইমেল',
    govEmailPlaceholder: 'name@logistics.gov.in',
    govCodeLabel: 'অনুমোদন / বিভাগীয় কোড (ঐচ্ছিক)',
    govCodePlaceholder: 'যেমন GOV-AUTH-2026',
    verifyGovBtn: 'সরকারি অনুমোদন যাচাই করুন →',
    govDemoHint: 'ডেমো অনুমোদিত অ্যাকাউন্ট: s.sharma@logistics.gov.in',
    govUnauthorized: 'প্রবেশাধিকারের জন্য অফিসিয়াল অনুমোদন প্রয়োজন।',

    verifyMobileTitle: 'আপনার মোবাইল নম্বর যাচাই করুন',
    verifyMobileSub: (phone: string) => `আমরা এই নম্বরে ৬-সংখ্যার যাচাইকরণ কোড পাঠিয়েছি: ${phone}`,
    verifyEmailTitle: 'আপনার ইমেল যাচাই করুন',
    verifyEmailSub: (email: string) => `আমরা এই ইমেলে ৬-সংখ্যার যাচাইকরণ কোড পাঠিয়েছি: ${email}`,
    otpLabel: '৬-সংখ্যার ওটিপি ইনপুট',
    verifyAndContinue: 'যাচাই করুন এবং এগিয়ে যান',
    resendCode: 'কোড পুনরায় পাঠান',
    resendIn: (seconds: number) => `${seconds} সেকেন্ডে পুনরায় পাঠান`,
    changeContact: 'ইমেল বা মোবাইল নম্বর পরিবর্তন করুন',
    otpHint: 'ডেমো যাচাইকরণ কোড: 123456 (বা যেকোনো ৬ সংখ্যা)',

    whoIsThisForTitle: 'এই অ্যাকাউন্ট কার জন্য?',
    whoIsThisForSub: 'অনবোর্ডিং শুরু করতে আপনার অপারেশনাল ভূমিকা নির্বাচন করুন।',
    createAccountTitle: 'আপনার অ্যাকাউন্ট তৈরি করুন',
    createAccountSub: 'অনুমোদিত ফিল্ড অপারেশনে অ্যাক্সেসের জন্য আপনার অ্যাকাউন্ট নিবন্ধন করুন।',
    fullNameLabel: 'পুরো নাম',
    fullNamePlaceholder: 'আপনার পুরো নাম লিখুন',
    vehicleRegLabel: 'যানবাহন নিবন্ধন নম্বর',
    vehicleRegPlaceholder: 'যেমন BR01AB2044',
    mobileLabel: 'মোবাইল নম্বর',
    mobilePlaceholder: '+91 মোবাইল নম্বর লিখুন',
    emailOptionalLabel: 'ইমেল ঠিকানা (ঐচ্ছিক)',
    emailOptionalPlaceholder: 'name@example.com',
    requiredNote: 'মোবাইল আবশ্যক। ইমেল ঐচ্ছিক।',
    operationalIdentifierNote: 'যানবাহন নিবন্ধন নম্বর হলো অনবোর্ডিংয়ের সময় ব্যবহৃত অপারেশনাল শনাক্তকারী।',
    verifyingVehicle: 'যানবাহন যাচাই করা হচ্ছে…',
    checkingVehicle: 'যানবাহন নিবন্ধন এবং অনুমোদিত তালিকাভুক্তি বিবরণ পরীক্ষা করা হচ্ছে।',
    vehicleVerified: 'যানবাহন যাচাই সম্পন্ন',
    authorizedRecordFound: 'অনুমোদিত অপারেশনাল রেকর্ড পাওয়া গেছে।',
    vehicleFailure: 'আমরা এই যানবাহন যাচাই করতে পারিনি।',
    vehicleFailureSub: 'নিবন্ধন নম্বর পরীক্ষা করে আবার চেষ্টা করুন।',
    retryVehicleBtn: 'নিবন্ধন পরীক্ষা করুন এবং পুনরায় চেষ্টা করুন',
    accountCreatedTitle: 'অ্যাকাউন্ট তৈরি হয়েছে',
    welcome: (name: string) => `স্বাগতম, ${name}`,
    accountLinkedMessage: 'আপনার অ্যাকাউন্ট যাচাই করা হয়েছে এবং অনুমোদিত ফিল্ড অপারেশনের সাথে সংযুক্ত হয়েছে।',
    continueToDriverApp: 'VECTOR-এ এগিয়ে যান →',

    navHome: 'হোম',
    navDelivery: 'আমার ডেলিভারি',
    navRoute: 'আমার রুট',
    navAlerts: 'সতর্কতা',
    navReports: 'আমার রিপোর্ট',
    navProfile: 'প্রোফাইল',
    reportBtn: 'রিপোর্ট',
    unitBadge: 'ইউনিট ৪',
    connectedText: 'সংযুক্ত • ড্রাইভার রাওয়াত',
    offlineText: 'অফলাইন • ডিভাইসে সংরক্ষিত রিপোর্ট',
    offlineSavedCount: (count: number) => `অফলাইন • ${count}টি ডিভাইসে সংরক্ষিত`,
    syncingText: 'সিঙ্ক হচ্ছে...',
    waitingToSyncText: (count: number) =>
      count === 1 ? '১টি রিপোর্ট সিঙ্কের অপেক্ষায়' : `${count}টি রিপোর্ট সিঙ্কের অপেক্ষায়`,
    offlineTooltip: 'অফলাইনে কাজ চলছে। সমস্ত রিপোর্ট ডিভাইসে সংরক্ষিত থাকবে।',
    pendingSyncTooltip: 'সংযুক্ত। ব্যাকএন্ডে সিঙ্ক হওয়ার অপেক্ষায়।',
    openDriverProfile: 'ড্রাইভার প্রোফাইল খুলুন',

    operationalDutyHeader: 'ড্রাইভার অপারেশনাল দায়িত্ব',
    fleetUnitSubtitle: 'ফ্লিট লজিস্টিকস ইউনিট ৪ • করিডোর ডেল্টা অ্যাসাইনমেন্ট',
    currentStatus: 'বর্তমান অবস্থা',
    onDuty: 'ডিউটিতে আছেন',
    offDuty: 'ডিউটি সমাপ্ত',
    assignedVehicle: 'নির্ধারিত যানবাহন',
    activeDelivery: 'সক্রিয় ডেলিভারি',
    assignedRoute: 'নির্ধারিত রুট',
    quickActions: 'দ্রুত কর্ম',
    reportDisruptionAction: 'রাস্তার বিঘ্ন রিপোর্ট করুন',
    viewDeliveryAction: 'ডেলিভারি দেখুন',
    viewRouteAction: 'রুট দেখুন',
    alertsSectionTitle: 'সক্রিয় সিস্টেম সতর্কতা',
    noActiveAlerts: 'আপনার করিডোরে কোনো সক্রিয় সতর্কতা নেই।',
    recentDisruptionsTitle: 'সাম্প্রতিক রাস্তার বিঘ্ন',
    noRecentDisruptions: 'সম্প্রতি কোনো বিঘ্ন রিপোর্ট করা হয়নি।',
    viewAllAlerts: 'সমস্ত সতর্কতা দেখুন',
    viewAllReports: 'সমস্ত রিপোর্ট দেখুন',
    quickReportTitle: 'নতুন বিপদের রিপোর্ট করতে চান?',
    quickReportSub: 'রাস্তার বাধা, আবহাওয়া বা যানবাহন সংক্রান্ত সমস্যা সরাসরি কেন্দ্রীয় ডিসপ্যাচে পাঠান।',
    primaryAlertNotice: 'করিডোর অবরোধ সতর্কতা • সংকটপূর্ণ',
    primaryAlertDesc: 'যাচাইকৃত বাধার কারণে মাইল ৪২ এর কাছে করিডোর ডেল্টায় চলাচল বন্ধ রয়েছে।',

    consignmentConsignment: 'কনসাইনমেন্ট',
    assignedToVehicleSubtitle: (vehId: string) => `যানবাহন ${vehId} এ বরাদ্দ • অফিসার ভি. রাওয়াত`,
    reportBlockageBtn: 'বাধা রিপোর্ট করুন',
    deliveryDelayedTitle: 'ডেলিভারি বিলম্বিত — করিডোর অবরোধ',
    deliveryDelayedDesc:
      'যাচাইকৃত রাস্তার বাধার কারণে করিডোর ডেল্টায় মাইল ৪২ এর কাছে চলাচল স্থগিত রয়েছে। মালামাল সুরক্ষিত রয়েছে। রাস্তা পরিষ্কার বা ALT-104 বাইপাসের অনুমোদনের অপেক্ষায়।',
    cargoSpecifications: 'কার্গো এবং চালানের বিবরণ',
    commodityLabel: 'পণ্য',
    consignmentIdLabel: 'চালান আইডি',
    weightLabel: 'ওজন',
    cargoCategoryLabel: 'কার্গো বিভাগ',
    originHubLabel: 'উৎস হাব',
    destinationDepotLabel: 'গন্তব্য ডিপো',
    currentEtaLabel: 'বর্তমান প্রত্যাশিত সময়',
    etaDelayedNotice: 'করিডোর ডেল্টায় বাধার কারণে বিলম্বিত',
    routeCorridorLabel: 'রুট করিডোর',
    transitTimelineTitle: 'চলাচল অগ্রগতি এবং মাইলফলক',
    departedOrigin: 'উৎস হাব থেকে রওনা হয়েছে',
    checkpointAlpha: 'করিডোর আলফা চেকপয়েন্ট উত্তীর্ণ',
    haltedMile42: 'করিডোর ডেল্টায় (মাইল ৪২) স্থগিত',
    destinationPending: 'গন্তব্যে পৌঁছানো (অনুমোদনের অপেক্ষায়)',

    routeTacticalHeader: 'আমার রুট এবং কৌশলগত নেভিগেশন',
    reportHazardBtn: 'বিপদ রিপোর্ট করুন',
    corridorStatusLabel: 'করিডোর স্থিতি',
    aiRouteRiskAssessment: 'করিডোর ঝুঁকি ও বিপদ মূল্যায়ন',
    riskIndexLabel: 'ঝুঁকি সূচক',
    corridorMetrics: 'করিডোর অপারেশনাল মেট্রিক্স',
    totalDistanceLabel: 'মোট দূরত্ব',
    estimatedTravelTimeLabel: 'আনুমানিক ভ্রমণের সময়',
    routeTypeLabel: 'রুটের ধরন',
    roadConditionLabel: 'রাস্তার অবস্থা',
    alternateRouteTitle: 'বিকল্প বাইপাস রুট উপলব্ধ',
    alternateRouteSubtitle: 'লোল্যান্ড আর্টেরিয়াল বাইপাসের মাধ্যমে অনুমোদিত পথ',
    requestRerouteAuth: 'রুট পরিবর্তনের অনুমোদনের অনুরোধ করুন',
    incidentsOnRouteTitle: 'রুটে রিপোর্ট করা বিপদ',
    noIncidentsOnRoute: 'এই রুটে কোনো সক্রিয় বিপদ নেই।',
    rerouteRequested: 'রুট পরিবর্তনের অনুরোধ করা হয়েছে',
    rerouteRequestedDesc: 'সেন্ট্রাল ডিসপ্যাচ বিকল্প পথ মূল্যায়ন করছে।',
    routeMapLabel: 'কৌশলগত করিডোর মানচিত্র',
    whereAmI: 'আমি কোথায়?',
    whatRouteAmIOn: 'আমি কোন রুটে আছি?',
    isRouteSafe: 'আমার রুট কি নিরাপদ?',
    routeNotSafeVerdict: 'জরুরি নিরাপত্তা সতর্কতা: যাতায়াতের জন্য রুট নিরাপদ নয়',
    routeNotSafeSub: 'করিডোর ডেল্টায় সক্রিয় গুরুতর ঝুঁকি শনাক্ত করা হয়েছে। আটকে পড়ার প্রবল ঝুঁকি রয়েছে।',
    travelImpactLabel: 'ভ্রমণের প্রভাব',
    whyRouteRisky: 'এই রুটটি কেন ঝুঁকিপূর্ণ?',
    verifiedIncidentsTitle: 'রুটের যাচাইকৃত ঘটনাবলী',
    clickForDetails: 'ঘটনার মূল্যায়ন ও বিকল্প রুটের তথ্যের জন্য যেকোনো কার্ডে ট্যাপ করুন',
    statusOpen: 'খোলা',
    routeComparisonTitle: 'করিডোর ঝুঁকি তুলনা ও বিকল্প বাইপাস',
    currentRouteLabel: 'বর্তমান রুট',
    alternateRouteLabel: 'বিকল্প বাইপাস রুট',

    alertsHeaderTitle: 'করিডোর সতর্কতা ও পরামর্শ',
    alertsSubtitle: 'করিডোর ডেল্টা এবং ইউনিট ৪ এর জন্য অপারেশনাল বিজ্ঞপ্তি',
    searchAlertsPlaceholder: 'কীওয়ার্ড বা কোড দিয়ে অনুসন্ধান করুন...',
    noAlertsFound: 'কোনো সতর্কতা পাওয়া যায়নি',
    noAlertsFoundDesc: 'আপনার ফিল্টারের সাথে কোনো বিজ্ঞপ্তি মেলেনি।',
    acknowledgeBtn: 'স্বীকার করুন',
    acknowledgedBtn: 'স্বীকৃত',
    viewAffectedRoute: 'রুট দেখুন',
    viewAffectedDelivery: 'ডেলিভারি দেখুন',
    reportRelatedIncident: 'বিপদ রিপোর্ট করুন',
    affectedVehicleLabel: 'যানবাহন',
    affectedCorridorLabel: 'করিডোর',

    myReportsHeaderTitle: 'আমার ফিল্ড রিপোর্ট',
    myReportsSubtitle: 'অফিসার ভি. রাওয়াত (ইউনিট ৪) দ্বারা দায়েরকৃত',
    newReportBtn: 'নতুন রিপোর্ট',
    searchReportsPlaceholder: 'আইডি, রুট, অবস্থান দিয়ে অনুসন্ধান করুন...',
    noReportsFound: 'কোনো রিপোর্ট পাওয়া যায়নি',
    noReportsFoundDesc: 'এই ফিল্টারে কোনো রিপোর্ট নথিভুক্ত নেই।',
    createNewReport: 'একটি নতুন রিপোর্ট তৈরি করুন',
    viewDetails: 'বিস্তারিত দেখুন',
    gpsBadge: 'জিপিএস',
    photoBadge: 'ছবি',
    syncFailedBadge: 'সিঙ্ক ব্যর্থ',
    syncedBadge: 'সিঙ্ক সম্পন্ন',

    reportIncidentTitle: 'রাস্তার বিঘ্ন রিপোর্ট করুন',
    reportIncidentSubtitle: 'সেন্ট্রাল ডিসপ্যাচে ফিল্ড রিপোর্ট জমা দিন',
    incidentTypeLabel: 'ঘটনার ধরন',
    incidentTypeSelectPlaceholder: 'ঘটনার ধরন নির্বাচন করুন',
    affectedRouteFormLabel: 'ক্ষতিগ্রস্ত করিডোর',
    locationFormLabel: 'ভৌগোলিক অবস্থান / ল্যান্ডমার্কের বিবরণ',
    locationPlaceholder: 'যেমন করিডোর ডেল্টা — মাইল ৪২, সাউথ ব্রিজের ২ কিমি উত্তরে',
    captureGpsBtn: 'জিপিএস দিয়ে শনাক্ত করুন',
    gpsLocating: 'অবস্থান শনাক্ত করা হচ্ছে...',
    gpsCaptured: (acc: number) => `জিপিএস প্রাপ্ত (±${acc}মি নির্ভুলতা)`,
    severityLevelLabel: 'তীব্রতার মাত্রা',
    observationsLabel: 'ফিল্ড পর্যবেক্ষণ ও বিবরণ',
    observationsPlaceholder: 'বাধার পরিধি, পরিষ্কারের প্রয়োজনীয়তা বা প্রয়োজনীয় সরঞ্জাম উল্লেখ করুন...',
    fieldPhotoLabel: 'ফিল্ড ছবি',
    optionalText: '(ঐচ্ছিক)',
    localAttachmentText: 'স্থানীয় সংযুক্তি',
    captureOrSelectPhoto: 'ছবি তুলুন বা নির্বাচন করুন',
    photoNotice: 'বিজ্ঞপ্তি: ফটোগুলি ব্রাউজারের মেমরিতে স্থানীয়ভাবে লোড হয়।',
    submitIncidentBtn: 'ঘটনা রিপোর্ট জমা দিন',
    recordingBtn: 'রেকর্ড করা হচ্ছে...',
    selectSeverityRequired: 'অনুগ্রহ করে তীব্রতা নির্বাচন করুন',
    selectTypeRequired: 'অনুগ্রহ করে ঘটনার ধরন নির্বাচন করুন',
    selectDisruptionTypeError: 'অনুগ্রহ করে জমা দেওয়ার আগে বিঘ্নতার ধরন নির্বাচন করুন।',
    specifyLocationError: 'অনুগ্রহ করে করিডোর বা ল্যান্ডমার্কের অবস্থান উল্লেখ করুন।',
    provideDescriptionError: 'অনুগ্রহ করে বিঘ্নতা সম্পর্কিত বিবরণ প্রদান করুন।',
    failedToRecordIncident: 'ঘটনা রেকর্ড করতে ব্যর্থ হয়েছে।',
    backToFieldPortal: 'অপারেশনে ফিরে যান',
    reportRoadDisruption: 'রাস্তার বিঘ্নতা রিপোর্ট করুন',
    officialIncidentSubmission: 'ফিল্ড ঘটনা সাবমিশন ও ডিসপ্যাচ রিলে',
    offlineReadyNoticeTitle: 'স্টোর ও ফরওয়ার্ড অফলাইন মোড সক্রিয়',
    offlineReadyNoticeDesc: 'রিপোর্ট স্থানীয়ভাবে সংরক্ষিত হবে এবং ব্লুটুথ দিয়ে রিলে হবে বা নেটওয়ার্ক পেলে সিঙ্ক হবে।',
    operatingOfflineNoticeTitle: 'অফলাইন মোড সক্রিয়',
    operatingOfflineNoticeDesc: 'আপনার রিপোর্ট ডিভাইসে সংরক্ষিত থাকবে এবং সংযোগ ফিরে এলে সিঙ্ক হবে।',
    disruptionTypeLabel: 'বিঘ্নতার ধরন',
    selectedType: 'নির্বাচিত',
    tapToSelect: 'নির্বাচন করতে ট্যাপ করুন',
    affectedCorridorRoute: 'ক্ষতিগ্রস্ত করিডোর / রুট',
    optionalLabel: 'ঐচ্ছিক',
    selectKnownCorridor: 'একটি পরিচিত করিডোর নির্বাচন করুন...',
    locationCoordinates: 'অবস্থান ও স্থানাঙ্ক',
    acquiringGps: 'জিপিএস অবস্থান নেওয়া হচ্ছে...',
    useCurrentGps: 'বর্তমান জিপিএস অবস্থান ব্যবহার করুন',
    hideDetailsAction: 'বিবরণ লুকান',
    viewDetailsAction: 'বিবরণ দেখুন',
    physicalLocationDesc: 'ভৌত অবস্থান / ল্যান্ডমার্কের বিবরণ',
    fieldObservationsDesc: 'ফিল্ড পর্যবেক্ষণ ও বাধার বিবরণ',
    fieldPhotograph: 'ফিল্ড আলোকচিত্র',
    captureSelectPhoto: 'ছবি তুলুন / নির্বাচন করুন',
    photoLocalNotice: 'ছবিগুলি স্থানীয়ভাবে সংরক্ষিত থাকবে এবং ব্যান্ডউইথ থাকলে সিঙ্ক হবে।',
    recording: 'ঘটনা রেকর্ড করা হচ্ছে...',
    submitIncidentReport: 'ঘটনা রিপোর্ট জমা দিন',

    typeRoadBlockage: 'রাস্তার বাধা',
    typeLandslide: 'ভূমিধস',
    typeFlood: 'বন্যা',
    typeAccident: 'দুর্ঘটনা',
    typeRoadDamage: 'রাস্তার ক্ষতি',
    typeVehicleIssue: 'যানবাহন সমস্যা',
    typeBridgeDamage: 'সেতু ক্ষতি',
    typeOtherIncident: 'অন্যান্য ঘটনা',

    sevLow: 'কম',
    sevLowDesc: 'সামান্য ধীরগতি, চলাচলযোগ্য',
    sevMedium: 'মাঝারি',
    sevMediumDesc: 'আংশিক বিঘ্ন, একক লেন',
    sevHigh: 'উচ্চ',
    sevHighDesc: 'গুরুতর বাধা, ভারী বিলম্ব',
    sevCritical: 'সংকটপূর্ণ',
    sevCriticalDesc: 'সম্পূর্ণ অবরুদ্ধ / কাঠামোগত ধস',

    incidentRecordNotFound: 'ঘটনার রেকর্ড পাওয়া যায়নি',
    incidentRecordNotFoundDesc: 'বর্তমান রেকর্ডে নির্বাচিত রিপোর্টটি পাওয়া যায়নি।',
    returnToMyReports: 'আমার রিপোর্টে ফিরে যান',
    backToReportsList: 'রিপোর্ট তালিকায় ফিরে যান',
    incidentLifecycleProgression: 'ঘটনার অগ্রগতি চক্র',
    stepReported: 'রিপোর্ট করা হয়েছে',
    stepReportedDesc: 'ফিল্ড ইউনিট দ্বারা নথিভুক্ত',
    stepUnderReview: 'পর্যালোচনাধীন',
    stepUnderReviewDesc: 'নিয়ন্ত্রণ কক্ষের মূল্যায়ন চলছে',
    stepResolved: 'সমাধান হয়েছে',
    stepResolvedDesc: 'রাস্তা পরিষ্কার ও যাচাইকৃত',
    incidentInfoTitle: 'ঘটনার তথ্য',
    timestampFiled: 'দায়েরের সময়',
    reportedByLabel: 'রিপোর্টার',
    corridorLocationLabel: 'করিডোর অবস্থান',
    gpsCoordinatesLabel: 'জিপিএস স্থানাঙ্ক',
    fieldObservationsHeader: 'ফিল্ড পর্যবেক্ষণ',
    attachedPhotoHeader: 'সংযুক্ত ছবি',
    dispatchAdvisoryHeader: 'সেন্ট্রাল ডিসপ্যাচ পরামর্শ',
    dispatchAdvisoryNotice: 'এই রিপোর্টটি সেন্ট্রাল ডিসপ্যাচ দ্বারা অগ্রাধিকার দেওয়া হয়েছে।',

    profileTitle: 'ড্রাইভার প্রোফাইল এবং অ্যাকাউন্ট সেটিংস',
    backToOperations: 'অপারেশনে ফিরে যান',
    personalInfoTitle: 'ব্যক্তিগত তথ্য',
    editProfileBtn: 'প্রোফাইল সম্পাদনা',
    saveProfileChangesBtn: 'পরিবর্তন সংরক্ষণ করুন',
    fullNameField: 'পুরো নাম',
    tacticalCallsignField: 'কৌশলগত কলসাইন',
    contactPhoneField: 'যোগাযোগের ফোন',
    officialEmailField: 'অফিসিয়াল ইমেল',
    emergencyContactField: 'জরুরি যোগাযোগ / সদর দপ্তর ফ্রিকোয়েন্সি',
    driverIdSystemField: 'ড্রাইভার আইডি (সিস্টেম নিয়ন্ত্রিত)',
    unitAssignmentSystemField: 'ইউনিট বরাদ্দ (সিস্টেম নিয়ন্ত্রিত)',
    operationalAssignmentTitle: 'অপারেশনাল বরাদ্দ প্রসঙ্গ',
    operationalAssignmentDesc: 'জোনাল লজিস্টিক অধিদপ্তর দ্বারা পরিচালিত ফ্লিট অপারেশন বরাদ্দ',
    assignmentParametersNotice: 'অ্যাসাইনমেন্টের প্যারামিটার সেন্ট্রাল ডিসপ্যাচ দ্বারা নিয়ন্ত্রিত।',
    accountSettingsTitle: 'অ্যাকাউন্ট সেটিংস',
    languageSettingTitle: 'ভাষা',
    languageSettingDesc: 'আপনি যে ভাষা ব্যবহার করতে চান তা নির্বাচন করুন। আপনি যেকোনো সময় এটি পরিবর্তন করতে পারেন।',
    changeLanguageBtn: 'ভাষা পরিবর্তন করুন',
    changePasswordBtn: 'পাসওয়ার্ড পরিবর্তন করুন',
    changePasswordDesc: 'নিরাপত্তা পিন / পাসওয়ার্ড আপডেট করুন',
    notificationPreferencesTitle: 'বিজ্ঞপ্তি পছন্দসমূহ',
    criticalCorridorAlerts: 'সংকটপূর্ণ করিডোর সতর্কতা',
    criticalCorridorAlertsDesc: 'রাস্তার বাধা এবং বিঘ্নের জন্য অবিলম্বে বিজ্ঞপ্তি',
    routeRiskUpdates: 'রুট ঝুঁকি আপডেট',
    routeRiskUpdatesDesc: 'করিডোর আবহাওয়া বা বিপদ সূচক পরিবর্তিত হলে আপডেট',
    dispatchDirectives: 'ডিসপ্যাচ নির্দেশিকা',
    dispatchDirectivesDesc: 'বিকল্প রুট সম্পর্কিত অফিসিয়াল পরামর্শ',
    logOut: 'লগ আউট',
    logOutDesc: 'লগ আউট করলে এই সেশন শেষ হবে এবং লগইন স্ক্রিনে ফিরে যাবে।',
    connectivitySettingsTitle: 'কানেক্টিভিটি',
    bleTitle: 'ব্লুটুথ মোড',
    bluetoothModeOn: 'ব্লুটুথ মোড চালু',
    bluetoothModeOff: 'ব্লুটুথ মোড বন্ধ',
    bluetoothModeDesc: 'বিএলই যোগাযোগ এবং স্টোর-অ্যান্ড-ফরোয়ার্ড রিলে করার জন্য মাস্টার সুইচ',
    howItWorksTitle: 'এটি কীভাবে কাজ করে',
    howItWorksOnline: 'অনলাইন',
    howItWorksOnlineSub: 'ইন্টারনেট উপলব্ধ',
    howItWorksOnlineDesc: '→ অপারেশনাল ডেটা ব্যাকএন্ডের সাথে স্বাভাবিকভাবে সিঙ্ক হতে পারে।',
    howItWorksOfflineRelay: 'অফলাইন + কাছাকাছি রিলে',
    howItWorksOfflineRelaySub: 'ইন্টারনেট সংযোগ নেই + রিলে সুবিধাযুক্ত কাছাকাছি ডিভাইস রয়েছে।',
    howItWorksOfflineRelayDesc: '→ ডেটা ডিভাইসে সংরক্ষিত থাকে এবং ব্লুটুথের মাধ্যমে রিলে করা যায়।',
    howItWorksNoRelay: 'কোনো রিলে উপলব্ধ নেই',
    howItWorksNoRelaySub: 'ইন্টারনেট নেই + কোনো উপযুক্ত রিলে ডিভাইস নেই।',
    howItWorksNoRelayDesc: '→ সংযোগ বা রিলে না পাওয়া পর্যন্ত ডেটা নিরাপদে স্থানীয়ভাবে সংরক্ষিত থাকে।',
    howItWorksConnReturns: 'সংযোগ ফিরে এসেছে',
    howItWorksConnReturnsSub: 'ইন্টারনেট সুবিধাযুক্ত ডিভাইস সংযোগ পেয়েছে।',
    howItWorksConnReturnsDesc: '→ সংরক্ষিত ডেটা ফরওয়ার্ড করে ব্যাকএন্ডে সিঙ্ক করা যেতে পারে।',

    statusOnDuty: 'ডিউটিতে আছেন',
    statusOffDuty: 'ডিউটি সমাপ্ত',
    statusConnected: 'সংযুক্ত',
    statusOffline: 'অফলাইন',
    statusPendingSync: 'সিঙ্ক অপেক্ষমাণ',
    statusSyncing: 'সিঙ্ক হচ্ছে...',
    statusSynced: 'সিঙ্ক সম্পন্ন',
    statusSyncFailed: 'সিঙ্ক ব্যর্থ',
    statusBtRelayed: 'ব্লুটুথ রিলে হয়েছে',
    statusBtReceived: 'ব্লুটুথ প্রাপ্ত হয়েছে',
    statusBlocked: 'অবরুদ্ধ',
    statusDelayed: 'বিলম্বিত',
    statusAtRisk: 'ঝুঁকিপূর্ণ',
    statusAccessible: 'চলাচলযোগ্য',
    statusReported: 'রিপোর্ট করা হয়েছে',
    statusUnderReview: 'পর্যালোচনাধীন',
    statusResolved: 'সমাধান হয়েছে',
    statusCritical: 'সংকটপূর্ণ',
    statusHigh: 'উচ্চ',
    statusMedium: 'মাঝারি',
    statusLow: 'কম',
    statusWarning: 'সতর্কতা',
    statusInfo: 'তথ্য',
  },

  as: {
    continueBtn: 'অগ্ৰসৰ হওক →',
    saveLanguageBtn: 'ভাষা সংৰক্ষণ কৰক',
    cancel: 'বাতিল কৰক',
    save: 'সংৰক্ষণ কৰক',
    back: 'উভতি যাওক',
    close: 'বন্ধ কৰক',
    search: 'সন্ধান কৰক',
    all: 'সকলো',
    retry: 'পুনৰ চেষ্টা কৰক',
    loading: 'লোড হৈ আছে...',
    yes: 'হয়',
    no: 'নহয়',
    submit: 'দাখিল কৰক',

    chooseLanguageTitle: 'আপোনাৰ ভাষা বাছক',
    chooseLanguageSubtitle: 'আপুনি ব্যৱহাৰ কৰিব বিচৰা ভাষা বাছক। আপুনি চেটিংছত যিকোনো সময়তে ইয়াক সলনি কৰিব পাৰে।',
    searchLanguagePlaceholder: 'ভাষা সন্ধান কৰক...',

    platformTitle: 'GOV LOGISTICS & OPS',
    appTitle: 'VECTOR',
    appSubtitle: 'SAFER ROUTES • STRONGER NORTHEAST',
    chooseAccessTitle: 'আপোনাৰ প্ৰৱেশাধিকাৰ বাছক',
    roleDriverTitle: 'ড্ৰাইভাৰ',
    roleDriverDesc: 'নিৰ্ধাৰিত ডেলিভাৰী, পথ আৰু ফিল্ড অপাৰেচন',
    roleGovTitle: 'চৰকাৰী সদস্য',
    roleGovDesc: 'অনুমোদিত লজিষ্টিকছ ব্যৱস্থাপনা আৰু নিৰীক্ষণ',
    login: 'লগইন',
    welcomeBack: 'পুনৰ স্বাগতম',
    loginSubtitle: 'আপোনাৰ একাউণ্টত চলি থাকিবলৈ লগইন কৰক।',
    emailOrMobile: 'ইমেইল বা মোবাইল নম্বৰ',
    loginPlaceholder: 'আপোনাৰ পঞ্জীভুক্ত ইমেইল বা মোবাইল নম্বৰ দিয়ক',
    newHereCreateAccount: 'নতুন নেকি? নতুন একাউণ্ট সৃষ্টি কৰক',
    alreadyHaveAccount: 'ইতিমধ্যে একাউণ্ট আছে? লগইন কৰক',
    prototypeModeBtn: 'প্ৰটোটাইপ মোডত অগ্ৰসৰ হওক',
    prototypeModeSub: 'প্ৰটোটাইপ মোড: পুনৰীক্ষণৰ বাবে ড্ৰাইভাৰ ভি. ৰাৱাট (BR01AB2044) হিচাপে মক চেচন আৰম্ভ কৰে।',
    devEvaluation: 'বিকাশ / মূল্যায়ন',
    govAccessNotice:
      'চৰকাৰী প্ৰৱেশাধিকাৰ অনুমোদিত লজিষ্টিক সঞ্চালকালয়ৰ বিষয়াৰ বাবে সীমাবদ্ধ আৰু চৰকাৰী প্ৰমাণপত্ৰ প্ৰয়োজন।',
    govEmailLabel: 'চৰকাৰী কাৰ্যালয়ৰ ইমেইল',
    govEmailPlaceholder: 'name@logistics.gov.in',
    govCodeLabel: 'অনুমোদন / বিভাগীয় কোড (ঐচ্ছিক)',
    govCodePlaceholder: 'যেনে GOV-AUTH-2026',
    verifyGovBtn: 'চৰকাৰী অনুমোদন পৰীক্ষা কৰক →',
    govDemoHint: 'ডেমো অনুমোদিত একাউণ্ট: s.sharma@logistics.gov.in',
    govUnauthorized: 'প্ৰৱেশাধিকাৰৰ বাবে চৰকাৰী বিভাগীয় অনুমোদন প্ৰয়োজন।',

    verifyMobileTitle: 'আপোনাৰ মোবাইল নম্বৰ পৰীক্ষা কৰক',
    verifyMobileSub: (phone: string) => `আমি এই নম্বৰলৈ ৬-সংখ্যাৰ পৰীক্ষণ ক’ড পঠিয়ালোঁ: ${phone}`,
    verifyEmailTitle: 'আপোনাৰ ইমেইল পৰীক্ষা কৰক',
    verifyEmailSub: (email: string) => `আমি এই ইমেইললৈ ৬-সংখ্যাৰ পৰীক্ষণ ক’ড পঠিয়ালোঁ: ${email}`,
    otpLabel: '৬-সংখ্যাৰ অ’টিপি ইনপুট',
    verifyAndContinue: 'পৰীক্ষা কৰক আৰু অগ্ৰসৰ হওক',
    resendCode: 'ক’ড পুনৰ পঠিয়াওক',
    resendIn: (seconds: number) => `${seconds} ছেকেণ্ডত পুনৰ পঠিয়াওক`,
    changeContact: 'ইমেইল বা মোবাইল নম্বৰ সলনি কৰক',
    otpHint: 'ডেমো পৰীক্ষণ ক’ড: 123456 (বা যিকোনো ৬টা সংখ্যা)',

    whoIsThisForTitle: 'এই একাউণ্ট কাৰ বাবে?',
    whoIsThisForSub: 'অনবৰ্ডিং আৰম্ভ কৰিবলৈ আপোনাৰ অপাৰেচনেল ভূমিকা বাছক।',
    createAccountTitle: 'আপোনাৰ একাউণ্ট সৃষ্টি কৰক',
    createAccountSub: 'অনুমোদিত ফিল্ড অপাৰেচনত প্ৰৱেশ কৰিবলৈ আপোনাৰ একাউণ্ট পঞ্জীয়ন কৰক।',
    fullNameLabel: 'সম্পূৰ্ণ নাম',
    fullNamePlaceholder: 'আপোনাৰ সম্পূৰ্ণ নাম দিয়ক',
    vehicleRegLabel: 'বাহন পঞ্জীয়ন নম্বৰ',
    vehicleRegPlaceholder: 'যেনে BR01AB2044',
    mobileLabel: 'মোবাইল নম্বৰ',
    mobilePlaceholder: '+91 মোবাইল নম্বৰ দিয়ক',
    emailOptionalLabel: 'ইমেইল ঠিকনা (ঐচ্ছিক)',
    emailOptionalPlaceholder: 'name@example.com',
    requiredNote: 'মোবাইল বাধ্যতামূলক। ইমেইল ঐচ্ছিক।',
    operationalIdentifierNote: 'বাহন পঞ্জীয়ন নম্বৰ হৈছে অনবৰ্ডিঙৰ সময়ত ব্যৱহৃত অপাৰেচনেল চিনাক্তকাৰী।',
    verifyingVehicle: 'বাহন পৰীক্ষা কৰা হৈছে…',
    checkingVehicle: 'বাহন পঞ্জীয়ন আৰু অনুমোদিত নামভৰ্তিৰ তথ্য পৰীক্ষা কৰা হৈছে।',
    vehicleVerified: 'বাহন পৰীক্ষা সফল',
    authorizedRecordFound: 'অনুমোদিত অপাৰেচনেল ৰেকৰ্ড পোৱা গ’ল।',
    vehicleFailure: 'আমি এই বাহন পৰীক্ষা কৰিব নোৱাৰিলোঁ।',
    vehicleFailureSub: 'পঞ্জীয়ন নম্বৰ পৰীক্ষা কৰি পুনৰ চেষ্টা কৰক।',
    retryVehicleBtn: 'পঞ্জীয়ন পৰীক্ষা কৰি পুনৰ চেষ্টা কৰক',
    accountCreatedTitle: 'একাউণ্ট সৃষ্টি হ’ল',
    welcome: (name: string) => `স্বাগতম, ${name}`,
    accountLinkedMessage: 'আপোনাৰ একাউণ্ট পৰীক্ষা কৰা হৈছে আৰু অনুমোদিত ফিল্ড অপাৰেচনৰ সৈতে সংযোগ কৰা হৈছে।',
    continueToDriverApp: 'VECTOR-লৈ অগ্ৰসৰ হওক →',

    navHome: 'ঘৰ',
    navDelivery: 'মোৰ ডেলিভাৰী',
    navRoute: 'মোৰ পথ',
    navAlerts: 'সতৰ্কতা',
    navReports: 'মোৰ প্ৰতিবেদন',
    navProfile: 'প্ৰফাইল',
    reportBtn: 'প্ৰতিবেদন',
    unitBadge: 'ইউনিট ৪',
    connectedText: 'সংযুক্ত • ড্ৰাইভাৰ ৰাৱাট',
    offlineText: 'অফলাইন • ডিভাইচত সংৰক্ষিত প্ৰতিবেদন',
    offlineSavedCount: (count: number) => `অফলাইন • ${count}টা সংৰক্ষিত`,
    syncingText: 'চিঙ্ক হৈ আছে...',
    waitingToSyncText: (count: number) =>
      count === 1 ? '১টা প্ৰতিবেদন চিঙ্ক হ’বলৈ বাকী' : `${count}টা প্ৰতিবেদন চিঙ্ক হ’বলৈ বাকী`,
    offlineTooltip: 'অফলাইনত চলি আছে। সকলো প্ৰতিবেদন ডিভাইচত সংৰক্ষিত হ’ব।',
    pendingSyncTooltip: 'সংযুক্ত। বেকএণ্ডত চিঙ্ক হ’বলৈ বাকী।',
    openDriverProfile: 'ড্ৰাইভাৰ প্ৰফাইল খোলক',

    operationalDutyHeader: 'ড্ৰাইভাৰ অপাৰেচনেল কৰ্তব্য',
    fleetUnitSubtitle: 'ফ্লিট লজিষ্টিকছ ইউনিট ৪ • কৰিডৰ ডেল্টা নিযুক্তি',
    currentStatus: 'বৰ্তমান স্থিতি',
    onDuty: 'কৰ্তব্যত আছে',
    offDuty: 'কৰ্তব্য শেষ',
    assignedVehicle: 'নিৰ্ধাৰিত বাহন',
    activeDelivery: 'সক্ৰিয় ডেলিভাৰী',
    assignedRoute: 'নিৰ্ধাৰিত পথ',
    quickActions: 'দ্ৰুত কাৰ্য্য',
    reportDisruptionAction: 'পথৰ বিঘিনি প্ৰতিবেদন দিয়ক',
    viewDeliveryAction: 'ডেলিভাৰী চাওক',
    viewRouteAction: 'পথ চাওক',
    alertsSectionTitle: 'সক্ৰিয় ছিষ্টেম সতৰ্কতা',
    noActiveAlerts: 'আপোনাৰ কৰিডৰত কোনো সক্ৰিয় জৰুৰী সতৰ্কতা নাই।',
    recentDisruptionsTitle: 'শেহতীয়া পথ বিঘিনি',
    noRecentDisruptions: 'শেহতীয়াকৈ কোনো বিঘিনি প্ৰতিবেদন দিয়া হোৱা নাই।',
    viewAllAlerts: 'সকলো সতৰ্কতা চাওক',
    viewAllReports: 'সকলো প্ৰতিবেদন চাওক',
    quickReportTitle: 'নতুন বিপদৰ প্ৰতিবেদন দিব বিচাৰে নেকি?',
    quickReportSub: 'পথৰ বাধা, বতৰ বা বাহনৰ সমস্যাৰ প্ৰতিবেদন কেন্দ্ৰীয় ডিচপেচলৈ প্ৰেৰণ কৰক।',
    primaryAlertNotice: 'কৰিডৰ অৱৰোধ সতৰ্কতা • সংকটপূৰ্ণ',
    primaryAlertDesc: 'যাচাইকৃত বাধাৰ বাবে মাইল ৪২ত কৰিডৰ ডেল্টাত যাতায়াত বন্ধ হৈ আছে।',

    consignmentConsignment: 'কনচাইনমেণ্ট',
    assignedToVehicleSubtitle: (vehId: string) => `বাহন ${vehId}লৈ আৱন্টিত • বিষয়া ভি. ৰাৱাট`,
    reportBlockageBtn: 'বাধা প্ৰতিবেদন দিয়ক',
    deliveryDelayedTitle: 'ডেলিভাৰীত বিলম্ব — কৰিডৰ অৱৰোধ',
    deliveryDelayedDesc:
      'যাচাইকৃত পথ বাধাৰ বাবে কৰিডৰ ডেল্টাত মাইল ৪২ৰ ওচৰত চলাচল বন্ধ হৈ আছে। মালবস্তু সুৰক্ষিত আছে। পথ মুকলি বা ALT-104 বাইপাছৰ বাবে বাট চোৱা হৈছে।',
    cargoSpecifications: 'মালবস্তু আৰু চালানৰ বিৱৰণ',
    commodityLabel: 'সামগ্ৰী',
    consignmentIdLabel: 'চালান আইডি',
    weightLabel: 'ওজন',
    cargoCategoryLabel: 'মালবস্তুৰ শ্ৰেণী',
    originHubLabel: 'মূল হাব',
    destinationDepotLabel: 'গন্তব্য ডিপো',
    currentEtaLabel: 'বৰ্তমান আনুমানিক সময়',
    etaDelayedNotice: 'কৰিডৰ ডেল্টাৰ বাধাৰ বাবে বিলম্বিত',
    routeCorridorLabel: 'পথ কৰিডৰ',
    transitTimelineTitle: 'চলাচলৰ অগ্ৰগতি আৰু মাইলৰ খুঁটি',
    departedOrigin: 'মূল হাবৰ পৰা ৰাওনা হৈছে',
    checkpointAlpha: 'কৰিডৰ আলফা চেকপইণ্ট পাৰ হৈছে',
    haltedMile42: 'কৰিডৰ ডেল্টাত (মাইল ৪২) স্থগিতাৱস্থা',
    destinationPending: 'গন্তব্যত আগমন (অনুমোদনৰ অপেক্ষাত)',

    routeTacticalHeader: 'মোৰ পথ আৰু কৌশলগত নেভিগেচন',
    reportHazardBtn: 'বিপদৰ প্ৰতিবেদন দিয়ক',
    corridorStatusLabel: 'কৰিডৰ স্থিতি',
    aiRouteRiskAssessment: 'কৰিডৰ আশংকা আৰু বিপদ মূল্যায়ন',
    riskIndexLabel: 'আশংকা সূচক',
    corridorMetrics: 'কৰিডৰ অপাৰেচনেল মেট্ৰিক',
    totalDistanceLabel: 'মুঠ দূৰত্ব',
    estimatedTravelTimeLabel: 'আনুমানিক ভ্ৰমণ সময়',
    routeTypeLabel: 'পথৰ ধৰণ',
    roadConditionLabel: 'পথৰ অৱস্থা',
    alternateRouteTitle: 'বিকল্প বাইপাছ পথ উপলব্ধ',
    alternateRouteSubtitle: 'নিম্নভূমি আৰ্টেৰিয়েল বাইপাছৰ জৰিয়তে অনুমোদিত পথ',
    requestRerouteAuth: 'পথ সলনিৰ অনুমোদনৰ অনুৰোধ জনাওক',
    incidentsOnRouteTitle: 'পথত প্ৰতিবেদন দিয়া বিপদসমূহ',
    noIncidentsOnRoute: 'এই পথত কোনো সক্ৰিয় বিপদ নাই।',
    rerouteRequested: 'পথ সলনিৰ অনুৰোধ জনোৱা হৈছে',
    rerouteRequestedDesc: 'কেন্দ্ৰীয় ডিচপেচে বিকল্প পথৰ মূল্যায়ন কৰি আছে।',
    routeMapLabel: 'কৌশলগত কৰিডৰ মানচিত্ৰ',
    whereAmI: 'মই ক’ত আছোঁ?',
    whatRouteAmIOn: 'মই কোনটো পথত আছোঁ?',
    isRouteSafe: 'মোৰ পথটো সুৰক্ষিতনে?',
    routeNotSafeVerdict: 'জৰুৰী সুৰক্ষা সতৰ্কতা: যাতায়াতৰ বাবে পথটো সুৰক্ষিত নহয়',
    routeNotSafeSub: 'কৰিডৰ ডেল্টাত সক্ৰিয় সংকটজনক বিপদ চিনাক্ত কৰা হৈছে। আবদ্ধ হোৱাৰ গুৰুতৰ আশংকা আছে।',
    travelImpactLabel: 'যাতায়াতৰ প্ৰভাৱ',
    whyRouteRisky: 'এই পথটো কিয় ঝুঁকিপূৰ্ণ?',
    verifiedIncidentsTitle: 'পথৰ সত্যপ্ৰমাণিত ঘটনাসমূহ',
    clickForDetails: 'ঘটনাৰ মূল্যায়ন আৰু বৈকল্পিক পথৰ বাবে যিকোনো কাৰ্ডত স্পৰ্শ কৰক',
    statusOpen: 'খোলা',
    routeComparisonTitle: 'কৰিডৰ বিপদ তুলনা আৰু বৈকল্পিক পথ',
    currentRouteLabel: 'বৰ্তমান পথ',
    alternateRouteLabel: 'বৈকল্পিক বাইপাছ পথ',

    alertsHeaderTitle: 'কৰিডৰ সতৰ্কতা আৰু পৰামৰ্শ',
    alertsSubtitle: 'কৰিডৰ ডেল্টা আৰু ইউনিট ৪ৰ বাবে অপাৰেচনেল জাননী',
    searchAlertsPlaceholder: 'সন্ধান কৰক...',
    noAlertsFound: 'কোনো সতৰ্কতা পোৱা নগ’ল',
    noAlertsFoundDesc: 'বাছনি কৰা ফিল্টাৰৰ লগত কোনো জাননী মিলা নাই।',
    acknowledgeBtn: 'স্বীকাৰ কৰক',
    acknowledgedBtn: 'স্বীকৃত',
    viewAffectedRoute: 'পথ চাওক',
    viewAffectedDelivery: 'ডেলিভাৰী চাওক',
    reportRelatedIncident: 'বিপদৰ প্ৰতিবেদন দিয়ক',
    affectedVehicleLabel: 'বাহন',
    affectedCorridorLabel: 'কৰিডৰ',

    myReportsHeaderTitle: 'মোৰ ফিল্ড প্ৰতিবেদন',
    myReportsSubtitle: 'বিষয়া ভি. ৰাৱাট (ইউনিট ৪) দ্বাৰা দাখিল কৰা হৈছে',
    newReportBtn: 'নতুন প্ৰতিবেদন',
    searchReportsPlaceholder: 'সন্ধান কৰক...',
    noReportsFound: 'কোনো প্ৰতিবেদন পোৱা নগ’ল',
    noReportsFoundDesc: 'এই ফিল্টাৰত কোনো প্ৰতিবেদন নথিভুক্ত নাই।',
    createNewReport: 'নতুন প্ৰতিবেদন সৃষ্টি কৰক',
    viewDetails: 'বিৱৰণ চাওক',
    gpsBadge: 'জিপিএছ',
    photoBadge: 'ফটো',
    syncFailedBadge: 'চিঙ্ক ব্যৰ্থ',
    syncedBadge: 'চিঙ্ক হ’ল',

    reportIncidentTitle: 'পথৰ বিঘিনি প্ৰতিবেদন দিয়ক',
    reportIncidentSubtitle: 'কেন্দ্ৰীয় ডিচপেচলৈ ফিল্ড প্ৰতিবেদন জমা দিয়ক',
    incidentTypeLabel: 'ঘটনাৰ ধৰণ',
    incidentTypeSelectPlaceholder: 'ঘটনাৰ ধৰণ বাছক',
    affectedRouteFormLabel: 'ক্ষতিগ্ৰস্ত কৰিডৰ',
    locationFormLabel: 'ভৌগোলিক অৱস্থান / লেণ্ডমাৰ্কৰ বিৱৰণ',
    locationPlaceholder: 'যেনে কৰিডৰ ডেল্টা — মাইল ৪২, ছাউথ ব্ৰীজৰ ২ কিমি উত্তৰে',
    captureGpsBtn: 'জিপিএছৰ দ্বাৰা চিনাক্ত কৰক',
    gpsLocating: 'অৱস্থান বিচাৰি থকা হৈছে...',
    gpsCaptured: (acc: number) => `জিপিএছ প্ৰাপ্ত (±${acc}মি সঠিকতা)`,
    severityLevelLabel: 'তীব্ৰতাৰ মাত্ৰা',
    observationsLabel: 'ফিল্ড পৰ্যবেক্ষণ আৰু বিৱৰণ',
    observationsPlaceholder: 'বাধাৰ পৰিমাণ বা প্ৰয়োজনীয় সঁজুলিৰ বিৱৰণ দিয়ক...',
    fieldPhotoLabel: 'ফিল্ড ফটো',
    optionalText: '(ঐচ্ছিক)',
    localAttachmentText: 'স্থানীয় সংযুক্তি',
    captureOrSelectPhoto: 'ফটো তোলক বা বাছক',
    photoNotice: 'বিজ্ঞপ্তি: ফটোগাহ ডিভাইচৰ মেমৰিত স্থানীয়ভাৱে সংৰক্ষিত হয়।',
    submitIncidentBtn: 'ঘটনা প্ৰতিবেদন দাখিল কৰক',
    recordingBtn: 'নথিভুক্ত হৈ আছে...',
    selectSeverityRequired: 'অনুগ্ৰহ কৰি তীব্ৰতা বাছক',
    selectTypeRequired: 'অনুগ্ৰহ কৰি ঘটনাৰ ধৰণ বাছক',
    selectDisruptionTypeError: 'অনুগ্ৰহ কৰি দাখিল কৰাৰ পূৰ্বে বাধাৰ ধৰণ বাছনি কৰক।',
    specifyLocationError: 'অনুগ্ৰহ কৰি কৰিডৰ বা স্থান উল্লেখ কৰক।',
    provideDescriptionError: 'অনুগ্ৰহ কৰি বাধাৰ বিষয়ে তথ্য প্ৰদান কৰক।',
    failedToRecordIncident: 'ঘটনা লিপিবদ্ধ কৰাত ব্যৰ্থ হ’ল।',
    backToFieldPortal: 'কাৰ্য্যকলাপলৈ উভতি যাওক',
    reportRoadDisruption: 'পথৰ বাধাৰ প্ৰতিবেদন দিয়ক',
    officialIncidentSubmission: 'ক্ষেত্ৰ ঘটনা প্ৰতিবেদন আৰু ডিচপেচ ৰিলে',
    offlineReadyNoticeTitle: 'ষ্ট’ৰ আৰু ফৰৱাৰ্ড অফলাইন মোড সক্ৰিয়',
    offlineReadyNoticeDesc: 'প্ৰতিবেদন স্থানীয়ভাৱে সংৰক্ষিত হ’ব আৰু ব্লুটুথৰ জৰিয়তে ৰিলে হ’ব বা সংযোগ পালে চিঙ্ক হ’ব।',
    operatingOfflineNoticeTitle: 'অফলাইন মোড সক্ৰিয়',
    operatingOfflineNoticeDesc: 'আপোনাৰ প্ৰতিবেদন ডিভাইচত সংৰক্ষিত থাকিব আৰু সংযোগ ঘূৰি অহাৰ সময়ত চিঙ্ক হ’ব।',
    disruptionTypeLabel: 'বাধাৰ ধৰণ',
    selectedType: 'বাছনি কৰা হৈছে',
    tapToSelect: 'বাছনি কৰিবলৈ স্পৰ্শ কৰক',
    affectedCorridorRoute: 'প্ৰভাৱিত কৰিডৰ / পথ',
    optionalLabel: 'ঐচ্ছিক',
    selectKnownCorridor: 'এটা জ্ঞাত কৰিডৰ বাছনি কৰক...',
    locationCoordinates: 'স্থান আৰু স্থানাংক',
    acquiringGps: 'জিপিএছ স্থানাংক লোৱা হৈছে...',
    useCurrentGps: 'বৰ্তমান জিপিএছ ব্যৱহাৰ কৰক',
    hideDetailsAction: 'বিৱৰণ লুকুৱাওক',
    viewDetailsAction: 'বিৱৰণ চাওক',
    physicalLocationDesc: 'ভৌতিক স্থান / চিনাকি স্থানৰ বিৱৰণ',
    fieldObservationsDesc: 'ক্ষেত্ৰ পৰ্য্যবেক্ষণ আৰু বাধাৰ বিৱৰণ',
    fieldPhotograph: 'ক্ষেত্ৰ আলোকচিত্ৰ',
    captureSelectPhoto: 'ফটো তোলক / বাছনি কৰক',
    photoLocalNotice: 'ফটোসমূহ ডিভাইচত সংৰক্ষিত থাকিব আৰু নেটৱৰ্ক থাকিলে চিঙ্ক হ’ব।',
    recording: 'ঘটনা লিপিবদ্ধ কৰা হৈছে...',
    submitIncidentReport: 'ঘটনাৰ প্ৰতিবেদন দাখিল কৰক',

    typeRoadBlockage: 'পথৰ বাধা',
    typeLandslide: 'ভূমিস্খলন',
    typeFlood: 'বানপানী',
    typeAccident: 'দুৰ্ঘটনা',
    typeRoadDamage: 'পথৰ ক্ষতি',
    typeVehicleIssue: 'বাহনৰ সমস্যা',
    typeBridgeDamage: 'দলং ক্ষতি',
    typeOtherIncident: 'অন্যান্য ঘটনা',

    sevLow: 'কম',
    sevLowDesc: 'সামান্য লেহেমীয়া, চলাচল সম্ভৱ',
    sevMedium: 'মধ্যমীয়া',
    sevMediumDesc: 'আংশিক বিঘিনি, একক লেন',
    sevHigh: 'উচ্চ',
    sevHighDesc: 'গুৰুতৰ বাধা, অধিক বিলম্ব',
    sevCritical: 'সংকটপূৰ্ণ',
    sevCriticalDesc: 'সম্পূৰ্ণ বন্ধ / গাঁথনিগত ক্ষতি',

    incidentRecordNotFound: 'ঘটনাৰ ৰেকৰ্ড পোৱা নগ’ল',
    incidentRecordNotFoundDesc: 'নিৰ্বাচিত প্ৰতিবেদন বৰ্তমান ৰেকৰ্ডত পোৱা নগ’ল।',
    returnToMyReports: 'মোৰ প্ৰতিবেদনলৈ উভতি যাওক',
    backToReportsList: 'তালিকালৈ উভতি যাওক',
    incidentLifecycleProgression: 'ঘটনাৰ অগ্ৰগতি চক্ৰ',
    stepReported: 'প্ৰতিবেদন দিয়া হ’ল',
    stepReportedDesc: 'ফিল্ড ইউনিট দ্বাৰা নথিভুক্ত',
    stepUnderReview: 'পুনৰীক্ষণত আছে',
    stepUnderReviewDesc: 'নিয়ন্ত্ৰণ কক্ষৰ মূল্যায়ন চলি আছে',
    stepResolved: 'সমাধান হ’ল',
    stepResolvedDesc: 'পথ মুকলি আৰু পৰীক্ষিত',
    incidentInfoTitle: 'ঘটনাৰ তথ্য',
    timestampFiled: 'দাখিলৰ সময়',
    reportedByLabel: 'প্ৰতিবেদক',
    corridorLocationLabel: 'কৰিডৰ স্থান',
    gpsCoordinatesLabel: 'জিপিএছ স্থানাংক',
    fieldObservationsHeader: 'ফিল্ড পৰ্যবেক্ষণ',
    attachedPhotoHeader: 'সংলগ্ন ফটো',
    dispatchAdvisoryHeader: 'কেন্দ্ৰীয় ডিচপেচ পৰামৰ্শ',
    dispatchAdvisoryNotice: 'এই প্ৰতিবেদন কেন্দ্ৰীয় ডিচপেচ দ্বাৰা অগ্ৰাধিকাৰ দিয়া হৈছে।',

    profileTitle: 'ড্ৰাইভাৰ প্ৰফাইল আৰু একাউণ্ট চেটিংছ',
    backToOperations: 'কাৰ্য্যকলাপলৈ উভতি যাওক',
    personalInfoTitle: 'ব্যক্তিগত তথ্য',
    editProfileBtn: 'প্ৰফাইল সম্পাদনা',
    saveProfileChangesBtn: 'পৰিৱৰ্তন সংৰক্ষণ কৰক',
    fullNameField: 'সম্পূৰ্ণ নাম',
    tacticalCallsignField: 'কৌশলগত কলচাইন',
    contactPhoneField: 'যোগাযোগৰ ফোন',
    officialEmailField: 'চৰকাৰী ইমেইল',
    emergencyContactField: 'জৰুৰী যোগাযোগ / মুখ্য কাৰ্যালয়ৰ ফ্ৰিকোৱেন্সী',
    driverIdSystemField: 'ড্ৰাইভাৰ আইডি (ছিষ্টেম নিয়ন্ত্ৰিত)',
    unitAssignmentSystemField: 'ইউনিট নিযুক্তি (ছিষ্টেম নিয়ন্ত্ৰিত)',
    operationalAssignmentTitle: 'অপাৰেচনেল নিযুক্তিৰ প্ৰসংগ',
    operationalAssignmentDesc: 'মণ্ডল লজিষ্টিক সঞ্চালকালয় দ্বাৰা পৰিচালিত ফ্লিট অপাৰেচন',
    assignmentParametersNotice: 'নিযুক্তিৰ পেৰামিটাৰ কেন্দ্ৰীয় ডিচপেচ দ্বাৰা নিয়ন্ত্ৰিত।',
    accountSettingsTitle: 'একাউণ্ট চেটিংছ',
    languageSettingTitle: 'ভাষা',
    languageSettingDesc: 'আপুনি ব্যৱহাৰ কৰিব বিচৰা ভাষা বাছক। আপুনি যিকোনো সময়তে ইয়াক সলনি কৰিব পাৰে।',
    changeLanguageBtn: 'ভাষা সলনি কৰক',
    changePasswordBtn: 'পাছৱৰ্ড সলনি কৰক',
    changePasswordDesc: 'নিৰাপত্তা পিন / পাছৱৰ্ড আপডেট কৰক',
    notificationPreferencesTitle: 'জাননীৰ পছন্দসমূহ',
    criticalCorridorAlerts: 'সংকটপূৰ্ণ কৰিডৰ সতৰ্কতা',
    criticalCorridorAlertsDesc: 'পথৰ বাধা আৰু বিঘিনিৰ বাবে তাৎক্ষণিক জাননী',
    routeRiskUpdates: 'পথৰ আশংকাৰ আপডেট',
    routeRiskUpdatesDesc: 'বতৰ বা বিপদ সূচক সলনি হ’লে আপডেট',
    dispatchDirectives: 'ডিচপেচ নিৰ্দেশনা',
    dispatchDirectivesDesc: 'বিকল্প পথ সম্পৰ্কে চৰকাৰী পৰামৰ্শ',
    logOut: 'লগ আউট',
    logOutDesc: 'লগ আউট কৰিলে এই চেচন সমাপ্ত হ’ব আৰু লগইন স্ক্ৰীনলৈ ঘূৰি যাব।',
    connectivitySettingsTitle: 'সংযোগ',
    bleTitle: 'ব্লুটুথ মোড',
    bluetoothModeOn: 'ব্লুটুথ মোড চালু',
    bluetoothModeOff: 'ব্লুটুথ মোড বন্ধ',
    bluetoothModeDesc: 'বিএলই যোগাযোগ আৰু ষ্টোৰ-এণ্ড-ফৰৱাৰ্ড ৰিলেৰ বাবে মাষ্টাৰ চুইচ',
    howItWorksTitle: 'ই কেনেদৰে কাম কৰে',
    howItWorksOnline: 'অনলাইন',
    howItWorksOnlineSub: 'ইণ্টাৰনেট উপলব্ধ',
    howItWorksOnlineDesc: '→ অপাৰেচনেল ডেটা স্বাভাৱিকভাৱে বেকএণ্ডৰ সৈতে চিঙ্ক হ’ব পাৰে।',
    howItWorksOfflineRelay: 'অফলাইন + ওচৰৰ ৰিলে',
    howItWorksOfflineRelaySub: 'ইণ্টাৰনেট নাই + ৰিলে সুবিধা থকা ওচৰৰ ফিল্ড ডিভাইচ।',
    howItWorksOfflineRelayDesc: '→ ডেটা ডিভাইচত সংৰক্ষিত থাকে আৰু ব্লুটুথৰ জৰিয়তে ৰিলে কৰিব পাৰি।',
    howItWorksNoRelay: 'কোনো ৰিলে উপলব্ধ নাই',
    howItWorksNoRelaySub: 'ইণ্টাৰনেট নাই + কোনো উপযুক্ত ৰিলে ডিভাইচ নাই।',
    howItWorksNoRelayDesc: '→ সংযোগ নোপোৱালৈকে ডেটা সুৰক্ষিতভাৱে ডিভাইচত থাকে।',
    howItWorksConnReturns: 'সংযোগ উভতি আহিল',
    howItWorksConnReturnsSub: 'ইণ্টাৰনেট থকা ডিভাইচ সংযোগ পালে।',
    howItWorksConnReturnsDesc: '→ সংৰক্ষিত ডেটা বেকএণ্ডৰ সৈতে চিঙ্ক কৰিব পাৰি।',

    statusOnDuty: 'কৰ্তব্যত আছে',
    statusOffDuty: 'কৰ্তব্য শেষ',
    statusConnected: 'সংযুক্ত',
    statusOffline: 'অফলাইন',
    statusPendingSync: 'চিঙ্ক বাকী',
    statusSyncing: 'চিঙ্ক হৈ আছে...',
    statusSynced: 'চিঙ্ক হ’ল',
    statusSyncFailed: 'চিঙ্ক ব্যৰ্থ',
    statusBtRelayed: 'ব্লুটুথ ৰিলে হ’ল',
    statusBtReceived: 'ব্লুটুথ প্ৰাপ্ত হ’ল',
    statusBlocked: 'অৱৰুদ্ধ',
    statusDelayed: 'বিলম্বিত',
    statusAtRisk: 'আশংকাজনক',
    statusAccessible: 'চলাচলযোগ্য',
    statusReported: 'প্ৰতিবেদন দিয়া হ’ল',
    statusUnderReview: 'পুনৰীক্ষণত আছে',
    statusResolved: 'সমাধান হ’ল',
    statusCritical: 'সংকটপূৰ্ণ',
    statusHigh: 'উচ্চ',
    statusMedium: 'মধ্যমীয়া',
    statusLow: 'কম',
    statusWarning: 'সতৰ্কবাৰ্তা',
    statusInfo: 'তথ্য',
  },
};

export function getTranslations(lang: AppLanguage = getAppLanguage()): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

// React Context for Application-Wide Unified Localization
interface I18nContextValue {
  lang: AppLanguage;
  setLanguage: (newLang: AppLanguage) => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>(() => getAppLanguage());

  useEffect(() => {
    return subscribeAppLanguage((newLang) => {
      setLang(newLang);
    });
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang,
      setLanguage: setAppLanguage,
      t: getTranslations(lang),
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) {
    return ctx;
  }
  // Fallback if rendered outside provider
  const lang = getAppLanguage();
  return {
    lang,
    setLanguage: setAppLanguage,
    t: getTranslations(lang),
  };
}

export function useAppLanguage() {
  return useI18n();
}
