/**
 * PSP Document Validation Rules Configuration
 * Defines file types, max sizes, required documents, and expiration tracking per graduate type
 */

export type GraduateType = 'GOV' | 'US' | 'UK' | 'KSA'

export type DocumentTypeId =
  | 'passport'
  | 'civil_id'
  | 'parent_civil_id'
  | 'hs_certificate'
  | 'nationality'
  | 'puc_receipt'
  | 'acceptance_letter'
  | 'transcript_moh'
  | 'sequence_letter'
  | 'gcse'
  | 'a_level'
  | 'equivalency'
  | 'photo'
  | 'shahada'
  | 'transcript'

export interface DocumentRule {
  id: DocumentTypeId
  name: string
  nameAr: string
  required: boolean
  acceptedFileTypes: string[]
  maxSizeMB: number
  hasExpiration: boolean
  expirationWarningDays?: number  // Days before expiration to show warning
  description?: string
}

export interface GraduateTypeConfig {
  type: GraduateType
  label: string
  labelAr: string
  documents: DocumentRule[]
}

// Common file type configurations
const DOCUMENT_FILE_TYPES = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp']
const IMAGE_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const PDF_ONLY = ['.pdf']

// Common document definitions
const PASSPORT: DocumentRule = {
  id: 'passport',
  name: 'Passport',
  nameAr: 'جواز السفر',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: true,
  expirationWarningDays: 90,
  description: 'Valid passport with at least 6 months validity'
}

const CIVIL_ID: DocumentRule = {
  id: 'civil_id',
  name: 'Civil ID',
  nameAr: 'البطاقة المدنية',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: true,
  expirationWarningDays: 30,
  description: 'Valid Kuwait Civil ID (front and back)'
}

const PARENT_CIVIL_ID: DocumentRule = {
  id: 'parent_civil_id',
  name: 'Parent Civil ID',
  nameAr: 'البطاقة المدنية للوالد',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: true,
  expirationWarningDays: 30,
  description: 'Parent/Guardian Kuwait Civil ID'
}

const HS_CERTIFICATE: DocumentRule = {
  id: 'hs_certificate',
  name: 'High School Certificate',
  nameAr: 'شهادة الثانوية العامة',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Original or certified true copy of high school certificate'
}

const NATIONALITY: DocumentRule = {
  id: 'nationality',
  name: 'Nationality Document',
  nameAr: 'شهادة الجنسية',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Nationality certificate or proof of citizenship'
}

const PUC_RECEIPT: DocumentRule = {
  id: 'puc_receipt',
  name: 'PUC Payment Receipt',
  nameAr: 'إيصال دفع رسوم PUC',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'PUC registration fee payment receipt'
}

const ACCEPTANCE_LETTER: DocumentRule = {
  id: 'acceptance_letter',
  name: 'Acceptance Letter',
  nameAr: 'خطاب القبول',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Ktech acceptance letter'
}

const PHOTO: DocumentRule = {
  id: 'photo',
  name: 'Personal Photo',
  nameAr: 'صورة شخصية',
  required: true,
  acceptedFileTypes: IMAGE_FILE_TYPES,
  maxSizeMB: 5,
  hasExpiration: false,
  description: 'Recent passport-sized photo with white background'
}

const EQUIVALENCY: DocumentRule = {
  id: 'equivalency',
  name: 'Equivalency Certificate',
  nameAr: 'شهادة المعادلة',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Ministry of Education equivalency certificate'
}

