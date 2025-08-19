import { NextResponse } from 'next/server';

export class GeneralValidators {
  // Validar campos requeridos
  static validateRequiredFields(payload: any, fields: string[]) {
    const missingFields = fields.filter(field => 
      payload[field] === undefined || 
      payload[field] === null || 
      payload[field] === ''
    );
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missing: missingFields,
          required: fields,
          message: 'All fields are mandatory'
        },
        { status: 400 }
      );
    }
    return null;
  }

  // Validar tipos de datos
  static validateFieldTypes(payload: any, fieldTypes: Record<string, string>) {
    const typeMismatches = Object.entries(fieldTypes)
      .filter(([field, expectedType]) => typeof payload[field] !== expectedType)
      .map(([field, expectedType]) => ({
        field,
        expected: expectedType,
        actual: typeof payload[field],
        value: payload[field]
      }));

    if (typeMismatches.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid data types',
          details: typeMismatches,
          message: 'All fields must be of the correct data type'
        },
        { status: 400 }
      );
    }
    return null;
  }

  // Validar que el payload no esté vacío
  static validatePayload(payload: any) {
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { 
          error: 'Empty request body',
          message: 'Request must contain valid JSON data'
        },
        { status: 400 }
      );
    }
    return null;
  }

  // Validar longitud máxima de campos
  static validateMaxLength(value: string, max: number, fieldName: string) {
    if (value && value.length > max) {
      return NextResponse.json(
        { 
          error: `${fieldName} exceeds maximum length`,
          field: fieldName,
          maxLength: max,
          currentLength: value.length,
          value: value
        },
        { status: 400 }
      );
    }
    return null;
  }

  // Validar longitud mínima de campos
  static validateMinLength(value: string, min: number, fieldName: string) {
    if (value && value.length < min) {
      return NextResponse.json(
        { 
          error: `${fieldName} is too short`,
          field: fieldName,
          minLength: min,
          currentLength: value.length,
          value: value
        },
        { status: 400 }
      );
    }
    return null;
  }
}