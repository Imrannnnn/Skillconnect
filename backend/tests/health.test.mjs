import request from 'supertest';
import { app } from '../server.js';

describe('Health endpoint', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