// Graduate type configurations
export const GRADUATE_TYPE_CONFIGS: GraduateTypeConfig[] = [
  {
    type: 'GOV',
    label: 'Government School Graduate',
    labelAr: 'خريج مدرسة حكومية',
    documents: [
      PASSPORT,
      CIVIL_ID,
      PARENT_CIVIL_ID,
      HS_CERTIFICATE,
      NATIONALITY,
      PUC_RECEIPT,
      ACCEPTANCE_LETTER
    ]
  },
  {
    type: 'US',
    label: 'US Curriculum Graduate',
    labelAr: 'خريج منهج أمريكي',
    documents: [
      CIVIL_ID,
      PASSPORT,
      {
        id: 'transcript_moh',
        name: 'HS Transcript (MOH Equivalency)',
        nameAr: 'كشف الدرجات مع معادلة وزارة التربية',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'High school transcript with Ministry of Education equivalency'
      },
      {
        id: 'sequence_letter',
        name: 'Sequence Letter',
        nameAr: 'خطاب التسلسل الدراسي',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Official letter showing academic sequence/continuity'
      }
    ]
  },
  {
    type: 'UK',
    label: 'UK Curriculum Graduate',
    labelAr: 'خريج منهج بريطاني',
    documents: [
      CIVIL_ID,
      {
        id: 'gcse',
        name: 'GCSE/IGCSE Certificates',
        nameAr: 'شهادات GCSE/IGCSE',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'GCSE or IGCSE exam certificates'
      },
      {
        id: 'a_level',
        name: 'A-Level Certificates',
        nameAr: 'شهادات A-Level',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'A-Level exam certificates'
      },
      PASSPORT,
      EQUIVALENCY,
      PHOTO
    ]
  },
  {
    type: 'KSA',
    label: 'Saudi Curriculum Graduate',
    labelAr: 'خريج منهج سعودي',
    documents: [
      CIVIL_ID,
      {
        id: 'shahada',
        name: 'Shahada (Certificate)',
        nameAr: 'الشهادة',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Saudi high school certificate (Shahada)'
      },
      {
        id: 'transcript',
        name: 'Academic Transcript',
        nameAr: 'كشف الدرجات',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Complete academic transcript'
      },
      PASSPORT,
      EQUIVALENCY,
      PHOTO
    ]
  }
]

// Utility functions
export function getGraduateTypeConfig(type: GraduateType): GraduateTypeConfig | undefined {
  return GRADUATE_TYPE_CONFIGS.find(config => config.type === type)
}

export function getDocumentRule(type: GraduateType, documentId: DocumentTypeId): DocumentRule | undefined {
  const config = getGraduateTypeConfig(type)
  return config?.documents.find(doc => doc.id === documentId)
}

export function getRequiredDocuments(type: GraduateType): DocumentRule[] {
  const config = getGraduateTypeConfig(type)
  return config?.documents.filter(doc => doc.required) || []
}

export function validateFileType(file: File, rule: DocumentRule): { valid: boolean; error?: string } {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!rule.acceptedFileTypes.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Accepted: ${rule.acceptedFileTypes.join(', ')}`
    }
  }
  return { valid: true }
}

export function validateFileSize(file: File, rule: DocumentRule): { valid: boolean; error?: string } {
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > rule.maxSizeMB) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${rule.maxSizeMB}MB`
    }
  }
  return { valid: true }
}

export function validateFile(file: File, rule: DocumentRule): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const typeResult = validateFileType(file, rule)
  if (!typeResult.valid && typeResult.error) {
    errors.push(typeResult.error)
  }

  const sizeResult = validateFileSize(file, rule)
  if (!sizeResult.valid && sizeResult.error) {
    errors.push(sizeResult.error)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function checkDocumentExpiration(expirationDate: Date, warningDays: number = 30): {
  isExpired: boolean
  isExpiringSoon: boolean
  daysUntilExpiration: number
} {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const expDate = new Date(expirationDate)
  expDate.setHours(0, 0, 0, 0)

  const diffTime = expDate.getTime() - now.getTime()
  const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return {
    isExpired: daysUntilExpiration < 0,
    isExpiringSoon: daysUntilExpiration >= 0 && daysUntilExpiration <= warningDays,
    daysUntilExpiration
  }
}

export function getMissingDocuments(
  graduateType: GraduateType,
  uploadedDocumentIds: DocumentTypeId[]
): DocumentRule[] {
  const requiredDocs = getRequiredDocuments(graduateType)
  return requiredDocs.filter(doc => !uploadedDocumentIds.includes(doc.id))
}

export function getDocumentCompletionStatus(
  graduateType: GraduateType,
  uploadedDocumentIds: DocumentTypeId[]
): {
  total: number
  uploaded: number
  missing: number
  percentage: number
  isComplete: boolean
} {
  const requiredDocs = getRequiredDocuments(graduateType)
  const uploadedRequired = requiredDocs.filter(doc => uploadedDocumentIds.includes(doc.id))

  return {
    total: requiredDocs.length,
    uploaded: uploadedRequired.length,
    missing: requiredDocs.length - uploadedRequired.length,
    percentage: requiredDocs.length > 0
      ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
      : 0,
    isComplete: uploadedRequired.length === requiredDocs.length
  }
}
