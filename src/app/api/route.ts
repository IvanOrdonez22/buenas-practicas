import { NextResponse, NextRequest } from 'next/server';
import postgres from 'postgres';

// Database connection configuration
const DB_CONFIG = {
  connectionString: 'postgresql://postgres.gymwtqibtytjbhqteoyt:ivferkiro112206@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  tableName: 'submissions'
};

class DataValidator {
  static checkRequiredFields(payload: any) {
    const mandatoryFields = ['title', 'description', 'author'];
    const missingFields = mandatoryFields.filter(field => payload[field] === undefined);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missing: missingFields,
          required: mandatoryFields 
        },
        { status: 400 }
      );
    }
    return null;
  }

  static verifyFieldTypes(payload: any) {
    const typeRequirements = {
      title: 'string',
      description: 'string', 
      author: 'string'
    };

    const typeMismatches = Object.entries(typeRequirements)
      .filter(([field, expectedType]) => typeof payload[field] !== expectedType)
      .map(([field, expectedType]) => ({
        field,
        expected: expectedType,
        actual: typeof payload[field]
      }));

    if (typeMismatches.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid data types',
          details: typeMismatches,
          message: 'All fields must be strings'
        },
        { status: 400 }
      );
    }
    return null;
  }

  static evaluateTitle(titleValue: string) {
    const cleanTitle = titleValue.trim();
    const titleLength = cleanTitle.length;

    if (titleLength < 5) {
      return NextResponse.json(
        {
          error: 'Title too short',
          currentLength: titleLength,
          minimumRequired: 5,
          providedValue: titleValue
        },
        { status: 400 }
      );
    }

    if (titleLength > 100) {
      return NextResponse.json(
        {
          error: 'Title exceeds maximum length',
          currentLength: titleLength,
          maximumAllowed: 100,
          providedValue: titleValue
        },
        { status: 400 }
      );
    }

    return null;
  }

  static assessDescription(descContent: string) {
    const processedDesc = descContent.trim();
    const descLength = processedDesc.length;

    if (descLength === 0) {
      return NextResponse.json(
        {
          error: 'Description cannot be empty',
          providedValue: descContent
        },
        { status: 400 }
      );
    }

    if (descLength < 5) {
      return NextResponse.json(
        {
          error: 'Description too short',
          currentCharacters: descLength,
          requiredMinimum: 5,
          missingCharacters: 5 - descLength
        },
        { status: 400 }
      );
    }

    if (descLength > 1000) {
      return NextResponse.json(
        {
          error: 'Description too long',
          currentCharacters: descLength,
          characterLimit: 1000,
          excessCharacters: descLength - 1000
        },
        { status: 400 }
      );
    }

    return null;
  }

  static inspectAuthorName(authorName: string) {
    const validationIssues: string[] = [];
    const namePatterns = {
      capitalStart: /^[A-ZÁÉÍÓÚÑÜ]/,
      validCharacters: /^[A-Za-záéíóúñü'\-. ]+$/,
      nameFormat: /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'\-.]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'\-.]+)*$/
    };

    if (!namePatterns.capitalStart.test(authorName)) {
      validationIssues.push('Must start with capital letter');
    }

    if (!namePatterns.validCharacters.test(authorName)) {
      validationIssues.push('Contains invalid characters');
    }

    if (!namePatterns.nameFormat.test(authorName)) {
      validationIssues.push('Invalid name format');
    }

    if (authorName.replace(/[^a-záéíóúñü]/gi, '').length < 2) {
      validationIssues.push('Name too short');
    }

    if (validationIssues.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid author name',
          detectedIssues: validationIssues,
          providedName: authorName,
          suggestions: [
            'Use proper capitalization',
            'Only use letters, spaces, hyphens, and apostrophes',
            'Example: "John-Doe Smith"'
          ]
        },
        { status: 400 }
      );
    }

    return null;
  }
}

class DatabaseService {
  private sql: any;

  constructor() {
    this.sql = postgres(DB_CONFIG.connectionString);
  }

  async storeSubmission(data: { title: string; description: string; author: string; }) {
    try {
      const result = await this.sql`
        INSERT INTO ${this.sql(DB_CONFIG.tableName)} 
          (title, description, author, created_at)
        VALUES 
          (${data.title}, ${data.description}, ${data.author}, NOW())
        RETURNING id
      `;
      
      return result[0].id;
    } catch (error) {
      console.error('Database insertion error:', error);
      throw new Error('Failed to store data in database');
    }
  }

  async closeConnection() {
    await this.sql.end();
  }
}

// POST con validaciones + insert
export async function POST(request: NextRequest) {
  let dbService: DatabaseService | null = null;

  try {
    const requestBody = await request.json();

    // Validaciones
    const requiredCheck = DataValidator.checkRequiredFields(requestBody);
    if (requiredCheck) return requiredCheck;

    const typeCheck = DataValidator.verifyFieldTypes(requestBody);
    if (typeCheck) return typeCheck;

    const titleValidation = DataValidator.evaluateTitle(requestBody.title);
    if (titleValidation) return titleValidation;

    const descValidation = DataValidator.assessDescription(requestBody.description);
    if (descValidation) return descValidation;

    const authorValidation = DataValidator.inspectAuthorName(requestBody.author);
    if (authorValidation) return authorValidation;

    // Insert en la BD
    dbService = new DatabaseService();
    const submissionId = await dbService.storeSubmission({
      title: requestBody.title.trim(),
      description: requestBody.description.trim(),
      author: requestBody.author.trim()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Data validated and stored successfully',
      submissionId,
      data: {
        title: requestBody.title,
        description: requestBody.description,
        author: requestBody.author
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Processing failed',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (dbService) await dbService.closeConnection();
  }
}

export async function GET() {
  const dbService = new DatabaseService();
  try {
    const newId = await dbService.storeSubmission({
      title: "Título de prueba",
      description: "Descripción de prueba para GET",
      author: "Pedro López"
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Inserción directa realizada',
      id: newId
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falló el insert', detail: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await dbService.closeConnection();
  }
}
