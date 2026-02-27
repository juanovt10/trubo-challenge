export type OrderStatus = "Draft" | "Needs Approval" | "Approved" | "Docs Ready" | "Action Required"

export interface Order {
  id: string
  patient: string
  payer: string
  status: OrderStatus
  totalAllowed: number
  margin: number
  updated: string
  selfPay: boolean
  address: string
  city: string
  state: string
  zip: string
  phone: string
  dob: string
  insuranceId: string
  groupNumber: string
  lineItems: LineItem[]
  notes: Note[]
  /** Present when status is "Action Required" (e.g. from mock or after manager rejection). */
  rejectionReason?: string
}

export interface LineItem {
  id: string
  product: string
  hcpcs: string
  qty: number
  cost: number
  allowedAmount: number
  patientShare: number
  hasMeasurement: boolean
}

export interface Note {
  id: string
  author: string
  text: string
  timestamp: string
}

export interface Product {
  id: string
  name: string
  hcpcs: string
  vendor: string
  cost: number
  msrp: number
  requiresApproval: boolean
  requiresMeasurement: boolean
}

export interface FeeSchedule {
  id: string
  payer: string
  hcpcs: string
  allowedAmount: number
  patientSharePercent: number
}

/** Attachment display info (no base64 content). Used for mock data and order detail list. */
export interface OrderAttachmentDisplay {
  id: string
  name: string
  type: string
  size: number
}

