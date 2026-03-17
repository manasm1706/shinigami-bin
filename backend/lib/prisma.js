require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let _prisma = null;

function getPrisma() {
  if (!_prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Check backend/.env');

    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

module.exports = new Proxy({}, {
  get(_target, prop) {
    return getPrisma()[prop];
  }
});
