// Shared setup for the API tests. Each test file gets its own in-memory MongoDB,
// so tests never touch a real database and can run anywhere, including CI.
import { after, before, beforeEach } from 'node:test';

import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

let mongod;
let app;
let models;

/** Starts the database and the app once per test file and wipes data between tests. */
export function useTestApp() {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    // Imported only now, so config.js sees the test environment variables above.
    ({ default: app } = await import('../src/app.js'));
    models = await import('../src/models/index.js');
    await mongoose.connect(mongod.getUri());
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  return {
    get app() {
      return app;
    },
    get models() {
      return models;
    },
  };
}

let userCounter = 0;

/**
 * Creates a user (with an active subscription unless `subscribed` is false)
 * and returns a supertest agent that is logged in as them.
 */
export async function loginAs(app, { role = 'user', subscribed = true } = {}) {
  const { User, Subscription } = await import('../src/models/index.js');
  userCounter += 1;
  const email = `user${userCounter}@example.com`;
  const password = 'secret123';

  const user = await User.create({
    name: `User ${userCounter}`,
    username: `user${userCounter}`,
    email,
    role,
    password: await bcrypt.hash(password, 4),
  });
  if (subscribed) {
    await Subscription.create({
      userId: user._id,
      stripesubscriptionId: `test_${userCounter}`,
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return { agent, user, email, password };
}

/** Creates a product owned by `agent`'s user through the API. */
export async function createProduct(agent, fields = {}) {
  const { body } = await agent
    .post('/api/user/products')
    .send({ productName: 'Rice 5kg', ...fields })
    .expect(201);
  return body;
}

/** Adds stock to a product the normal way: create a purchase, then approve it. */
export async function stockUp(agent, product, quantity) {
  const { body: category } = await agent
    .post('/api/user/category')
    .send({ name: 'Groceries' })
    .expect(201);
  const { body: supplier } = await agent
    .post('/api/user/supplier')
    .send({ name: 'Acme', email: `acme${Date.now()}@example.com`, phone: 999, address: 'Main St' })
    .expect(201);

  const { body: purchases } = await agent
    .post('/api/user/purchases')
    .send([
      {
        purchaseNo: 'P-1',
        supplierName: supplier._id,
        selectedCategory: category._id,
        selectedProduct: product._id,
        startDate: new Date().toISOString(),
        quantity,
        unitPrice: 10,
        description: 'Initial stock',
        totalPrice: quantity * 10,
      },
    ])
    .expect(201);

  await agent.put(`/api/user/purchases/${purchases[0]._id}`).expect(200);
  return { category, supplier, purchase: purchases[0] };
}

/** Creates a pending invoice for a new customer. */
export async function createInvoice(agent, { product, category, quantity, total, status, paid }) {
  const { body } = await agent
    .post('/api/user/invoice')
    .send({
      date: new Date().toISOString(),
      description: 'Counter sale',
      grandTotal: total,
      partialAmount: paid ?? 0,
      status,
      selectedCustomer: 'new_customer',
      name: 'Walk-in',
      email: `walkin${Date.now()}${Math.random()}@example.com`,
      phone: 12345,
      purchaseData: [
        {
          selectedProduct: product._id,
          selectedCategory: category._id,
          startDate: new Date().toISOString(),
          quantity,
          unitPrice: total / quantity,
          totalPrice: total,
        },
      ],
    })
    .expect(201);
  return body;
}
