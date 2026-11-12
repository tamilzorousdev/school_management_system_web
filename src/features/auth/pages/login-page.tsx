import { useEffect, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BellRing,
  Bus,
  CalendarCheck2,
  Check,
  CircleAlert,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import campus from '@/assets/login-campus.webp'
import { BrandLogo, BrandMark } from '@/components/common/brand-logo'
import { OtpInput } from '@/components/common/otp-input'
import { Button } from '@/components/ui/button'
import { config } from '@/config/env'
import { toApiError } from '@/lib/api/errors'
import { session } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { authApi, meKey, type OtpSent } from '../api'

const route = getRouteApi('/login')

const FEATURES = [
  {
    icon: Bus,
    title: 'Live bus tracking',
    tag: 'Real-time GPS',
    text: 'Every bus on one map, with stop alerts and delay messages sent to parents.',
  },
  {
    icon: CalendarCheck2,
    title: 'Attendance and homework',
    text: 'Teachers mark the roll in seconds and parents know within a minute.',
  },
  {
    icon: BellRing,
    title: 'Instant alerts',
    tag: 'Tamil and English',
    text: 'App notification first, SMS when the phone is offline.',
  },
]

const ERROR_TITLES: Record<string, string> = {
  MOBILE_NOT_REGISTERED: 'Number not registered',
  ACCOUNT_INACTIVE: 'Account switched off',
  NO_ADMIN_ACCESS: 'No admin access',
  APP_NOT_ALLOWED: 'No admin access',
  AUTH_SERVICE_UNAVAILABLE: 'Sign-in is busy',
  OTP_INVALID: 'Wrong code',
  OTP_EXPIRED: 'Code expired',
  OTP_ATTEMPTS_EXCEEDED: 'Too many attempts',
}

interface LoginError {
  code: string
  message: string
}

const normalize = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits.slice(0, 10)
}

