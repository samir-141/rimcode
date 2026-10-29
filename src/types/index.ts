export type TechCategory =
  | "all"
  | "frontend"
  | "backend"
  | "database"
  | "devops-tools";

export interface Technology {
  id: string;
  name: string;
  category: "frontend" | "backend" | "database" | "devops-tools";
  iconName: string;
  shortDescription: string;
  fullDescription: string;
  primaryUse: string;
  keyBenefits: string[];
  docUrl: string;
  color: string;
  // 3D coordinates on unit sphere
  position: [number, number, number];
  relatedProjects?: string[];
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  summary: string;
  problem: string;
  personalContribution: string;
  keyFeatures: string[];
  technologies: string[];
  image: string;
  demoUrl?: string;
  repoUrl?: string;
  isPrivateRepo?: boolean;
  statusBadge: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  tagline: string;
  colSpan?: "small" | "medium" | "large" | "full";
  problem: string;
  solution: string;
  expectedBenefit: string;
  deliverables: string[];
  icon: string;
  accentColor: "cyan" | "violet" | "blue" | "emerald";
}

export type DemoRole = "admin" | "cajero" | "almacen";

export interface DemoProduct {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  category: "Analgésicos" | "Antibióticos" | "Cuidado Personal" | "Vitaminas" | "Primeros Auxilios";
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  expirationDate: string;
}

export interface DemoSaleRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  timestamp: string;
  cashierRole: DemoRole;
}

export interface DemoStockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "VENTA" | "REABASTECIMIENTO" | "AJUSTE";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  userRole: DemoRole;
}

export interface DemoHourlySales {
  hour: string;
  ventas: number;
  transacciones: number;
}

export interface DemoState {
  products: DemoProduct[];
  salesHistory: DemoSaleRecord[];
  movementHistory: DemoStockMovement[];
  hourlySales: DemoHourlySales[];
  currentRole: DemoRole;
  selectedCategory: string;
  searchQuery: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  projectType: string;
  estimatedBudget?: string;
  message: string;
  honeypot?: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  developer: string;
  role: string;
  tagline: string;
  subheadline: string;
  valueProposition: string;
  contact: {
    email: string;
    whatsappNumber: string;
    whatsappFormatted: string;
    whatsappDefaultMessage: string;
    githubUrl: string;
    linkedinUrl: string;
  };
  availabilityStatus: {
    isAvailable: boolean;
    text: string;
    detail: string;
  };
  navigation: Array<{
    label: string;
    href: string;
  }>;
}

