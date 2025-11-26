# Real Estate CRM - Example Prompts & Report Templates

This guide provides comprehensive examples of natural language prompts and report templates for the MongoDB Real Estate CRM application. These examples demonstrate how management can interact with the system to get insights about sales, marketing, inventory, and team performance.

## 📊 Dashboard & Overview

### Executive Dashboard
```
Show me the executive dashboard
```
**What it does:** Displays a comprehensive dashboard with:
- Sales revenue trends
- Pipeline funnel visualization
- Inventory status breakdown
- Lead source distribution
- Key performance metrics

**Example Output:**
- Interactive charts with sales data
- Current pipeline status
- Inventory availability
- Marketing performance summary

---

## 💰 Sales Analytics

### Sales Performance Report

```
Generate a sales performance report for Q4 2024 with both charts and tables
```

**Parameters:**
- Time period: Q4 2024 (Oct 1 - Dec 31, 2024)
- Format: Both charts and tables

**What it does:**
- Shows revenue trends over time
- Displays agent performance rankings
- Calculates conversion rates
- Shows average closing times

**Sample Markdown Output:**
```markdown
## Sales Performance Report

**Period:** 2024-10-01 - 2024-12-31

**Key Metrics:**
- Total Revenue: $15,450,000
- Total Sales: 42
- Average Sale Price: $368,095
- Conversion Rate: 21.5%
- Average Closing Time: 45 days

**Top Performers:**
1. Sarah Johnson - $2,340,000 (7 sales)
2. Michael Williams - $2,150,000 (6 sales)
3. Emily Brown - $1,980,000 (5 sales)
4. David Garcia - $1,750,000 (5 sales)
5. Jennifer Miller - $1,620,000 (4 sales)
```

### Monthly Sales Trend
```
Show me sales trends for the last 6 months with a line chart
```

**Use Case:** Track revenue trajectory and identify seasonal patterns

**Typical Insights:**
- Peak sales months
- Revenue growth rate
- Seasonal patterns
- Year-over-year comparisons

### Agent Performance Comparison
```
Compare all agent performance for this year
```

**What it does:**
- Creates sortable table of all agents
- Shows sales volume, revenue, and conversion rates
- Displays average closing time per agent
- Includes active lead counts

**Sample Table Columns:**
| Agent | Sales | Revenue | Active Leads | Conversion % | Avg Close (days) |
|-------|-------|---------|--------------|--------------|------------------|
| Sarah Johnson | 18 | $6,840,000 | 12 | 28.5% | 42 |
| Michael Williams | 15 | $5,625,000 | 15 | 25.0% | 48 |
| Emily Brown | 14 | $5,180,000 | 10 | 24.1% | 45 |

---

## 🎯 Pipeline & Lead Analytics

### Sales Pipeline Analysis
```
Show me the current sales pipeline with funnel visualization
```

**What it does:**
- Displays funnel chart showing leads at each stage
- Calculates conversion rate between stages
- Shows stage-by-stage percentages
- Identifies bottlenecks

**Sample Markdown Output:**
```markdown
## Pipeline Analysis

**Total Leads:** 195

**Stage Breakdown:**
- New: 45 (23.1%)
- Contacted: 38 (19.5%)
- Qualified: 32 (16.4%)
- Proposal: 28 (14.4%)
- Negotiation: 22 (11.3%)
- Won: 30 (15.4%)
- Lost: 0

**Overall Conversion Rate:** 15.38%
```

### Lead Source Performance
```
Analyze lead sources for the last quarter
```

**What it does:**
- Shows distribution of leads by source
- Calculates conversion rate per source
- Identifies most effective channels

**Use Cases:**
- Marketing budget allocation
- Channel optimization
- ROI analysis per source

**Sample Pie Chart Data:**
- Website: 45 leads (32%)
- Referrals: 38 leads (27%)
- Social Media: 31 leads (22%)
- Advertising: 18 leads (13%)
- Walk-ins: 8 leads (6%)

### Pipeline by Agent
```
Show me the sales pipeline filtered by agent Sarah Johnson
```

**Use Case:** Individual agent performance review and coaching

---

## 🏠 Inventory Management

### Inventory Status Report
```
Show me the current inventory status with property listings
```

