import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before importing the actions
const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    organizationSetting: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
  },
  default: {},
}))

const { getOrganizationSettings, updateOrganizationSettings } = await import("@/actions/settings")

describe("getOrganizationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns existing settings when record is found", async () => {
    const mockSettings = {
      id: "set_1",
      organizationId: "org_1",
      smtpEnabled: false,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPass: null,
      smtpFrom: null,
      smtpSecure: false,
      emailVerificationEnabled: false,
      currency: "USD",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      locale: "en-US",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockFindUnique.mockResolvedValue(mockSettings)

    const result = await getOrganizationSettings("org_1")

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe("USD")
      expect(result.data.timezone).toBe("America/New_York")
    }
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { organizationId: "org_1" } })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("creates settings with defaults when no record exists (upsert)", async () => {
    const defaultSettings = {
      id: "set_2",
      organizationId: "org_2",
      smtpEnabled: false,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPass: null,
      smtpFrom: null,
      smtpSecure: false,
      emailVerificationEnabled: false,
      currency: "USD",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      locale: "en-US",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockFindUnique.mockResolvedValue(null) // no record found
    mockCreate.mockResolvedValue(defaultSettings)

    const result = await getOrganizationSettings("org_2")

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe("USD")
    }
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { organizationId: "org_2" } })
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_2",
        currency: "USD",
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
        locale: "en-US",
      }),
    })
  })

  it("strips smtpPass from returned data", async () => {
    const mockSettings = {
      id: "set_1",
      organizationId: "org_1",
      smtpPass: "secret123",
      currency: "USD",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      locale: "en-US",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockFindUnique.mockResolvedValue(mockSettings)

    const result = await getOrganizationSettings("org_1")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty("smtpPass")
    }
  })

  it("returns error when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB connection failed"))

    const result = await getOrganizationSettings("org_1")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("DB connection failed")
    }
  })
})

describe("updateOrganizationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates a single field partially", async () => {
    const existing = {
      id: "set_1",
      organizationId: "org_1",
      currency: "USD",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      locale: "en-US",
    }

    mockFindUnique.mockResolvedValue(existing)
    mockUpdate.mockResolvedValue({ ...existing, currency: "BRL" })

    const result = await updateOrganizationSettings("org_1", { currency: "BRL" })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe("BRL")
    }
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { organizationId: "org_1" },
      data: { currency: "BRL" },
    })
  })

  it("rejects invalid currency code", async () => {
    const result = await updateOrganizationSettings("org_1", {
      // @ts-expect-error testing runtime validation
      currency: "INVALID",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("rejects invalid timeFormat", async () => {
    const result = await updateOrganizationSettings("org_1", {
      // @ts-expect-error testing runtime validation
      timeFormat: "24hours",
    })

    expect(result.success).toBe(false)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("rejects invalid dateFormat", async () => {
    const result = await updateOrganizationSettings("org_1", {
      // @ts-expect-error testing runtime validation
      dateFormat: "DD-MM-YYYY",
    })

    expect(result.success).toBe(false)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("rejects invalid timezone", async () => {
    const result = await updateOrganizationSettings("org_1", {
      // @ts-expect-error testing runtime validation
      timezone: "Mars/Olympus",
    })

    expect(result.success).toBe(false)
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
