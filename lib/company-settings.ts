export type CompanySettings = {
  companyName: string
  shortName: string
  serviceProfile: string
  workSchedule: string
  workStart: string
  workEnd: string
  lunchEnabled: boolean
  lunchStart: string
  lunchEnd: string
  slotDuration: string
  urgentOrdersEnabled: boolean
  publicDescription: string
  addressLine: string
  city: string
  region: string
  postalCode: string
  phone: string
  additionalPhone: string
  email: string
  website: string
  mapsLink: string
  contactPerson: string
  clientNote: string
  companyType: string
  edrpou: string
  ipn: string
  iban: string
  bankName: string
  recipientName: string
  legalAddress: string
  vatPayer: boolean
  invoiceNote: string
}

export type CompanySettingsDto = {
  [K in keyof CompanySettings]?: CompanySettings[K] | null
} & {
  slotDuration?: number | string | null
}

export const COMPANY_SETTINGS_ENDPOINT = "/companies/me/settings"

export const defaultCompanySettings: CompanySettings = {
  companyName: "WagGarage Service",
  shortName: "WagGarage",
  serviceProfile: "full-service",
  workSchedule: "mon-sat",
  workStart: "09:00",
  workEnd: "19:00",
  lunchEnabled: true,
  lunchStart: "13:00",
  lunchEnd: "14:00",
  slotDuration: "60",
  urgentOrdersEnabled: true,
  publicDescription: "",
  addressLine: "",
  city: "",
  region: "",
  postalCode: "",
  phone: "",
  additionalPhone: "",
  email: "",
  website: "",
  mapsLink: "",
  contactPerson: "",
  clientNote: "",
  companyType: "\u0422\u041E\u0412",
  edrpou: "",
  ipn: "",
  iban: "",
  bankName: "",
  recipientName: "",
  legalAddress: "",
  vatPayer: true,
  invoiceNote: "",
}

function getString(value: string | null | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function getBoolean(value: boolean | null | undefined, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

export function normalizeCompanySettings(payload?: CompanySettingsDto | null): CompanySettings {
  return {
    companyName: getString(payload?.companyName, defaultCompanySettings.companyName),
    shortName: getString(payload?.shortName, defaultCompanySettings.shortName),
    serviceProfile: getString(payload?.serviceProfile, defaultCompanySettings.serviceProfile),
    workSchedule: getString(payload?.workSchedule, defaultCompanySettings.workSchedule),
    workStart: getString(payload?.workStart, defaultCompanySettings.workStart),
    workEnd: getString(payload?.workEnd, defaultCompanySettings.workEnd),
    lunchEnabled: getBoolean(payload?.lunchEnabled, defaultCompanySettings.lunchEnabled),
    lunchStart: getString(payload?.lunchStart, defaultCompanySettings.lunchStart),
    lunchEnd: getString(payload?.lunchEnd, defaultCompanySettings.lunchEnd),
    slotDuration: String(payload?.slotDuration ?? defaultCompanySettings.slotDuration),
    urgentOrdersEnabled: getBoolean(payload?.urgentOrdersEnabled, defaultCompanySettings.urgentOrdersEnabled),
    publicDescription: getString(payload?.publicDescription, defaultCompanySettings.publicDescription),
    addressLine: getString(payload?.addressLine, defaultCompanySettings.addressLine),
    city: getString(payload?.city, defaultCompanySettings.city),
    region: getString(payload?.region, defaultCompanySettings.region),
    postalCode: getString(payload?.postalCode, defaultCompanySettings.postalCode),
    phone: getString(payload?.phone, defaultCompanySettings.phone),
    additionalPhone: getString(payload?.additionalPhone, defaultCompanySettings.additionalPhone),
    email: getString(payload?.email, defaultCompanySettings.email),
    website: getString(payload?.website, defaultCompanySettings.website),
    mapsLink: getString(payload?.mapsLink, defaultCompanySettings.mapsLink),
    contactPerson: getString(payload?.contactPerson, defaultCompanySettings.contactPerson),
    clientNote: getString(payload?.clientNote, defaultCompanySettings.clientNote),
    companyType: getString(payload?.companyType, defaultCompanySettings.companyType),
    edrpou: getString(payload?.edrpou, defaultCompanySettings.edrpou),
    ipn: getString(payload?.ipn, defaultCompanySettings.ipn),
    iban: getString(payload?.iban, defaultCompanySettings.iban),
    bankName: getString(payload?.bankName, defaultCompanySettings.bankName),
    recipientName: getString(payload?.recipientName, defaultCompanySettings.recipientName),
    legalAddress: getString(payload?.legalAddress, defaultCompanySettings.legalAddress),
    vatPayer: getBoolean(payload?.vatPayer, defaultCompanySettings.vatPayer),
    invoiceNote: getString(payload?.invoiceNote, defaultCompanySettings.invoiceNote),
  }
}

export function serializeCompanySettings(settings: CompanySettings) {
  const result = {
    ...settings,
    slotDuration: Number(settings.slotDuration),
  }

  // Якщо ці поля пусті, відправляємо null, щоб бекенд не лаявся на валідацію формату
  const fieldsToNullify: Array<keyof CompanySettings> = ["email", "website", "mapsLink"]

  for (const field of fieldsToNullify) {
    if (result[field] === "") {
      (result as any)[field] = null
    }
  }

  return result
}