/** Mock attachments per order id for order detail Attachments tab. */
export const mockOrderAttachments: Record<string, OrderAttachmentDisplay[]> = {
  "ORD-1001": [
    { id: "att-mock-1", name: "CMN-K0823-Chen.pdf", type: "application/pdf", size: 124000 },
    { id: "att-mock-2", name: "Face-to-face-notes.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 42000 },
  ],
  "ORD-1002": [
    { id: "att-mock-3", name: "Prior-auth-BCBS.pdf", type: "application/pdf", size: 89000 },
  ],
  "ORD-1003": [
    { id: "att-mock-4", name: "CMN-K0856-Evans.pdf", type: "application/pdf", size: 156000 },
    { id: "att-mock-5", name: "Prescription-E2321.pdf", type: "application/pdf", size: 31000 },
  ],
  "ORD-1007": [
    { id: "att-mock-6", name: "Wheelchair-CMN-Davis.pdf", type: "application/pdf", size: 198000 },
    { id: "att-mock-7", name: "Delivery-instructions.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 28000 },
  ],
  "ORD-1008": [
    { id: "att-mock-8", name: "CMN-K0823-Cooper-current.pdf", type: "application/pdf", size: 102000 },
  ],
  "ORD-1009": [
    { id: "att-mock-9", name: "Aetna-prior-auth-request.pdf", type: "application/pdf", size: 76000 },
    { id: "att-mock-10", name: "Patient-share-verification.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 35000 },
  ],
}

export const orders: Order[] = [
  {
    id: "ORD-1001",
    patient: "Margaret Chen",
    payer: "Medicare",
    status: "Needs Approval",
    totalAllowed: 2450.0,
    margin: 38.2,
    updated: "2026-02-22",
    selfPay: false,
    address: "1420 Oak Lane",
    city: "Portland",
    state: "OR",
    zip: "97201",
    phone: "(503) 555-0142",
    dob: "1948-03-15",
    insuranceId: "MBI-9281736450",
    groupNumber: "N/A",
    lineItems: [
      { id: "LI-1", product: "Power Wheelchair – Group 2", hcpcs: "K0823", qty: 1, cost: 890.0, allowedAmount: 1650.0, patientShare: 330.0, hasMeasurement: true },
      { id: "LI-2", product: "Seat Cushion – Skin Protection", hcpcs: "E2607", qty: 1, cost: 210.0, allowedAmount: 800.0, patientShare: 160.0, hasMeasurement: false },
    ],
    notes: [
      { id: "N-1", author: "Sarah Kim", text: "Initial intake completed. Patient qualifies for Group 2 PWC.", timestamp: "2026-02-20T09:30:00Z" },
      { id: "N-2", author: "Dr. James Park", text: "CMN received. Face-to-face notes attached.", timestamp: "2026-02-21T14:15:00Z" },
    ],
  },
  {
    id: "ORD-1002",
    patient: "Robert Williams",
    payer: "BCBS",
    status: "Approved",
    totalAllowed: 1280.0,
    margin: 42.5,
    updated: "2026-02-21",
    selfPay: false,
    address: "3200 Elm Street",
    city: "Seattle",
    state: "WA",
    zip: "98101",
    phone: "(206) 555-0198",
    dob: "1955-07-22",
    insuranceId: "XYZ-887412",
    groupNumber: "GRP-44210",
    lineItems: [
      { id: "LI-3", product: "Hospital Bed – Semi-Electric", hcpcs: "E0260", qty: 1, cost: 420.0, allowedAmount: 980.0, patientShare: 196.0, hasMeasurement: false },
      { id: "LI-4", product: "Pressure Mattress", hcpcs: "E0277", qty: 1, cost: 150.0, allowedAmount: 300.0, patientShare: 60.0, hasMeasurement: false },
    ],
    notes: [
      { id: "N-3", author: "Amy Lopez", text: "Authorization approved by BCBS. Delivery scheduled.", timestamp: "2026-02-20T11:00:00Z" },
    ],
  },
  {
    id: "ORD-1003",
    patient: "Dorothy Evans",
    payer: "Aetna",
    status: "Docs Ready",
    totalAllowed: 3100.0,
    margin: 35.8,
    updated: "2026-02-20",
    selfPay: false,
    address: "780 Birch Drive",
    city: "Denver",
    state: "CO",
    zip: "80202",
    phone: "(720) 555-0167",
    dob: "1942-11-08",
    insuranceId: "AET-5528194",
    groupNumber: "GRP-77312",
    lineItems: [
      { id: "LI-5", product: "Power Wheelchair – Group 3", hcpcs: "K0856", qty: 1, cost: 1400.0, allowedAmount: 2800.0, patientShare: 560.0, hasMeasurement: true },
      { id: "LI-6", product: "Joystick Control", hcpcs: "E2321", qty: 1, cost: 85.0, allowedAmount: 300.0, patientShare: 60.0, hasMeasurement: false },
    ],
    notes: [
      { id: "N-4", author: "Sarah Kim", text: "All documents generated. Ready for delivery.", timestamp: "2026-02-19T16:45:00Z" },
    ],
  },
  {
    id: "ORD-1004",
    patient: "James Thompson",
    payer: "Medicare",
    status: "Draft",
    totalAllowed: 0,
    margin: 0,
    updated: "2026-02-22",
    selfPay: false,
    address: "55 Pine Avenue",
    city: "Austin",
    state: "TX",
    zip: "73301",
    phone: "(512) 555-0134",
    dob: "1960-01-29",
    insuranceId: "MBI-1130045892",
    groupNumber: "N/A",
    lineItems: [],
    notes: [],
  },
  {
    id: "ORD-1005",
    patient: "Helen Martinez",
    payer: "BCBS",
    status: "Needs Approval",
    totalAllowed: 1890.0,
    margin: 40.1,
    updated: "2026-02-21",
    selfPay: false,
    address: "2100 Maple Court",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    phone: "(312) 555-0156",
    dob: "1951-09-14",
    insuranceId: "XYZ-112948",
    groupNumber: "GRP-55102",
    lineItems: [
      { id: "LI-7", product: "CPAP Machine", hcpcs: "E0601", qty: 1, cost: 380.0, allowedAmount: 890.0, patientShare: 178.0, hasMeasurement: false },
      { id: "LI-8", product: "CPAP Mask – Full Face", hcpcs: "A7030", qty: 1, cost: 120.0, allowedAmount: 450.0, patientShare: 90.0, hasMeasurement: true },
      { id: "LI-9", product: "CPAP Tubing", hcpcs: "A4604", qty: 2, cost: 25.0, allowedAmount: 550.0, patientShare: 110.0, hasMeasurement: false },
    ],
    notes: [
      { id: "N-5", author: "Amy Lopez", text: "Awaiting prior auth from BCBS. Follow up by 2/24.", timestamp: "2026-02-21T10:30:00Z" },
    ],
  },
  {
    id: "ORD-1006",
    patient: "Frank Nguyen",
    payer: "Medicare",
    status: "Approved",
    totalAllowed: 720.0,
    margin: 44.3,
    updated: "2026-02-19",
    selfPay: true,
    address: "430 Cedar Blvd",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    phone: "(415) 555-0123",
    dob: "1958-05-03",
    insuranceId: "MBI-6642018374",
    groupNumber: "N/A",
    lineItems: [
      { id: "LI-10", product: "Knee Brace – Custom Fitted", hcpcs: "L1843", qty: 2, cost: 160.0, allowedAmount: 720.0, patientShare: 144.0, hasMeasurement: true },
    ],
    notes: [
      { id: "N-6", author: "Dr. James Park", text: "Patient opted for self-pay. Custom fitting completed.", timestamp: "2026-02-18T13:00:00Z" },
    ],
  },
  {
    id: "ORD-1007",
    patient: "Patricia Davis",
    payer: "Aetna",
    status: "Docs Ready",
    totalAllowed: 4200.0,
    margin: 36.7,
    updated: "2026-02-18",
    selfPay: false,
    address: "892 Walnut Street",
    city: "Miami",
    state: "FL",
    zip: "33101",
    phone: "(305) 555-0189",
    dob: "1945-12-20",
    insuranceId: "AET-3319827",
    groupNumber: "GRP-88451",
    lineItems: [
      { id: "LI-11", product: "Power Wheelchair – Group 2", hcpcs: "K0823", qty: 1, cost: 890.0, allowedAmount: 1650.0, patientShare: 330.0, hasMeasurement: true },
      { id: "LI-12", product: "Elevating Leg Rest", hcpcs: "E1002", qty: 2, cost: 175.0, allowedAmount: 850.0, patientShare: 170.0, hasMeasurement: false },
      { id: "LI-13", product: "Seat Cushion – Skin Protection", hcpcs: "E2607", qty: 1, cost: 210.0, allowedAmount: 800.0, patientShare: 160.0, hasMeasurement: false },
      { id: "LI-14", product: "Arm Rest – Adjustable", hcpcs: "E0973", qty: 2, cost: 95.0, allowedAmount: 900.0, patientShare: 180.0, hasMeasurement: false },
    ],
    notes: [
      { id: "N-7", author: "Sarah Kim", text: "Full documentation package generated and verified.", timestamp: "2026-02-17T15:30:00Z" },
      { id: "N-8", author: "Amy Lopez", text: "Patient confirmed delivery window. Scheduled for 2/25.", timestamp: "2026-02-18T09:15:00Z" },
    ],
  },
  {
    id: "ORD-1008",
    patient: "Linda Cooper",
    payer: "Medicare",
    status: "Action Required",
    totalAllowed: 1650.0,
    margin: 46.2,
    updated: "2026-02-23",
    selfPay: false,
    address: "1500 Spruce Street",
    city: "Philadelphia",
    state: "PA",
    zip: "19102",
    phone: "(215) 555-0177",
    dob: "1953-04-11",
    insuranceId: "MBI-4452019381",
    groupNumber: "N/A",
    lineItems: [
      { id: "LI-15", product: "Power Wheelchair – Group 2", hcpcs: "K0823", qty: 1, cost: 890.0, allowedAmount: 1650.0, patientShare: 330.0, hasMeasurement: true },
    ],
    notes: [
      { id: "N-9", author: "Manager", text: "Order rejected: CMN on file does not support Group 2. Please obtain updated face-to-face documentation.", timestamp: "2026-02-23T11:00:00Z" },
    ],
    rejectionReason: "CMN on file does not support Group 2. Please obtain updated face-to-face documentation and resubmit.",
  },
  {
    id: "ORD-1009",
    patient: "David Miller",
    payer: "Aetna",
    status: "Action Required",
    totalAllowed: 900.0,
    margin: 38.5,
    updated: "2026-02-22",
    selfPay: false,
    address: "88 Oak Ridge Drive",
    city: "Atlanta",
    state: "GA",
    zip: "30301",
    phone: "(404) 555-0192",
    dob: "1962-08-30",
    insuranceId: "AET-9921847",
    groupNumber: "GRP-22105",
    lineItems: [
      { id: "LI-16", product: "CPAP Machine", hcpcs: "E0601", qty: 1, cost: 380.0, allowedAmount: 900.0, patientShare: 180.0, hasMeasurement: false },
      { id: "LI-17", product: "CPAP Mask – Full Face", hcpcs: "A7030", qty: 1, cost: 120.0, allowedAmount: 265.0, patientShare: 53.0, hasMeasurement: true },
    ],
    notes: [
      { id: "N-10", author: "Manager", text: "Order rejected: Prior authorization from Aetna required before dispensing. Patient share percentage needs verification.", timestamp: "2026-02-22T14:30:00Z" },
    ],
    rejectionReason: "Prior authorization from Aetna required before dispensing. Please verify patient share percentage and attach approval.",
  },
]

export const products: Product[] = [
  { id: "P-1", name: "Power Wheelchair – Group 2", hcpcs: "K0823", vendor: "Sunrise Medical", cost: 890.0, msrp: 2200.0, requiresApproval: true, requiresMeasurement: true },
  { id: "P-2", name: "Power Wheelchair – Group 3", hcpcs: "K0856", vendor: "Permobil", cost: 1400.0, msrp: 3800.0, requiresApproval: true, requiresMeasurement: true },
  { id: "P-3", name: "Hospital Bed – Semi-Electric", hcpcs: "E0260", vendor: "Drive Medical", cost: 420.0, msrp: 1100.0, requiresApproval: false, requiresMeasurement: false },
  { id: "P-4", name: "Pressure Mattress", hcpcs: "E0277", vendor: "Invacare", cost: 150.0, msrp: 380.0, requiresApproval: false, requiresMeasurement: false },
  { id: "P-5", name: "CPAP Machine", hcpcs: "E0601", vendor: "ResMed", cost: 380.0, msrp: 950.0, requiresApproval: true, requiresMeasurement: false },
  { id: "P-6", name: "CPAP Mask – Full Face", hcpcs: "A7030", vendor: "Philips", cost: 120.0, msrp: 280.0, requiresApproval: false, requiresMeasurement: true },
  { id: "P-7", name: "CPAP Tubing", hcpcs: "A4604", vendor: "ResMed", cost: 25.0, msrp: 45.0, requiresApproval: false, requiresMeasurement: false },
  { id: "P-8", name: "Knee Brace – Custom Fitted", hcpcs: "L1843", vendor: "Ossur", cost: 160.0, msrp: 420.0, requiresApproval: false, requiresMeasurement: true },
  { id: "P-9", name: "Seat Cushion – Skin Protection", hcpcs: "E2607", vendor: "ROHO", cost: 210.0, msrp: 550.0, requiresApproval: false, requiresMeasurement: false },
  { id: "P-10", name: "Joystick Control", hcpcs: "E2321", vendor: "Permobil", cost: 85.0, msrp: 200.0, requiresApproval: false, requiresMeasurement: false },
  { id: "P-11", name: "Elevating Leg Rest", hcpcs: "E1002", vendor: "Sunrise Medical", cost: 175.0, msrp: 450.0, requiresApproval: false, requiresMeasurement: false },
  { id: "P-12", name: "Arm Rest – Adjustable", hcpcs: "E0973", vendor: "Drive Medical", cost: 95.0, msrp: 240.0, requiresApproval: false, requiresMeasurement: false },
]

// Incomplete: not all payer + product (HCPCS) combinations exist.
export const feeSchedules: FeeSchedule[] = [
  // Medicare – missing K0856, E2321, E0260, L1843, E1002
  { id: "FS-1", payer: "Medicare", hcpcs: "K0823", allowedAmount: 1650.0, patientSharePercent: 20 },
  { id: "FS-4", payer: "Medicare", hcpcs: "E0277", allowedAmount: 300.0, patientSharePercent: 20 },
  { id: "FS-5", payer: "Medicare", hcpcs: "E0601", allowedAmount: 890.0, patientSharePercent: 20 },
  { id: "FS-6", payer: "Medicare", hcpcs: "A7030", allowedAmount: 250.0, patientSharePercent: 20 },
  { id: "FS-7", payer: "Medicare", hcpcs: "A4604", allowedAmount: 40.0, patientSharePercent: 20 },
  { id: "FS-9", payer: "Medicare", hcpcs: "E2607", allowedAmount: 500.0, patientSharePercent: 20 },
  { id: "FS-12", payer: "Medicare", hcpcs: "E0973", allowedAmount: 220.0, patientSharePercent: 20 },
  // BCBS – missing K0823, A7030, E0601, E0260, A4604, L1843, E1002
  { id: "FS-14", payer: "BCBS", hcpcs: "K0856", allowedAmount: 3000.0, patientSharePercent: 15 },
  { id: "FS-16", payer: "BCBS", hcpcs: "E0277", allowedAmount: 320.0, patientSharePercent: 15 },
  { id: "FS-21", payer: "BCBS", hcpcs: "E2607", allowedAmount: 520.0, patientSharePercent: 15 },
  { id: "FS-22", payer: "BCBS", hcpcs: "E2321", allowedAmount: 280.0, patientSharePercent: 15 },
  { id: "FS-24", payer: "BCBS", hcpcs: "E0973", allowedAmount: 260.0, patientSharePercent: 15 },
  // Aetna – missing K0823, E0260, E0277, E0601, A4604, L1843, E1002
  { id: "FS-26", payer: "Aetna", hcpcs: "K0856", allowedAmount: 2700.0, patientSharePercent: 20 },
  { id: "FS-30", payer: "Aetna", hcpcs: "A7030", allowedAmount: 265.0, patientSharePercent: 20 },
  { id: "FS-33", payer: "Aetna", hcpcs: "E2607", allowedAmount: 800.0, patientSharePercent: 20 },
  { id: "FS-34", payer: "Aetna", hcpcs: "E2321", allowedAmount: 300.0, patientSharePercent: 20 },
  { id: "FS-36", payer: "Aetna", hcpcs: "E0973", allowedAmount: 450.0, patientSharePercent: 20 },
]

export const roadmapItems = [
  {
    sprint: 1,
    title: "Intake & Pricing Foundation",
    active: true,
    items: [
      "Structured order intake",
      "Product catalog & fee schedule management",
      "Margin visibility",
      "Approval gating",
      "Basic document generation (Encounter, Invoice, POD)",
      "Status management (Draft, Needs Approval, Approved, Docs Ready)",
    ],
  },
  {
    sprint: 2,
    title: "Pricing Parity & PDFs",
    active: false,
    items: [
      "PDF export for all document types",
      "Pricing parity validation across payers",
      "Fee schedule version management",
      "Batch pricing updates",
      "Data integrity & validation",
    ],
  },
  {
    sprint: 3,
    title: "Workflow & Controls",
    active: false,
    items: [
      "Multi-step approval workflows",
      "Role-based access controls",
      "Audit trail & activity logging",
      "Notification system",
      "Operational reporting",
    ],
  },
  {
    sprint: 4,
    title: "Automation & Integrations",
    active: false,
    items: [
      "Insurance eligibility verification API",
      "Electronic prior authorization",
      "Inventory management integration",
      "Automated claim submission",
      "Third-party API integrations",
    ],
  },
]
