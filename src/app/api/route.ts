import { NextResponse, NextRequest } from 'next/server';
import postgres from 'postgres';

// Database connection configuration
interface DatabaseConfig {
  connectionString: string;
  schema: string;
  tableName: string;
}

const DB_CONFIG: DatabaseConfig = {
  connectionString: 'postgresql://postgres.gymwtqibtytjbhqteoyt:ivferkiro112206@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  schema: 'public',
  tableName: 'db_buenaspracticas'
};

// Data interfaces
interface SubmissionData {
  title: string;
  description: string;
  author: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: NextResponse;
}

interface DatabaseOperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Abstract database service
abstract class DatabaseService {
  protected sql: any;

  constructor(connectionString: string) {
    this.sql = postgres(connectionString);
  }

  abstract executeQuery(query: string, params?: any[]): Promise<DatabaseOperationResult>;
  abstract close(): Promise<void>;
}

// Concrete PostgreSQL implementation
class PostgresService extends DatabaseService {
  async executeQuery(query: string, params?: any[]): Promise<DatabaseOperationResult> {
    try {
      const result = await this.sql.unsafe(query, params);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

// Database repository for specific table operations
class SubmissionRepository {
  private dbService: DatabaseService;
  private config: DatabaseConfig;

  constructor(dbService: DatabaseService, config: DatabaseConfig) {
    this.dbService = dbService;
    this.config = config;
  }

  async ensureTableExists(): Promise<DatabaseOperationResult> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.config.schema}.${this.config.tableName} (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return await this.dbService.executeQuery(createTableQuery);
  }

  async insertSubmission(data: SubmissionData): Promise<DatabaseOperationResult> {
    const insertQuery = `
      INSERT INTO ${this.config.schema}.${this.config.tableName} 
        (title, description, author, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;

    const params = [data.title, data.description, data.author];
    return await this.dbService.executeQuery(insertQuery, params);
  }
}

// Validation strategies
interface ValidationStrategy {
  validate(data: any): ValidationResult;
}

class RequiredFieldsValidation implements ValidationStrategy {
  private fields: string[];

  constructor(fields: string[]) {
    this.fields = fields;
  }

  validate(payload: any): ValidationResult {
    const missingFields = this.fields.filter(field => payload[field] === undefined);
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: NextResponse.json(
          { 
            error: 'Missing required fields',
            missing: missingFields,
            required: this.fields 
          },
          { status: 400 }
        )
      };
    }
    return { isValid: true };
  }
}

class TypeValidation implements ValidationStrategy {
  private fieldTypes: Record<string, string>;

  constructor(fieldTypes: Record<string, string>) {
    this.fieldTypes = fieldTypes;
  }

  validate(payload: any): ValidationResult {
    const typeMismatches = Object.entries(this.fieldTypes)
      .filter(([field, expectedType]) => typeof payload[field] !== expectedType)
      .map(([field, expectedType]) => ({
        field,
        expected: expectedType,
        actual: typeof payload[field]
      }));

    if (typeMismatches.length > 0) {
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: 'Invalid data types',
            details: typeMismatches,
            message: 'All fields must be strings'
          },
          { status: 400 }
        )
      };
    }
    return { isValid: true };
  }
}

class LengthValidation implements ValidationStrategy {
  constructor(
    private field: string,
    private min: number,
    private max: number,
    private fieldName: string
  ) {}

  validate(payload: any): ValidationResult {
    const value = payload[this.field]?.trim() || '';
    const length = value.length;

    if (length < this.min) {
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: `${this.fieldName} too short`,
            currentLength: length,
            minimumRequired: this.min,
            providedValue: payload[this.field]
          },
          { status: 400 }
        )
      };
    }

    if (length > this.max) {
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: `${this.fieldName} exceeds maximum length`,
            currentLength: length,
            maximumAllowed: this.max,
            providedValue: payload[this.field]
          },
          { status: 400 }
        )
      };
    }

    return { isValid: true };
  }
}

// Validation orchestrator
class ValidationOrchestrator {
  private strategies: ValidationStrategy[];

  constructor(strategies: ValidationStrategy[]) {
    this.strategies = strategies;
  }

  validate(payload: any): ValidationResult {
    for (const strategy of this.strategies) {
      const result = strategy.validate(payload);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }
}

// Response factory
class ResponseFactory {
  static success(data: any, message: string = 'Operation completed successfully') {
    return NextResponse.json({
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(message: string, details: any = {}, status: number = 500) {
    return NextResponse.json({
      status: 'error',
      message,
      details,
      timestamp: new Date().toISOString()
    }, { status });
  }

  static validationError(errorDetails: any) {
    return NextResponse.json({
      status: 'validation_error',
      ...errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

// Main service orchestrator
class SubmissionService {
  private validationOrchestrator: ValidationOrchestrator;
  private repository: SubmissionRepository;

  constructor(validationOrchestrator: ValidationOrchestrator, repository: SubmissionRepository) {
    this.validationOrchestrator = validationOrchestrator;
    this.repository = repository;
  }

  async processSubmission(payload: any): Promise<NextResponse> {
    // Validación
    const validationResult = this.validationOrchestrator.validate(payload);
    if (!validationResult.isValid) {
      return validationResult.error!;
    }

    // Preparar datos
    const submissionData: SubmissionData = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      author: payload.author.trim()
    };

    // Asegurar que la tabla existe
    const tableResult = await this.repository.ensureTableExists();
    if (!tableResult.success) {
      return ResponseFactory.error('Database table setup failed', { detail: tableResult.error });
    }

    // Insertar datos
    const insertResult = await this.repository.insertSubmission(submissionData);
    if (!insertResult.success) {
      return ResponseFactory.error('Database insertion failed', { detail: insertResult.error });
    }

    // Respuesta exitosa
    return ResponseFactory.success({
      insertedId: insertResult.data[0].id,
      submission: submissionData
    }, 'Data validated and inserted successfully');
  }
}

// Factory for service creation
class ServiceFactory {
  static createSubmissionService(config: DatabaseConfig): SubmissionService {
    // Crear servicios de base de datos
    const dbService = new PostgresService(config.connectionString);
    const repository = new SubmissionRepository(dbService, config);

    // Configurar validaciones
    const validationStrategies: ValidationStrategy[] = [
      new RequiredFieldsValidation(['title', 'description', 'author']),
      new TypeValidation({ title: 'string', description: 'string', author: 'string' }),
      new LengthValidation('title', 5, 100, 'Title'),
      new LengthValidation('description', 5, 1000, 'Description'),
      // Puedes agregar más validaciones aquí
    ];

    const validationOrchestrator = new ValidationOrchestrator(validationStrategies);

    return new SubmissionService(validationOrchestrator, repository);
  }
}

// Handler principal
export async function POST(request: NextRequest) {
  let submissionService: SubmissionService | null = null;

  try {
    const requestBody = await request.json();

    // Crear servicio usando factory
    submissionService = ServiceFactory.createSubmissionService(DB_CONFIG);

    // Procesar submission
    return await submissionService.processSubmission(requestBody);

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return ResponseFactory.error(
      'Unexpected processing error',
      { detail: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}