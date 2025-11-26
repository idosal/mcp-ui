import { stringify } from 'csv-stringify/sync';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  SalesMetrics,
  PipelineMetrics,
  InventoryMetrics,
  MarketingMetrics,
  AgentPerformance,
  ExportFormat
} from '../../../shared/types/index.js';

export class ReportGenerator {
  /**
   * Generate CSV from array of objects
   */
  static generateCSV(data: any[], columns?: string[]): string {
    if (data.length === 0) {
      return '';
    }

    const headers = columns || Object.keys(data[0]);

    const records = data.map(item => {
      const record: any = {};
      headers.forEach(header => {
        record[header] = item[header];
      });
      return record;
    });

    return stringify(records, {
      header: true,
      columns: headers
    });
  }

  /**
   * Generate executive summary PDF
   */
  static async generateExecutiveSummaryPDF(data: {
    salesMetrics: SalesMetrics;
    pipelineMetrics: PipelineMetrics;
    inventoryMetrics: InventoryMetrics;
    marketingMetrics: MarketingMetrics;
    agentPerformance: AgentPerformance[];
    reportDate: Date;
  }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText('Real Estate CRM - Executive Summary', {
      x: 50,
      y: yPosition,
      size: 20,
      font: timesRomanBold,
      color: rgb(0, 0.2, 0.4)
    });
    yPosition -= 30;

    // Report Date
    page.drawText(`Report Date: ${data.reportDate.toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRomanFont
    });
    yPosition -= 40;

    // Sales Metrics Section
    page.drawText('Sales Performance', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0, 0.3, 0.6)
    });
    yPosition -= 25;

    const salesLines = [
      `Total Revenue: $${data.salesMetrics.totalRevenue.toLocaleString()}`,
      `Total Sales: ${data.salesMetrics.totalSales}`,
      `Average Sale Price: $${Math.round(data.salesMetrics.averageSalePrice).toLocaleString()}`,
      `Conversion Rate: ${data.salesMetrics.conversionRate.toFixed(2)}%`,
      `Average Closing Time: ${data.salesMetrics.averageClosingTime} days`
    ];

    salesLines.forEach(line => {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: 12,
        font: timesRomanFont
      });
      yPosition -= 20;
    });
    yPosition -= 20;

    // Pipeline Metrics Section
    page.drawText('Sales Pipeline', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0, 0.3, 0.6)
    });
    yPosition -= 25;

    const pipelineLines = [
      `Total Leads: ${data.pipelineMetrics.totalLeads}`,
      `New: ${data.pipelineMetrics.new} | Contacted: ${data.pipelineMetrics.contacted}`,
      `Qualified: ${data.pipelineMetrics.qualified} | Proposal: ${data.pipelineMetrics.proposal}`,
      `Negotiation: ${data.pipelineMetrics.negotiation}`,
      `Won: ${data.pipelineMetrics.won} | Lost: ${data.pipelineMetrics.lost}`,
      `Pipeline Conversion Rate: ${data.pipelineMetrics.conversionRate.toFixed(2)}%`
    ];

    pipelineLines.forEach(line => {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: 12,
        font: timesRomanFont
      });
      yPosition -= 20;
    });
    yPosition -= 20;

    // Inventory Metrics Section
    page.drawText('Inventory Status', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0, 0.3, 0.6)
    });
    yPosition -= 25;

    const inventoryLines = [
      `Total Properties: ${data.inventoryMetrics.totalProperties}`,
      `Available: ${data.inventoryMetrics.available} | Reserved: ${data.inventoryMetrics.reserved}`,
      `Sold: ${data.inventoryMetrics.sold} | Under Construction: ${data.inventoryMetrics.underConstruction}`,
      `Average Price: $${Math.round(data.inventoryMetrics.averagePrice).toLocaleString()}`,
      `Average Days on Market: ${data.inventoryMetrics.averageDaysOnMarket} days`
    ];

    inventoryLines.forEach(line => {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: 12,
        font: timesRomanFont
      });
      yPosition -= 20;
    });
    yPosition -= 20;

    // Marketing Metrics Section
    if (yPosition < 150) {
      page = pdfDoc.addPage([600, 800]);
      yPosition = height - 50;
    }

    page.drawText('Marketing Performance', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0, 0.3, 0.6)
    });
    yPosition -= 25;

    const marketingLines = [
      `Total Campaigns: ${data.marketingMetrics.totalCampaigns}`,
      `Total Budget: $${data.marketingMetrics.totalBudget.toLocaleString()}`,
      `Total Spent: $${data.marketingMetrics.totalSpent.toLocaleString()}`,
      `Total Leads Generated: ${data.marketingMetrics.totalLeads}`,
      `Total Conversions: ${data.marketingMetrics.totalConversions}`,
      `Average Cost per Lead: $${data.marketingMetrics.averageCostPerLead.toFixed(2)}`,
      `Average ROI: ${data.marketingMetrics.averageROI.toFixed(2)}%`
    ];

    marketingLines.forEach(line => {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: 12,
        font: timesRomanFont
      });
      yPosition -= 20;
    });
    yPosition -= 30;

    // Top Agents Section
    page.drawText('Top Performing Agents', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0, 0.3, 0.6)
    });
    yPosition -= 25;

    const topAgents = data.agentPerformance.slice(0, 5);
    topAgents.forEach((agent, index) => {
      const line = `${index + 1}. ${agent.agentName} - $${agent.totalRevenue.toLocaleString()} (${agent.totalSales} sales)`;
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: 12,
        font: timesRomanFont
      });
      yPosition -= 20;
    });

    // Footer
    page.drawText('Generated by Real Estate CRM System', {
      x: 50,
      y: 30,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  /**
   * Generate agent performance PDF report
   */
  static async generateAgentPerformancePDF(
    agentPerformance: AgentPerformance[],
    reportDate: Date
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText('Agent Performance Report', {
      x: 50,
      y: yPosition,
      size: 20,
      font: timesRomanBold,
      color: rgb(0, 0.2, 0.4)
    });
    yPosition -= 30;

    // Report Date
    page.drawText(`Report Date: ${reportDate.toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRomanFont
    });
    yPosition -= 40;

    // Table Header
    page.drawText('Agent Name', { x: 50, y: yPosition, size: 11, font: timesRomanBold });
    page.drawText('Sales', { x: 200, y: yPosition, size: 11, font: timesRomanBold });
    page.drawText('Revenue', { x: 260, y: yPosition, size: 11, font: timesRomanBold });
    page.drawText('Conv%', { x: 360, y: yPosition, size: 11, font: timesRomanBold });
    page.drawText('Avg Days', { x: 420, y: yPosition, size: 11, font: timesRomanBold });
    yPosition -= 20;

    // Table content
    agentPerformance.forEach((agent) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([600, 800]);
        yPosition = height - 50;

        // Repeat header on new page
        page.drawText('Agent Name', { x: 50, y: yPosition, size: 11, font: timesRomanBold });
        page.drawText('Sales', { x: 200, y: yPosition, size: 11, font: timesRomanBold });
        page.drawText('Revenue', { x: 260, y: yPosition, size: 11, font: timesRomanBold });
        page.drawText('Conv%', { x: 360, y: yPosition, size: 11, font: timesRomanBold });
        page.drawText('Avg Days', { x: 420, y: yPosition, size: 11, font: timesRomanBold });
        yPosition -= 20;
      }

      page.drawText(agent.agentName.substring(0, 20), { x: 50, y: yPosition, size: 10, font: timesRomanFont });
      page.drawText(agent.totalSales.toString(), { x: 200, y: yPosition, size: 10, font: timesRomanFont });
      page.drawText(`$${(agent.totalRevenue / 1000).toFixed(0)}K`, { x: 260, y: yPosition, size: 10, font: timesRomanFont });
      page.drawText(`${agent.conversionRate.toFixed(1)}%`, { x: 360, y: yPosition, size: 10, font: timesRomanFont });
      page.drawText(agent.averageClosingTime.toString(), { x: 420, y: yPosition, size: 10, font: timesRomanFont });
      yPosition -= 18;
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  /**
   * Format data for export based on format type
   */
  static async formatForExport(
    data: any,
    format: ExportFormat,
    reportType: string
  ): Promise<string | Uint8Array> {
    switch (format) {
      case 'csv':
        if (Array.isArray(data)) {
          return this.generateCSV(data);
        } else {
          // Convert object to array for CSV export
          return this.generateCSV([data]);
        }

      case 'pdf':
        if (reportType === 'executive-summary') {
          return await this.generateExecutiveSummaryPDF(data);
        } else if (reportType === 'agent-performance') {
          return await this.generateAgentPerformancePDF(data.agentPerformance, data.reportDate);
        }
        throw new Error(`Unsupported PDF report type: ${reportType}`);

      case 'json':
        return JSON.stringify(data, null, 2);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}
