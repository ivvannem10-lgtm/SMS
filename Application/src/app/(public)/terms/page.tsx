import Link from 'next/link'
import { GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    num: '01',
    title: 'Introduction',
    content: `This Legal Master Policy governs the SMS School Management System ("the System"), a unified institutional platform integrating academic, administrative, financial, HR, and operational modules within a single ecosystem. By accessing or using the System, all users — including administrators, faculty, staff, and students — agree to be bound by the terms set forth in this document. If you do not agree with any part of these terms, you must discontinue use of the System immediately.`,
  },
  {
    num: '02',
    title: 'System Scope',
    content: `The System encompasses the Student Information System (SIS), Learning Management System (LMS), Human Resource Information System (HRIS), Asset Management System (AMS), and all supporting School Operations modules. These modules are designed to synchronize institutional processes and data across all departments, colleges, and administrative units of the Institution.`,
  },
  {
    num: '03',
    title: 'Data Governance',
    content: `All data generated, stored, processed, or transmitted within the System remains the exclusive property of the Institution. Users acknowledge that:\n\n• Personal and academic data entered into the System is subject to institutional data governance policies.\n• Data must be accurate, truthful, and current at all times.\n• Users are prohibited from exporting, sharing, or disclosing institutional data to unauthorized parties.\n• The Institution reserves the right to audit, review, and correct any data stored within the System.\n• Data retention and disposal follow applicable Philippine data privacy laws, including RA 10173 (Data Privacy Act of 2012).`,
  },
  {
    num: '04',
    title: 'User Access & Credentials',
    content: `Access to the System is strictly restricted to authorized users only. Role-Based Access Control (RBAC) governs permissions across all modules — each user role (Super Admin, Registrar, Treasurer, HR Staff, AMO, Teacher, Student, etc.) is granted access only to the features relevant to their function.\n\nThe System serves students of all age levels, including minors and young learners. For students who are minors (below 18 years of age), a parent or legal guardian must provide consent for their enrollment and use of the System. The Institution is responsible for obtaining and documenting such consent at the point of admission. By enrolling a minor student into the System, the Institution confirms that appropriate parental or guardian consent has been secured.\n\nUsers must:\n\n• Protect their login credentials and not share them with any other person.\n• Immediately report lost, stolen, or compromised credentials to the System Administrator.\n• Not attempt to access features, data, or accounts beyond their assigned role.\n• Log out of all active sessions when leaving a workstation or shared device.\n\nFor young students who do not manage their own credentials, a designated guardian, teacher, or administrator is responsible for the secure management and use of those credentials on the student's behalf.\n\nThe Institution reserves the right to reset, revoke, or modify user credentials at any time without prior notice.`,
  },
  {
    num: '05',
    title: 'Security & Privacy',
    content: `The System implements authentication, session management, audit logging, and activity monitoring mechanisms to protect institutional data. However:\n\n• The Institution remains solely responsible for its internal cybersecurity practices, network infrastructure, and endpoint security.\n• Users must not install unauthorized software, browser extensions, or plugins that interact with the System.\n• Any attempt to intercept, tamper with, or manipulate data transmissions is strictly prohibited and constitutes a criminal offense under Philippine law.\n• Personal data collected by the System is processed in accordance with the Data Privacy Act of 2012 (RA 10173) and the National Privacy Commission's implementing rules.`,
  },
  {
    num: '06',
    title: 'Acceptable Use Policy',
    content: `Users agree to use the System solely for legitimate institutional purposes. The following are expressly prohibited:\n\n• Introducing, uploading, or executing malicious code, scripts, or software.\n• Attempting unauthorized access, privilege escalation, or system exploitation.\n• Using the System to harass, intimidate, or harm other users.\n• Distributing, reproducing, or publishing System-generated documents without proper authorization.\n• Conducting commercial activities or operating unauthorized services through the System.\n• Circumventing security controls or audit mechanisms.\n\nViolations of this Acceptable Use Policy may result in immediate suspension or permanent termination of access, in addition to disciplinary action under institutional policies and applicable Philippine laws.`,
  },
  {
    num: '07',
    title: 'System Availability',
    content: `The System aims for continuous, uninterrupted operation. However, scheduled maintenance windows, software updates, infrastructure upgrades, and external factors (such as internet service disruptions, force majeure events, or third-party service outages) may cause temporary unavailability.\n\nThe Institution does not guarantee any specific uptime percentage. Critical academic deadlines and institutional timelines should account for potential System unavailability. Users are advised to complete time-sensitive tasks well in advance of deadlines.`,
  },
  {
    num: '08',
    title: 'Third-Party Integrations',
    content: `The System may integrate with or rely upon external third-party services, libraries, and platforms. The Institution acknowledges that such external services operate under their own terms of service, privacy policies, and service agreements. The Institution is not liable for disruptions, data breaches, or service changes caused by third-party providers. Users interacting with third-party integrations do so subject to those providers' terms.`,
  },
  {
    num: '09',
    title: 'Audit & Monitoring',
    content: `All system activities — including logins, data access, record modifications, document generation, and administrative actions — are logged and may be reviewed for security, compliance, and operational purposes.\n\nAudit logs are immutable and cannot be deleted or modified by regular users. Only authorized administrators with explicit audit-management privileges may perform actions on audit records, and such actions are themselves logged. Users have no expectation of privacy with respect to their System activity logs.`,
  },
  {
    num: '10',
    title: 'Limitation of Liability',
    content: `The System and its administrators are not liable for:\n\n• Loss, corruption, or unauthorized access to data caused by user negligence, shared credentials, or compromised devices.\n• Academic or financial consequences arising from user errors in data entry or document generation.\n• Disruptions to academic processes caused by System unavailability or third-party service outages.\n• Any indirect, incidental, or consequential damages arising from use of or inability to use the System.\n\nThe Institution's total liability for any claim arising from the use of the System shall not exceed the amount paid by the Institution for the relevant System module subscription in the preceding calendar month.`,
  },
  {
    num: '11',
    title: 'Account Termination',
    content: `User access to the System may be suspended or permanently terminated under the following circumstances:\n\n• Violation of any provision of this Policy.\n• Identified security risk or compromised account.\n• Institutional request (e.g., student graduation, employee resignation, or contract end).\n• Extended inactivity beyond the period defined by institutional policy.\n• Court order, regulatory directive, or law enforcement request.\n\nUpon termination, the user's access rights are immediately revoked. Data associated with the account may be retained for audit, legal, or institutional recordkeeping purposes in accordance with applicable data retention policies.`,
  },
  {
    num: '12',
    title: 'Policy Amendments',
    content: `This Policy may be updated, amended, or revised by the Institution at any time. Users will be notified of material changes through in-system notifications, email, or official institutional announcements. Continued use of the System after any amendments constitutes acceptance of the revised Policy. It is the user's responsibility to review this Policy periodically. The most current version of this Policy is always accessible at the Terms of Service page within the System.`,
  },
  {
    num: '13',
    title: 'Governing Law',
    content: `This Policy is governed by and construed in accordance with applicable institutional jurisdiction laws. Where institutional policies do not specify, the laws of the Republic of the Philippines apply — including but not limited to:\n\n• Republic Act No. 10173 — Data Privacy Act of 2012\n• Republic Act No. 8792 — Electronic Commerce Act of 2000\n• Republic Act No. 10175 — Cybercrime Prevention Act of 2012\n\nAny disputes arising from the use of the System shall be resolved through the Institution's internal grievance mechanisms before escalation to appropriate legal or regulatory bodies.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c1e3d]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">School Eco</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/apply" className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
              Apply Online
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#0c1e3d] pb-16 pt-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-200 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <span>/</span>
            <span className="text-slate-300">Terms of Service</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/20 border border-brand-500/30">
              <ShieldCheck className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Terms of Service</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Legal Master Policy Framework — SMS School Management System</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                  Effective Date: <span className="text-slate-300 font-medium">May 10, 2026</span>
                </span>
                <span className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                  Version: <span className="text-slate-300 font-medium">1.0</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex gap-8">
          {/* Sticky TOC */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 rounded-2xl bg-white border border-[#e4ebf5] p-4">
              <p className="text-2xs font-bold uppercase tracking-widest text-slate-400 mb-3">Contents</p>
              <nav className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <a key={s.num} href={`#section-${s.num}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition-colors group">
                    <span className="font-mono text-slate-300 group-hover:text-brand-400">{s.num}</span>
                    <span className="truncate">{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Notice banner */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Please read these terms carefully.</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  By accessing or using the SMS School Management System, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These terms apply to all users — administrators, faculty, staff, and students.
                </p>
              </div>
            </div>

            {/* Sections */}
            {SECTIONS.map((section) => (
              <div key={section.num} id={`section-${section.num}`}
                className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden scroll-mt-20">
                <div className="flex items-center gap-3 px-6 py-4 bg-[#f8fafd] border-b border-[#e4ebf5]">
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-50 border border-brand-100 rounded-lg px-2 py-0.5">
                    {section.num}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{section.title}</h2>
                </div>
                <div className="px-6 py-5">
                  {section.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3 last:mb-0 whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Acceptance card */}
            <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6">
              <h3 className="text-base font-bold text-white mb-2">Acceptance of Terms</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                By logging into or using the SMS School Management System, you confirm that you have read and understood these Terms and agree to comply with all applicable provisions. The System serves students of all ages, including young learners and preschoolers. For minor students, the parent or legal guardian is deemed to have accepted these Terms on the student's behalf at the point of institutional enrollment. If you are an adult accessing the System on behalf of a student or institution, you represent that you have the authority to bind that individual or entity to these Terms.
              </p>
              <p className="text-xs text-white/50">
                For questions regarding these Terms, contact your System Administrator or the Data Protection Officer of the Institution.
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 pb-4">
              © {new Date().getFullYear()} SMS School Management System — St. Dominic College. All rights reserved.
            </p>
          </main>
        </div>
      </div>
    </div>
  )
}
