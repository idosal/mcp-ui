import { ObjectId } from 'mongodb';
import MongoDBClient from '../mongodb-client.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample data generators
const communities = ['Sunset Hills', 'Oak Valley', 'Riverside Estates', 'Mountain View', 'Lakeside'];
const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Pine Ln', 'Cedar Way', 'Elm Blvd', 'Birch Ct'];
const features = ['Granite Countertops', 'Hardwood Floors', 'Stainless Appliances', 'Walk-in Closet', 'Smart Home', 'Solar Panels', 'Pool', 'Fireplace'];
const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa', 'William', 'Amanda', 'James', 'Jessica', 'Daniel', 'Ashley'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedData() {
  console.log('🌱 Starting data seed...\n');

  const mongoClient = MongoDBClient.getInstance();
  await mongoClient.connect();
  const db = mongoClient.getDb();

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    db.collection('properties').deleteMany({}),
    db.collection('leads').deleteMany({}),
    db.collection('salesAgents').deleteMany({}),
    db.collection('contracts').deleteMany({}),
    db.collection('deposits').deleteMany({}),
    db.collection('marketingCampaigns').deleteMany({}),
    db.collection('activities').deleteMany({})
  ]);

  // 1. Create Sales Agents
  console.log('👥 Creating sales agents...');
  const agents = [];
  for (let i = 0; i < 8; i++) {
    const agent = {
      _id: new ObjectId(),
      agentId: `AGT-${String(i + 1).padStart(3, '0')}`,
      firstName: randomChoice(firstNames),
      lastName: randomChoice(lastNames),
      email: `agent${i + 1}@realestate.com`,
      phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      hireDate: randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31)),
      status: 'active' as const,
      territory: randomChoice(communities),
      performance: {
        totalSales: 0,
        totalRevenue: 0,
        averageClosingTime: 0,
        conversionRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    agents.push(agent);
  }
  await db.collection('salesAgents').insertMany(agents);
  console.log(`✅ Created ${agents.length} sales agents`);

  // 2. Create Properties
  console.log('🏠 Creating properties...');
  const properties = [];
  let propertyCounter = 1;

  for (const community of communities) {
    const numProperties = randomInt(15, 30);

    for (let i = 0; i < numProperties; i++) {
      const lotNum = String(propertyCounter).padStart(3, '0');
      const bedrooms = randomChoice([2, 3, 4, 5]);
      const bathrooms = randomChoice([2, 2.5, 3, 3.5, 4]);
      const sqft = randomInt(1200, 4500);
      const basePrice = sqft * randomInt(180, 350);

      const status = randomChoice(['available', 'available', 'available', 'reserved', 'sold', 'under_construction']);

      const property = {
        _id: new ObjectId(),
        propertyId: `LOT-${lotNum}`,
        address: `${randomInt(100, 9999)} ${randomChoice(streets)}`,
        lotNumber: lotNum,
        sqft,
        bedrooms,
        bathrooms,
        price: Math.round(basePrice / 10000) * 10000, // Round to nearest 10k
        status,
        features: randomChoices(features, randomInt(3, 6)),
        community,
        constructionStartDate: randomDate(new Date(2023, 0, 1), new Date(2024, 6, 1)),
        estimatedCompletionDate: randomDate(new Date(2024, 6, 1), new Date(2025, 11, 31)),
        createdAt: randomDate(new Date(2023, 0, 1), new Date(2024, 10, 1)),
        updatedAt: new Date()
      };

      properties.push(property);
      propertyCounter++;
    }
  }
  await db.collection('properties').insertMany(properties);
  console.log(`✅ Created ${properties.length} properties`);

  // 3. Create Leads
  console.log('📋 Creating leads...');
  const leads = [];
  const leadStatuses: Array<'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'> =
    ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const leadSources: Array<'website' | 'referral' | 'walk-in' | 'advertising' | 'social_media'> =
    ['website', 'referral', 'walk-in', 'advertising', 'social_media'];

  for (let i = 0; i < 200; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const createdAt = randomDate(new Date(2024, 0, 1), new Date());
    const status = randomChoice(leadStatuses);

    const lead = {
      _id: new ObjectId(),
      leadId: `LEAD-${String(i + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      source: randomChoice(leadSources),
      status,
      assignedTo: randomChoice(agents)._id,
      interestedProperties: randomChoices(properties, randomInt(1, 3)).map(p => p._id),
      budget: {
        min: randomInt(200, 400) * 1000,
        max: randomInt(500, 800) * 1000
      },
      notes: `Interested in ${randomChoice(communities)} community. Looking for ${randomChoice(['2', '3', '4'])} bedroom home.`,
      createdAt,
      updatedAt: new Date(),
      lastContactDate: status !== 'new' ? randomDate(createdAt, new Date()) : createdAt
    };

    leads.push(lead);
  }
  await db.collection('leads').insertMany(leads);
  console.log(`✅ Created ${leads.length} leads`);

  // 4. Create Contracts (for won leads)
  console.log('📝 Creating contracts...');
  const contracts = [];
  const wonLeads = leads.filter(l => l.status === 'won');
  const soldProperties = properties.filter(p => p.status === 'sold').slice(0, wonLeads.length);

  for (let i = 0; i < Math.min(wonLeads.length, soldProperties.length); i++) {
    const lead = wonLeads[i];
    const property = soldProperties[i];
    const contractDate = randomDate(lead.createdAt, new Date());
    const closingDate = randomDate(contractDate, new Date());

    const contract = {
      _id: new ObjectId(),
      contractId: `CON-${String(i + 1).padStart(4, '0')}`,
      propertyId: property._id,
      leadId: lead._id,
      agentId: lead.assignedTo,
      contractDate,
      closingDate,
      salePrice: property.price * randomInt(95, 105) / 100, // Price variation
      depositAmount: property.price * 0.05, // 5% deposit
      depositDate: contractDate,
      status: randomChoice(['pending', 'signed', 'signed', 'closed', 'closed'] as const),
      terms: {
        financingType: randomChoice(['cash', 'mortgage', 'construction_loan'] as const),
        downPaymentPercent: randomChoice([10, 15, 20, 25, 30]),
        contingencies: randomChoices(['Inspection', 'Appraisal', 'Financing', 'HOA Approval'], randomInt(1, 3))
      },
      createdAt: contractDate,
      updatedAt: new Date()
    };

    contracts.push(contract);
  }
  await db.collection('contracts').insertMany(contracts);
  console.log(`✅ Created ${contracts.length} contracts`);

  // 5. Create Deposits
  console.log('💰 Creating deposits...');
  const deposits = [];

  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];

    // Earnest money deposit
    deposits.push({
      _id: new ObjectId(),
      depositId: `DEP-${String(deposits.length + 1).padStart(4, '0')}`,
      contractId: contract._id,
      amount: contract.depositAmount,
      depositDate: contract.depositDate,
      type: 'earnest_money' as const,
      status: 'cleared' as const,
      paymentMethod: randomChoice(['check', 'wire', 'credit_card'] as const),
      notes: 'Initial earnest money deposit',
      createdAt: contract.depositDate,
      updatedAt: new Date()
    });

    // Additional deposits if contract is signed or closed
    if (contract.status === 'signed' || contract.status === 'closed') {
      const downPayment = contract.salePrice * (contract.terms.downPaymentPercent / 100);
      const remainingDeposit = downPayment - contract.depositAmount;

      if (remainingDeposit > 0) {
        deposits.push({
          _id: new ObjectId(),
          depositId: `DEP-${String(deposits.length + 1).padStart(4, '0')}`,
          contractId: contract._id,
          amount: remainingDeposit,
          depositDate: randomDate(contract.contractDate, contract.closingDate),
          type: 'down_payment' as const,
          status: 'cleared' as const,
          paymentMethod: randomChoice(['wire', 'check'] as const),
          notes: 'Down payment',
          createdAt: contract.contractDate,
          updatedAt: new Date()
        });
      }
    }
  }
  await db.collection('deposits').insertMany(deposits);
  console.log(`✅ Created ${deposits.length} deposits`);

  // 6. Create Marketing Campaigns
  console.log('📢 Creating marketing campaigns...');
  const campaigns = [
    { name: 'Google Ads - Q1 2024', type: 'digital', channel: 'Google Ads' },
    { name: 'Facebook Ads - Spring Promo', type: 'social_media', channel: 'Facebook' },
    { name: 'Instagram - Summer Campaign', type: 'social_media', channel: 'Instagram' },
    { name: 'Local Magazine - Monthly', type: 'print', channel: 'Homes & Gardens Magazine' },
    { name: 'Highway Billboard - Route 101', type: 'billboard', channel: 'Outdoor Media' },
    { name: 'Radio Spots - Morning Drive', type: 'radio', channel: 'Local FM Radio' },
    { name: 'Email Newsletter', type: 'digital', channel: 'Email Marketing' },
    { name: 'Open House Events', type: 'digital', channel: 'Event Marketing' },
    { name: 'YouTube Pre-Roll Ads', type: 'digital', channel: 'YouTube' },
    { name: 'LinkedIn Sponsored Posts', type: 'social_media', channel: 'LinkedIn' }
  ];

  const marketingCampaigns = campaigns.map((camp, i) => {
    const budget = randomInt(5000, 50000);
    const spent = randomInt(Math.floor(budget * 0.5), budget);
    const impressions = spent * randomInt(100, 500);
    const clicks = Math.floor(impressions * randomInt(1, 5) / 100);
    const leads = Math.floor(clicks * randomInt(5, 20) / 100);
    const conversions = Math.floor(leads * randomInt(10, 30) / 100);

    return {
      _id: new ObjectId(),
      campaignId: `CAMP-${String(i + 1).padStart(3, '0')}`,
      name: camp.name,
      type: camp.type as any,
      channel: camp.channel,
      startDate: randomDate(new Date(2024, 0, 1), new Date(2024, 8, 1)),
      endDate: randomDate(new Date(2024, 9, 1), new Date(2024, 11, 31)),
      budget,
      spent,
      impressions,
      clicks,
      leads,
      conversions,
      status: randomChoice(['active', 'active', 'completed', 'paused'] as const),
      createdAt: randomDate(new Date(2024, 0, 1), new Date(2024, 6, 1)),
      updatedAt: new Date()
    };
  });

  await db.collection('marketingCampaigns').insertMany(marketingCampaigns);
  console.log(`✅ Created ${marketingCampaigns.length} marketing campaigns`);

  // 7. Create Activities
  console.log('📅 Creating activities...');
  const activities = [];
  const activityTypes: Array<'call' | 'email' | 'meeting' | 'site_visit' | 'follow_up'> =
    ['call', 'email', 'meeting', 'site_visit', 'follow_up'];

  for (const lead of leads.slice(0, 100)) {
    const numActivities = randomInt(2, 8);

    for (let i = 0; i < numActivities; i++) {
      const type = randomChoice(activityTypes);
      const scheduledDate = randomDate(lead.createdAt, new Date());
      const completed = Math.random() > 0.2; // 80% completion rate

      activities.push({
        _id: new ObjectId(),
        activityId: `ACT-${String(activities.length + 1).padStart(5, '0')}`,
        agentId: lead.assignedTo,
        leadId: lead._id,
        type,
        subject: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} - ${lead.firstName} ${lead.lastName}`,
        notes: `Follow-up ${type} regarding ${randomChoice(communities)} properties.`,
        duration: type === 'call' ? randomInt(5, 30) : type === 'meeting' ? randomInt(30, 120) : randomInt(10, 60),
        outcome: completed ? randomChoice(['Positive', 'Interested', 'Needs follow-up', 'Not interested', 'Scheduled next meeting']) : '',
        scheduledDate,
        completedDate: completed ? randomDate(scheduledDate, new Date()) : scheduledDate,
        status: completed ? 'completed' as const : randomChoice(['scheduled', 'cancelled'] as const),
        createdAt: scheduledDate,
        updatedAt: new Date()
      });
    }
  }

  await db.collection('activities').insertMany(activities);
  console.log(`✅ Created ${activities.length} activities`);

  // Update agent performance metrics
  console.log('📊 Updating agent performance metrics...');
  for (const agent of agents) {
    const agentContracts = contracts.filter(c => c.agentId.equals(agent._id));
    const agentLeads = leads.filter(l => l.assignedTo.equals(agent._id));

    const totalSales = agentContracts.filter(c => c.status === 'closed').length;
    const totalRevenue = agentContracts
      .filter(c => c.status === 'closed')
      .reduce((sum, c) => sum + c.salePrice, 0);

    const closingTimes = agentContracts
      .filter(c => c.status === 'closed')
      .map(c => (c.closingDate.getTime() - c.contractDate.getTime()) / (1000 * 60 * 60 * 24));

    const averageClosingTime = closingTimes.length > 0
      ? closingTimes.reduce((sum, t) => sum + t, 0) / closingTimes.length
      : 0;

    const conversionRate = agentLeads.length > 0
      ? (totalSales / agentLeads.length) * 100
      : 0;

    await db.collection('salesAgents').updateOne(
      { _id: agent._id },
      {
        $set: {
          'performance.totalSales': totalSales,
          'performance.totalRevenue': totalRevenue,
          'performance.averageClosingTime': Math.round(averageClosingTime),
          'performance.conversionRate': conversionRate
        }
      }
    );
  }
  console.log('✅ Updated agent performance metrics');

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log(`   Properties: ${properties.length}`);
  console.log(`   Leads: ${leads.length}`);
  console.log(`   Sales Agents: ${agents.length}`);
  console.log(`   Contracts: ${contracts.length}`);
  console.log(`   Deposits: ${deposits.length}`);
  console.log(`   Marketing Campaigns: ${marketingCampaigns.length}`);
  console.log(`   Activities: ${activities.length}`);
  console.log('\n✅ Database seeded successfully!\n');

  await mongoClient.disconnect();
}

// Run the seed
seedData().catch(console.error);