const spaced = (mobile: string) => mobile.replace(/^(\d{5})(\d+)/, '$1 $2')

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { redirect } = route.useSearch()
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState<OtpSent | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [error, setError] = useState<LoginError | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const fail = (caught: unknown) => {
    const apiError = toApiError(caught)
    setError({ code: apiError.code, message: apiError.message })
  }

  const requestOtp = async (event?: FormEvent, resend = false) => {
    event?.preventDefault()
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError({ code: 'VALIDATION_FAILED', message: 'Enter a valid 10-digit mobile number' })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await (resend ? authApi.resendOtp(mobile) : authApi.requestOtp(mobile))
      setSent(result)
      setOtp('')
      setResendIn(result.resend_in)
    } catch (caught) {
      fail(caught)
    } finally {
      setBusy(false)
    }
  }

  const verify = async (code = otp) => {
    if (code.length !== 6 || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await authApi.verifyOtp(mobile, code)
      session.set({ accessToken: result.access_token, refreshToken: result.refresh_token })
      queryClient.setQueryData(meKey, result.user)
      setDone(true)

      const destination =
        redirect && redirect.startsWith('/')
          ? redirect
          : result.user.apps.includes('admin')
            ? '/'
            : result.user.apps.includes('parent')
              ? '/parent-preview'
              : result.user.apps.includes('staff')
                ? '/teacher-preview'
                : '/'
      await navigate({ to: destination, replace: true })
    } catch (caught) {
      fail(caught)
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  const changeNumber = () => {
    setSent(null)
    setOtp('')
    setError(null)
  }

  const mobileInvalid = !sent && Boolean(error)

  return (
    <div className='flex min-h-dvh flex-col bg-background lg:h-dvh lg:overflow-hidden'>
      <header className='flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5 text-xs text-muted-foreground sm:px-6'>
        <div className='flex items-center gap-3'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase'>
            <span className='size-1.5 animate-pulse rounded-full bg-primary' />
            Admin console
          </span>
          <span className='hidden sm:inline'>School operations and bus tracking in one place</span>
        </div>
        {import.meta.env.DEV && (
          <span className='rounded-md border bg-muted px-2 py-0.5 font-semibold'>
            Development · OTP 123456
          </span>
        )}
      </header>

      <main className='mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-4 p-3 lg:min-h-0 lg:flex-row lg:items-stretch lg:gap-6 lg:p-5'>
        <section className='relative flex flex-col overflow-hidden rounded-2xl bg-sidebar p-6 text-white shadow-xl sm:p-8 lg:w-[48%] lg:rounded-3xl lg:p-9 lg:tall:p-12'>
          <img
            src={campus}
            alt=''
            aria-hidden
            fetchPriority='high'
            decoding='async'
            className='pointer-events-none absolute inset-0 size-full scale-105 object-cover object-center'
          />
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1f17]/95 via-[#075c43]/80 to-[#0b1f17]/70 mix-blend-multiply'
          />
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent'
          />

          <div className='relative flex items-center justify-between gap-3'>
            <div className='grid gap-1'>
              <BrandLogo className='h-8 text-white sm:h-9' />
              <p className='text-xs font-medium text-white/60'>School Management System</p>
            </div>
            <span className='hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md sm:inline-flex'>
              <ShieldCheck className='size-3.5 text-sidebar-primary' />
              OTP sign-in
            </span>
          </div>

          <div className='relative py-6 lg:my-auto lg:py-4'>
            <span className='mb-4 hidden items-center gap-2 rounded-full border border-sidebar-primary/40 bg-primary/30 px-3 py-1 text-xs font-semibold tracking-wide text-sidebar-primary uppercase sm:inline-flex'>
              <Sparkles className='size-3.5' />
              Smart school platform
            </span>
            <h1 className='max-w-xl text-2xl leading-[1.15] font-extrabold tracking-tight text-balance sm:text-4xl xl:tall:text-5xl'>
              Everything your school needs.{' '}
              <span className='bg-gradient-to-r from-sidebar-primary to-emerald-200 bg-clip-text text-transparent'>
                One smart platform.
              </span>
            </h1>
            <p className='mt-4 hidden max-w-lg text-sm leading-relaxed text-white/75 sm:block sm:text-base lg:short:hidden'>
              Run the school day, keep parents in the loop and follow every bus, all from one place.
            </p>

            <ul className='mt-6 hidden max-w-lg gap-3 lg:grid lg:tall:mt-8'>
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className='flex items-start gap-4 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md transition-colors hover:bg-white/15'
                >
                  <span className='grid size-10 shrink-0 place-items-center rounded-lg border border-sidebar-primary/40 bg-primary/40 text-sidebar-primary'>
                    <feature.icon className='size-5' />
                  </span>
                  <div className='grid gap-0.5'>
                    <span className='flex flex-wrap items-center gap-2 text-sm font-semibold'>
                      {feature.title}
                      {feature.tag && (
                        <span className='rounded bg-sidebar-primary/20 px-2 text-[10px] font-medium text-sidebar-primary'>
                          {feature.tag}
                        </span>
                      )}
                    </span>
                    <span className='text-xs leading-normal text-white/70'>{feature.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className='relative hidden items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/60 lg:flex lg:short:hidden'>
            <span className='font-medium'>Designed for smarter school management.</span>
            <span className='font-mono text-[11px]'>© {new Date().getFullYear()} Tamilzorous</span>
          </div>
        </section>

        <section className='flex flex-col items-center justify-center px-1 py-2 sm:px-8 lg:min-h-0 lg:w-[52%] lg:flex-1 lg:overflow-y-auto lg:py-2'>
          <div className='w-full max-w-[440px] rounded-2xl border bg-card p-6 shadow-[0_20px_40px_-15px_rgba(15,26,21,0.08)] sm:p-9 lg:rounded-3xl lg:p-8 lg:tall:p-9'>
            <div className='mb-6 flex items-center justify-between'>
              <span className='grid size-12 place-items-center rounded-2xl border border-primary/20 bg-accent text-primary'>
                {done ? <Check className='size-6' /> : <LockKeyhole className='size-6' />}
              </span>
              <span className='inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs font-semibold text-accent-foreground'>
                <BrandMark className='h-3.5' />
                Admin portal
              </span>
            </div>

            {done ? (
              <div className='grid gap-4 py-4 text-center'>
                <h2 className='text-2xl font-extrabold tracking-tight'>Signed in</h2>
                <p className='text-sm text-muted-foreground'>Opening your school console…</p>
                <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
                  <div className='h-full w-4/5 animate-pulse rounded-full bg-primary' />
                </div>
              </div>
            ) : (
              <>
                <div className='mb-7 grid gap-1.5'>
                  <h2 className='text-2xl font-extrabold tracking-tight sm:text-3xl'>
                    {sent ? 'Enter the code' : 'Welcome back!'}
                  </h2>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {sent
                      ? 'Type the 6-digit code from the SMS to sign in.'
                      : 'Sign in to the school admin console with your registered mobile number.'}
                  </p>
                </div>

                {error && error.code !== 'VALIDATION_FAILED' && (
                  <div
                    role='alert'
                    className='mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive'
                  >
                    <CircleAlert className='mt-0.5 size-4 shrink-0' />
                    <div className='grid gap-0.5'>
                      <span className='font-bold'>
                        {ERROR_TITLES[error.code] ?? 'Could not sign in'}
                      </span>
                      <span>{error.message}</span>
                    </div>
                  </div>
                )}

                {!sent ? (
                  <form className='grid gap-5' onSubmit={requestOtp} noValidate>
                    <div className='grid gap-2'>
                      <label
                        htmlFor='mobile'
                        className='flex items-center justify-between text-xs font-bold tracking-wider uppercase'
                      >
                        <span className={cn(mobileInvalid && 'text-destructive')}>
                          Registered mobile number
                        </span>
                        <span className='text-[11px] font-semibold tracking-normal text-primary normal-case'>
                          Staff and admin
                        </span>
                      </label>
                      <div
                        className={cn(
                          'flex rounded-xl border bg-muted/40 transition focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10',
                          mobileInvalid &&
                            'border-destructive bg-destructive/5 focus-within:border-destructive focus-within:ring-destructive/10'
                        )}
                      >
                        <span className='flex items-center gap-1.5 pr-3 pl-3.5 text-sm font-semibold'>
                          +91
                        </span>
                        <span aria-hidden className='my-2 w-px bg-border' />
                        <div className='relative flex-1'>
                          <input
                            id='mobile'
                            type='tel'
                            inputMode='numeric'
                            autoComplete='tel-national'
                            autoFocus
                            placeholder='98765 43210'
                            value={spaced(mobile)}
                            aria-invalid={mobileInvalid || undefined}
                            aria-describedby='mobile-hint'
                            onChange={(event) => {
                              setMobile(normalize(event.target.value))
                              setError(null)
                            }}
                            className='tabular w-full bg-transparent py-3 pr-10 pl-3.5 text-base font-semibold tracking-wide outline-none placeholder:font-medium placeholder:text-muted-foreground/60'
                          />
                          {/^[6-9]\d{9}$/.test(mobile) && (
                            <Check className='absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-primary' />
                          )}
                        </div>
                      </div>
                      {error?.code === 'VALIDATION_FAILED' ? (
                        <p id='mobile-hint' className='text-xs font-medium text-destructive'>
                          {error.message}
                        </p>
                      ) : (
                        <p
                          id='mobile-hint'
                          className='flex items-center gap-1.5 text-[11px] text-muted-foreground'
                        >
                          <Info className='size-3.5 shrink-0 text-primary' />
                          Use the mobile number registered with the school office.
                        </p>
                      )}
                    </div>
                    <Button
                      type='submit'
                      size='lg'
                      className='group h-12 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:shadow-primary/20'
                      loading={busy}
                      disabled={mobile.length !== 10}
                    >
                      Continue with OTP
                      <ArrowRight className='transition-transform group-hover:translate-x-0.5' />
                    </Button>
                  </form>
                ) : (
                  <form
                    className='grid gap-5'
                    onSubmit={(event) => {
                      event.preventDefault()
                      void verify()
                    }}
                    noValidate
                  >
                    <div className='flex items-center justify-between gap-3 rounded-xl border bg-muted/50 p-3 text-xs'>
                      <span>
                        <span className='text-muted-foreground'>Code sent to </span>
                        <span className='tabular font-bold'>+91 {sent.mobile_masked}</span>
                      </span>
                      <button
                        type='button'
                        onClick={changeNumber}
                        className='font-bold text-primary hover:underline'
                      >
                        Change
                      </button>
                    </div>
                    <div className='grid gap-2'>
                      <span className='text-xs font-bold tracking-wider uppercase'>
                        6-digit code
                      </span>
                      <OtpInput
                        value={otp}
                        onChange={(value) => {
                          setOtp(value)
                          setError(null)
                        }}
                        onComplete={(value) => void verify(value)}
                        disabled={busy}
                        invalid={Boolean(error)}
                        autoFocus
                      />
                    </div>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>Didn’t get the SMS?</span>
                      {resendIn > 0 ? (
                        <span className='tabular font-semibold text-accent-foreground'>
                          Resend in 0:{String(resendIn).padStart(2, '0')}
                        </span>
                      ) : (
                        <button
                          type='button'
                          onClick={() => void requestOtp(undefined, true)}
                          disabled={busy}
                          className='font-bold text-primary hover:underline disabled:opacity-50'
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                    <Button
                      type='submit'
                      size='lg'
                      className='h-12 rounded-xl text-sm font-bold shadow-md'
                      loading={busy}
                      disabled={otp.length !== 6}
                    >
                      Verify and sign in
                      <Check />
                    </Button>
                  </form>
                )}

                <div className='mt-6 flex items-start gap-2.5 border-t pt-4 text-[11.5px] leading-normal text-muted-foreground'>
                  <ShieldCheck className='mt-0.5 size-4 shrink-0 text-primary' />
                  <p>
                    Codes expire after{' '}
                    <span className='font-semibold text-foreground'>10 minutes</span>. Never share
                    your code with anyone, including school staff.
                  </p>
                </div>
              </>
            )}

            <p className='mt-6 border-t pt-5 text-center text-xs text-muted-foreground'>
              Trouble signing in? Ask the school office to check your number.
            </p>
          </div>
        </section>
      </main>

      <footer className='flex flex-col items-center justify-between gap-2 border-t bg-card px-6 py-3.5 text-xs text-muted-foreground sm:flex-row lg:hidden'>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          <span className='font-bold text-foreground'>{config.appName}</span>
          <span className='text-border'>|</span>
          <span>Bus tracking · Attendance · Parent alerts</span>
        </div>
        <span>© {new Date().getFullYear()} Tamilzorous</span>
      </footer>
    </div>
  )
}
