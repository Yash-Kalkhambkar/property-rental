import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  Buildings,
  ChartLineUp,
  CreditCard,
  House,
  Lightbulb,
  ShieldCheck,
  UsersThree,
} from '@phosphor-icons/react'
import { LandingBackground } from '@/components/shared/AppBackground'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { cn } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

const stats = [
  { value: '2,400+', label: 'Units managed across India' },
  { value: '96%', label: 'On-time rent collection' },
  { value: '18 hrs', label: 'Saved on admin each month' },
  { value: '4.8/5', label: 'Owner satisfaction' },
]

const features = [
  {
    icon: ChartLineUp,
    title: 'Portfolio dashboard',
    description:
      'Occupancy, revenue, and overdue accounts in one view — no spreadsheet juggling.',
  },
  {
    icon: UsersThree,
    title: 'Tenant management',
    description:
      'Profiles, leases, and contact details linked to each unit across your properties.',
  },
  {
    icon: CreditCard,
    title: 'Payment tracking',
    description:
      'Record collections, flag overdue rent, and reconcile expected vs collected monthly.',
  },
  {
    icon: ShieldCheck,
    title: 'Separate resident access',
    description:
      'Tenants see only their leases and payments. Owners keep full portfolio control.',
  },
]

const insights = [
  {
    tag: 'Market insight',
    icon: Lightbulb,
    title: 'Vacancy costs more than you think',
    body: 'One empty month on ₹25,000 rent is ₹25,000 gone — plus upkeep. Tracking vacancy early lets you act before gaps widen.',
  },
  {
    tag: 'Best practice',
    icon: ShieldCheck,
    title: 'Document everything at move-in',
    body: 'Lease terms, deposits, and unit condition notes stored digitally prevent disputes months later.',
  },
  {
    tag: 'Collection tip',
    icon: CreditCard,
    title: 'Remind before the due date',
    body: 'A reminder 3 days before rent is due cuts late payments significantly. RentEase surfaces overdue accounts automatically.',
  },
]

