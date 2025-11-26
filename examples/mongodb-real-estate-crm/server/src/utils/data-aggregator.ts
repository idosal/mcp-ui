import { Db, ObjectId } from 'mongodb';
import {
  SalesMetrics,
  PipelineMetrics,
  InventoryMetrics,
  MarketingMetrics,
  AgentPerformance,
  ReportFilters,
  TimeSeriesData
} from '../../../shared/types/index.js';

export class DataAggregator {
  constructor(private db: Db) {}

  /**
   * Calculate sales metrics for a given period
   */
  async getSalesMetrics(filters: ReportFilters = {}): Promise<SalesMetrics> {
    const matchStage: any = { status: { $in: ['closed', 'signed'] } };

    if (filters.startDate || filters.endDate) {
      matchStage.contractDate = {};
      if (filters.startDate) matchStage.contractDate.$gte = filters.startDate;
      if (filters.endDate) matchStage.contractDate.$lte = filters.endDate;
    }

    if (filters.agentId) {
      matchStage.agentId = new ObjectId(filters.agentId);
    }

    const results = await this.db.collection('contracts').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$salePrice' },
          totalSales: { $sum: 1 },
          avgClosingTime: {
            $avg: {
              $divide: [
                { $subtract: ['$closingDate', '$contractDate'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        }
      }
    ]).toArray();

    const totalLeads = await this.db.collection('leads').countDocuments(
      filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { $gte: filters.startDate }),
              ...(filters.endDate && { $lte: filters.endDate })
            }
          }
        : {}
    );

    const metrics = results[0] || { totalRevenue: 0, totalSales: 0, avgClosingTime: 0 };

    return {
      totalRevenue: metrics.totalRevenue || 0,
      totalSales: metrics.totalSales || 0,
      averageSalePrice: metrics.totalSales > 0 ? metrics.totalRevenue / metrics.totalSales : 0,
      conversionRate: totalLeads > 0 ? (metrics.totalSales / totalLeads) * 100 : 0,
      averageClosingTime: Math.round(metrics.avgClosingTime || 0)
    };
  }

  /**
   * Get pipeline funnel metrics
   */
  async getPipelineMetrics(filters: ReportFilters = {}): Promise<PipelineMetrics> {
    const matchStage: any = {};

    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate) matchStage.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchStage.createdAt.$lte = filters.endDate;
    }

    if (filters.agentId) {
      matchStage.assignedTo = new ObjectId(filters.agentId);
    }

    const results = await this.db.collection('leads').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const metrics: PipelineMetrics = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
      totalLeads: 0,
      conversionRate: 0
    };

    results.forEach(item => {
      const status = item._id as keyof Omit<PipelineMetrics, 'totalLeads' | 'conversionRate'>;
      if (status in metrics) {
        metrics[status] = item.count;
        metrics.totalLeads += item.count;
      }
    });

    metrics.conversionRate = metrics.totalLeads > 0
      ? (metrics.won / metrics.totalLeads) * 100
      : 0;

    return metrics;
  }

  /**
   * Get inventory metrics
   */
  async getInventoryMetrics(filters: ReportFilters = {}): Promise<InventoryMetrics> {
    const matchStage: any = {};

    if (filters.community) {
      matchStage.community = filters.community;
    }

    const [statusResults, priceResults] = await Promise.all([
      this.db.collection('properties').aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
      this.db.collection('properties').aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$price' },
            totalProperties: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    const metrics: InventoryMetrics = {
      totalProperties: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      underConstruction: 0,
      averagePrice: 0,
      averageDaysOnMarket: 0
    };

    statusResults.forEach(item => {
      const status = item._id;
      if (status === 'available') metrics.available = item.count;
      else if (status === 'reserved') metrics.reserved = item.count;
      else if (status === 'sold') metrics.sold = item.count;
      else if (status === 'under_construction') metrics.underConstruction = item.count;
      metrics.totalProperties += item.count;
    });

    if (priceResults.length > 0) {
      metrics.averagePrice = priceResults[0].avgPrice || 0;
    }

    // Calculate average days on market for available properties
    const availableProps = await this.db.collection('properties')
      .find({ status: 'available', ...matchStage })
      .toArray();

    if (availableProps.length > 0) {
      const totalDays = availableProps.reduce((sum, prop) => {
        const days = Math.floor(
          (Date.now() - prop.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      metrics.averageDaysOnMarket = Math.round(totalDays / availableProps.length);
    }

    return metrics;
  }

  /**
   * Get marketing campaign metrics
   */
  async getMarketingMetrics(filters: ReportFilters = {}): Promise<MarketingMetrics> {
    const matchStage: any = {};

    if (filters.startDate || filters.endDate) {
      matchStage.startDate = {};
      if (filters.startDate) matchStage.startDate.$gte = filters.startDate;
      if (filters.endDate) matchStage.startDate.$lte = filters.endDate;
    }

    const results = await this.db.collection('marketingCampaigns').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$spent' },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalLeads: { $sum: '$leads' },
          totalConversions: { $sum: '$conversions' }
        }
      }
    ]).toArray();

    const metrics = results[0] || {
      totalCampaigns: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0,
      totalConversions: 0
    };

    const averageCostPerLead = metrics.totalLeads > 0
      ? metrics.totalSpent / metrics.totalLeads
      : 0;

    const averageROI = metrics.totalSpent > 0
      ? ((metrics.totalConversions - metrics.totalSpent) / metrics.totalSpent) * 100
      : 0;

    return {
      ...metrics,
      averageCostPerLead,
      averageROI
    };
  }

  /**
   * Get agent performance data
   */
  async getAgentPerformance(filters: ReportFilters = {}): Promise<AgentPerformance[]> {
    const agents = await this.db.collection('salesAgents')
      .find({ status: 'active' })
      .toArray();

    const performance: AgentPerformance[] = [];

    for (const agent of agents) {
      const contractMatchStage: any = {
        agentId: agent._id,
        status: { $in: ['closed', 'signed'] }
      };

      if (filters.startDate || filters.endDate) {
        contractMatchStage.contractDate = {};
        if (filters.startDate) contractMatchStage.contractDate.$gte = filters.startDate;
        if (filters.endDate) contractMatchStage.contractDate.$lte = filters.endDate;
      }

      const [contractResults, leadCount, activityCount] = await Promise.all([
        this.db.collection('contracts').aggregate([
          { $match: contractMatchStage },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$salePrice' },
              avgClosingTime: {
                $avg: {
                  $divide: [
                    { $subtract: ['$closingDate', '$contractDate'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            }
          }
        ]).toArray(),
        this.db.collection('leads').countDocuments({
          assignedTo: agent._id,
          status: { $nin: ['won', 'lost'] }
        }),
        this.db.collection('activities').countDocuments({
          agentId: agent._id,
          status: 'completed',
          ...(filters.startDate || filters.endDate ? {
            completedDate: {
              ...(filters.startDate && { $gte: filters.startDate }),
              ...(filters.endDate && { $lte: filters.endDate })
            }
          } : {})
        })
      ]);

      const contractData = contractResults[0] || {
        totalSales: 0,
        totalRevenue: 0,
        avgClosingTime: 0
      };

      const totalLeads = await this.db.collection('leads').countDocuments({
        assignedTo: agent._id,
        ...(filters.startDate || filters.endDate ? {
          createdAt: {
            ...(filters.startDate && { $gte: filters.startDate }),
            ...(filters.endDate && { $lte: filters.endDate })
          }
        } : {})
      });

      performance.push({
        agentId: agent.agentId,
        agentName: `${agent.firstName} ${agent.lastName}`,
        totalSales: contractData.totalSales,
        totalRevenue: contractData.totalRevenue,
        activeLeads: leadCount,
        conversionRate: totalLeads > 0 ? (contractData.totalSales / totalLeads) * 100 : 0,
        averageClosingTime: Math.round(contractData.avgClosingTime || 0),
        activitiesCompleted: activityCount
      });
    }

    return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Get time series data for sales trends
   */
  async getSalesTrend(filters: ReportFilters = {}): Promise<TimeSeriesData[]> {
    const matchStage: any = { status: { $in: ['closed', 'signed'] } };

    if (filters.startDate || filters.endDate) {
      matchStage.contractDate = {};
      if (filters.startDate) matchStage.contractDate.$gte = filters.startDate;
      if (filters.endDate) matchStage.contractDate.$lte = filters.endDate;
    }

    const results = await this.db.collection('contracts').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$contractDate' },
            month: { $month: '$contractDate' }
          },
          value: { $sum: '$salePrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();

    return results.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      value: item.value
    }));
  }

  /**
   * Get lead source distribution
   */
  async getLeadSourceDistribution(filters: ReportFilters = {}): Promise<{ source: string; count: number }[]> {
    const matchStage: any = {};

    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate) matchStage.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchStage.createdAt.$lte = filters.endDate;
    }

    const results = await this.db.collection('leads').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    return results.map(item => ({
      source: item._id,
      count: item.count
    }));
  }
}
