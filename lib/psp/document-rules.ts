/**
 * PSP Document Validation Rules Configuration
 * Defines file types, max sizes, required documents, and expiration tracking per graduate type
 */

export type GraduateType = 'GOV' | 'US' | 'UK' | 'KSA' | 'OTHER'

export type DocumentTypeId =
  | 'passport'
  | 'civil_id'
  | 'parent_civil_id'
  | 'hs_certificate'
  | 'nationality'
  | 'puc_receipt'
  | 'acceptance_letter'
  | 'declaration'
  | 'payment_receipt'
  | 'transcript_moh'
  | 'sequence'
  | 'gcse'
  | 'shahada'
  | 'qiyas'
  | 'equivalency'
  | 'transfer_certificate'
  | 'special_needs_certificate'
  | 'ministry_foreign_affairs'
  | 'course_description'
  | 'extra_document_1'
  | 'extra_document_2'

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
  name: 'Proof of Nationality',
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
  description: 'ktech acceptance letter'
}

const DECLARATION: DocumentRule = {
  id: 'declaration',
  name: 'Declaration',
  nameAr: 'إقرار',
  required: false,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Signed declaration form'
}

const PAYMENT_RECEIPT: DocumentRule = {
  id: 'payment_receipt',
  name: 'Payment Receipt',
  nameAr: 'إيصال الدفع',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Payment receipt'
}

const TRANSFER_CERTIFICATE: DocumentRule = {
  id: 'transfer_certificate',
  name: 'Transcript',
  nameAr: 'كشف الدرجات الرسمي',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Official academic transcript from previous institution'
}

const SPECIAL_NEEDS_CERTIFICATE: DocumentRule = {
  id: 'special_needs_certificate',
  name: 'Special Needs Certificate',
  nameAr: 'شهادة ذوي الاحتياجات الخاصة',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Certificate for students with special needs'
}

const MINISTRY_FOREIGN_AFFAIRS: DocumentRule = {
  id: 'ministry_foreign_affairs',
  name: 'Ministry of Foreign Affairs',
  nameAr: 'وزارة الخارجية',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Ministry of Foreign Affairs document for diplomatic students'
}

const COURSE_DESCRIPTION: DocumentRule = {
  id: 'course_description',
  name: 'Course Description',
  nameAr: 'وصف المقررات',
  required: true,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Course description from previous institution for credit transfer evaluation'
}

const EXTRA_DOCUMENT_1: DocumentRule = {
  id: 'extra_document_1',
  name: 'Extra Document 1',
  nameAr: 'مستند إضافي 1',
  required: false,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Optional additional document'
}

