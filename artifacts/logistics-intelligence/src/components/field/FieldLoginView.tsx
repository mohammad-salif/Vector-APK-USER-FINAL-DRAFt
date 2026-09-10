import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Truck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Car,
  User,
  RefreshCw,
  Terminal,
  Globe,
} from 'lucide-react';
import {
  type UserAccount,
  DEFAULT_DRIVER_ACCOUNT,
  findAccountByContact,
  verifyVehicleRegistration,
  registerDriverAccount,
  setActiveSessionAccount,
  type VehicleVerificationResult,
} from '@/services/authService';
import {
  type AppLanguage,
  SUPPORTED_LANGUAGES,
  getAppLanguage,
  setAppLanguage,
  getTranslations,
  subscribeAppLanguage,
} from '@/services/i18n';
import { FieldLanguageSelectView } from './FieldLanguageSelectView';
import { VectorLogo } from '@/components/brand/VectorBrand';

type AuthStep =
  | 'login'
  | 'login-otp'
  | 'signup-driver'
  | 'signup-verifying-vehicle'
  | 'signup-mobile-otp'
  | 'signup-email-otp'
  | 'signup-success';

interface FieldLoginViewProps {
  onLoginSuccess: (accountOrId: UserAccount | string) => void;
}

/**
 * Custom 6-digit OTP Box Input Component
 */
