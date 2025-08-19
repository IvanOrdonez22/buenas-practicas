import { NextResponse } from 'next/server';

export class ResponseHandler {
  static success(data: any, message: string = 'Success') {
    return NextResponse.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(message: string, status: number = 500, details: any = {}) {
    return NextResponse.json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString()
    }, { status });
  }
}