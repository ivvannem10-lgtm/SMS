import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  const pw = await bcrypt.hash('password', 10)

  // ── School ──────────────────────────────────────────────────────────────────
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

  // ── Users (all demo accounts) ────────────────────────────────────────────────
  const upsertUser = (email: string, name: string, role: string) =>
    db.user.upsert({
      where: { email },
      update: {},
      create: { email, password: pw, name, role, schoolId: school.id },
    })

  const [
    uAdmin, uAdmissions, uRegistrar, uTreasury, uAccounting, uPurchasing,
    uAcademic, uDeanComp, uDeanBiz, uDeanNursing, uDeanArts,
    uHR, uAMO, uTeacher, uStudent,
  ] = await Promise.all([
    upsertUser('admin@school.edu',              'Alex Administrator',    'SUPER_ADMIN'),
    upsertUser('admissions@school.edu',         'Maria Santos',          'ADMISSION_OFFICER'),
    upsertUser('registrar@school.edu',          'Rosa Registrar',        'REGISTRAR'),
    upsertUser('treasury@school.edu',           'Tom Treasury',          'TREASURER'),
    upsertUser('accounting@school.edu',         'Clara Accounting',      'ACCOUNTING'),
    upsertUser('purchasing@school.edu',         'Perry Purchasing',      'PURCHASING_OFFICER'),
    upsertUser('academic@school.edu',           'Ana Academic',          'ACADEMIC_ADMIN'),
    upsertUser('dean.computing@school.edu',     'Dr. Carlos Reyes',      'DEAN'),
    upsertUser('dean.business@school.edu',      'Dr. Roberto Tan',       'DEAN'),
    upsertUser('dean.nursing@school.edu',       'Dr. Elena Cruz',        'DEAN'),
    upsertUser('dean.arts@school.edu',          'Dr. Grace Villanueva',  'DEAN'),
    upsertUser('hr@school.edu',                 'Hannah Rodriguez',      'HR_STAFF'),
    upsertUser('amo@school.edu',                'Marco Dela Cruz',       'AMO'),
    upsertUser('prof.santos@school.edu',        'Prof. Roberto Santos',  'TEACHER'),
    upsertUser('student@school.edu',            'Ethan Dela Cruz',       'STUDENT'),
  ])
  console.log('✓ Users: 15 demo accounts')

  // ── Programs ─────────────────────────────────────────────────────────────────
  const [progCS, progBiz, progNursing, progArts] = await Promise.all([
    db.program.upsert({ where: { code_schoolId: { code: 'BSCS', schoolId: school.id } }, update: {}, create: { name: 'BS Computer Science', code: 'BSCS', schoolId: school.id } }),
    db.program.upsert({ where: { code_schoolId: { code: 'BSBA', schoolId: school.id } }, update: {}, create: { name: 'BS Business Administration', code: 'BSBA', schoolId: school.id } }),
    db.program.upsert({ where: { code_schoolId: { code: 'BSN',  schoolId: school.id } }, update: {}, create: { name: 'Bachelor of Science in Nursing', code: 'BSN',  schoolId: school.id } }),
    db.program.upsert({ where: { code_schoolId: { code: 'BAComm', schoolId: school.id } }, update: {}, create: { name: 'BA Communication', code: 'BAComm', schoolId: school.id } }),
  ])
  console.log('✓ Programs: 4')

  // ── Academic Year + Semester ──────────────────────────────────────────────────
  const ay = await db.academicYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-31'),
      isActive: true,
      schoolId: school.id,
    },
  })

  const sem = await db.semester.create({
    data: {
      name: '1st Semester',
      type: 'FIRST',
      isActive: true,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-12-20'),
      enrollmentStart: new Date('2025-07-01'),
      enrollmentEnd: new Date('2025-08-15'),
      maxUnits: 24,
      academicYearId: ay.id,
    },
  })
  console.log(`✓ Academic Year: ${ay.name} · Semester: ${sem.name}`)

  // ── Subjects ──────────────────────────────────────────────────────────────────
  const [sCS101, sCS201, sMath101] = await Promise.all([
    db.subject.upsert({ where: { code_schoolId: { code: 'CS101', schoolId: school.id } }, update: {}, create: { code: 'CS101', name: 'Introduction to Programming', units: 3, labUnits: 1, type: 'LECTURE', schoolId: school.id } }),
    db.subject.upsert({ where: { code_schoolId: { code: 'CS201', schoolId: school.id } }, update: {}, create: { code: 'CS201', name: 'Data Structures and Algorithms', units: 3, labUnits: 1, type: 'LECTURE', schoolId: school.id } }),
    db.subject.upsert({ where: { code_schoolId: { code: 'MATH101', schoolId: school.id } }, update: {}, create: { code: 'MATH101', name: 'Mathematics in the Modern World', units: 3, labUnits: 0, type: 'LECTURE', schoolId: school.id } }),
  ])
  console.log('✓ Subjects: 3')

  // ── Faculty ───────────────────────────────────────────────────────────────────
  const faculty = await db.faculty.create({
    data: {
      facultyId: 'FAC-2024-001',
      firstName: 'Roberto',
      lastName: 'Santos',
      email: 'prof.santos@school.edu',
      phone: '09171234567',
      department: 'College of Computing',
      position: 'Associate Professor',
      status: 'ACTIVE',
      schoolId: school.id,
      userId: uTeacher.id,
    },
  })
  console.log('✓ Faculty: Prof. Roberto Santos')

  // ── Subject Offerings ─────────────────────────────────────────────────────────
  const off1 = await db.subjectOffering.create({
    data: {
      section: 'BSCS-1A',
      status: 'PUBLISHED',
      maxStudents: 35,
      subjectId: sCS101.id,
      semesterId: sem.id,
      schedules: {
        create: [
          { dayOfWeek: 'MON', startTime: '08:00', endTime: '10:00' },
          { dayOfWeek: 'WED', startTime: '08:00', endTime: '10:00' },
        ],
      },
      assignments: {
        create: [{ role: 'BOTH', facultyId: faculty.id }],
      },
    },
  })
  console.log('✓ Offerings: 1 published (CS101 · BSCS-1A)')

  // ── Student ───────────────────────────────────────────────────────────────────
  const student = await db.student.create({
    data: {
      studentId: '2025-00000',
      firstName: 'Ethan',
      lastName: 'Dela Cruz',
      email: 'student@school.edu',
      phone: '09000000000',
      dateOfBirth: new Date('2005-01-01'),
      gender: 'MALE',
      address: 'St. Dominic College',
      yearLevel: 1,
      status: 'ACTIVE',
      programId: progCS.id,
      schoolId: school.id,
      userId: uStudent.id,
    },
  })

  // ── Enrollment ────────────────────────────────────────────────────────────────
  await db.enrollment.create({
    data: {
      status: 'ENROLLED',
      studentId: student.id,
      offeringId: off1.id,
      semesterId: sem.id,
      confirmedAt: new Date('2025-08-12'),
    },
  })
  console.log('✓ Student + enrollment seeded')

  // ── SOA for demo student ──────────────────────────────────────────────────────
  await db.sOA.create({
    data: {
      status: 'UNPAID',
      totalAmount: 28500,
      paidAmount: 0,
      balance: 28500,
      semesterId: sem.id,
      studentId: student.id,
      items: {
        create: [
          { description: 'Tuition Fee',       amount: 21000, type: 'TUITION' },
          { description: 'Miscellaneous Fee',  amount: 3500,  type: 'MISC' },
          { description: 'Laboratory Fee',     amount: 2500,  type: 'LAB' },
          { description: 'Registration Fee',   amount: 1000,  type: 'REG' },
          { description: 'Student ID Fee',     amount: 500,   type: 'OTHER' },
        ],
      },
    },
  })
  console.log('✓ SOA seeded for demo student')

  console.log('\n✅ Database seeded successfully!')
  console.log('\nDemo accounts (password: "password"):')
  console.log('  Super Admin:    admin@school.edu')
  console.log('  Accounting:     accounting@school.edu')
  console.log('  Treasury:       treasury@school.edu')
  console.log('  Registrar:      registrar@school.edu')
  console.log('  Teacher:        prof.santos@school.edu')
  console.log('  Student:        student@school.edu')
  console.log('  (+ 9 more — see /dev for full list)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