const EXTRA_DOCUMENT_2: DocumentRule = {
  id: 'extra_document_2',
  name: 'Extra Document 2',
  nameAr: 'مستند إضافي 2',
  required: false,
  acceptedFileTypes: DOCUMENT_FILE_TYPES,
  maxSizeMB: 10,
  hasExpiration: false,
  description: 'Optional additional document'
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
      ACCEPTANCE_LETTER,
      PAYMENT_RECEIPT,
    ]
  },
  {
    type: 'US',
    label: 'US Curriculum Graduate',
    labelAr: 'خريج منهج أمريكي',
    documents: [
      CIVIL_ID,
      PARENT_CIVIL_ID,
      PASSPORT,
      NATIONALITY,
      {
        id: 'transcript_moh',
        name: 'Original HS Transcript',
        nameAr: 'كشف الدرجات الأصلي للثانوية',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Official high school transcript from grade 9-12'
      },
      {
        id: 'sequence',
        name: 'Sequence',
        nameAr: 'التسلسل',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Academic sequence document'
      },
      {
        id: 'equivalency',
        name: 'Equivalency',
        nameAr: 'المعادلة',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Private education sector equivalency certificate'
      },
      ACCEPTANCE_LETTER,
      PAYMENT_RECEIPT,
    ]
  },
  {
    type: 'UK',
    label: 'UK Curriculum Graduate',
    labelAr: 'خريج منهج بريطاني',
    documents: [
      CIVIL_ID,
      PARENT_CIVIL_ID,
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
        id: 'equivalency',
        name: 'Equivalency',
        nameAr: 'المعادلة',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Private education sector equivalency certificate'
      },
      PASSPORT,
      NATIONALITY,
      ACCEPTANCE_LETTER,
      PAYMENT_RECEIPT,
    ]
  },
  {
    type: 'KSA',
    label: 'Saudi Curriculum Graduate',
    labelAr: 'خريج منهج سعودي',
    documents: [
      CIVIL_ID,
      PARENT_CIVIL_ID,
      {
        id: 'shahada',
        name: 'Original HS Certificate',
        nameAr: 'الشهادة',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Official high school certificate (Shahada)'
      },
      {
        id: 'qiyas',
        name: 'Qiyas',
        nameAr: 'قياس',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Qiyas standardized test result certificate'
      },
      PASSPORT,
      NATIONALITY,
      ACCEPTANCE_LETTER,
      PAYMENT_RECEIPT,
    ]
  },
  {
    type: 'OTHER',
    label: 'Other Curriculum Graduate',
    labelAr: 'خريج منهج آخر',
    documents: [
      CIVIL_ID,
      PARENT_CIVIL_ID,
      HS_CERTIFICATE,
      {
        id: 'equivalency',
        name: 'Equivalency',
        nameAr: 'المعادلة',
        required: true,
        acceptedFileTypes: DOCUMENT_FILE_TYPES,
        maxSizeMB: 10,
        hasExpiration: false,
        description: 'Private education sector equivalency certificate'
      },
      PASSPORT,
      NATIONALITY,
      ACCEPTANCE_LETTER,
      PAYMENT_RECEIPT,
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

// Conditional document flags
export interface ConditionalDocumentFlags {
  isTransfer?: boolean
  isSpecialNeeds?: boolean
  isDiplomatic?: boolean
}

/**
 * Returns the full document list for a graduate type, including any conditional documents.
 */
export function getDocumentsForGraduateType(
  type: GraduateType,
  flags?: ConditionalDocumentFlags
): DocumentRule[] {
  const config = getGraduateTypeConfig(type)
  if (!config) return []

  const docs = [...config.documents]

  if (flags?.isTransfer) {
    docs.push(TRANSFER_CERTIFICATE)
  }
  if (flags?.isSpecialNeeds) {
    docs.push(SPECIAL_NEEDS_CERTIFICATE)
  }
  if (flags?.isDiplomatic) {
    docs.push(MINISTRY_FOREIGN_AFFAIRS)
  }

  // Declaration is optional – always at the end
  docs.push(DECLARATION)

  // Always include optional extra document slots
  docs.push(EXTRA_DOCUMENT_1)
  docs.push(EXTRA_DOCUMENT_2)

  return docs
}

export function getMissingDocuments(
  graduateType: GraduateType,
  uploadedDocumentIds: DocumentTypeId[],
  flags?: ConditionalDocumentFlags
): DocumentRule[] {
  const requiredDocs = getDocumentsForGraduateType(graduateType, flags).filter(doc => doc.required)
  return requiredDocs.filter(doc => !uploadedDocumentIds.includes(doc.id))
}

export function getDocumentCompletionStatus(
  graduateType: GraduateType,
  uploadedDocumentIds: DocumentTypeId[],
  flags?: ConditionalDocumentFlags
): {
  total: number
  uploaded: number
  missing: number
  percentage: number
  isComplete: boolean
} {
  const allDocs = getDocumentsForGraduateType(graduateType, flags)
  const requiredDocs = allDocs.filter(doc => doc.required)
  const uploadedAll = allDocs.filter(doc => uploadedDocumentIds.includes(doc.id))
  const uploadedRequired = requiredDocs.filter(doc => uploadedDocumentIds.includes(doc.id))

  return {
    total: requiredDocs.length,
    uploaded: uploadedAll.length,
    missing: requiredDocs.length - uploadedRequired.length,
    percentage: requiredDocs.length > 0
      ? Math.min(100, Math.round((uploadedAll.length / requiredDocs.length) * 100))
      : 0,
    isComplete: uploadedRequired.length === requiredDocs.length
  }
}
