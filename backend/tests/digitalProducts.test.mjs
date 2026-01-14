import mongoose from 'mongoose';
import { jest, expect, describe, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../server.js';
import User from '../src/models/user.js';
import DigitalProduct from '../src/models/digitalProduct.js';
import DigitalPurchase from '../src/models/digitalPurchase.js';
import Transaction from '../src/models/transaction.js';
import jwt from 'jsonwebtoken';

let mongo;
let sellerToken;
let buyerToken;
let sellerId;
let buyerId;

// Mock global fetch for Paystack
global.fetch = jest.fn();

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: 'test-db-digital' });

    // Secrets
    process.env.JWT_SECRET = 'test-secret';
    process.env.PAYSTACK_SECRET_KEY = 'test-paystack-key';

    // Create Users
    const seller = await User.create({
        name: 'Seller One',
        email: 'seller@example.com',
        password: 'password123',
        role: 'provider',
        providerMode: 'product'
    });
    sellerId = seller._id;
    sellerToken = jwt.sign({ _id: seller._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const buyer = await User.create({
        name: 'Buyer One',
        email: 'buyer@example.com',
        password: 'password123',
        role: 'client'
    });
    buyerId = buyer._id;
    buyerToken = jwt.sign({ _id: buyer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongo) await mongo.stop();
});

describe('Digital Products Module', () => {
    let productId;

    it('Seller can upload a digital product', async () => {
        // We need to attach a file. 
        // supertest .attach works with paths or buffers.
        // We can create a dummy buffer.
        const buffer = Buffer.from('dummy pdf content');

        const res = await request(app)
            .post('/api/digital-products')
            .set('Authorization', `Bearer ${sellerToken}`)
            .field('name', 'E-Book 101')
            .field('description', 'Learn everything')
            .field('price', '5000')
            .attach('file', buffer, 'ebook.pdf');

        const fs = await import('fs');
        fs.writeFileSync('debug_error.txt', `Status: ${res.statusCode}\nBody: ${JSON.stringify(res.body, null, 2)}\n`);

        expect(res.statusCode).toBe(201);
        expect(res.body.product).toBeDefined();
        expect(res.body.product.name).toBe('E-Book 101');
        expect(res.body.product.fileKey).toBeDefined();

        productId = res.body.product._id;
    });

    it('Public can list products', async () => {
        const res = await request(app).get('/api/digital-products');
        expect(res.statusCode).toBe(200);
        expect(res.body.products.length).toBeGreaterThan(0);
        expect(res.body.products[0]._id).toBe(productId);
    });

    it('Buyer can initiate purchase', async () => {
        // Mock Paystack Initialize
        fetch.mockResolvedValueOnce({
            json: async () => ({
                status: true,
                data: { authorization_url: 'http://paystack.com/checkout', reference: 'ref-12345' }
            })
        });

        const res = await request(app)
            .post(`/api/digital-products/${productId}/buy`)
            .set('Authorization', `Bearer ${buyerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.reference).toBe('ref-12345');

        // Valid transaction created
        const tx = await Transaction.findOne({ providerReference: 'ref-12345' });
        expect(tx).toBeDefined();
        expect(tx.status).toBe('pending');
    });

    it('Buyer verifies payment', async () => {
        // Mock Paystack Verify
        fetch.mockResolvedValueOnce({
            json: async () => ({
                status: true,
                data: { status: 'success', amount: 500000, reference: 'ref-12345' }
            })
        });

        const res = await request(app)
            .get(`/api/digital-products/payments/verify/ref-12345`)
            .set('Authorization', `Bearer ${buyerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('paid');

        // Check Purchase Record
        const purchase = await DigitalPurchase.findOne({ buyerId: buyerId, productId: productId });
        expect(purchase).toBeDefined();
        expect(purchase.accessStatus).toBe('active');
    });

    it('Buyer can download file', async () => {
        const purchase = await DigitalPurchase.findOne({ buyerId: buyerId, productId: productId });

        const res = await request(app)
            .get(`/api/digital-products/purchase/${purchase._id}/download`)
            .set('Authorization', `Bearer ${buyerToken}`);

        expect(res.statusCode).toBe(302);
        expect(res.header['location']).toBeDefined();
    });

    it('Download blocked if access revoked', async () => {
        const purchase = await DigitalPurchase.findOne({ buyerId: buyerId, productId: productId });
        purchase.accessStatus = 'revoked';
        await purchase.save();

        const res = await request(app)
            .get(`/api/digital-products/purchase/${purchase._id}/download`)
            .set('Authorization', `Bearer ${buyerToken}`);

        expect(res.statusCode).toBe(403);
    });
});
