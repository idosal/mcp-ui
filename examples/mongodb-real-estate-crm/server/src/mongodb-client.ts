import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class MongoDBClient {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private static instance: MongoDBClient;

  private constructor() {}

  public static getInstance(): MongoDBClient {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }

    const uri = process.env.MONGODB_URI || process.env.MDB_MCP_CONNECTION_STRING;
    if (!uri) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    const dbName = process.env.DB_NAME || 'real-estate-crm';

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log(`✅ Connected to MongoDB database: ${dbName}`);

      // Create indexes for better query performance
      await this.createIndexes();
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Properties indexes
      await this.db.collection('properties').createIndexes([
        { key: { propertyId: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { community: 1 } },
        { key: { price: 1 } },
        { key: { createdAt: -1 } }
      ]);

      // Leads indexes
      await this.db.collection('leads').createIndexes([
        { key: { leadId: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { source: 1 } },
        { key: { assignedTo: 1 } },
        { key: { email: 1 } },
        { key: { createdAt: -1 } }
      ]);

      // Sales agents indexes
      await this.db.collection('salesAgents').createIndexes([
        { key: { agentId: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { email: 1 }, unique: true }
      ]);

      // Contracts indexes
      await this.db.collection('contracts').createIndexes([
        { key: { contractId: 1 }, unique: true },
        { key: { propertyId: 1 } },
        { key: { leadId: 1 } },
        { key: { agentId: 1 } },
        { key: { status: 1 } },
        { key: { contractDate: -1 } },
        { key: { closingDate: -1 } }
      ]);

      // Deposits indexes
      await this.db.collection('deposits').createIndexes([
        { key: { depositId: 1 }, unique: true },
        { key: { contractId: 1 } },
        { key: { status: 1 } },
        { key: { depositDate: -1 } }
      ]);

      // Marketing campaigns indexes
      await this.db.collection('marketingCampaigns').createIndexes([
        { key: { campaignId: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { type: 1 } },
        { key: { startDate: -1 } }
      ]);

      // Activities indexes
      await this.db.collection('activities').createIndexes([
        { key: { activityId: 1 }, unique: true },
        { key: { agentId: 1 } },
        { key: { leadId: 1 } },
        { key: { type: 1 } },
        { key: { status: 1 } },
        { key: { scheduledDate: -1 } }
      ]);

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('⚠️  Error creating indexes:', error);
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('✅ Disconnected from MongoDB');
    }
  }

  // Helper method to check connection status
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}

export default MongoDBClient;
