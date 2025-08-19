import { NextResponse } from 'next/server';

export class DescriptionValidator {
  static validate(description: string) {
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedDesc = description.trim();
    const length = trimmedDesc.length;

    if (length === 0) {
      return NextResponse.json(
        { error: 'Description cannot be empty or whitespace only' },
        { status: 400 }
      );
    }

    if (length < 5) {
      return NextResponse.json(
        { 
          error: 'Description too short',
          minLength: 5,
          currentLength: length,
          value: description
        },
        { status: 400 }
      );
    }

    if (length > 1000) {
      return NextResponse.json(
        { 
          error: 'Description too long',
          maxLength: 1000,
          currentLength: length,
          value: description
        },
        { status: 400 }
      );
    }

    return null;
  }
}