const steps = [
  {
    step: '1',
    title: 'Create your owner account',
    description: 'Register, add properties and units, then connect tenants when leases are ready.',
  },
  {
    step: '2',
    title: 'Set up leases & payments',
    description: 'Record rent amounts, due dates, and terms. Track collections as they come in.',
  },
  {
    step: '3',
    title: 'Residents sign in separately',
    description: 'Tenants use their own portal — no access to your owner data or other units.',
  },
]

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen text-[#e2e8f0]">
      <LandingBackground />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a14]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <BrandLogo variant="landing" linkTo="/" />
          <nav className="hidden items-center gap-8 text-sm text-[#94a3b8] sm:flex">
            {[
              ['#features', 'Features'],
              ['#insights', 'Insights'],
              ['#how-it-works', 'How it works'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/tenant/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#94a3b8] transition-colors hover:text-white sm:inline-block"
            >
              Resident login
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_-4px_rgba(59,130,246,0.5)] transition-all hover:bg-[#2563eb]"
            >
              Owner login
            </Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
          <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#93c5fd]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                  Property rental management · India
                </span>
                <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                  Run your rentals with{' '}
                  <span className="text-gradient-owner">clarity, not chaos.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#94a3b8]">
                  One workspace for owners. One calm portal for residents. Leases, tenants,
                  and payments — finally in one place.
                </p>
              </Reveal>
              <Reveal delay={0.1} className="mt-10 flex flex-col gap-4 sm:flex-row">
                <PortalCard
                  variant="owner"
                  title="Owner portal"
                  description="Manage properties, leases, tenants, and collections."
                  href="/login"
                  icon={Buildings}
                />
                <PortalCard
                  variant="tenant"
                  title="Resident portal"
                  description="View leases, payments, and your rental profile."
                  href="/tenant/login"
                  icon={House}
                />
              </Reveal>
            </div>
            <Reveal delay={0.15} className="hidden lg:block">
              <div className="landing-glass animate-float-subtle relative rounded-2xl p-8">
                <p className="text-xs font-medium uppercase tracking-widest text-[#64748b]">
                  Live portfolio snapshot
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Occupancy', value: '94%', accent: true },
                    { label: 'Collected', value: '₹12.4L' },
                    { label: 'Active leases', value: '128' },
                    { label: 'Overdue', value: '3', warn: true },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-[#64748b]">
                        {m.label}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-2xl font-semibold',
                          m.accent && 'text-[#93c5fd]',
                          m.warn && 'text-[#fbbf24]',
                          !m.accent && !m.warn && 'text-white',
                        )}
                      >
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="mt-16 flex flex-col items-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#475569]">
              Scroll to explore
            </p>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="mt-3 h-10 w-px bg-gradient-to-b from-[#3b82f6] to-transparent"
            />
          </Reveal>
        </div>
      </section>

      <section className="landing-section-light border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.05}>
                <div className={cn(i > 0 && 'lg:border-l lg:border-white/[0.06] lg:pl-8')}>
                  <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                  <p className="mt-1.5 text-sm text-[#94a3b8]">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-white/[0.06] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <Reveal>
            <p className="text-sm font-medium text-[#93c5fd]">Features</p>
            <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for how rentals actually work
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.07}>
                <article className="landing-section-card group h-full rounded-2xl p-6 transition-all duration-300 hover:border-[#3b82f6]/30 hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.25)]">
                  <div className="icon-chip-owner mb-5 h-11 w-11 transition-transform group-hover:scale-105">
                    <feature.icon weight="duotone" size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
                    {feature.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="landing-section-light border-b border-white/[0.06] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <Reveal>
            <p className="text-sm font-medium text-[#5eead4]">Insights</p>
            <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Smarter rental decisions
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {insights.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <article className="landing-section-card flex h-full flex-col rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#94a3b8]">
                      {item.tag}
                    </span>
                    <item.icon weight="duotone" size={20} className="text-[#5eead4]" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold leading-snug text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#94a3b8]">
                    {item.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-white/[0.06] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <Reveal>
            <p className="text-sm font-medium text-[#93c5fd]">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Up and running in three steps
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.08}>
                <li className="relative landing-section-card rounded-2xl p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6]/15 text-sm font-semibold text-[#93c5fd] ring-1 ring-[#3b82f6]/30">
                    {item.step}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
                    {item.description}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative py-24 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-t from-[#3b82f6]/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 text-center sm:px-8">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to simplify your rentals?
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="w-full rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0f172a] sm:w-auto"
              >
                Create owner account
              </Link>
              <Link to="/login" className="landing-glass w-full rounded-xl px-6 py-3.5 text-sm font-medium text-white sm:w-auto">
                Owner sign in
              </Link>
              <Link
                to="/tenant/login"
                className="w-full rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-[#94a3b8] hover:text-white sm:w-auto"
              >
                Resident sign in
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#060a14]/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-[#64748b] sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} RentEase</span>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-white">Owner portal</Link>
            <Link to="/tenant/login" className="hover:text-white">Resident portal</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PortalCard({
  variant,
  title,
  description,
  href,
  icon: Icon,
}: {
  variant: 'owner' | 'tenant'
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ weight?: 'duotone'; size?: number; className?: string }>
}) {
  const isOwner = variant === 'owner'
  return (
    <Link
      to={href}
      className={cn(
        'group landing-glass flex flex-1 flex-col rounded-2xl p-6 transition-all duration-300 sm:max-w-xs',
        isOwner
          ? 'hover:border-[#3b82f6]/35 hover:shadow-[0_0_48px_-12px_rgba(59,130,246,0.35)]'
          : 'hover:border-[#5eead4]/25 hover:shadow-[0_0_48px_-12px_rgba(13,148,136,0.25)]',
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-10 w-10 items-center justify-center rounded-xl',
          isOwner ? 'bg-[#3b82f6]/15 text-[#93c5fd]' : 'bg-[#0d9488]/15 text-[#5eead4]',
        )}
      >
        <Icon weight="duotone" size={22} />
      </div>
      <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#94a3b8]">{description}</p>
      <span className={cn('mt-5 inline-flex items-center gap-1.5 text-sm font-medium', isOwner ? 'text-[#93c5fd]' : 'text-[#5eead4]')}>
        Sign in
        <ArrowRight weight="bold" size={14} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  )
}