**What it does:**
- Displays interactive table of all properties
- Shows status breakdown (available, reserved, sold, under construction)
- Provides filtering and sorting capabilities
- Enables CSV/JSON export

**Sample Markdown Output:**
```markdown
## Inventory Report

**Total Properties:** 127
- Available: 48
- Reserved: 15
- Sold: 52
- Under Construction: 12

**Pricing:**
- Average Price: $425,750
- Average Days on Market: 42 days
```

**Interactive Table Features:**
- Search by address, community, or status
- Sort by price, size, bedrooms
- Filter by community
- Export to CSV/JSON

### Community-Specific Inventory
```
Show me available properties in Sunset Hills community
```

**What it does:**
- Filters inventory by community
- Shows only available properties
- Includes pricing and features

### Price Range Analysis
```
Show me properties under $500,000
```

**Use Case:** Match inventory to buyer budgets

---

## 📢 Marketing Analytics

### Marketing ROI Analysis
```
Analyze marketing campaign performance with ROI metrics
```

**What it does:**
- Shows all campaigns with performance data
- Calculates cost per lead
- Computes ROI percentage
- Ranks campaigns by effectiveness

**Sample Table:**
| Campaign | Type | Budget | Spent | Leads | Conversions | Cost/Lead | ROI % |
|----------|------|--------|-------|-------|-------------|-----------|-------|
| Google Ads Q1 | Digital | $25,000 | $24,500 | 145 | 22 | $168.97 | 45.2% |
| Facebook Spring | Social | $15,000 | $14,200 | 98 | 15 | $144.90 | 38.7% |
| Instagram Summer | Social | $18,000 | $17,800 | 112 | 18 | $158.93 | 41.5% |

### Campaign Effectiveness
```
Show me the top 10 marketing campaigns by ROI
```

**Use Case:** Identify and replicate successful campaigns

**Sample Bar Chart:**
- Shows ROI comparison across campaigns
- Highlights best performers
- Helps budget allocation decisions

### Channel Performance
```
Compare digital vs traditional marketing channels
```

**Use Cases:**
- Budget allocation between channels
- Strategy refinement
- ROI optimization

---

## 📈 Financial Reports

### Revenue Summary
```
Generate a financial summary for this quarter
```

**What it does:**
- Total revenue from closed deals
- Pending contract values
- Deposit status and amounts
- Revenue forecasting

**Sample Output:**
```markdown
## Financial Summary - Q4 2024

**Closed Sales:**
- Total Revenue: $15,450,000
- Number of Sales: 42
- Average Sale: $368,095

**Pending Contracts:**
- Total Value: $8,750,000
- Number of Contracts: 23
- Expected Close: Next 60 days

**Deposits Received:**
- Total Deposits: $1,847,500
- Cleared: $1,725,000
- Pending: $122,500
```

### Deposit Tracking
```
Show me all pending deposits
```

**Use Case:** Cash flow management and follow-up

---

## 👥 Team Performance

### Agent Activity Report
```
Show me sales team activity for this week
```

**What it does:**
- Lists all completed activities by type
- Shows agent productivity metrics
- Identifies top performers

**Activity Types Tracked:**
- Calls made
- Emails sent
- Meetings conducted
- Site visits completed
- Follow-ups scheduled

**Sample Output:**
```markdown
## Weekly Activity Report

**Team Totals:**
- Calls: 142
- Emails: 89
- Meetings: 34
- Site Visits: 28
- Follow-ups: 67

**Top Performers:**
1. Sarah Johnson - 45 activities (12 site visits)
2. Michael Williams - 38 activities (9 meetings)
3. Emily Brown - 35 activities (8 site visits)
```

### Individual Agent Deep Dive
```
Show me detailed performance for agent John Smith
```

**What it does:**
- Complete activity history
- Sales performance metrics
- Current pipeline status
- Conversion funnel analysis

---

## 📤 Export & Reporting

### Executive Summary PDF
```
Export an executive summary report as PDF
```

**What it does:**
- Generates comprehensive PDF report
- Includes all key metrics
- Formatted for presentation
- Ready for board meetings

**Report Sections:**
1. Sales Performance
2. Pipeline Status
3. Inventory Overview
4. Marketing Performance
5. Top Agent Rankings
6. Financial Summary

### Data Export for Analysis
```
Export all properties data to CSV
```

