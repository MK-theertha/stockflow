import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loginAs, useTestApp } from './helpers.js';

const ctx = useTestApp();

const rent = { date: '2026-11-01', category: 'Rent', amount: 15000, paidTo: 'Landlord' };

describe('expenses', () => {
  it('creates, lists, updates and deletes an expense', async () => {
    const { agent } = await loginAs(ctx.app);

    const { body: created } = await agent.post('/api/user/expenses').send(rent).expect(201);
    assert.equal(created.amount, 15000);

    const { body: list } = await agent.get('/api/user/expenses').expect(200);
    assert.equal(list.length, 1);

    const { body: updated } = await agent
      .put(`/api/user/expenses/${created._id}`)
      .send({ ...rent, amount: 16000 })
      .expect(200);
    assert.equal(updated.amount, 16000);

    await agent.delete(`/api/user/expenses/${created._id}`).expect(200);
    const { body: empty } = await agent.get('/api/user/expenses').expect(200);
    assert.equal(empty.length, 0);
  });

  it('validates the category and amount', async () => {
    const { agent } = await loginAs(ctx.app);
    const { body } = await agent
      .post('/api/user/expenses')
      .send({ ...rent, category: 'Holidays' })
      .expect(400);
    assert.match(body.err, /category/);
    await agent
      .post('/api/user/expenses')
      .send({ ...rent, amount: -5 })
      .expect(400);
  });

  it("hides one shop's expenses from another", async () => {
    const { agent: shopA } = await loginAs(ctx.app);
    const { agent: shopB } = await loginAs(ctx.app);
    const { body: expense } = await shopA.post('/api/user/expenses').send(rent).expect(201);

    const { body: listB } = await shopB.get('/api/user/expenses').expect(200);
    assert.equal(listB.length, 0);
    await shopB.delete(`/api/user/expenses/${expense._id}`).expect(404);
  });

  it('shows this month on the dashboard', async () => {
    const { agent } = await loginAs(ctx.app);
    await agent
      .post('/api/user/expenses')
      .send({ ...rent, date: new Date().toISOString() })
      .expect(201);

    const { body } = await agent.get('/api/user/dashboard').expect(200);
    assert.equal(body.expenses.thisMonth.total, 15000);
  });
});
