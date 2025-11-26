import { ObjectId } from 'mongodb';

// ============================================
// Property Types
// ============================================

export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'under_construction';

export interface Property {
  _id: ObjectId;
  propertyId: string;
  address: string;
  lotNumber: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  status: PropertyStatus;
  features: string[];
  community: string;
  constructionStartDate: Date;
  estimatedCompletionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Lead Types
// ============================================

export type LeadSource = 'website' | 'referral' | 'walk-in' | 'advertising' | 'social_media';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  _id: ObjectId;
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: ObjectId;
  interestedProperties: ObjectId[];
  budget: {
    min: number;
    max: number;
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate: Date;
}

// ============================================
// Sales Agent Types
// ============================================

export type AgentStatus = 'active' | 'inactive';

export interface SalesAgent {
  _id: ObjectId;
  agentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: Date;
  status: AgentStatus;
  territory: string;
  performance: {
    totalSales: number;
    totalRevenue: number;
    averageClosingTime: number;
    conversionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Contract Types
// ============================================

export type ContractStatus = 'pending' | 'signed' | 'closed' | 'cancelled';
export type FinancingType = 'cash' | 'mortgage' | 'construction_loan';

export interface Contract {
  _id: ObjectId;
  contractId: string;
  propertyId: ObjectId;
  leadId: ObjectId;
  agentId: ObjectId;
  contractDate: Date;
  closingDate: Date;
  salePrice: number;
  depositAmount: number;
  depositDate: Date;
  status: ContractStatus;
  terms: {
    financingType: FinancingType;
    downPaymentPercent: number;
    contingencies: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Deposit Types
// ============================================

export type DepositType = 'earnest_money' | 'down_payment' | 'installment';
export type DepositStatus = 'pending' | 'cleared' | 'refunded';
export type PaymentMethod = 'check' | 'wire' | 'credit_card';

export interface Deposit {
  _id: ObjectId;
  depositId: string;
  contractId: ObjectId;
  amount: number;
  depositDate: Date;
  type: DepositType;
  status: DepositStatus;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Marketing Campaign Types
// ============================================

export type CampaignType = 'digital' | 'print' | 'billboard' | 'radio' | 'tv' | 'social_media';
export type CampaignStatus = 'planned' | 'active' | 'paused' | 'completed';

export interface MarketingCampaign {
  _id: ObjectId;
  campaignId: string;
  name: string;
  type: CampaignType;
  channel: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Activity Types
// ============================================

export type ActivityType = 'call' | 'email' | 'meeting' | 'site_visit' | 'follow_up';
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Activity {
  _id: ObjectId;
  activityId: string;
  agentId: ObjectId;
  leadId: ObjectId;
  type: ActivityType;
  subject: string;
  notes: string;
  duration: number;
  outcome: string;
  scheduledDate: Date;
  completedDate: Date;
  status: ActivityStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Report Types
// ============================================

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  agentId?: string;
  propertyId?: string;
  community?: string;
  status?: string;
  source?: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalSales: number;
  averageSalePrice: number;
  conversionRate: number;
  averageClosingTime: number;
}

export interface PipelineMetrics {
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  negotiation: number;
  won: number;
  lost: number;
  totalLeads: number;
  conversionRate: number;
}

export interface InventoryMetrics {
  totalProperties: number;
  available: number;
  reserved: number;
  sold: number;
  underConstruction: number;
  averagePrice: number;
  averageDaysOnMarket: number;
}

export interface MarketingMetrics {
  totalCampaigns: number;
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  totalConversions: number;
  averageCostPerLead: number;
  averageROI: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalSales: number;
  totalRevenue: number;
  activeLeads: number;
  conversionRate: number;
  averageClosingTime: number;
  activitiesCompleted: number;
}

// ============================================
// Chart Data Types
// ============================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
  title: string;
  data: ChartDataPoint[] | TimeSeriesData[];
  options?: {
    showLegend?: boolean;
    showGrid?: boolean;
    stacked?: boolean;
    colors?: string[];
  };
}

// ============================================
// Export Types
// ============================================

export type ExportFormat = 'csv' | 'pdf' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeRawData?: boolean;
  fileName?: string;
  filters?: ReportFilters;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardData {
  metrics: {
    sales: SalesMetrics;
    pipeline: PipelineMetrics;
    inventory: InventoryMetrics;
    marketing: MarketingMetrics;
  };
  charts: {
    salesTrend: TimeSeriesData[];
    pipelineFunnel: ChartDataPoint[];
    inventoryStatus: ChartDataPoint[];
    topAgents: ChartDataPoint[];
    leadSources: ChartDataPoint[];
    marketingROI: ChartDataPoint[];
  };
  recentActivities: Activity[];
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
    timestamp: Date;
  }[];
}