**Available Export Types:**
- `properties` - Full property database
- `leads` - Lead information
- `contracts` - Contract details
- `agent-performance` - Agent metrics

**Export Formats:**
- CSV - For Excel/Google Sheets
- PDF - For presentations
- JSON - For API/integration

**Example:**
```
Export agent performance data for Q4 2024 as CSV
```

---

## 🎨 Custom Report Examples

### New Home Sales Management Dashboard

**Prompt:**
```
Create a comprehensive dashboard for new home sales showing:
- Total revenue this month vs last month
- Current pipeline by stage
- Available inventory by community
- Top 5 agents this quarter
- Marketing campaign effectiveness
```

**Use Case:** Weekly management review meetings

### Sales Team Performance Review

**Prompt:**
```
Generate a sales team performance report comparing all agents for the last 90 days,
showing sales volume, conversion rates, and average closing time
```

**Use Case:** Quarterly performance reviews

### Marketing Budget Planning

**Prompt:**
```
Analyze all marketing campaigns from this year showing budget vs spent,
leads generated, cost per lead, and ROI for each channel
```

**Use Case:** Annual budget planning

### Inventory Aging Report

**Prompt:**
```
Show me all available properties grouped by community with days on market,
highlighting properties over 60 days
```

**Use Case:** Pricing strategy adjustments

### Commission Report

**Prompt:**
```
Show me all closed contracts for agent Sarah Johnson this quarter
with sale prices and commission calculations
```

**Use Case:** Commission payment processing

---

## 💡 Advanced Analysis Prompts

### Trend Analysis
```
Compare sales performance for Q3 2024 vs Q3 2023
```

**Insights:**
- Year-over-year growth
- Seasonal patterns
- Market trends

### Predictive Analytics
```
Based on current pipeline, forecast revenue for next quarter
```

**Use Case:** Revenue forecasting and planning

### Territory Analysis
```
Compare sales performance across all communities
```

**Insights:**
- High-performing areas
- Underperforming markets
- Investment opportunities

### Conversion Optimization
```
Analyze conversion rates at each pipeline stage to identify bottlenecks
```

**Use Case:** Sales process optimization

### Customer Segmentation
```
Show me lead distribution by budget range and preferred property type
```

**Use Case:** Targeted marketing campaigns

---

## 🔍 Quick Reference: Common Questions

### Sales Questions
- "What's our total revenue this month?"
- "How many properties did we sell this quarter?"
- "Who are our top 3 agents?"
- "What's our average sale price?"

### Pipeline Questions
- "How many leads do we have in negotiation?"
- "What's our overall conversion rate?"
- "Show me new leads from this week"
- "How many deals are closing this month?"

### Inventory Questions
- "How many properties are available?"
- "What's in inventory in Oak Valley?"
- "Show me homes under $400k"
- "Which properties have been on market longest?"

### Marketing Questions
- "Which campaigns generated the most leads?"
- "What's our cost per lead by channel?"
- "Show me ROI for digital marketing"
- "Which lead source has highest conversion?"

### Team Questions
- "How many site visits this week?"
- "Show me agent activity breakdown"
- "Who has the most active leads?"
- "What's the average response time?"

---

## 📋 Report Template Customization

All reports can be customized with:

**Time Filters:**
- Last 7 days
- Last 30 days
- Last quarter
- Last year
- Custom date range
- Year-to-date
- Month-to-date

**Agent Filters:**
- Specific agent
- Team comparison
- Top performers
- All agents

**Property Filters:**
- Community
- Price range
- Status
- Property type
- Bedrooms/bathrooms

**Format Options:**
- Interactive charts
- Sortable tables
- Combined view
- Export (CSV/PDF/JSON)

---

## 🎯 Best Practices

1. **Be Specific:** Include date ranges and filters for more relevant results
2. **Use Comparisons:** Ask for period-over-period comparisons to identify trends
3. **Request Visualizations:** Charts and tables make data easier to understand
4. **Export Data:** Use CSV exports for detailed analysis in Excel
5. **Regular Reviews:** Set up weekly/monthly reporting cadence
6. **Action Items:** Use insights to drive business decisions

---

## 📞 Support

For questions about specific prompts or custom reports, refer to the main [README.md](./README.md) documentation or check the API documentation.
