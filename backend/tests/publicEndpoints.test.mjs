import request from 'supertest';
import { app } from '../server.js';

describe('Public API endpoints', () => {
  it('GET / should return SkillConnect API text', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('SkillConnect API');
  });

  it('GET /api/v1/news should return items array', async () => {
    const res = await request(app).get('/api/v1/news');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/v1/posts should return items array', async () => {
    const res = await request(app).get('/api/v1/posts');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/v1/blog should return items array', async () => {
    const res = await request(app).get('/api/v1/blog');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
