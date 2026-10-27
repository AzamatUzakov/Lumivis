// src/data/prices.ts
// Single source of truth for numeric price data, structure and formatting

export interface ServiceItem {
  id: string; // Used for translation lookup: price.service.${id}
  oneEye?: number | null;
  bothEyes?: number | null;
  singlePrice?: number | null;
  warning?: boolean;
}

export interface StrabismusCategory {
  categoryKey: string;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  m4Warning?: boolean;
}

export interface PackageService {
  nameKey: string;
  price: number;
  warning?: boolean;
}

export interface ExaminationPackage {
  id: string;
  titleKey: string;
  hasWarning?: boolean;
  total?: number | null; // null when total is not published (e.g. D.1 primary exam)
  totalWarning?: boolean;
  services: PackageService[];
}

export interface FamilyDiscountItem {
  count: number;
  discountPercent?: number | null;
  price: number;
  warning?: boolean;
}

/**
 * Pure formatter for currency numbers grouping by 3 digits with non-breaking space.
 * Deterministic across Node/SSR/browsers.
 */
export function formatPrice(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

// A. Диагностические услуги
export const DIAGNOSTIC_SERVICES: ServiceItem[] = [
  { id: "consultation", singlePrice: 50000 },
  { id: "visiometry", oneEye: 10000, bothEyes: 20000 },
  { id: "refractometry", oneEye: 15000, bothEyes: 30000 },
  { id: "keratometry", oneEye: 10000, bothEyes: 20000 },
  { id: "tonometry", oneEye: 15000, bothEyes: 30000 },
  { id: "pachymetry", oneEye: 10000, bothEyes: 20000 },
  { id: "glasses_selection", oneEye: 15000, bothEyes: 30000 },
  { id: "biomicroscopy", oneEye: 15000, bothEyes: 30000 },
  { id: "us_a_scan", oneEye: 35000, bothEyes: 70000 },
  { id: "us_b_scan", oneEye: 55000, bothEyes: 110000 },
  { id: "gonioscopy", oneEye: 45000, bothEyes: 90000 },
  { id: "perimetry_comp", oneEye: 105000, bothEyes: 200000 },
  { id: "oct", oneEye: 175000, bothEyes: 300000 },
  { id: "fundus_camera", oneEye: 75000, bothEyes: 150000 },
  { id: "skiascopy", oneEye: 35000, bothEyes: 70000 },
  { id: "schirmer_test", oneEye: null, bothEyes: 40000 },
  { id: "ophthalmoscopy_direct", oneEye: 20000, bothEyes: 40000, warning: true },
  { id: "ophthalmoscopy_indirect", oneEye: 30000, bothEyes: 60000 },
  { id: "ubm", oneEye: 175000, bothEyes: 350000 },
  { id: "strabismus_angle_synoptophore", oneEye: null, bothEyes: 130000 },
  { id: "color_rabkin", oneEye: null, bothEyes: 80000 },
  { id: "vision_nature", oneEye: null, bothEyes: 30000 },
  { id: "iol_calc", oneEye: 30000, bothEyes: 50000 },
  { id: "mydriasis", oneEye: 5000, bothEyes: 10000 },
];

// B. Лечебные услуги
export const TREATMENT_SERVICES: ServiceItem[] = [
  { id: "probing", oneEye: 250000, bothEyes: 400000 },
  { id: "irrigation", oneEye: 100000, bothEyes: 150000 },
  { id: "parabulbar_inj", oneEye: 45000, bothEyes: 80000 },
  { id: "bitemporal_inj", oneEye: 45000, bothEyes: 80000 },
  { id: "im_inj", singlePrice: 30000 },
  { id: "iv_inj", singlePrice: 40000 },
  { id: "foreign_body_removal", oneEye: 90000, bothEyes: 160000 },
];

// B.8 Плеоптика, ортоптика
export const PLEOPTICS_SERVICES: ServiceItem[] = [
  { id: "pleoptics_electrostim", oneEye: 30000, bothEyes: 50000 },
  { id: "pleoptics_magneto", oneEye: 35000, bothEyes: 60000 },
  { id: "pleoptics_tak2", oneEye: 15000, bothEyes: 25000 },
  { id: "pleoptics_maculastim", oneEye: null, bothEyes: 25000 },
  { id: "pleoptics_electrophoresis", oneEye: 15000, bothEyes: 20000 },
  { id: "pleoptics_vibromassage", oneEye: null, bothEyes: 10000 },
  { id: "pleoptics_synoptophore", oneEye: null, bothEyes: 100000 },
  { id: "pleoptics_aka", oneEye: 15000, bothEyes: 25000 },
  { id: "pleoptics_avetisov", oneEye: null, bothEyes: 45000 },
  { id: "pleoptics_computer", oneEye: null, bothEyes: 30000 },
];

// C.1 Хирургическое устранение косоглазия (по числу мышц)
export const STRABISMUS_TABLE: StrabismusCategory[] = [
  {
    categoryKey: "price.strabismus.cat1",
    m1: 4500000,
    m2: 7500000,
    m3: 10000000,
    m4: 12000000,
  },
  {
    categoryKey: "price.strabismus.cat2",
    m1: 5000000,
    m2: 8000000,
    m3: 11000000,
    m4: 13000000,
  },
  {
    categoryKey: "price.strabismus.cat3",
    m1: 5500000,
    m2: 9000000,
    m3: 12000000,
    m4: 13000000,
    m4Warning: true,
  },
  {
    categoryKey: "price.strabismus.cat4",
    m1: 6000000,
    m2: 10000000,
    m3: 12000000,
    m4: 14000000,
  },
];

// C.2–C.12 Остальные операции
export const SURGERY_SERVICES: ServiceItem[] = [
  { id: "nystagmus", singlePrice: 20000000 },
  { id: "pterygium_1", oneEye: 1200000, bothEyes: 2000000 },
  { id: "pterygium_2", oneEye: 1500000, bothEyes: 2800000 },
  { id: "pterygium_3", oneEye: 1800000, bothEyes: 3200000 },
  { id: "pterygium_4", oneEye: 2200000, bothEyes: 4000000 },
  { id: "pterygium_recidiv", oneEye: 2500000, bothEyes: 4800000 },
  { id: "pterygium_double", oneEye: 3250000, bothEyes: 5800000 },
  { id: "cataract_acrofold", oneEye: 3800000, bothEyes: 6800000 },
  { id: "cataract_naspro", oneEye: 4500000, bothEyes: 8700000 },
  { id: "cataract_supra", oneEye: 5000000, bothEyes: 9200000 },
  { id: "cataract_alcon", oneEye: 6800000, bothEyes: 12300000 },
  { id: "cataract_zeiss", oneEye: 7500000, bothEyes: 13000000 },
  { id: "blepharoplasty_upper", oneEye: null, bothEyes: 4800000 },
  { id: "blepharoplasty_lower", oneEye: null, bothEyes: 5200000 },
  { id: "blepharoplasty_circular", oneEye: null, bothEyes: 9300000 },
  { id: "chalazion_removal", oneEye: 950000, bothEyes: 1600000 },
  { id: "atheroma_removal", oneEye: 1150000, bothEyes: 2000000 },
  { id: "conjunctival_cyst_removal", oneEye: 850000, bothEyes: 1550000 },
  { id: "eyelid_cyst_removal", oneEye: 750000, bothEyes: 1300000 },
  { id: "entropion_repair", oneEye: 3500000, bothEyes: 6500000 },
  { id: "ptosis_tarsomyectomy", oneEye: 6800000, bothEyes: 12500000 },
  { id: "ptosis_levator", oneEye: 8200000, bothEyes: 14000000 },
  { id: "ptosis_frontal_suspension", oneEye: 9600000, bothEyes: 17000000, warning: true },
  { id: "ptosis_frontal_flap", oneEye: 12000000, bothEyes: 20000000 },
  { id: "dacryocystorhinostomy_external", oneEye: 4500000, bothEyes: 8000000 },
  { id: "dacryocystorhinostomy_endonasal", oneEye: 8500000, bothEyes: 15000000 },
];

// C.13 Глазное протезирование
export const PROSTHETICS_PRICES: ServiceItem[] = [
  { id: "prosthetic_individual", oneEye: 5500000, bothEyes: 10000000 },
  { id: "prosthetic_3d", singlePrice: 9000000 },
  { id: "prosthetic_polishing", singlePrice: 400000 },
  { id: "prosthetic_adjustment", singlePrice: 1000000 },
  { id: "prosthetic_conformer", singlePrice: 400000 },
  { id: "prosthetic_contact_lens", singlePrice: 300000 },
];

// D. Пакеты обследования
export const EXAMINATION_PACKAGES: ExaminationPackage[] = [
  {
    id: "d1_primary",
    titleKey: "price.package.d1.title",
    hasWarning: true,
    total: null, // ⛔ Total not published
    services: [
      { nameKey: "price.service.consultation", price: 50000 },
      { nameKey: "price.service.visiometry", price: 20000 },
      { nameKey: "price.service.refractometry", price: 30000 },
      { nameKey: "price.service.glasses_narrow", price: 30000 },
      { nameKey: "price.service.tonometry", price: 30000 },
      { nameKey: "price.service.biomicroscopy", price: 30000 },
      { nameKey: "price.service.mydriasis", price: 10000 },
      { nameKey: "price.service.refractometry_repeat", price: 30000 },
      { nameKey: "price.service.glasses_wide", price: 30000 },
      { nameKey: "price.service.ophthalmoscopy_general", price: 50000 },
    ],
  },
  {
    id: "d2_strabismus",
    titleKey: "price.package.d2.title",
    total: 630000,
    totalWarning: true,
    services: [
      { nameKey: "price.service.primary_exam", price: 160000 },
      { nameKey: "price.service.vision_nature", price: 30000 },
      { nameKey: "price.service.synoptophore_exam", price: 130000 },
      { nameKey: "price.service.skiascopy", price: 70000 },
      { nameKey: "price.service.strabismus_angle_various", price: 70000 },
      { nameKey: "price.service.a_scan_pzo", price: 70000 },
      { nameKey: "price.service.strabismologist_consult", price: 100000 },
    ],
  },
  {
    id: "d3_glaucoma",
    titleKey: "price.package.d3.title",
    total: 1276000,
    totalWarning: true,
    services: [
      { nameKey: "price.service.primary_exam", price: 160000 },
      { nameKey: "price.service.gonioscopy", price: 90000 },
      { nameKey: "price.service.perimetry_simple", price: 200000 },
      { nameKey: "price.service.ubm_a_scan", price: 350000, warning: true },
      { nameKey: "price.service.oct", price: 300000 },
      { nameKey: "price.service.fundus_camera", price: 150000 },
      { nameKey: "price.service.pachymetry", price: 26000, warning: true },
    ],
  },
  {
    id: "d4_cataract",
    titleKey: "price.package.d4.title",
    total: 720000,
    services: [
      { nameKey: "price.service.primary_exam", price: 160000 },
      { nameKey: "price.service.keratometry", price: 20000 },
      { nameKey: "price.service.pachymetry", price: 20000 },
      { nameKey: "price.service.us_a_b_scan", price: 180000 },
      { nameKey: "price.service.iol_calc", price: 50000 },
      { nameKey: "price.service.schirmer_test", price: 40000 },
      { nameKey: "price.service.lacrimal_patency", price: 150000 },
      { nameKey: "price.service.cataractologist_consult", price: 100000 },
    ],
  },
  {
    id: "d5_oculoplastics",
    titleKey: "price.package.d5.title",
    total: 260000,
    services: [
      { nameKey: "price.service.primary_exam", price: 160000 },
      { nameKey: "price.service.oculoplastic_consult", price: 100000 },
    ],
  },
  // Note: D.6 is completely omitted (⛔ not published)
  {
    id: "d7_anophthalmic",
    titleKey: "price.package.d7.title",
    total: 140000,
    services: [
      { nameKey: "price.service.doctor_consult", price: 50000 },
      { nameKey: "price.service.visiometry", price: 30000, warning: true },
      { nameKey: "price.service.refractometry", price: 30000 },
      { nameKey: "price.service.biomicroscopy", price: 30000 },
    ],
  },
];

// E. Бонусы и скидки
export const FAMILY_DISCOUNTS: FamilyDiscountItem[] = [
  { count: 1, discountPercent: null, price: 160000 },
  { count: 2, discountPercent: 25, price: 120000, warning: true },
  { count: 3, discountPercent: 35, price: 105000, warning: true },
  { count: 4, discountPercent: 40, price: 95000, warning: true },
  { count: 5, discountPercent: 50, price: 80000, warning: true },
];
