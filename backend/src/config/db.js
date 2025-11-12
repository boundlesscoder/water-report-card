import pkg from 'pg';
import { DATABASE_URL } from './envConfig.js';

const { Pool } = pkg;

if(!DATABASE_URL){
    throw new Error('DATABASE_URL environment variable is not set.');
}

export const db = new Pool({
    connectionString: DATABASE_URL,
    // Set the search path to include core and audit schemas
    options: '-c search_path=core,audit,public'
});