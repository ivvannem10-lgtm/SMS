import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database…\n')

  const pw = await bcrypt.hash('password', 10)

  // ── School ────────────────────────────────────────────────────────────────────
  const school = await db.school.upsert({
    where: { slug: 'stdominic' },
    update: {},
    create: {
      name: 'St. Dominic College',
      slug: 'stdominic',
      address: '45 Rizal Ave, Quezon City',
      phone: '+63 2 8000-1234',
      email: 'info@stdominic.edu.ph',
      primaryColor: '#1a4a8a',
      plan: 'PROFESSIONAL',
    },
  })
  console.log(`✓ School: ${school.name}`)

  // ── Users ─────────────────────────────────────────────────────────────────────
  const upsertUser = (email: string, name: string, role: string) =>
    db.user.upsert({
      where: { email },
      update: {},
      create: { email, password: pw, name, role, schoolId: school.id },
    })

  const [, , , , , , , , , , , uHR, uAMO, uTeacher, uStudent] = await Promise.all([
    upsertUser('admin@school.edu',          'Alex Administrator',   'SUPER_ADMIN'),
    upsertUser('admissions@school.edu',     'Maria Santos',         'ADMISSION_OFFICER'),
    upsertUser('registrar@school.edu',      'Rosa Registrar',       'REGISTRAR'),
    upsertUser('treasury@school.edu',       'Tom Treasury',         'TREASURER'),
    upsertUser('accounting@school.edu',     'Clara Accounting',     'ACCOUNTING'),
    upsertUser('purchasing@school.edu',     'Perry Purchasing',     'PURCHASING_OFFICER'),
    upsertUser('academic@school.edu',       'Ana Academic',         'ACADEMIC_ADMIN'),
    upsertUser('dean.computing@school.edu', 'Dr. Carlos Reyes',     'DEAN'),
    upsertUser('dean.business@school.edu',  'Dr. Roberto Tan',      'DEAN'),
    upsertUser('dean.nursing@school.edu',   'Dr. Elena Cruz',       'DEAN'),
    upsertUser('dean.arts@school.edu',      'Dr. Grace Villanueva', 'DEAN'),
    upsertUser('hr@school.edu',             'Hannah Rodriguez',     'HR_STAFF'),
    upsertUser('amo@school.edu',            'Marco Dela Cruz',      'AMO'),
    upsertUser('prof.santos@school.edu',    'Prof. Roberto Santos', 'TEACHER'),
    upsertUser('student@school.edu',        'Ethan Dela Cruz',      'STUDENT'),
  ])
  console.log('✓ Users: 15 demo accounts')

  // ── Programs ──────────────────────────────────────────────────────────────────
  const [progCS] = await Promise.all([
    db.program.upsert({ where: { code_schoolId: { code: 'BSCS',   schoolId: school.id } }, update: {}, create: { name: 'BS Computer Science',       code: 'BSCS',   schoolId: school.id } }),
    db.program.upsert({ where: { code_schoolId: { code: 'BSBA',   schoolId: school.id } }, update: {}, create: { name: 'BS Business Administration', code: 'BSBA',   schoolId: school.id } }),
    db.program.upsert({ where: { code_schoolId: { code: 'BSN',    schoolId: school.id } }, update: {}, create: { name: 'BS Nursing',                 code: 'BSN',    schoolId: school.id } }),
    db.program.upsert({ where: { code_schoolId: { code: 'BAComm', schoolId: school.id } }, update: {}, create: { name: 'BA Communication',           code: 'BAComm', schoolId: school.id } }),
  ])
  console.log('✓ Programs: 4')

  // ── Academic Year ─────────────────────────────────────────────────────────────
  const existingAY = await db.academicYear.findFirst({ where: { name: '2025-2026', schoolId: school.id } })
  const ay = existingAY ?? await db.academicYear.create({
    data: { name: '2025-2026', startDate: new Date('2025-08-01'), endDate: new Date('2026-05-31'), isActive: true, schoolId: school.id },
  })

  // ── Semester ──────────────────────────────────────────────────────────────────
  const existingSem = await db.semester.findFirst({ where: { name: '1st Semester', academicYearId: ay.id } })
  const sem = existingSem ?? await db.semester.create({
    data: {
      name: '1st Semester', type: 'FIRST', isActive: true,
      startDate: new Date('2025-08-01'), endDate: new Date('2025-12-20'),
      enrollmentStart: new Date('2025-07-01'), enrollmentEnd: new Date('2025-08-15'),
      maxUnits: 24, academicYearId: ay.id,
    },
  })
  console.log(`✓ Academic Year: ${ay.name} · Semester: ${sem.name}`)

  // ── Subjects ──────────────────────────────────────────────────────────────────
  const [sCS101] = await Promise.all([
    db.subject.upsert({ where: { code_schoolId: { code: 'CS101',   schoolId: school.id } }, update: {}, create: { code: 'CS101',   name: 'Introduction to Programming',     units: 3, labUnits: 1, type: 'LECTURE', schoolId: school.id } }),
    db.subject.upsert({ where: { code_schoolId: { code: 'CS201',   schoolId: school.id } }, update: {}, create: { code: 'CS201',   name: 'Data Structures and Algorithms',  units: 3, labUnits: 1, type: 'LECTURE', schoolId: school.id } }),
    db.subject.upsert({ where: { code_schoolId: { code: 'MATH101', schoolId: school.id } }, update: {}, create: { code: 'MATH101', name: 'Mathematics in the Modern World', units: 3, labUnits: 0, type: 'LECTURE', schoolId: school.id } }),
  ])
  console.log('✓ Subjects: 3')

  // ── Faculty ───────────────────────────────────────────────────────────────────
  const faculty = await db.faculty.upsert({
    where: { facultyId_schoolId: { facultyId: 'FAC-2024-001', schoolId: school.id } },
    update: {},
    create: {
      facultyId: 'FAC-2024-001', firstName: 'Roberto', lastName: 'Santos',
      email: 'prof.santos@school.edu', phone: '09171234567',
      department: 'College of Computing', position: 'Associate Professor',
      status: 'ACTIVE', schoolId: school.id, userId: uTeacher.id,
    },
  })
  console.log('✓ Faculty: Prof. Roberto Santos')

  // ── Subject Offering ──────────────────────────────────────────────────────────
  const existingOff = await db.subjectOffering.findFirst({ where: { section: 'BSCS-1A', semesterId: sem.id, subjectId: sCS101.id } })
  const off1 = existingOff ?? await db.subjectOffering.create({
    data: {
      section: 'BSCS-1A', status: 'PUBLISHED', maxStudents: 35,
      subjectId: sCS101.id, semesterId: sem.id,
      schedules:   { create: [{ dayOfWeek: 'MON', startTime: '08:00', endTime: '10:00' }, { dayOfWeek: 'WED', startTime: '08:00', endTime: '10:00' }] },
      assignments: { create: [{ role: 'BOTH', facultyId: faculty.id }] },
    },
  })
  console.log('✓ Offerings: 1 published (CS101 · BSCS-1A)')

  // ── Student ───────────────────────────────────────────────────────────────────
  const existingStudent = await db.student.findFirst({ where: { userId: uStudent.id } })
  const student = existingStudent ?? await db.student.create({
    data: {
      studentId: '2025-00000', firstName: 'Ethan', lastName: 'Dela Cruz',
      email: 'student@school.edu', phone: '09000000000',
      dateOfBirth: new Date('2005-01-01'), gender: 'MALE',
      address: 'St. Dominic College', yearLevel: 1, status: 'ACTIVE',
      programId: progCS.id, schoolId: school.id, userId: uStudent.id,
    },
  })

  // ── Enrollment ────────────────────────────────────────────────────────────────
  const existingEnr = await db.enrollment.findFirst({ where: { studentId: student.id, offeringId: off1.id } })
  if (!existingEnr) {
    await db.enrollment.create({
      data: { status: 'ENROLLED', studentId: student.id, offeringId: off1.id, semesterId: sem.id, confirmedAt: new Date('2025-08-12') },
    })
  }
  console.log('✓ Student + enrollment seeded')

  // ── SOA ───────────────────────────────────────────────────────────────────────
  const existingSOA = await db.sOA.findFirst({ where: { studentId: student.id, semesterId: sem.id } })
  if (!existingSOA) {
    await db.sOA.create({
      data: {
        status: 'UNPAID', totalAmount: 28500, paidAmount: 0, balance: 28500,
        semesterId: sem.id, studentId: student.id,
        items: { create: [
          { description: 'Tuition Fee',       amount: 21000, type: 'TUITION' },
          { description: 'Miscellaneous Fee',  amount: 3500,  type: 'MISC'    },
          { description: 'Laboratory Fee',     amount: 2500,  type: 'LAB'     },
          { description: 'Registration Fee',   amount: 1000,  type: 'REG'     },
          { description: 'Student ID Fee',     amount: 500,   type: 'OTHER'   },
        ]},
      },
    })
  }
  console.log('✓ SOA seeded for demo student')

  // ── Applicants ────────────────────────────────────────────────────────────────
  const applicantDefs = [
    { ref: 'APP-2025-0001', firstName: 'Maria', lastName: 'Reyes',     status: 'PENDING',      email: 'maria.reyes@gmail.com',     phone: '09171000001' },
    { ref: 'APP-2025-0002', firstName: 'Jose',  lastName: 'Garcia',    status: 'PENDING',      email: 'jose.garcia@yahoo.com',      phone: '09172000002' },
    { ref: 'APP-2025-0003', firstName: 'Ana',   lastName: 'Mendoza',   status: 'PENDING',      email: 'ana.mendoza@outlook.com',    phone: '09173000003' },
    { ref: 'APP-2025-0004', firstName: 'Carlo', lastName: 'Bautista',  status: 'UNDER_REVIEW', email: 'carlo.bautista@gmail.com',   phone: '09174000004' },
    { ref: 'APP-2025-0005', firstName: 'Liza',  lastName: 'Villanueva',status: 'ACCEPTED',     email: 'liza.villanueva@gmail.com',  phone: '09175000005' },
  ]
  await Promise.all(
    applicantDefs.map(a =>
      db.applicant.upsert({
        where: { referenceNumber: a.ref },
        update: {},
        create: {
          referenceNumber: a.ref, firstName: a.firstName, lastName: a.lastName,
          email: a.email, phone: a.phone, applicantType: 'FRESHMAN',
          status: a.status, schoolId: school.id,
          dateOfBirth: new Date('2006-06-15'), gender: 'MALE',
          address: 'Quezon City, Metro Manila',
        },
      })
    )
  )
  console.log('✓ Applicants: 5 (3 PENDING, 1 UNDER_REVIEW, 1 ACCEPTED)')

  // ── HR Employees ──────────────────────────────────────────────────────────────
  const employeeDefs = [
    { employeeNo: 'EMP-2024-001', firstName: 'Hannah',  lastName: 'Rodriguez', email: 'hr@school.edu',         phone: '09181001001', department: 'Human Resources', position: 'HR Officer',          employmentType: 'FULL_TIME', workSetup: 'ON_SITE', salary: 35000 },
    { employeeNo: 'EMP-2024-002', firstName: 'Marco',   lastName: 'Dela Cruz', email: 'amo@school.edu',        phone: '09181001002', department: 'Asset Management', position: 'AMO Officer',         employmentType: 'FULL_TIME', workSetup: 'ON_SITE', salary: 32000 },
    { employeeNo: 'EMP-2024-003', firstName: 'Rosa',    lastName: 'Registrar', email: 'registrar@school.edu',  phone: '09181001003', department: 'Registrar Office', position: 'Registrar',           employmentType: 'FULL_TIME', workSetup: 'ON_SITE', salary: 40000 },
    { employeeNo: 'EMP-2024-004', firstName: 'Tom',     lastName: 'Treasury',  email: 'treasury@school.edu',   phone: '09181001004', department: 'Treasury Office',  position: 'Treasurer',           employmentType: 'FULL_TIME', workSetup: 'ON_SITE', salary: 45000 },
    { employeeNo: 'EMP-2024-005', firstName: 'Clara',   lastName: 'Accounting',email: 'accounting@school.edu', phone: '09181001005', department: 'Accounting Office','position': 'Accounting Officer', employmentType: 'FULL_TIME', workSetup: 'ON_SITE', salary: 38000 },
  ]

  const hrEmployees = await Promise.all(
    employeeDefs.map(async e => {
      const existing = await db.hREmployee.findFirst({ where: { employeeNo: e.employeeNo, schoolId: school.id } })
      if (existing) return existing
      return db.hREmployee.create({
        data: {
          employeeNo: e.employeeNo, firstName: e.firstName, lastName: e.lastName,
          email: e.email, phone: e.phone, department: e.department,
          position: e.position, employmentType: e.employmentType,
          workSetup: e.workSetup, status: 'ACTIVE', salary: e.salary,
          hiredAt: new Date('2024-01-15'), schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ HR Employees: 5')

  // ── Job Postings ──────────────────────────────────────────────────────────────
  const jobDefs = [
    { title: 'IT Systems Administrator',        department: 'IT Department',    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', status: 'OPEN',  salaryMin: 30000, salaryMax: 45000, slots: 1 },
    { title: 'Administrative Assistant',         department: 'Admin Office',     employmentType: 'FULL_TIME', workSetup: 'ON_SITE', status: 'OPEN',  salaryMin: 20000, salaryMax: 28000, slots: 2 },
    { title: 'Part-time English Instructor',     department: 'College of Arts',  employmentType: 'PART_TIME', workSetup: 'ON_SITE', status: 'DRAFT', salaryMin: 600,   salaryMax: 800,   slots: 3 },
  ]
  await Promise.all(
    jobDefs.map(async j => {
      const existing = await db.jobPosting.findFirst({ where: { title: j.title, schoolId: school.id } })
      if (existing) return existing
      return db.jobPosting.create({
        data: {
          title: j.title, department: j.department, employmentType: j.employmentType,
          workSetup: j.workSetup, status: j.status, salaryMin: j.salaryMin,
          salaryMax: j.salaryMax, slots: j.slots,
          description: `We are looking for a qualified ${j.title} to join St. Dominic College.`,
          requirements: 'Bachelor\'s degree required. At least 1 year of relevant experience.',
          deadline: new Date('2025-09-30'), schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Job Postings: 3')

  // ── HR Leave Requests ─────────────────────────────────────────────────────────
  const leaveDefs = [
    { employeeIdx: 0, leaveType: 'VACATION',  startDate: '2025-08-18', endDate: '2025-08-22', days: 5, reason: 'Family vacation in Palawan.',       status: 'PENDING'  },
    { employeeIdx: 2, leaveType: 'SICK',      startDate: '2025-08-05', endDate: '2025-08-06', days: 2, reason: 'Flu and fever, with medical certificate.', status: 'APPROVED' },
    { employeeIdx: 4, leaveType: 'EMERGENCY', startDate: '2025-07-28', endDate: '2025-07-28', days: 1, reason: 'Family emergency — immediate travel required.', status: 'REJECTED' },
  ]
  await Promise.all(
    leaveDefs.map(async l => {
      const emp = hrEmployees[l.employeeIdx]
      const existing = await db.hRLeaveRequest.findFirst({
        where: { employeeId: emp.id, leaveType: l.leaveType, startDate: new Date(l.startDate) },
      })
      if (existing) return existing
      return db.hRLeaveRequest.create({
        data: {
          leaveType: l.leaveType, startDate: new Date(l.startDate),
          endDate: new Date(l.endDate), days: l.days, reason: l.reason,
          status: l.status, employeeId: emp.id, schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ HR Leave Requests: 3')

  // ── Assets ────────────────────────────────────────────────────────────────────
  const assetDefs = [
    { assetTag: 'IT-COMP-2025-001', name: 'Dell OptiPlex 7090',       category: 'COMPUTER',  brand: 'Dell',   model: 'OptiPlex 7090',  status: 'AVAILABLE',         purchaseCost: 45000 },
    { assetTag: 'IT-COMP-2025-002', name: 'Lenovo ThinkPad E14',      category: 'COMPUTER',  brand: 'Lenovo', model: 'ThinkPad E14',   status: 'DEPLOYED',          purchaseCost: 52000 },
    { assetTag: 'IT-COMP-2025-003', name: 'HP ProBook 440 G9',        category: 'COMPUTER',  brand: 'HP',     model: 'ProBook 440 G9', status: 'UNDER_MAINTENANCE', purchaseCost: 48000 },
    { assetTag: 'IT-PROJ-2025-001', name: 'Epson EB-X51 Projector',   category: 'EQUIPMENT', brand: 'Epson',  model: 'EB-X51',         status: 'AVAILABLE',         purchaseCost: 28000 },
    { assetTag: 'IT-PRNT-2025-001', name: 'HP LaserJet Pro M404dn',   category: 'EQUIPMENT', brand: 'HP',     model: 'LaserJet Pro M404dn', status: 'AVAILABLE',    purchaseCost: 18000 },
  ]
  const assets = await Promise.all(
    assetDefs.map(async a => {
      const existing = await db.asset.findFirst({ where: { assetTag: a.assetTag, schoolId: school.id } })
      if (existing) return existing
      return db.asset.create({
        data: {
          assetTag: a.assetTag, name: a.name, category: a.category,
          brand: a.brand, model: a.model, status: a.status,
          purchaseCost: a.purchaseCost, purchaseDate: new Date('2025-01-15'),
          supplier: 'PC Express Philippines', condition: 'GOOD',
          department: 'IT Department', location: 'Room 201, Main Building',
          warrantyExpiry: new Date('2027-01-15'), schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Assets: 5')

  // ── Consumables ───────────────────────────────────────────────────────────────
  const consumableDefs = [
    { name: 'Bond Paper (A4, 80gsm)',  category: 'Office Supplies', unit: 'REAM', quantity: 500, minThreshold: 50  },
    { name: 'Printer Ink Cartridge',  category: 'IT Supplies',     unit: 'PCS',  quantity: 20,  minThreshold: 5   },
    { name: 'Whiteboard Marker',      category: 'Office Supplies', unit: 'PCS',  quantity: 50,  minThreshold: 10  },
    { name: 'Ballpen (Black)',        category: 'Office Supplies', unit: 'PCS',  quantity: 200, minThreshold: 30  },
  ]
  await Promise.all(
    consumableDefs.map(async c => {
      const existing = await db.consumable.findFirst({ where: { name: c.name, schoolId: school.id } })
      if (existing) return existing
      return db.consumable.create({
        data: {
          name: c.name, category: c.category, unit: c.unit,
          quantity: c.quantity, minThreshold: c.minThreshold,
          location: 'Supply Room, Admin Building',
          supplier: 'National Book Store Branches', schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Consumables: 4')

  // ── Vendors ───────────────────────────────────────────────────────────────────
  const vendorDefs = [
    { name: 'PC Express Philippines, Inc.',  category: 'IT_SUPPLIES',     email: 'b2b@pcexpress.ph',      phone: '+63 2 8441-1111', contactPerson: 'Javier Cruz'    },
    { name: 'National Book Store',           category: 'OFFICE_SUPPLIES', email: 'procurement@nbs.com.ph', phone: '+63 2 8525-2221', contactPerson: 'Carla Navarro'  },
    { name: 'Mandaue Foam Industries',       category: 'FURNITURE',       email: 'sales@mandauefoam.com',  phone: '+63 32 238-3000', contactPerson: 'Rodel Bautista' },
  ]
  await Promise.all(
    vendorDefs.map(async v => {
      const existing = await db.vendor.findFirst({ where: { name: v.name, schoolId: school.id } })
      if (existing) return existing
      return db.vendor.create({
        data: {
          name: v.name, category: v.category, email: v.email,
          phone: v.phone, contactPerson: v.contactPerson,
          address: 'Metro Manila, Philippines', status: 'ACTIVE', schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Vendors: 3')

  // ── Purchase Requests ─────────────────────────────────────────────────────────
  const prDefs = [
    {
      prNumber: 'PR-2025-0001', title: 'Classroom Computers — Lab 1 Upgrade', department: 'IT Department',
      requestedBy: uAMO.id, requestedByName: 'Marco Dela Cruz', priority: 'HIGH', status: 'SUBMITTED',
      totalAmount: 225000,
      items: [
        { id: 'pri-1', description: 'Dell OptiPlex 7090 Desktop', quantity: 5, unitPrice: 45000, totalPrice: 225000 },
      ],
      approvals: [
        { id: 'pra-1', level: 1, approverRole: 'ACCOUNTING',         status: 'PENDING' },
        { id: 'pra-2', level: 2, approverRole: 'PURCHASING_OFFICER', status: 'PENDING' },
      ],
    },
    {
      prNumber: 'PR-2025-0002', title: 'Office Supplies Q3 2025', department: 'Admin Office',
      requestedBy: uHR.id, requestedByName: 'Hannah Rodriguez', priority: 'MEDIUM', status: 'APPROVED',
      totalAmount: 12500,
      items: [
        { id: 'pri-3', description: 'Bond Paper (A4) — 50 reams',  quantity: 50,  unitPrice: 200,  totalPrice: 10000 },
        { id: 'pri-4', description: 'Ballpen (Black) — 10 boxes',  quantity: 10,  unitPrice: 250,  totalPrice: 2500  },
      ],
      approvals: [
        { id: 'pra-3', level: 1, approverRole: 'ACCOUNTING',         status: 'APPROVED' },
        { id: 'pra-4', level: 2, approverRole: 'PURCHASING_OFFICER', status: 'APPROVED' },
      ],
    },
    {
      prNumber: 'PR-2025-0003', title: 'Faculty Lounge Furniture Replacement', department: 'Facilities',
      requestedBy: uHR.id, requestedByName: 'Hannah Rodriguez', priority: 'LOW', status: 'DRAFT',
      totalAmount: 85000,
      items: [
        { id: 'pri-5', description: 'Executive Office Chair', quantity: 10, unitPrice: 5500, totalPrice: 55000 },
        { id: 'pri-6', description: 'Conference Table (8-seater)', quantity: 1, unitPrice: 30000, totalPrice: 30000 },
      ],
      approvals: [
        { id: 'pra-5', level: 1, approverRole: 'ACCOUNTING',         status: 'PENDING' },
        { id: 'pra-6', level: 2, approverRole: 'PURCHASING_OFFICER', status: 'PENDING' },
      ],
    },
  ]
  await Promise.all(
    prDefs.map(async pr => {
      const existing = await db.purchaseRequest.findFirst({ where: { prNumber: pr.prNumber } })
      if (existing) return existing
      return db.purchaseRequest.create({
        data: {
          prNumber: pr.prNumber, title: pr.title, department: pr.department,
          requestedBy: pr.requestedBy, requestedByName: pr.requestedByName,
          priority: pr.priority, status: pr.status, totalAmount: pr.totalAmount,
          items: pr.items, approvals: pr.approvals, schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Purchase Requests: 3')

  // ── Chart of Accounts ─────────────────────────────────────────────────────────
  const coaDefs = [
    { code: '1001', name: 'Cash in Bank',      type: 'ASSET',     description: 'Operating bank accounts', balance: 1250000 },
    { code: '2001', name: 'Accounts Payable',  type: 'LIABILITY', description: 'Amounts owed to vendors', balance: 185000  },
    { code: '4001', name: 'Tuition Revenue',   type: 'REVENUE',   description: 'Student tuition fee income', balance: 3200000 },
    { code: '5001', name: 'Salaries Expense',  type: 'EXPENSE',   description: 'Faculty and staff salaries', balance: 980000  },
    { code: '5002', name: 'Office Supplies',   type: 'EXPENSE',   description: 'Office and classroom supplies', balance: 45000 },
  ]
  await Promise.all(
    coaDefs.map(async coa => {
      const existing = await db.chartOfAccount.findFirst({ where: { code: coa.code, schoolId: school.id } })
      if (existing) return existing
      return db.chartOfAccount.create({
        data: {
          code: coa.code, name: coa.name, type: coa.type,
          description: coa.description, balance: coa.balance,
          isActive: true, schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Chart of Accounts: 5')

  // ── Fee Structures ────────────────────────────────────────────────────────────
  const feeDefs = [
    { name: 'Tuition Fee',          category: 'TUITION', applicability: 'PER_UNIT',         amount: 1500 },
    { name: 'Miscellaneous Fee',    category: 'MISC',    applicability: 'ALL_STUDENTS',     amount: 3500 },
    { name: 'Laboratory Fee',       category: 'LAB',     applicability: 'ALL_STUDENTS',     amount: 2500 },
    { name: 'Registration Fee',     category: 'REG',     applicability: 'ALL_STUDENTS',     amount: 1000 },
    { name: 'Student ID Fee',       category: 'OTHER',   applicability: 'NEW_STUDENTS_ONLY', amount: 500  },
    { name: 'NSTP Fee',             category: 'OTHER',   applicability: 'NEW_STUDENTS_ONLY', amount: 750  },
    { name: 'Athletic Fee',         category: 'MISC',    applicability: 'ALL_STUDENTS',     amount: 600  },
    { name: 'Library Fee',          category: 'MISC',    applicability: 'ALL_STUDENTS',     amount: 400  },
  ]
  await Promise.all(
    feeDefs.map(async f => {
      const existing = await db.feeStructure.findFirst({ where: { name: f.name, schoolId: school.id } })
      if (existing) return existing
      return db.feeStructure.create({
        data: {
          name: f.name, category: f.category, applicability: f.applicability,
          amount: f.amount, isActive: true, schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Fee Structures: 8')

  // ── Cashflow Entries ──────────────────────────────────────────────────────────
  const cashflowDefs = [
    { date: '2025-08-01', type: 'INFLOW',  category: 'TUITION',    description: 'Tuition payments — 1st Semester batch 1',  amount: 850000, reference: 'CF-2025-001', department: 'Treasury Office' },
    { date: '2025-08-05', type: 'OUTFLOW', category: 'SALARIES',   description: 'Faculty salaries — August 2025',           amount: 420000, reference: 'CF-2025-002', department: 'HR/Payroll'      },
    { date: '2025-08-10', type: 'INFLOW',  category: 'MISC_FEES',  description: 'Miscellaneous fees collection',            amount: 175000, reference: 'CF-2025-003', department: 'Treasury Office' },
    { date: '2025-08-12', type: 'OUTFLOW', category: 'SUPPLIES',   description: 'Office supplies procurement (PR-2025-0002)', amount: 12500, reference: 'CF-2025-004', department: 'Admin Office'    },
    { date: '2025-08-15', type: 'OUTFLOW', category: 'UTILITIES',  description: 'Electricity and water — August 2025',      amount: 38000, reference: 'CF-2025-005', department: 'Facilities'      },
  ]
  await Promise.all(
    cashflowDefs.map(async c => {
      const existing = await db.cashflowEntry.findFirst({ where: { reference: c.reference, schoolId: school.id } })
      if (existing) return existing
      return db.cashflowEntry.create({
        data: {
          date: new Date(c.date), type: c.type, category: c.category,
          description: c.description, amount: c.amount, reference: c.reference,
          department: c.department, recordedBy: 'Clara Accounting', schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Cashflow Entries: 5')

  // ── Support Tickets ───────────────────────────────────────────────────────────
  const ticketDefs = [
    {
      ticketNumber: 'TKT-0001', subject: 'Cannot access student portal after password reset',
      description: 'I reset my password but still cannot log in. The page keeps showing an error.',
      category: 'IT_SUPPORT', priority: 'HIGH', status: 'IN_PROGRESS',
      submittedBy: uStudent.id, submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    },
    {
      ticketNumber: 'TKT-0002', subject: 'Grade concern for CS101 — midterm result',
      description: 'I believe my midterm grade was recorded incorrectly. Please verify with the professor.',
      category: 'GRADES_CONCERN', priority: 'MEDIUM', status: 'OPEN',
      submittedBy: uStudent.id, submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    },
    {
      ticketNumber: 'TKT-0003', subject: 'Projector in Room 301 not working',
      description: 'The projector in Room 301 (Science Building) has been non-functional since Monday.',
      category: 'FACILITIES', priority: 'MEDIUM', status: 'UNDER_REVIEW',
      submittedBy: uTeacher.id, submittedByName: 'Prof. Roberto Santos', submittedByRole: 'TEACHER', portal: 'teacher',
    },
  ]
  await Promise.all(
    ticketDefs.map(async t => {
      const existing = await db.supportTicket.findFirst({ where: { ticketNumber: t.ticketNumber } })
      if (existing) return existing
      return db.supportTicket.create({
        data: {
          ticketNumber: t.ticketNumber, subject: t.subject, description: t.description,
          category: t.category, priority: t.priority, status: t.status,
          submittedBy: t.submittedBy, submittedByName: t.submittedByName,
          submittedByRole: t.submittedByRole, portal: t.portal,
          replies: [], slaDeadline: new Date('2025-08-20'), schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Support Tickets: 3')

  // ── Knowledge Base Articles ───────────────────────────────────────────────────
  const kbDefs = [
    {
      title: 'How to View Your Grades', slug: 'how-to-view-grades',
      category: 'Student Guide',
      content: 'To view your grades, log in to the student portal and navigate to My Grades from the sidebar. Grades are only visible after the Registrar has published them. If you do not see your grades, please contact the Registrar\'s Office.',
      tags: ['grades', 'student', 'portal'],
    },
    {
      title: 'How to File a Leave Request', slug: 'how-to-file-leave-request',
      category: 'HR Guide',
      content: 'Employees can file leave requests by going to the HR module and selecting Leave Requests. Click "File Leave Request", fill in the leave type, dates, and reason, then submit. Your department head will receive a notification to approve or reject the request.',
      tags: ['leave', 'hr', 'employees'],
    },
    {
      title: 'How to Submit a Purchase Request', slug: 'how-to-submit-purchase-request',
      category: 'Purchasing Guide',
      content: 'To submit a purchase request, navigate to Purchasing > Purchase Requests and click "New Request". Fill in the department, items needed with quantities and estimated prices, then submit for approval. The request will go through a two-step approval process: Accounting then Purchasing Officer.',
      tags: ['purchasing', 'procurement', 'request'],
    },
  ]
  await Promise.all(
    kbDefs.map(async kb => {
      const existing = await db.kBArticle.findFirst({ where: { slug: kb.slug, schoolId: school.id } })
      if (existing) return existing
      return db.kBArticle.create({
        data: {
          title: kb.title, slug: kb.slug, category: kb.category,
          content: kb.content, tags: kb.tags,
          isPublished: true, schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ KB Articles: 3')

  // ── Institutional Forms ───────────────────────────────────────────────────────
  const formDefs = [
    {
      title: 'Leave Application Form',
      description: 'Official leave application form for all employees of St. Dominic College.',
      category: 'HR', department: 'HR', visibility: 'STAFF_ONLY', status: 'PUBLISHED',
      createdBy: uHR.id, createdByName: 'Hannah Rodriguez',
      fields: [
        { id: 'f1', label: 'Employee Name',  type: 'text',   required: true  },
        { id: 'f2', label: 'Department',     type: 'text',   required: true  },
        { id: 'f3', label: 'Leave Type',     type: 'select', required: true, options: ['Vacation', 'Sick', 'Emergency', 'Maternity/Paternity'] },
        { id: 'f4', label: 'Start Date',     type: 'date',   required: true  },
        { id: 'f5', label: 'End Date',       type: 'date',   required: true  },
        { id: 'f6', label: 'Reason',         type: 'textarea', required: true },
      ],
    },
    {
      title: 'IT Equipment Request Form',
      description: 'Request form for borrowing or acquiring IT equipment from the Asset Management Office.',
      category: 'AMO', department: 'AMO', visibility: 'STAFF_ONLY', status: 'PUBLISHED',
      createdBy: uAMO.id, createdByName: 'Marco Dela Cruz',
      fields: [
        { id: 'f1', label: 'Requestor Name', type: 'text',     required: true  },
        { id: 'f2', label: 'Department',     type: 'text',     required: true  },
        { id: 'f3', label: 'Equipment Type', type: 'select',   required: true, options: ['Laptop', 'Desktop', 'Projector', 'Printer', 'Camera', 'Other'] },
        { id: 'f4', label: 'Purpose/Use',    type: 'textarea', required: true  },
        { id: 'f5', label: 'Date Needed',    type: 'date',     required: true  },
        { id: 'f6', label: 'Return Date',    type: 'date',     required: false },
      ],
    },
    {
      title: 'Grade Complaint Form',
      description: 'For students who wish to formally contest a grade received in a subject.',
      category: 'ACADEMIC', department: 'ACADEMIC', visibility: 'STUDENT_ONLY', status: 'PUBLISHED',
      createdBy: uHR.id, createdByName: 'Ana Academic',
      fields: [
        { id: 'f1', label: 'Student Name',   type: 'text',     required: true  },
        { id: 'f2', label: 'Student ID',     type: 'text',     required: true  },
        { id: 'f3', label: 'Subject Code',   type: 'text',     required: true  },
        { id: 'f4', label: 'Subject Name',   type: 'text',     required: true  },
        { id: 'f5', label: 'Grade Received', type: 'text',     required: true  },
        { id: 'f6', label: 'Explanation',    type: 'textarea', required: true  },
      ],
    },
  ]
  await Promise.all(
    formDefs.map(async f => {
      const existing = await db.institutionalForm.findFirst({ where: { title: f.title, schoolId: school.id } })
      if (existing) return existing
      return db.institutionalForm.create({
        data: {
          title: f.title, description: f.description, category: f.category,
          department: f.department, visibility: f.visibility, status: f.status,
          createdBy: f.createdBy, createdByName: f.createdByName,
          fields: f.fields, settings: {},
          publishedAt: new Date('2025-08-01'), schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Institutional Forms: 3')

  // ── Notifications ─────────────────────────────────────────────────────────────
  const notifDefs = [
    {
      title: 'Payment Reminder',
      message: 'Your Statement of Account for 1st Semester 2025-2026 is now available. Balance due: ₱28,500.00. Please settle on or before August 15, 2025 to avoid late payment charges.',
      type: 'PAYMENT', link: '/student/soa',
    },
    {
      title: 'Enrollment Confirmed',
      message: 'Your enrollment for CS101 (Introduction to Programming) — Section BSCS-1A has been confirmed. Classes begin August 18, 2025.',
      type: 'ENROLLMENT', link: '/student/subjects',
    },
    {
      title: 'Welcome to St. Dominic College',
      message: 'Welcome to the St. Dominic College Student Information System! Your portal is now active. Explore your courses, view your SOA, and track your academic progress.',
      type: 'GENERAL', link: '/student',
    },
  ]
  await Promise.all(
    notifDefs.map(async n => {
      const existing = await db.notification.findFirst({
        where: { title: n.title, studentId: student.id, schoolId: school.id },
      })
      if (existing) return existing
      return db.notification.create({
        data: {
          title: n.title, message: n.message, type: n.type, link: n.link,
          isRead: false, userId: uStudent.id, studentId: student.id, schoolId: school.id,
        },
      })
    })
  )
  console.log('✓ Notifications: 3 (for demo student)')

  // ── Asset History (for deployed asset) ───────────────────────────────────────
  const deployedAsset = assets[1] // Lenovo ThinkPad — DEPLOYED
  const existingHistory = await db.assetHistory.findFirst({ where: { assetId: deployedAsset.id, activityType: 'REGISTERED' } })
  if (!existingHistory) {
    await db.assetHistory.create({
      data: {
        assetId: deployedAsset.id, activityType: 'REGISTERED',
        description: 'Asset registered in the system during initial inventory.',
        performedBy: 'Marco Dela Cruz', schoolId: school.id,
      },
    })
    await db.assetHistory.create({
      data: {
        assetId: deployedAsset.id, activityType: 'DEPLOYED',
        description: 'Deployed to Prof. Roberto Santos for classroom use.',
        performedBy: 'Marco Dela Cruz', schoolId: school.id,
      },
    })
  }

  const maintenanceAsset = assets[2] // HP ProBook — UNDER_MAINTENANCE
  const existingMaint = await db.maintenanceLog.findFirst({ where: { assetId: maintenanceAsset.id } })
  if (!existingMaint) {
    await db.maintenanceLog.create({
      data: {
        assetId: maintenanceAsset.id, type: 'CORRECTIVE',
        status: 'IN_PROGRESS',
        description: 'Keyboard malfunction and trackpad unresponsive. Sent to authorized service center.',
        technician: 'Javier Cruz — PC Express Service', cost: 3500,
        schoolId: school.id,
      },
    })
  }
  console.log('✓ Asset History + Maintenance Log seeded')

  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n✅ Database seeded successfully!')
  console.log('\nDemo accounts (password: "password"):')
  console.log('  Super Admin:       admin@school.edu')
  console.log('  Admission Officer: admissions@school.edu')
  console.log('  Registrar:         registrar@school.edu')
  console.log('  Treasurer:         treasury@school.edu')
  console.log('  Accounting:        accounting@school.edu')
  console.log('  Purchasing:        purchasing@school.edu')
  console.log('  Academic Admin:    academic@school.edu')
  console.log('  Dean (Computing):  dean.computing@school.edu')
  console.log('  HR Staff:          hr@school.edu')
  console.log('  AMO:               amo@school.edu')
  console.log('  Teacher:           prof.santos@school.edu')
  console.log('  Student:           student@school.edu')
  console.log('\n  Quick dev login:   http://localhost:3000/dev')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
