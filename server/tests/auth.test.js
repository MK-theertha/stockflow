import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';

import { loginAs, useTestApp } from './helpers.js';

const ctx = useTestApp();

describe('auth', () => {
  it('registers, logs in, reads the session and logs out', async () => {
    const agent = request.agent(ctx.app);
    const email = 'a.very.long.email.address@example.com';

    await agent
      .post('/api/register')
      .send({ name: 'Shop Owner', email, password: 'secret123' })
      .expect(201);

    const { body: login } = await agent
      .post('/api/auth/login')
      .send({ email, password: 'secret123' })
      .expect(200);
    assert.equal(login.user.email, email);
    assert.ok(login.user.username.length <= 20);

    const { body: session } = await agent.get('/api/auth/session').expect(200);
    assert.equal(session.user.role, 'user');

    await agent.post('/api/auth/logout').expect(200);
    const { body: after } = await agent.get('/api/auth/session').expect(200);
    assert.equal(after.user, null);
  });

  it('rejects a wrong password with the same message as an unknown email', async () => {
    const { email } = await loginAs(ctx.app);
    const wrong = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email, password: 'nope' })
      .expect(401);
    const unknown = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'nope' })
      .expect(401);
    assert.equal(wrong.body.err, unknown.body.err);
  });

  it('rejects duplicate emails', async () => {
    const { email } = await loginAs(ctx.app);
    const { body } = await request(ctx.app)
      .post('/api/register')
      .send({ name: 'Copycat', email, password: 'secret123' })
      .expect(409);
    assert.match(body.err, /email/);
  });

  it('protects routes by login, subscription and role', async () => {
    await request(ctx.app).get('/api/user/category').expect(401);

    const { agent: unsubscribed } = await loginAs(ctx.app, { subscribed: false });
    await unsubscribed.get('/api/user/category').expect(402);
    await unsubscribed.get('/api/user/orders').expect(200);

    const { agent: user } = await loginAs(ctx.app);
    await user.get('/api/user/category').expect(200);
    await user.get('/api/admin').expect(403);

    const { agent: admin } = await loginAs(ctx.app, { role: 'admin', subscribed: false });
    await admin.get('/api/admin').expect(200);
    await admin.get('/api/user/category').expect(200);
  });

  it('ignores a tampered session cookie', async () => {
    const { body } = await request(ctx.app)
      .get('/api/auth/session')
      .set('Cookie', 'stockflow_session=not.a.jwt')
      .expect(200);
    assert.equal(body.user, null);
  });

  it('updates the profile and changes the password', async () => {
    const { agent, email } = await loginAs(ctx.app);

    const { body: profile } = await agent
      .put('/api/user/profile')
      .send({ name: 'New Name', phone: '12345' })
      .expect(200);
    assert.equal(profile.name, 'New Name');
    const { body: session } = await agent.get('/api/auth/session');
    assert.equal(session.user.name, 'New Name');

    await agent
      .post('/api/user/change-password')
      .send({ oldPassword: 'wrong', newPassword: 'newsecret' })
      .expect(400);
    await agent
      .post('/api/user/change-password')
      .send({ oldPassword: 'secret123', newPassword: 'newsecret' })
      .expect(200);
    await request(ctx.app)
      .post('/api/auth/login')
      .send({ email, password: 'newsecret' })
      .expect(200);
  });
});
