import postgres from 'postgres';
import { DatabaseConfig, SubmissionData } from '../types';

const DB_CONFIG: DatabaseConfig = {
  connectionString: 'postgresql://postgres.gymwtqibtytjbhqteoyt:ivferkiro112206@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  schema: 'public',
  tableName: 'db_buenaspracticas'
};

export class DatabaseService {
  private sql: any;

  constructor() {
    this.sql = postgres(DB_CONFIG.connectionString);
  }

  async ensureTableExists() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${DB_CONFIG.schema}.${DB_CONFIG.tableName} (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    return await this.executeQuery(query);
  }

  async insertSubmission(data: SubmissionData) {
    const query = `
      INSERT INTO ${DB_CONFIG.schema}.${DB_CONFIG.tableName} 
        (title, description, author, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;
    const params = [data.title, data.description, data.author];
    const result = await this.executeQuery(query, params);
    return result[0].id;
  }

  private async executeQuery(query: string, params?: any[]) {
    try {
      const result = await this.sql.unsafe(query, params);
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Database operation failed');
    }
  }

  async close() {
    await this.sql.end();
  }
}