import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Truck,
  Package,
  Route as RouteIcon,
  Phone,
  Mail,
  Lock,
  Wifi,
  RefreshCw,
  Edit3,
  Save,
  X,
  LogOut,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Bell,
  Radio,
  KeyRound,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Globe,
  ArrowDown,
  CircleSlash,
} from 'lucide-react';
import type { FleetVehicle, Delivery, RouteSegment } from '@/types';
import {
  type FieldUserProfile,
  type NotificationPreferences,
  getStoredUserProfile,
  saveStoredUserProfile,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/services/authService';
import {
  useI18n,
  SUPPORTED_LANGUAGES,
} from '@/services/i18n';
import { FieldLanguageSelectView } from './FieldLanguageSelectView';
import {
  getBluetoothModePreference,
  setBluetoothModePreference,
  verifyBluetoothPrerequisites,
  subscribeConnectivitySettings,
} from '@/services/offline';

interface SimpleToggleProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function SimpleToggle({ id, checked, disabled, onChange, label }: SimpleToggleProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-8 w-20 shrink-0 cursor-pointer select-none items-center rounded-full border transition-all duration-200 focus:outline-none ${
        disabled
          ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-50'
          : checked
          ? 'border-neutral-900 bg-neutral-900'
          : 'border-neutral-300 bg-neutral-200 hover:bg-neutral-300'
      }`}
    >
      <span
        className={`inline-flex items-center text-[11px] font-bold tracking-wider select-none transition-all ${
          checked ? 'pl-2.5 text-white' : 'ml-auto pr-2.5 text-neutral-600'
        }`}
      >
        {checked ? (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ON
          </span>
        ) : (
          'OFF'
        )}
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}

interface FieldProfileViewProps {
  vehicle: FleetVehicle;
  delivery: Delivery;
  route: RouteSegment;
  onBack: () => void;
  onViewDelivery: () => void;
  onViewRoute: () => void;
  onLogout: () => void;
}

export function FieldProfileView({
  vehicle,
  delivery,
  route,
  onBack,
  onViewDelivery,
  onViewRoute,
  onLogout,
}: FieldProfileViewProps) {
  const { lang, setLanguage, t } = useI18n();
  const [profile, setProfile] = useState<FieldUserProfile>(getStoredUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Editable Form Fields (Only appropriate personal info)
  const [formName, setFormName] = useState(profile.name);
  const [formPhone, setFormPhone] = useState(profile.phone);
  const [formEmail, setFormEmail] = useState(profile.email);
  const [formCallsign, setFormCallsign] = useState(profile.callsign);
  const [formEmergencyContact, setFormEmergencyContact] = useState(profile.emergencyContact);

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    getNotificationPreferences,
  );

  // Change Password Modal / State (Adapter Boundary)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Language Preference State (Profile -> Settings -> Language)
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  // Connectivity Settings State (Profile -> Connectivity)
  const [bluetoothModeEnabled, setBluetoothModeEnabled] = useState<boolean>(getBluetoothModePreference);
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false);
  const [connectivityNotice, setConnectivityNotice] = useState<string | null>(null);

  useEffect(() => {
    return subscribeConnectivitySettings((settings) => {
      setBluetoothModeEnabled(settings.bluetoothModeEnabled);
    });
  }, []);

  async function handleToggleBluetoothMode(targetEnabled: boolean) {
    setConnectivityNotice(null);

    if (targetEnabled) {
      const check = await verifyBluetoothPrerequisites();
      if (!check.permissionGranted) {
        setConnectivityNotice(check.errorMessage || 'Bluetooth permission required in Android system settings.');
        setBluetoothModePreference(false);
        setBluetoothModeEnabled(false);
        return;
      }
      if (!check.adapterEnabled) {
        setConnectivityNotice(check.errorMessage || 'Bluetooth hardware adapter is turned off.');
      }
      setBluetoothModePreference(true);
      setBluetoothModeEnabled(true);
    } else {
      setBluetoothModePreference(false);
      setBluetoothModeEnabled(false);
    }
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const updated = saveStoredUserProfile({
      name: formName,
      phone: formPhone,
      email: formEmail,
      callsign: formCallsign,
      emergencyContact: formEmergencyContact,
    });
    setProfile(updated);
    setIsEditing(false);
    setSaveSuccessMsg('Personal profile updated successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  }

  function handleCancelEdit() {
    setFormName(profile.name);
    setFormPhone(profile.phone);
    setFormEmail(profile.email);
    setFormCallsign(profile.callsign);
    setFormEmergencyContact(profile.emergencyContact);
    setIsEditing(false);
  }

  function handleTogglePref(key: keyof NotificationPreferences) {
    const updated = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    };
    setNotificationPrefs(updated);
    saveNotificationPreferences(updated);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback('Passwords do not match. Please re-enter.');
      return;
    }

    setPasswordFeedback('Password updated in local adapter session. (Supabase Auth ready)');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordFeedback(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1800);
  }

  return (
    <div id="field-profile-screen" className="flex flex-col gap-4 sm:gap-5 pb-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          id="btn-profile-back"
          onClick={onBack}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.backToOperations}</span>
        </button>

        <span className="text-xs font-mono font-semibold text-neutral-500">
          ID: {profile.officerId}
        </span>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. PROFILE HEADER                                            */}
      {/* ============================================================ */}
      <div
        id="profile-header-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar with Current Duty Status */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-neutral-900 text-2xl font-black text-white shadow-sm sm:h-22 sm:w-22">
              <span>VR</span>
            </div>
            <span
              className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border-2 border-white bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs"
              title="Current Duty Status: On Duty"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {profile.status}
            </span>
          </div>

          {/* Identity Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-lg font-bold text-neutral-950 sm:text-xl">
                {profile.name}
              </h1>
              <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-800">
                {profile.officerId}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-neutral-600">
              {profile.designation}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-700">
                <Shield className="h-3 w-3 text-neutral-500" />
                <span>{profile.unit}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-neutral-700">
                <Radio className="h-3 w-3 text-neutral-500" />
                <span>Callsign: {profile.callsign}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PERSONAL INFORMATION & EDIT PROFILE                       */}
      {/* ============================================================ */}
      <div
        id="profile-personal-info-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {t.personalInfoTitle}
            </h2>
          </div>

          {!isEditing ? (
            <button
              type="button"
              id="btn-start-edit-profile"
              onClick={() => setIsEditing(true)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 active:scale-[0.98]"
            >
              <Edit3 className="h-3.5 w-3.5 text-neutral-600" />
              <span>{t.editProfileBtn}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              <X className="h-3.5 w-3.5" />
              <span>{t.cancel}</span>
            </button>
          )}
        </div>

        {isEditing ? (
          /* Editable Form for User-Level Profile Fields Only */
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 leading-relaxed">
              <strong>Permission Scope:</strong> You can edit personal contact and identity details. Operational and system-controlled fields (Driver ID, Unit, Vehicle Registration, Delivery, Route) are managed by Central Dispatch and cannot be modified here.
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  {t.fullNameField}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  {t.tacticalCallsignField}
                </label>
                <input
                  type="text"
                  value={formCallsign}
                  onChange={(e) => setFormCallsign(e.target.value)}
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-mono text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  {t.contactPhoneField}
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  {t.officialEmailField}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  {t.emergencyContactField}
                </label>
                <input
                  type="text"
                  value={formEmergencyContact}
                  onChange={(e) => setFormEmergencyContact(e.target.value)}
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>
            </div>

            {/* Read-Only System Fields Notice */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2 border-t border-neutral-100">
              <div className="rounded-xl border border-neutral-200 bg-neutral-100/70 p-3 opacity-80">
                <span className="text-[10px] font-semibold uppercase text-neutral-400 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  {t.driverIdSystemField}
                </span>
                <p className="mt-0.5 font-mono font-bold text-neutral-700">{profile.officerId}</p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-100/70 p-3 opacity-80">
                <span className="text-[10px] font-semibold uppercase text-neutral-400 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  {t.unitAssignmentSystemField}
                </span>
                <p className="mt-0.5 font-bold text-neutral-700">{profile.unit}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                id="btn-save-profile"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-[0.98]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{t.saveProfileChangesBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        ) : (
          /* Read-Only Personal Information Display */
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                {t.fullNameField}
              </span>
              <p className="mt-0.5 font-bold text-neutral-900">{profile.name}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                {t.driverIdSystemField}
              </span>
              <p className="mt-0.5 font-mono font-bold text-neutral-900">{profile.officerId}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                Designation
              </span>
              <p className="mt-0.5 font-semibold text-neutral-800">{profile.designation}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                {t.unitAssignmentSystemField}
              </span>
              <p className="mt-0.5 font-semibold text-neutral-800">{profile.unit}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 flex items-center gap-1">
                <Phone className="h-2.5 w-2.5 text-neutral-500" />
                {t.contactPhoneField}
              </span>
              <p className="mt-0.5 font-mono font-medium text-neutral-900">{profile.phone}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 flex items-center gap-1">
                <Mail className="h-2.5 w-2.5 text-neutral-500" />
                {t.officialEmailField}
              </span>
              <p className="mt-0.5 font-medium text-neutral-900 truncate">{profile.email}</p>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-neutral-500" />
                {t.tacticalCallsignField} & {t.emergencyContactField}
              </span>
              <p className="mt-0.5 font-medium text-neutral-800">
                {profile.callsign} • {profile.emergencyContact}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. READ-ONLY WORK ASSIGNMENT: CURRENT ASSIGNMENT             */}
      {/* ============================================================ */}
      <div
        id="profile-current-assignment-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {t.operationalAssignmentTitle}
            </h2>
          </div>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1 border border-neutral-200">
            <Lock className="h-2.5 w-2.5" />
            <span>{t.operationalAssignmentDesc}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          {/* Assigned Vehicle */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-neutral-400">
                {t.assignedVehicle}
              </span>
              <Truck className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <p className="mt-1 font-mono font-bold text-neutral-900 text-sm">
              {vehicle.id}
            </p>
            <p className="text-[11px] text-neutral-600">
              {vehicle.type} • {vehicle.status}
            </p>
          </div>

          {/* Assigned Delivery */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-neutral-400">
                {t.activeDelivery}
              </span>
              <Package className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <p className="mt-1 font-mono font-bold text-neutral-900 text-sm">
              {delivery.id}
            </p>
            <p className="text-[11px] text-neutral-600">
              {delivery.commodity} • Status: {delivery.status}
            </p>
          </div>

          {/* Assigned Route */}
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-red-800">
                {t.assignedRoute}
              </span>
              <RouteIcon className="h-3.5 w-3.5 text-red-600" />
            </div>
            <p className="mt-1 font-mono font-bold text-red-950 text-sm">
              {route.id}
            </p>
            <p className="text-[11px] text-red-800 font-semibold">
              {route.label} • {route.status.toUpperCase()} (Risk {route.riskScore})
            </p>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-neutral-500">
          {t.assignmentParametersNotice}
        </p>

        {/* Navigation Quick Links to Full Screens */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            id="btn-profile-view-delivery"
            onClick={onViewDelivery}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 active:scale-[0.98]"
          >
            <Package className="h-4 w-4 text-neutral-600" />
            <span>{t.viewDeliveryAction}</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
          </button>

          <button
            type="button"
            id="btn-profile-view-route"
            onClick={onViewRoute}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-[0.98]"
          >
            <RouteIcon className="h-4 w-4 text-emerald-400" />
            <span>{t.viewRouteAction}</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ACCOUNT SETTINGS & ACTIONS                                */}
      {/* ============================================================ */}
      <div
        id="profile-account-settings-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Lock className="h-4 w-4 text-neutral-700" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            {t.accountSettingsTitle}
          </h2>
        </div>

        <div className="mt-4 space-y-3.5 text-xs">
          {/* Language Setting (Profile -> Settings -> Language) */}
          <div
            id="setting-language-row"
            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3"
          >
            <div>
              <p className="font-bold text-neutral-900">{t.languageSettingTitle}</p>
              <p className="text-[11px] text-neutral-500">
                {currentLangObj.nativeName} ({currentLangObj.englishName}) • {t.languageSettingDesc}
              </p>
            </div>
            <button
              type="button"
              id="btn-open-language-settings"
              onClick={() => setShowLanguageModal(true)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 font-semibold text-neutral-800 hover:bg-neutral-100 shadow-2xs"
            >
              <Globe className="h-3.5 w-3.5 text-neutral-600" />
              <span>{t.changeLanguageBtn}</span>
            </button>
          </div>

          {/* Change Password Trigger */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
            <div>
              <p className="font-bold text-neutral-900">{t.changePasswordBtn}</p>
              <p className="text-[11px] text-neutral-500">
                {t.changePasswordDesc}
              </p>
            </div>
            <button
              type="button"
              id="btn-open-change-password"
              onClick={() => setShowPasswordModal(!showPasswordModal)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 font-semibold text-neutral-800 hover:bg-neutral-100 shadow-2xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-neutral-600" />
              <span>{t.changePasswordBtn}</span>
            </button>
          </div>

          {/* Change Password Inline Form / Modal */}
          {showPasswordModal && (
            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  Update Security Password
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  Supabase Auth Adapter Ready
                </span>
              </div>

              {passwordFeedback && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[11px] text-blue-900">
                  {passwordFeedback}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  id="btn-submit-new-password"
                  className="flex-1 min-h-[44px] rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-black"
                >
                  Confirm Password Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          )}

          {/* Notification Preferences Toggles */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Bell className="h-3.5 w-3.5 text-neutral-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                {t.notificationPreferencesTitle}
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 cursor-pointer hover:bg-neutral-100/60">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">{t.criticalCorridorAlerts}</p>
                  <p className="text-[11px] text-neutral-500">
                    {t.criticalCorridorAlertsDesc}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.criticalAlerts}
                  onChange={() => handleTogglePref('criticalAlerts')}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                />
              </label>

              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 cursor-pointer hover:bg-neutral-100/60">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">{t.routeRiskUpdates}</p>
                  <p className="text-[11px] text-neutral-500">
                    {t.routeRiskUpdatesDesc}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.routeRiskUpdates}
                  onChange={() => handleTogglePref('routeRiskUpdates')}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                />
              </label>

              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 cursor-pointer hover:bg-neutral-100/60">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">{t.dispatchDirectives}</p>
                  <p className="text-[11px] text-neutral-500">
                    {t.dispatchDirectivesDesc}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.dispatchAdvisories}
                  onChange={() => handleTogglePref('dispatchAdvisories')}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                />
              </label>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-3 border-t border-neutral-100">
            <button
              type="button"
              id="btn-profile-logout"
              onClick={onLogout}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs font-bold text-red-800 transition-colors hover:bg-red-100 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span>{t.logOut}</span>
            </button>
            <p className="mt-1.5 text-center text-[10px] text-neutral-400">
              {t.logOutDesc}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. CONNECTIVITY                                              */}
      {/* ============================================================ */}
      <div
        id="profile-connectivity-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {t.connectivitySettingsTitle}
            </h2>
          </div>
          <span className="text-[11px] font-medium text-neutral-500">
            {bluetoothModeEnabled ? t.bluetoothModeOn : t.bluetoothModeOff}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {/* Exactly ONE Master Switch */}
          <div
            id="row-bluetooth-mode"
            className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5"
          >
            <div className="pr-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-bluetooth-info"
                  onClick={() => setShowInfoPanel((prev) => !prev)}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 focus:outline-none"
                  aria-label="How it works information"
                  title={t.howItWorksTitle}
                >
                  <Info className="h-4 w-4 text-neutral-600 hover:text-neutral-900" />
                </button>
                <span className="text-xs font-bold text-neutral-900">
                  {t.bleTitle}
                </span>
              </div>
              <p className="mt-1 pl-6 text-[11px] text-neutral-500 leading-snug">
                {t.bluetoothModeDesc}
              </p>
            </div>

            <SimpleToggle
              id="toggle-bluetooth-mode"
              checked={bluetoothModeEnabled}
              label={t.bleTitle}
              onChange={handleToggleBluetoothMode}
            />
          </div>

          {/* Compact Information Panel ("How it works") */}
          {showInfoPanel && (
            <div
              id="panel-bluetooth-how-it-works"
              className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-neutral-700" />
                  <h3 className="text-xs font-bold text-neutral-900">{t.howItWorksTitle}</h3>
                </div>
                <button
                  type="button"
                  id="btn-close-bluetooth-info"
                  onClick={() => setShowInfoPanel(false)}
                  className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none"
                  aria-label="Close information panel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                {/* 1. ONLINE */}
                <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">
                      {t.howItWorksOnline}
                    </span>
                    <span className="text-[10px] text-neutral-400">•</span>
                    <span className="text-[11px] text-neutral-600">{t.howItWorksOnlineSub}</span>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-neutral-600">
                    {t.howItWorksOnlineDesc}
                  </p>
                </div>

                <div className="flex justify-center py-0.5 text-neutral-300">
                  <ArrowDown className="h-3 w-3" />
                </div>

                {/* 2. OFFLINE + NEARBY RELAY */}
                <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">
                      {t.howItWorksOfflineRelay}
                    </span>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-neutral-600">
                    {t.howItWorksOfflineRelaySub}
                  </p>
                  <p className="mt-0.5 pl-5 text-[11px] text-neutral-700 font-medium">
                    {t.howItWorksOfflineRelayDesc}
                  </p>
                </div>

                <div className="flex justify-center py-0.5 text-neutral-300">
                  <ArrowDown className="h-3 w-3" />
                </div>

                {/* 3. NO RELAY AVAILABLE */}
                <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <CircleSlash className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">
                      {t.howItWorksNoRelay}
                    </span>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-neutral-600">
                    {t.howItWorksNoRelaySub}
                  </p>
                  <p className="mt-0.5 pl-5 text-[11px] text-neutral-700 font-medium">
                    {t.howItWorksNoRelayDesc}
                  </p>
                </div>

                <div className="flex justify-center py-0.5 text-neutral-300">
                  <ArrowDown className="h-3 w-3" />
                </div>

                {/* 4. CONNECTIVITY RETURNS */}
                <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">
                      {t.howItWorksConnReturns}
                    </span>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-neutral-600">
                    {t.howItWorksConnReturnsSub}
                  </p>
                  <p className="mt-0.5 pl-5 text-[11px] text-neutral-700 font-medium">
                    {t.howItWorksConnReturnsDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Permission or Adapter Notice */}
          {connectivityNotice && (
            <div
              id="notice-connectivity-status"
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span>{connectivityNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Language Selection Modal (Profile -> Settings -> Language) */}
      {showLanguageModal && (
        <FieldLanguageSelectView
          initialLanguage={lang}
          onContinue={(selectedLang) => {
            setLanguage(selectedLang);
            setShowLanguageModal(false);
          }}
          mode="settings"
          onClose={() => setShowLanguageModal(false)}
        />
      )}
    </div>
  );
}
