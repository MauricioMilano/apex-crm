import { PrismaClient, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── 1. Delete existing data in reverse dependency order ──────────────────
  await prisma.auditLog.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.webhook.deleteMany()
  await prisma.blockedSlot.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.clientFile.deleteMany()
  await prisma.client.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.leadStatus.deleteMany()
  await prisma.employeeService.deleteMany()
  await prisma.employeeProfile.deleteMany()
  await prisma.service.deleteMany()
  await prisma.form.deleteMany()
  await prisma.user.deleteMany()
  await prisma.location.deleteMany()
  await prisma.organization.deleteMany()

  console.log('Cleared existing data.')

  // ── 2. Organization ───────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      id: 'org_apex_business_solutions',
      name: 'Apex Business Solutions',
      slug: 'apex-business-solutions',
    },
  })

  // ── 3. Locations ──────────────────────────────────────────────────────────
  const [locMain, locNorth] = await prisma.$transaction([
    prisma.location.create({
      data: {
        organizationId: org.id,
        name: 'Main Office',
        address: '1234 Commerce Blvd',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        phone: '312-555-0100',
        email: 'main@apexbusiness.com',
        timezone: 'America/Chicago',
        isDefault: true,
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        organizationId: org.id,
        name: 'North Branch',
        address: '5678 Northern Ave',
        city: 'Evanston',
        state: 'IL',
        zip: '60201',
        phone: '847-555-0200',
        email: 'north@apexbusiness.com',
        timezone: 'America/Chicago',
        isDefault: false,
        isActive: true,
      },
    }),
  ])

  // ── 4. Users with hashed passwords ───────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12)

  const [adminUser, emp1, emp2, clientUser] = await prisma.$transaction([
    prisma.user.create({
      data: {
        organizationId: org.id,
        locationId: locMain.id,
        email: 'admin@apexbusiness.com',
        passwordHash,
        role: 'admin',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '312-555-1001',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        organizationId: org.id,
        locationId: locMain.id,
        email: 'mike.chen@apexbusiness.com',
        passwordHash,
        role: 'employee',
        firstName: 'Mike',
        lastName: 'Chen',
        phone: '312-555-1002',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        organizationId: org.id,
        locationId: locNorth.id,
        email: 'emily.rodriguez@apexbusiness.com',
        passwordHash,
        role: 'employee',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        phone: '847-555-1003',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        organizationId: org.id,
        locationId: locMain.id,
        email: 'client@example.com',
        passwordHash,
        role: 'client',
        firstName: 'James',
        lastName: 'Wilson',
        phone: '312-555-2001',
        isActive: true,
      },
    }),
  ])

  // ── 5. Employee profiles ──────────────────────────────────────────────────
  const workingHours = {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '16:00', enabled: true },
    saturday: { start: '10:00', end: '14:00', enabled: false },
    sunday: { start: '10:00', end: '14:00', enabled: false },
  }

  const [empProfile1, empProfile2] = await prisma.$transaction([
    prisma.employeeProfile.create({
      data: {
        userId: emp1.id,
        bio: 'Senior business consultant with 10 years of experience.',
        workingHours,
        bufferMinutes: 15,
      },
    }),
    prisma.employeeProfile.create({
      data: {
        userId: emp2.id,
        bio: 'Certified financial advisor and business strategist.',
        workingHours,
        bufferMinutes: 10,
      },
    }),
  ])

  // ── 6. Lead statuses ──────────────────────────────────────────────────────
  const statusData = [
    { name: 'New', color: '#6366f1', order: 0, isDefault: true },
    { name: 'Contacted', color: '#f59e0b', order: 1, isDefault: false },
    { name: 'Qualified', color: '#3b82f6', order: 2, isDefault: false },
    { name: 'Proposal Sent', color: '#8b5cf6', order: 3, isDefault: false },
    { name: 'Negotiating', color: '#ec4899', order: 4, isDefault: false },
    { name: 'Closed Won', color: '#10b981', order: 5, isDefault: false },
  ]

  const leadStatuses = await prisma.$transaction(
    statusData.map((s) =>
      prisma.leadStatus.create({ data: { ...s, organizationId: org.id } })
    )
  )

  const [statusNew, statusContacted, statusQualified, statusProposal, statusNegotiating, statusClosed] =
    leadStatuses

  // ── 7. Services ───────────────────────────────────────────────────────────
  const [svcConsult, svcStrategy, svcFinancial] = await prisma.$transaction([
    prisma.service.create({
      data: {
        organizationId: org.id,
        name: 'Business Consultation',
        description: 'One-on-one business strategy consultation session.',
        duration: 60,
        price: 150.0,
        color: '#6366f1',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: org.id,
        name: 'Strategic Planning',
        description: 'Comprehensive strategic planning workshop.',
        duration: 120,
        price: 350.0,
        color: '#3b82f6',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: org.id,
        name: 'Financial Review',
        description: 'In-depth financial health review and recommendations.',
        duration: 90,
        price: 250.0,
        color: '#10b981',
        isActive: true,
      },
    }),
  ])

  // Employee <-> Service assignments
  await prisma.$transaction([
    prisma.employeeService.create({ data: { employeeId: empProfile1.id, serviceId: svcConsult.id } }),
    prisma.employeeService.create({ data: { employeeId: empProfile1.id, serviceId: svcStrategy.id } }),
    prisma.employeeService.create({ data: { employeeId: empProfile2.id, serviceId: svcFinancial.id } }),
    prisma.employeeService.create({ data: { employeeId: empProfile2.id, serviceId: svcConsult.id } }),
  ])

  // ── 8. Leads ──────────────────────────────────────────────────────────────
  const leadsData = [
    {
      firstName: 'Alice',
      lastName: 'Thompson',
      email: 'alice.thompson@techcorp.com',
      phone: '312-555-3001',
      company: 'TechCorp Inc.',
      source: 'website',
      statusId: statusNew.id,
      assignedTo: emp1.id,
      value: 5000,
      tags: ['tech', 'enterprise'],
    },
    {
      firstName: 'Bob',
      lastName: 'Martinez',
      email: 'bob.martinez@startup.io',
      phone: '312-555-3002',
      company: 'StartupIO',
      source: 'referral',
      statusId: statusContacted.id,
      assignedTo: emp1.id,
      value: 2500,
      tags: ['startup'],
    },
    {
      firstName: 'Carol',
      lastName: 'Davis',
      email: 'carol.davis@retail.com',
      phone: '847-555-3003',
      company: 'Retail Solutions',
      source: 'cold_call',
      statusId: statusQualified.id,
      assignedTo: emp2.id,
      value: 7500,
      tags: ['retail'],
    },
    {
      firstName: 'David',
      lastName: 'Lee',
      email: 'david.lee@finance.com',
      phone: '847-555-3004',
      company: 'Lee Financial',
      source: 'linkedin',
      statusId: statusProposal.id,
      assignedTo: emp2.id,
      value: 12000,
      tags: ['finance', 'high-value'],
    },
    {
      firstName: 'Eva',
      lastName: 'Brown',
      email: 'eva.brown@healthcare.org',
      phone: '312-555-3005',
      company: 'HealthCare Plus',
      source: 'website',
      statusId: statusNegotiating.id,
      assignedTo: emp1.id,
      value: 9000,
      tags: ['healthcare'],
    },
    {
      firstName: 'Frank',
      lastName: 'Wilson',
      email: 'frank.wilson@logistics.com',
      phone: '312-555-3006',
      company: 'Fast Logistics',
      source: 'trade_show',
      statusId: statusClosed.id,
      assignedTo: emp1.id,
      value: 15000,
      tags: ['logistics', 'enterprise'],
    },
    {
      firstName: 'Grace',
      lastName: 'Kim',
      email: 'grace.kim@design.studio',
      phone: '847-555-3007',
      company: 'Kim Design Studio',
      source: 'instagram',
      statusId: statusNew.id,
      assignedTo: emp2.id,
      value: 3500,
      tags: ['creative'],
    },
    {
      firstName: 'Henry',
      lastName: 'Adams',
      email: 'henry.adams@realty.com',
      phone: '312-555-3008',
      company: 'Adams Realty',
      source: 'referral',
      statusId: statusContacted.id,
      assignedTo: emp2.id,
      value: 6000,
      tags: ['real-estate'],
    },
  ]

  await prisma.$transaction(
    leadsData.map((l) =>
      prisma.lead.create({
        data: {
          organizationId: org.id,
          locationId: locMain.id,
          statusId: l.statusId,
          assignedTo: l.assignedTo,
          firstName: l.firstName,
          lastName: l.lastName,
          email: l.email,
          phone: l.phone,
          company: l.company,
          source: l.source,
          value: l.value,
          tags: l.tags,
        },
      })
    )
  )

  // ── 9. Clients ────────────────────────────────────────────────────────────
  const clientsData = [
    {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@example.com',
      phone: '312-555-4001',
      company: 'Wilson Enterprises',
      city: 'Chicago',
      state: 'IL',
      assignedTo: emp1.id,
      tags: ['vip', 'enterprise'],
    },
    {
      firstName: 'Laura',
      lastName: 'Parker',
      email: 'laura.parker@example.com',
      phone: '312-555-4002',
      company: 'Parker & Associates',
      city: 'Chicago',
      state: 'IL',
      assignedTo: emp1.id,
      tags: ['consulting'],
    },
    {
      firstName: 'Michael',
      lastName: 'Torres',
      email: 'michael.torres@example.com',
      phone: '847-555-4003',
      company: 'Torres Manufacturing',
      city: 'Evanston',
      state: 'IL',
      assignedTo: emp2.id,
      tags: ['manufacturing'],
    },
    {
      firstName: 'Nancy',
      lastName: 'White',
      email: 'nancy.white@example.com',
      phone: '847-555-4004',
      company: 'White Medical Group',
      city: 'Evanston',
      state: 'IL',
      assignedTo: emp2.id,
      tags: ['healthcare', 'vip'],
    },
    {
      firstName: 'Oscar',
      lastName: 'Green',
      email: 'oscar.green@example.com',
      phone: '312-555-4005',
      company: 'Green Tech Solutions',
      city: 'Chicago',
      state: 'IL',
      assignedTo: emp1.id,
      tags: ['tech'],
    },
  ]

  const clients = await prisma.$transaction(
    clientsData.map((c) =>
      prisma.client.create({
        data: {
          organizationId: org.id,
          locationId: locMain.id,
          assignedTo: c.assignedTo,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          company: c.company,
          city: c.city,
          state: c.state,
          tags: c.tags,
          isActive: true,
        },
      })
    )
  )

  const [client1, client2, client3, client4, client5] = clients

  // ── 10. Appointments ──────────────────────────────────────────────────────
  const now = new Date()
  const day = (offset: number, hour: number, minute = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    d.setHours(hour, minute, 0, 0)
    return d
  }

  const appointmentsData: Array<{
    clientId: string
    employeeId: string
    serviceId: string
    status: AppointmentStatus
    startTime: Date
    endTime: Date
    notes?: string
  }> = [
    {
      clientId: client1.id,
      employeeId: emp1.id,
      serviceId: svcConsult.id,
      status: 'confirmed',
      startTime: day(1, 9),
      endTime: day(1, 10),
      notes: 'Initial strategy review',
    },
    {
      clientId: client2.id,
      employeeId: emp1.id,
      serviceId: svcStrategy.id,
      status: 'pending',
      startTime: day(1, 11),
      endTime: day(1, 13),
    },
    {
      clientId: client3.id,
      employeeId: emp2.id,
      serviceId: svcFinancial.id,
      status: 'confirmed',
      startTime: day(2, 10),
      endTime: day(2, 11, 30),
    },
    {
      clientId: client4.id,
      employeeId: emp2.id,
      serviceId: svcConsult.id,
      status: 'confirmed',
      startTime: day(2, 14),
      endTime: day(2, 15),
      notes: 'Q2 business review',
    },
    {
      clientId: client5.id,
      employeeId: emp1.id,
      serviceId: svcConsult.id,
      status: 'pending',
      startTime: day(3, 9),
      endTime: day(3, 10),
    },
    {
      clientId: client1.id,
      employeeId: emp2.id,
      serviceId: svcFinancial.id,
      status: 'completed',
      startTime: day(-7, 10),
      endTime: day(-7, 11, 30),
      notes: 'Annual financial review',
    },
    {
      clientId: client2.id,
      employeeId: emp1.id,
      serviceId: svcConsult.id,
      status: 'completed',
      startTime: day(-5, 14),
      endTime: day(-5, 15),
    },
    {
      clientId: client3.id,
      employeeId: emp2.id,
      serviceId: svcStrategy.id,
      status: 'cancelled',
      startTime: day(-3, 11),
      endTime: day(-3, 13),
      notes: 'Client requested reschedule',
    },
    {
      clientId: client4.id,
      employeeId: emp1.id,
      serviceId: svcStrategy.id,
      status: 'no_show',
      startTime: day(-2, 9),
      endTime: day(-2, 11),
    },
    {
      clientId: client5.id,
      employeeId: emp2.id,
      serviceId: svcFinancial.id,
      status: 'confirmed',
      startTime: day(5, 15),
      endTime: day(5, 16, 30),
    },
  ]

  await prisma.$transaction(
    appointmentsData.map((a) =>
      prisma.appointment.create({
        data: {
          organizationId: org.id,
          locationId: locMain.id,
          ...a,
        },
      })
    )
  )

  // ── 11. Webhooks ──────────────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.webhook.create({
      data: {
        organizationId: org.id,
        name: 'Lead Notifications',
        url: 'https://hooks.example.com/leads',
        events: ['lead.created', 'lead.updated', 'lead.converted'],
        isActive: true,
      },
    }),
    prisma.webhook.create({
      data: {
        organizationId: org.id,
        name: 'Appointment Alerts',
        url: 'https://hooks.example.com/appointments',
        events: ['appointment.created', 'appointment.cancelled'],
        isActive: true,
      },
    }),
  ])

  console.log('Seeding complete!')
  console.log(`  Organization: ${org.name}`)
  console.log(`  Locations: 2`)
  console.log(`  Users: 4 (1 admin, 2 employees, 1 client)`)
  console.log(`  Lead statuses: ${leadStatuses.length}`)
  console.log(`  Services: 3`)
  console.log(`  Leads: ${leadsData.length}`)
  console.log(`  Clients: ${clientsData.length}`)
  console.log(`  Appointments: ${appointmentsData.length}`)
  console.log(`  Webhooks: 2`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
