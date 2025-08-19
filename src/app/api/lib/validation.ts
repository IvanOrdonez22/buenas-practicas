import { NextResponse } from 'next/server';
import { ValidationResult } from '../types';

export class Validator {
  static validateRequiredFields(payload: any, fields: string[]): ValidationResult {
    const missingFields = fields.filter(field => payload[field] === undefined);
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: 'Missing required fields', missing: missingFields },
          { status: 400 }
        )
      };
    }
    return { isValid: true };
  }

  static validateFieldTypes(payload: any, fieldTypes: Record<string, string>): ValidationResult {
    const typeMismatches = Object.entries(fieldTypes)
      .filter(([field, expectedType]) => typeof payload[field] !== expectedType)
      .map(([field]) => field);

    if (typeMismatches.length > 0) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: 'Invalid data types', invalidFields: typeMismatches },
          { status: 400 }
        )
      };
    }
    return { isValid: true };
  }

  static validateLength(value: string, min: number, max: number, fieldName: string): ValidationResult {
    const length = value.trim().length;

    if (length < min) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: `${fieldName} too short`, minLength: min, currentLength: length },
          { status: 400 }
        )
      };
    }

    if (length > max) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: `${fieldName} too long`, maxLength: max, currentLength: length },
          { status: 400 }
        )
      };
    }

    return { isValid: true };
  }

  static validateAuthorName(author: string): ValidationResult {
    if (!/^[A-ZÁÉÍÓÚÑÜ]/.test(author)) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: 'Author name must start with capital letter' },
          { status: 400 }
        )
      };
    }

    if (!/^[A-Za-záéíóúñü'\-. ]+$/.test(author)) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: 'Author name contains invalid characters' },
          { status: 400 }
        )
      };
    }

    return { isValid: true };
  }
}