import request from 'supertest';
import { app } from '../server.js';

describe('Payments and legacy endpoints', () => {
  it('GET /api/v1/payment should return ok true', async () => {
    const res = await request(app).get('/api/v1/payment');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /api/v1/payments should return ok true', async () => {
    const res = await request(app).get('/api/v1/payments');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /api/v1/requests should return deprecated message', async () => {
    const res = await request(app).get('/api/v1/requests');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'deprecated');
  });
});