function OtpInputBox({
  value,
  onChange,
  autoFocus = true,
  idPrefix = 'otp',
}: {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
  idPrefix?: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  function handleDigitChange(index: number, char: string) {
    const clean = char.replace(/[^0-9]/g, '');
    if (!clean) {
      const next = digits.slice();
      next[index] = ' ';
      onChange(next.join('').trimEnd());
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6);
      onChange(pasted);
      const focusTarget = Math.min(pasted.length, 5);
      inputRefs.current[focusTarget]?.focus();
      return;
    }

    const next = digits.slice();
    next[index] = clean[clean.length - 1];
    onChange(next.join('').trimEnd());

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && (!digits[index] || digits[index] === ' ') && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          id={`${idPrefix}-digit-${idx}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus={autoFocus && idx === 0}
          value={digits[idx] === ' ' ? '' : digits[idx]}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className="h-12 w-11 rounded-xl border border-neutral-300 bg-white text-center font-mono text-lg font-bold text-neutral-900 shadow-2xs focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 sm:h-13 sm:w-12"
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}

export function FieldLoginView({ onLoginSuccess }: FieldLoginViewProps) {
  // App Language State
  const [lang, setLangState] = useState<AppLanguage>(() => getAppLanguage());
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    return subscribeAppLanguage((newLang) => {
      setLangState(newLang);
    });
  }, []);

  const t = useMemo(() => getTranslations(lang), [lang]);

  // Auth Flow Navigation State (Driver-Only)
  const [step, setStep] = useState<AuthStep>('login');

  // Login Form States (ONE SMART INPUT)
  const [loginContact, setLoginContact] = useState('');
  const [loginOtp, setLoginOtp] = useState('');

  // Driver Signup Form States
  const [signupFullName, setSignupFullName] = useState('');
  const [signupVehicleReg, setSignupVehicleReg] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  // Verification & Processing States
  const [vehicleVerificationResult, setVehicleVerificationResult] =
    useState<VehicleVerificationResult | null>(null);
  const [signupMobileOtp, setSignupMobileOtp] = useState('');
  const [signupEmailOtp, setSignupEmailOtp] = useState('');
  const [createdAccount, setCreatedAccount] = useState<UserAccount | null>(null);

  // Common UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(30);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  function isEmailContact(val: string): boolean {
    return val.includes('@');
  }

  function getMaskedContact(val: string): string {
    const trimmed = val.trim();
    if (isEmailContact(trimmed)) {
      const [user, domain] = trimmed.split('@');
      const maskedUser = user.length > 2 ? `${user[0]}••••${user[user.length - 1]}` : user;
      return `${maskedUser}@${domain || 'field.logistics.in'}`;
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `+91 ••••• ••${digits.slice(-3)}`;
    }
    return trimmed;
  }

  // -------------------------------------------------------------
  // 1. LOGIN SUBMISSION -> OTP
  // -------------------------------------------------------------
  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = loginContact.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your registered email or mobile number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResendCountdown(30);
      setLoginOtp('');
      setStep('login-otp');
    }, 400);
  }

  // -------------------------------------------------------------
  // 2. VERIFY LOGIN OTP
  // -------------------------------------------------------------
  function handleVerifyLoginOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = loginOtp.trim();
    if (cleanOtp.length < 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const existing = findAccountByContact(loginContact);
      if (existing) {
        setActiveSessionAccount(existing);
        onLoginSuccess(existing);
      } else {
        const fallback: UserAccount = {
          ...DEFAULT_DRIVER_ACCOUNT,
          mobile: isEmailContact(loginContact) ? DEFAULT_DRIVER_ACCOUNT.mobile : loginContact,
          email: isEmailContact(loginContact) ? loginContact : DEFAULT_DRIVER_ACCOUNT.email,
          lastLoginAt: 'Just now',
        };
        setActiveSessionAccount(fallback);
        onLoginSuccess(fallback);
      }
    }, 500);
  }

  // -------------------------------------------------------------
  // 3. DRIVER SIGNUP -> VERIFY VEHICLE
  // -------------------------------------------------------------
  async function handleDriverSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupFullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!signupVehicleReg.trim()) {
      setErrorMessage('Vehicle registration number is required.');
      return;
    }
    if (!signupMobile.trim()) {
      setErrorMessage('Mobile number is required.');
      return;
    }

    setStep('signup-verifying-vehicle');
    setIsLoading(true);

    try {
      const result = await verifyVehicleRegistration(signupVehicleReg);
      setVehicleVerificationResult(result);
      setIsLoading(false);

      if (result.verified) {
        setTimeout(() => {
          setResendCountdown(30);
          setSignupMobileOtp('');
          setStep('signup-mobile-otp');
        }, 1200);
      }
    } catch {
      setIsLoading(false);
      setVehicleVerificationResult({
        verified: false,
        message: "We couldn't verify this vehicle.",
        details: 'Check the registration number and try again.',
      });
    }
  }

  // -------------------------------------------------------------
  // 4. SIGNUP MOBILE OTP VERIFICATION
  // -------------------------------------------------------------
  function handleVerifySignupMobileOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (signupMobileOtp.trim().length < 6) {
      setErrorMessage('Please enter all 6 digits of the mobile verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      setIsLoading(false);

      if (signupEmail.trim()) {
        setResendCountdown(30);
        setSignupEmailOtp('');
        setStep('signup-email-otp');
      } else {
        await finalizeAccountCreation();
      }
    }, 450);
  }

  // -------------------------------------------------------------
  // 5. SIGNUP EMAIL OTP VERIFICATION (Optional Email)
  // -------------------------------------------------------------
  function handleVerifySignupEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (signupEmailOtp.trim().length < 6) {
      setErrorMessage('Please enter all 6 digits of the email verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      setIsLoading(false);
      await finalizeAccountCreation();
    }, 450);
  }

  // Finalize Driver Account Persistence
  async function finalizeAccountCreation() {
    try {
      const newAcc = await registerDriverAccount({
        fullName: signupFullName,
        vehicleRegistration: signupVehicleReg,
        mobile: signupMobile,
        email: signupEmail || undefined,
        vehicleId: vehicleVerificationResult?.vehicleId || 'VHC-2044',
      });
      setCreatedAccount(newAcc);
      setStep('signup-success');
    } catch {
      setErrorMessage('Could not complete account creation. Please try again.');
    }
  }

  // -------------------------------------------------------------
  // PROTOTYPE MODE: FAST-FORWARD EVALUATION (Driver V. Rawat)
  // -------------------------------------------------------------
  function handlePrototypeMode() {
    setActiveSessionAccount(DEFAULT_DRIVER_ACCOUNT);
    onLoginSuccess(DEFAULT_DRIVER_ACCOUNT);
  }

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex min-h-screen min-h-dvh flex-col justify-center bg-neutral-100/70 p-4 sm:p-6">
      {/* Settings / Language Modal when opened from subtle top selector */}
      {showLanguagePicker && (
        <FieldLanguageSelectView
          initialLanguage={lang}
          onContinue={(selectedLang) => {
            setLangState(selectedLang);
            setAppLanguage(selectedLang);
            setShowLanguagePicker(false);
          }}
          mode="settings"
          onClose={() => setShowLanguagePicker(false)}
        />
      )}

      <div className="mx-auto w-full max-w-md">
        {/* Subtle Language Selector on Authentication Screen */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Driver System Ready</span>
          </div>
          <button
            type="button"
            id="btn-auth-language-selector"
            onClick={() => setShowLanguagePicker(true)}
            className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-2xs hover:border-neutral-900 hover:bg-neutral-50"
            title="Change language"
          >
            <Globe className="h-3.5 w-3.5 text-neutral-600" />
            <span>{currentLangObj.nativeName}</span>
          </button>
        </div>

        {/* Official VECTOR Brand Header */}
        <div className="text-center py-2">
          <VectorLogo size="lg" layout="vertical" />
        </div>

        {/* CARD CONTAINER */}
        <div className="mt-5 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-7">
          {/* General Error Notice */}
          {errorMessage && (
            <div
              id="auth-error-alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 1: FINAL LOGIN SCREEN (DRIVER-ONLY)                    */}
          {/* ========================================================== */}
          {step === 'login' && (
            <div>
              <div className="border-b border-neutral-100 pb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  {t.login}
                </p>
                <h2 className="mt-1 text-base font-bold text-neutral-950 sm:text-lg">
                  {t.welcomeBack}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">{t.loginSubtitle}</p>
              </div>

              {/* ONE SMART INPUT ONLY (Email or Mobile) */}
              <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="login-contact-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
                  >
                    {t.emailOrMobile}
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="login-contact-input"
                      type="text"
                      value={loginContact}
                      onChange={(e) => setLoginContact(e.target.value)}
                      placeholder={t.loginPlaceholder}
                      required
                      autoComplete="username"
                      className="block min-h-[46px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-continue-otp"
                  disabled={isLoading}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-black disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>{t.continueBtn}</span>
                  )}
                </button>
              </form>

              {/* Create New Account Link (Opens Driver Registration directly) */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  id="btn-go-to-signup"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep('signup-driver');
                  }}
                  className="text-xs font-bold text-neutral-900 underline hover:text-black"
                >
                  {t.newHereCreateAccount}
                </button>
              </div>

              {/* DEVELOPMENT / EVALUATION SECTION (Preserved per Section 11) */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="bg-white px-2.5 text-neutral-400">{t.devEvaluation}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  id="btn-prototype-mode-access"
                  data-testid="button-prototype-mode"
                  onClick={handlePrototypeMode}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-100 active:scale-[0.99]"
                >
                  <Terminal className="h-4 w-4 text-neutral-600" />
                  <span>{t.prototypeModeBtn}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                </button>
                <p className="text-center text-[10px] text-neutral-500">{t.prototypeModeSub}</p>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 2: LOGIN OTP VERIFICATION                             */}
          {/* ========================================================== */}
          {step === 'login-otp' && (
            <div>
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
                  {isEmailContact(loginContact) ? t.verifyEmailTitle : t.verifyMobileTitle}
                </h2>
                <p className="mt-1 text-xs text-neutral-600">
                  {isEmailContact(loginContact)
                    ? t.verifyEmailSub(getMaskedContact(loginContact))
                    : t.verifyMobileSub(getMaskedContact(loginContact))}
                </p>
              </div>

              <form onSubmit={handleVerifyLoginOtp} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    {t.otpLabel}
                  </label>
                  <div className="mt-2">
                    <OtpInputBox
                      idPrefix="login-otp"
                      value={loginOtp}
                      onChange={setLoginOtp}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-center font-mono text-[11px] text-neutral-500">
                    {t.otpHint}
                  </p>
                </div>

                <button
                  type="submit"
                  id="btn-verify-login-otp"
                  disabled={isLoading || loginOtp.trim().length < 6}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-black disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>{t.verifyAndContinue}</span>
                  )}
                </button>

                {/* Resend Code and Change Contact */}
                <div className="flex flex-col items-center gap-2 pt-1 text-xs">
                  {resendCountdown > 0 ? (
                    <span className="font-mono text-neutral-400">
                      {t.resendIn(resendCountdown)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      id="btn-resend-login-otp"
                      onClick={() => setResendCountdown(30)}
                      className="font-bold text-neutral-900 underline hover:text-black"
                    >
                      {t.resendCode}
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-change-login-contact"
                    onClick={() => {
                      setErrorMessage(null);
                      setStep('login');
                    }}
                    className="text-neutral-500 underline hover:text-neutral-900"
                  >
                    {t.changeContact}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 3: CREATE NEW ACCOUNT (OPENS DIRECTLY INTO DRIVER REG) */}
          {/* ========================================================== */}
          {step === 'signup-driver' && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep('login');
                }}
                className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t.back}</span>
              </button>

              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
                  {t.createAccountTitle}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">{t.createAccountSub}</p>
              </div>

              <form onSubmit={handleDriverSignupSubmit} className="mt-4 space-y-3.5">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="signup-name-input"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    {t.fullNameLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-name-input"
                      type="text"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      required
                      className="block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>
                </div>

                {/* Vehicle registration number */}
                <div>
                  <label
                    htmlFor="signup-vehicle-input"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    {t.vehicleRegLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                      <Car className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-vehicle-input"
                      type="text"
                      value={signupVehicleReg}
                      onChange={(e) => setSignupVehicleReg(e.target.value.toUpperCase())}
                      placeholder={t.vehicleRegPlaceholder}
                      required
                      className="block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-3 font-mono text-xs uppercase text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-500 leading-tight">
                    {t.operationalIdentifierNote}
                  </p>
                </div>

                {/* Mobile number (REQUIRED) */}
                <div>
                  <label
                    htmlFor="signup-mobile-input"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    {t.mobileLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-mobile-input"
                      type="tel"
                      value={signupMobile}
                      onChange={(e) => setSignupMobile(e.target.value)}
                      placeholder={t.mobilePlaceholder}
                      required
                      className="block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>
                </div>

                {/* Email address (OPTIONAL) */}
                <div>
                  <label
                    htmlFor="signup-email-input"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    {t.emailOptionalLabel}
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-email-input"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder={t.emailOptionalPlaceholder}
                      className="block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-500">{t.requiredNote}</p>
                </div>

                <button
                  type="submit"
                  id="btn-signup-submit-driver"
                  className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-black"
                >
                  <span>{t.continueBtn}</span>
                </button>
              </form>

              {/* Already have an account? Login */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  id="btn-signup-already-have-account"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep('login');
                  }}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  {t.alreadyHaveAccount}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 4: VEHICLE VALIDATION STATE                           */}
          {/* ========================================================== */}
          {step === 'signup-verifying-vehicle' && (
            <div className="py-4 text-center">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
                    <RefreshCw className="h-7 w-7 animate-spin text-neutral-700" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">{t.verifyingVehicle}</h3>
                  <p className="mx-auto max-w-xs text-xs text-neutral-500">
                    {t.checkingVehicle}
                  </p>
                  <p className="font-mono text-xs font-bold text-neutral-700">
                    {signupVehicleReg}
                  </p>
                </div>
              ) : vehicleVerificationResult?.verified ? (
                <div className="space-y-3 animate-in fade-in zoom-in-95">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-950">{t.vehicleVerified}</h3>
                  <p className="text-xs text-neutral-600">{t.authorizedRecordFound}</p>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-left">
                    <p className="font-bold text-neutral-800">
                      Vehicle: {signupVehicleReg}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Assigned to Logistics Fleet Unit 4 • Corridor Delta
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-950">{t.vehicleFailure}</h3>
                  <p className="text-xs text-neutral-600">{t.vehicleFailureSub}</p>
                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-retry-vehicle-verification"
                      onClick={() => setStep('signup-driver')}
                      className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black"
                    >
                      {t.retryVehicleBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 5: SIGNUP MOBILE OTP                                  */}
          {/* ========================================================== */}
          {step === 'signup-mobile-otp' && (
            <div>
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
                  {t.verifyMobileTitle}
                </h2>
                <p className="mt-1 text-xs text-neutral-600">
                  {t.verifyMobileSub(getMaskedContact(signupMobile))}
                </p>
              </div>

              <form onSubmit={handleVerifySignupMobileOtp} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    {t.otpLabel}
                  </label>
                  <div className="mt-2">
                    <OtpInputBox
                      idPrefix="signup-mobile-otp"
                      value={signupMobileOtp}
                      onChange={setSignupMobileOtp}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-center font-mono text-[11px] text-neutral-500">
                    {t.otpHint}
                  </p>
                </div>

                <button
                  type="submit"
                  id="btn-verify-signup-mobile-otp"
                  disabled={isLoading || signupMobileOtp.trim().length < 6}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-black disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>{t.verifyAndContinue}</span>
                  )}
                </button>

                <div className="flex items-center justify-center text-xs">
                  {resendCountdown > 0 ? (
                    <span className="font-mono text-neutral-400">
                      {t.resendIn(resendCountdown)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendCountdown(30)}
                      className="font-bold text-neutral-900 underline hover:text-black"
                    >
                      {t.resendCode}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 6: SIGNUP EMAIL OTP (Only when email provided)        */}
          {/* ========================================================== */}
          {step === 'signup-email-otp' && (
            <div>
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
                  {t.verifyEmailTitle}
                </h2>
                <p className="mt-1 text-xs text-neutral-600">
                  {t.verifyEmailSub(getMaskedContact(signupEmail))}
                </p>
              </div>

              <form onSubmit={handleVerifySignupEmailOtp} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    {t.otpLabel}
                  </label>
                  <div className="mt-2">
                    <OtpInputBox
                      idPrefix="signup-email-otp"
                      value={signupEmailOtp}
                      onChange={setSignupEmailOtp}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-center font-mono text-[11px] text-neutral-500">
                    {t.otpHint}
                  </p>
                </div>

                <button
                  type="submit"
                  id="btn-verify-signup-email-otp"
                  disabled={isLoading || signupEmailOtp.trim().length < 6}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-black disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>{t.verifyAndContinue}</span>
                  )}
                </button>

                <div className="flex items-center justify-center text-xs">
                  {resendCountdown > 0 ? (
                    <span className="font-mono text-neutral-400">
                      {t.resendIn(resendCountdown)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendCountdown(30)}
                      className="font-bold text-neutral-900 underline hover:text-black"
                    >
                      {t.resendCode}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 7: SIGNUP SUCCESS                                     */}
          {/* ========================================================== */}
          {step === 'signup-success' && createdAccount && (
            <div className="space-y-4 py-2 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-950">{t.accountCreatedTitle}</h3>
                <p className="text-sm font-semibold text-neutral-800">
                  {t.welcome(createdAccount.fullName)}
                </p>
                <p className="mt-1 text-xs text-neutral-500 max-w-xs mx-auto">
                  {t.accountLinkedMessage}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Driver:</span>
                  <span className="font-bold text-neutral-900">{createdAccount.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vehicle:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {createdAccount.vehicleRegistration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Mobile:</span>
                  <span className="font-mono text-neutral-900">{createdAccount.mobile}</span>
                </div>
              </div>

              <button
                type="button"
                id="btn-complete-onboarding-driver"
                onClick={() => {
                  setActiveSessionAccount(createdAccount);
                  onLoginSuccess(createdAccount);
                }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-black"
              >
                <span>{t.continueToDriverApp}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
