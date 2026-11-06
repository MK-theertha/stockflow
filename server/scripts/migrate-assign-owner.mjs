// One-off migration for per-user data.
//
// Records created before per-user scoping have no `userId`, so nobody can see them.
// This assigns all of them to one existing user and replaces the old global
// unique email indexes with per-user ones.
//
// Usage:
//   node --env-file=.env scripts/migrate-assign-owner.mjs owner@example.com
//
// Safe to run more than once: it only touches records that have no owner yet.
import mongoose from 'mongoose';

const OWNED_COLLECTIONS = [
  'categories',
  'units',
  'suppliers',
  'customers',
  'products',
  'purchases',
  'invoices',
  'invoicedetails',
  'payments',
  'paymentdetails',
];

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node --env-file=.env scripts/migrate-assign-owner.mjs <owner-email>');
  process.exit(1);
}
if (!process.env.DB_URI) {
  console.error('DB_URI is not set. Pass --env-file=.env.');
  process.exit(1);
}

await mongoose.connect(process.env.DB_URI);
const db = mongoose.connection.db;

try {
  const owner = await db.collection('users').findOne({ email });
  if (!owner) throw new Error(`No user with email ${email}`);
  console.warn(`Assigning unowned records to ${owner.name} <${owner.email}> (${owner._id})`);

  for (const name of OWNED_COLLECTIONS) {
    const { modifiedCount } = await db
      .collection(name)
      .updateMany({ userId: { $exists: false } }, { $set: { userId: owner._id } });
    console.warn(`  ${name}: ${modifiedCount} updated`);
  }

  // Emails used to be unique across all shops; they are now unique per shop.
  for (const name of ['customers', 'suppliers']) {
    const collection = db.collection(name);
    const indexes = await collection.indexes().catch(() => []);
    if (indexes.some((index) => index.name === 'email_1')) {
      await collection.dropIndex('email_1');
      console.warn(`  ${name}: dropped global email index`);
    }
    await collection.createIndex({ userId: 1, email: 1 }, { unique: true });
  }

  // Order.transactionId is now unique so a payment cannot be redeemed twice.
  const duplicates = await db
    .collection('orders')
    .aggregate([
      { $group: { _id: '$transactionId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
  if (duplicates.length) {
    console.warn(
      `  orders: ${duplicates.length} transaction ids were redeemed more than once. ` +
        'Remove the duplicates so the unique index can be built:',
      duplicates.map((d) => d._id)
    );
  } else {
    await db.collection('orders').createIndex({ transactionId: 1 }, { unique: true });
  }

  console.warn('Done.');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
