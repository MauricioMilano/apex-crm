import { Prisma, PrismaClient, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createSeedWorkingHours } from '@/lib/working-hours'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── 1. Delete existing data in reverse dependency order ──────────────────
  await prisma.auditLog.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.webhook.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.paymentMethod.deleteMany()
  await prisma.blockedSlot.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.clientFile.deleteMany()
  await prisma.clientSubscription.deleteMany()
  await prisma.subscriptionPlanService.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
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

  // ── 2b. Organization Settings ─────────────────────────────────────────────
  await prisma.organizationSetting.create({
    data: {
      organizationId: org.id,
      currency: 'USD',
      timezone: 'America/Chicago',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      locale: 'en-US',
      defaultInterestRate: 2.0,
    },
  })

  // ── 2c. Default Payment Methods ──────────────────────────────────────────
  await prisma.$transaction([
    prisma.paymentMethod.create({
      data: { organizationId: org.id, name: 'Debit', code: 'debit', isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { organizationId: org.id, name: 'Credit', code: 'credit', requiresDocs: true, isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { organizationId: org.id, name: 'Cash', code: 'cash', isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { organizationId: org.id, name: 'PIX', code: 'pix', isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { organizationId: org.id, name: 'Transfer', code: 'transfer', isActive: true },
    }),
  ])

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
  const [empProfile1, empProfile2] = await prisma.$transaction([
    prisma.employeeProfile.create({
      data: {
        userId: emp1.id,
        bio: 'Senior business consultant with 10 years of experience.',
        workingHours: createSeedWorkingHours() as unknown as Prisma.InputJsonValue,
        bufferMinutes: 15,
      },
    }),
    prisma.employeeProfile.create({
      data: {
        userId: emp2.id,
        bio: 'Certified financial advisor and business strategist.',
        workingHours: createSeedWorkingHours() as unknown as Prisma.InputJsonValue,
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

  // ── 8. Subscription Plans ──────────────────────────────────────────────────
  const [planBasic, planPremium, planUnlimited] = await prisma.$transaction([
    prisma.subscriptionPlan.create({
      data: {
        organizationId: org.id,
        name: 'Basic',
        description: 'Essential business advisory services.',
        price: 199.0,
        billingPeriod: 'monthly',
        maxApptsPerPeriod: 4,
        isActive: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        organizationId: org.id,
        name: 'Premium',
        description: 'Full access to all advisory services.',
        price: 399.0,
        billingPeriod: 'monthly',
        maxApptsPerPeriod: 8,
        isActive: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        organizationId: org.id,
        name: 'Unlimited',
        description: 'Unlimited access to all services.',
        price: 699.0,
        billingPeriod: 'monthly',
        isActive: true,
      },
    }),
  ])

  // Plan <-> Service assignments
  await prisma.$transaction([
    // Basic includes Consultation only
    prisma.subscriptionPlanService.create({
      data: { planId: planBasic.id, serviceId: svcConsult.id, maxPerPeriod: 4 },
    }),
    // Premium includes Consultation + Strategy
    prisma.subscriptionPlanService.create({
      data: { planId: planPremium.id, serviceId: svcConsult.id, maxPerPeriod: 6 },
    }),
    prisma.subscriptionPlanService.create({
      data: { planId: planPremium.id, serviceId: svcStrategy.id, maxPerPeriod: 2 },
    }),
    // Unlimited includes all services
    prisma.subscriptionPlanService.create({
      data: { planId: planUnlimited.id, serviceId: svcConsult.id },
    }),
    prisma.subscriptionPlanService.create({
      data: { planId: planUnlimited.id, serviceId: svcStrategy.id },
    }),
    prisma.subscriptionPlanService.create({
      data: { planId: planUnlimited.id, serviceId: svcFinancial.id },
    }),
  ])

  console.log('  Subscription Plans: 3')

  // ── 9. Leads ──────────────────────────────────────────────────────────────
  const leadsData = [
    {
      firstName: 'Alice',
      lastName: 'Thompson',
      email: 'alice.thompson@techcorp.com',
      phone: '312-555-3001',
      company: 'TechCorp Inc.',
      source: 'website',
      status: statusNew,
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
      status: statusContacted,
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
      status: statusQualified,
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
      status: statusProposal,
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
      status: statusNegotiating,
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
      status: statusClosed,
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
      status: statusNew,
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
      status: statusContacted,
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
          statusId: l.status.id,
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

  // Assign demo subscription: James Wilson (client1) gets Premium plan
  const subNow = new Date()
  const subPeriodEnd = new Date(subNow.getTime() + 30 * 24 * 60 * 60 * 1000)
  await prisma.clientSubscription.create({
    data: {
      clientId: client1.id,
      planId: planPremium.id,
      status: 'active',
      startDate: subNow,
      currentPeriodStart: subNow,
      currentPeriodEnd: subPeriodEnd,
      appointmentsUsed: 2,
    },
  })
  console.log('  Client Subscription: 1 (James Wilson -> Premium)')

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

  // ── 11. Forms ─────────────────────────────────────────────────────────────
  const formData = [
    {
      name: 'Contact Us',
      description: 'General inquiry form for website visitors.',
      isPublished: true,
      fields: [
        { id: 'f1', type: 'text', label: 'First Name', required: true },
        { id: 'f2', type: 'text', label: 'Last Name', required: true },
        { id: 'f3', type: 'email', label: 'Email', required: true },
        { id: 'f4', type: 'textarea', label: 'Message', required: false }
      ],
      styling: { primaryColor: '#6366f1', showLogo: true },
    },
    {
      name: 'Consultation Request',
      description: 'Form to request a business consultation.',
      isPublished: true,
      fields: [
        { id: 'c1', type: 'text', label: 'Full Name', required: true },
        { id: 'c2', type: 'email', label: 'Email', required: true },
        { id: 'c3', type: 'text', label: 'Company', required: false },
        { id: 'c4', type: 'select', label: 'Service Interest', required: true, options: ['Strategy', 'Financial', 'Consulting'] }
      ],
      styling: { primaryColor: '#10b981', showLogo: false },
    }
  ]

  await prisma.$transaction(
    formData.map((f) =>
      prisma.form.create({
        data: {
          organizationId: org.id,
          name: f.name,
          description: f.description,
          isPublished: f.isPublished,
          fields: f.fields as unknown as Prisma.InputJsonValue,
          styling: f.styling as unknown as Prisma.InputJsonValue,
        },
      })
    )
  )

  // ── 12. Webhooks ──────────────────────────────────────────────────────────
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
  console.log(`  Forms: ${formData.length}`)
  console.log(`  Payment methods: 5`)
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
