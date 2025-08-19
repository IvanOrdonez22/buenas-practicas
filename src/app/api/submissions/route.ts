import { NextRequest } from 'next/server';
import { DatabaseService } from '../lib/database';
import { ResponseHandler } from '../lib/responses';
import { GeneralValidators } from '../lib/validation/generalValidator';
import { TitleValidator, DescriptionValidator, AuthorValidator } from '../lib/validation';

export async function POST(request: NextRequest) {
  let db: DatabaseService | null = null;

  try {
    const data = await request.json();

    // Validación de campos requeridos
    const requiredCheck = GeneralValidators.validateRequiredFields(data, ['title', 'description', 'author']);
    if (requiredCheck) return requiredCheck;

    // Validación de tipos de datos
    const typeCheck = GeneralValidators.validateFieldTypes(data, { 
      title: 'string', 
      description: 'string', 
      author: 'string' 
    });
    if (typeCheck) return typeCheck;

    // Validaciones específicas por campo
    const titleValidation = TitleValidator.validate(data.title);
    if (titleValidation) return titleValidation;

    const descriptionValidation = DescriptionValidator.validate(data.description);
    if (descriptionValidation) return descriptionValidation;

    const authorValidation = AuthorValidator.validate(data.author);
    if (authorValidation) return authorValidation;

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
      title: submissionData.title,
      description: submissionData.description,
      author: submissionData.author
    }, 'Data validated and saved successfully');

  } catch (error) {
    console.error('Server error:', error);
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
  return ResponseHandler.success(
    { endpoint: '/api/submissions', method: 'POST' },
    'Submit data using POST method with title, description, and author fields'
  );
}