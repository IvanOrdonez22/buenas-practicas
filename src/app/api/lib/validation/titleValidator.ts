import { NextResponse } from 'next/server';

export class TitleValidator {
  static validate(title: string) {
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    const length = trimmedTitle.length;

    if (length < 5) {
      return NextResponse.json(
        { 
          error: 'Title too short',
          minLength: 5,
          currentLength: length,
          value: title
        },
        { status: 400 }
      );
    }

    if (length > 100) {
      return NextResponse.json(
        { 
          error: 'Title too long',
          maxLength: 100,
          currentLength: length,
          value: title
        },
        { status: 400 }
      );
    }

    return null;
  }
}