import { NextResponse } from 'next/server';

export class AuthorValidator {
  static validate(author: string) {
    if (!author || typeof author !== 'string') {
      return NextResponse.json(
        { error: 'Author is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedAuthor = author.trim();

    if (!/^[A-ZÁÉÍÓÚÑÜ]/.test(trimmedAuthor)) {
      return NextResponse.json(
        { 
          error: 'Author name must start with a capital letter',
          value: author,
          suggestion: 'Example: "John Smith"'
        },
        { status: 400 }
      );
    }

    if (!/^[A-Za-záéíóúñü'\-. ]+$/.test(trimmedAuthor)) {
      return NextResponse.json(
        { 
          error: 'Author name contains invalid characters',
          value: author,
          allowed: 'Letters, spaces, hyphens, apostrophes, and dots only'
        },
        { status: 400 }
      );
    }

    if (trimmedAuthor.replace(/[^a-záéíóúñü]/gi, '').length < 2) {
      return NextResponse.json(
        { 
          error: 'Author name is too short',
          value: author,
          minLetters: 2
        },
        { status: 400 }
      );
    }

    return null;
  }
}