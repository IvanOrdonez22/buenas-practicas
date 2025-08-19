import { NextRequest } from 'next/server';
import { DatabaseService } from '../lib/database';
import { Validator } from '../lib/validation';
import { ResponseHandler } from '../lib/responses';

export async function POST(request: NextRequest) {
  let db: DatabaseService | null = null;

  try {
    const data = await request.json();

    // Validaciones
    const requiredCheck = Validator.validateRequiredFields(data, ['title', 'description', 'author']);
    if (!requiredCheck.isValid) return requiredCheck.error;

    const typeCheck = Validator.validateFieldTypes(data, { 
      title: 'string', description: 'string', author: 'string' 
    });
    if (!typeCheck.isValid) return typeCheck.error;

    const titleCheck = Validator.validateLength(data.title, 5, 100, 'Title');
    if (!titleCheck.isValid) return titleCheck.error;

    const descCheck = Validator.validateLength(data.description, 5, 1000, 'Description');
    if (!descCheck.isValid) return descCheck.error;

    const authorCheck = Validator.validateAuthorName(data.author);
    if (!authorCheck.isValid) return authorCheck.error;

    // Procesar datos
    const submissionData = {
      title: data.title.trim(),
      description: data.description.trim(),
      author: data.author.trim()
    };

    // Base de datos
    db = new DatabaseService();
    await db.ensureTableExists();
    const insertedId = await db.insertSubmission(submissionData);

    return ResponseHandler.success({
      id: insertedId,
      ...submissionData
    }, 'Data saved successfully');

  } catch (error) {
    console.error('Error:', error);
    return ResponseHandler.error(
      'Internal server error',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  } finally {
    if (db) await db.close();
  }
}

export async function GET() {
  return ResponseHandler.success({}, 'API is working');
}