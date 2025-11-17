import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../server.js';
import User from '../src/models/user.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { dbName: 'test-db' });

  // Seed a few users
  await User.create([
    { name: 'Provider A', role: 'provider', categories: ['plumber'], providerType: 'individual' },
    { name: 'Provider B', role: 'provider', categories: ['electrician'], providerType: 'company' },
    { name: 'Client X', role: 'client' },
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

describe('GET /api/v1/providers', () => {
  it('returns only providers (role=provider)', async () => {
    const res = await request(app).get('/api/v1/providers');
    expect(res.statusCode).toBe(200);
    // Should not include the client
    expect(res.body.length).toBe(2);
    expect(res.body.every((p) => p.role === 'provider')).toBe(true);
  });

  it('filters by category (case-insensitive)', async () => {
    const res = await request(app).get('/api/v1/providers?category=PlUmB');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Provider A');
  });

  it('filters by providerType', async () => {
    const res = await request(app).get('/api/v1/providers?providerType=company');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Provider B');
  });
});
