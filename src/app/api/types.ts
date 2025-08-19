export interface DatabaseConfig {
  connectionString: string;
  schema: string;
  tableName: string;
}

export interface SubmissionData {
  title: string;
  description: string;
  author: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: any;
}