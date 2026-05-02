import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // School
  const school = await db.school.upsert({
    where: { slug: 'westfield' },
    update: {},
    create: {
      name: 'Westfield University',
      slug: 'westfield',
      address: '123 University Ave, Westfield City',
      phone: '+1 (555) 000-1234',
      email: 'registrar@westfield.edu',
      website: 'https://westfield.edu',
      primaryColor: '#2563EB',
      plan: 'PROFESSIONAL',
    },
  })
  console.log(`✓ School: ${school.name}`)

  // Programs
  const programs = await Promise.all([
    db.program.upsert({
      where: { code_schoolId: { code: 'BSCS', schoolId: school.id } },
      update: {},
      create: { name: 'Bachelor of Science in Computer Science', code: 'BSCS', schoolId: school.id },
    }),
    db.program.upsert({
      where: { code_schoolId: { code: 'BSIT', schoolId: school.id } },
      update: {},
      create: { name: 'Bachelor of Science in Information Technology', code: 'BSIT', schoolId: school.id },
    }),
    db.program.upsert({
      where: { code_schoolId: { code: 'BSBA', schoolId: school.id } },
      update: {},
      create: { name: 'Bachelor of Science in Business Administration', code: 'BSBA', schoolId: school.id },
    }),
  ])
  console.log(`✓ Programs: ${programs.length}`)

  // Users
  const hashedPassword = await bcrypt.hash('password', 10)

  const adminUser = await db.user.upsert({
    where: { email: 'admin@westfield.edu' },
    update: {},
    create: {
      email: 'admin@westfield.edu',
      password: hashedPassword,
      name: 'Alex Administrator',
      role: 'ADMIN',
      schoolId: school.id,
    },
  })
  await db.user.upsert({
    where: { email: 'registrar@westfield.edu' },
    update: {},
    create: {
      email: 'registrar@westfield.edu',
      password: hashedPassword,
      name: 'Regina Reyes',
      role: 'REGISTRAR',
      schoolId: school.id,
    },
  })
  console.log('✓ Users created')

  // Term
  const term = await db.term.create({
    data: {
      name: '1st Semester 2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-12-15'),
      isActive: true,
      schoolId: school.id,
    },
  })
  console.log(`✓ Term: ${term.name}`)

  // Courses
  const courses = await Promise.all([
    db.course.upsert({
      where: { code_schoolId: { code: 'CS101', schoolId: school.id } },
      update: {},
      create: { code: 'CS101', name: 'Introduction to Computing', units: 3, programId: programs[0].id, schoolId: school.id },
    }),
    db.course.upsert({
      where: { code_schoolId: { code: 'CS201', schoolId: school.id } },
      update: {},
      create: { code: 'CS201', name: 'Data Structures and Algorithms', units: 3, programId: programs[0].id, schoolId: school.id },
    }),
    db.course.upsert({
      where: { code_schoolId: { code: 'MATH101', schoolId: school.id } },
      update: {},
      create: { code: 'MATH101', name: 'Calculus I', units: 4, programId: programs[0].id, schoolId: school.id },
    }),
  ])
  console.log(`✓ Courses: ${courses.length}`)

  // Faculty
  const facultyUser = await db.user.upsert({
    where: { email: 'r.santos@westfield.edu' },
    update: {},
    create: {
      email: 'r.santos@westfield.edu',
      password: hashedPassword,
      name: 'Robert Santos',
      role: 'FACULTY',
      schoolId: school.id,
    },
  })

  const faculty = await db.faculty.create({
    data: {
      facultyId: 'FAC-2024-001',
      firstName: 'Robert',
      lastName: 'Santos',
      email: 'r.santos@westfield.edu',
      department: 'Computer Science',
      position: 'Professor',
      status: 'ACTIVE',
      schoolId: school.id,
      userId: facultyUser.id,
    },
  })
  console.log('✓ Faculty created')

  // Schedule
  await db.schedule.create({
    data: {
      courseId: courses[0].id,
      facultyId: faculty.id,
      termId: term.id,
      schoolId: school.id,
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '09:30',
      room: 'CS Lab 1',
    },
  })
  console.log('✓ Schedule created')

  // Students
  const studentUser = await db.user.upsert({
    where: { email: 'ethan.delacruz@student.westfield.edu' },
    update: {},
    create: {
      email: 'ethan.delacruz@student.westfield.edu',
      password: hashedPassword,
      name: 'Ethan Dela Cruz',
      role: 'STUDENT',
      schoolId: school.id,
    },
  })

  const student = await db.student.create({
    data: {
      studentId: '2024-0001',
      firstName: 'Ethan',
      lastName: 'Dela Cruz',
      middleName: 'Miguel',
      email: 'ethan.delacruz@student.westfield.edu',
      phone: '555-1001',
      dateOfBirth: new Date('2005-03-15'),
      gender: 'MALE',
      address: '45 Maple St, Westfield City',
      guardianName: 'Maria Dela Cruz',
      guardianPhone: '555-2001',
      guardianRelation: 'Mother',
      yearLevel: 2,
      status: 'ACTIVE',
      programId: programs[0].id,
      schoolId: school.id,
      userId: studentUser.id,
    },
  })

  // Enrollment with grade
  await db.enrollment.create({
    data: {
      studentId: student.id,
      courseId: courses[0].id,
      termId: term.id,
      midtermGrade: 88,
      finalGrade: 92,
      overallGrade: 90.4,
      letterGrade: '1.50',
      remarks: 'PASSED',
    },
  })

  // Education history
  await db.educationHistory.create({
    data: {
      studentId: student.id,
      schoolName: 'Westfield National High School',
      level: 'HIGH_SCHOOL',
      yearFrom: 2019,
      yearTo: 2023,
      honors: 'With Honors',
    },
  })

  console.log('✓ Student + enrollment seeded')
  console.log('\n✅ Seed complete!')
  console.log('\nDemo login credentials (password: "password"):')
  console.log('  Admin:     admin@westfield.edu')
  console.log('  Registrar: registrar@westfield.edu')
  console.log('  Faculty:   r.santos@westfield.edu')
  console.log('  Student:   ethan.delacruz@student.westfield.edu')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
