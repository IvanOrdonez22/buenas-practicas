import { NextResponse, NextRequest } from 'next/server';

class DataValidator {
  static checkRequiredFields(payload: any) {
    const mandatoryFields = ['title', 'description', 'author'];
    const missingFields = mandatoryFields.filter(field => payload[field] === undefined);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          validationError: 'Campos obligatorios faltantes',
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
          validationError: 'Tipos de datos incorrectos',
          details: typeMismatches,
          message: 'Todos los campos deben ser texto'
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
          validationError: 'Título demasiado corto',
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
          validationError: 'Título excede longitud máxima',
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
          validationError: 'Descripción no puede estar vacía',
          providedValue: descContent
        },
        { status: 400 }
      );
    }

    if (descLength < 5) {
      return NextResponse.json(
        {
          validationError: 'Descripción insuficiente',
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
          validationError: 'Descripción demasiado extensa',
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
      validationIssues.push('Debe comenzar con mayúscula');
    }

    if (!namePatterns.validCharacters.test(authorName)) {
      validationIssues.push('Contiene caracteres no permitidos');
    }

    if (!namePatterns.nameFormat.test(authorName)) {
      validationIssues.push('Formato de nombre incorrecto');
    }

    if (authorName.replace(/[^a-záéíóúñü]/gi, '').length < 2) {
      validationIssues.push('Nombre muy corto');
    }

    if (validationIssues.length > 0) {
      return NextResponse.json(
        {
          validationError: 'Nombre de autor inválido',
          detectedIssues: validationIssues,
          providedName: authorName,
          recommendations: [
            'Usar mayúscula inicial',
            'Solo letras, espacios, guiones y apóstrofes',
            'Ejemplo: "Ana-María López"'
          ]
        },
        { status: 400 }
      );
    }

    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();

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

    console.log('Datos validados correctamente:', {
      titulo: requestBody.title,
      descripcion: requestBody.description,
      autor: requestBody.author
    });

    return NextResponse.json({
      estado: 'éxito',
      mensaje: 'Validación completada satisfactoriamente',
      datos: {
        titulo: requestBody.title,
        descripcion: requestBody.description,
        autor: requestBody.author
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Payload JSON inválido',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 400 }
    );
  }
}