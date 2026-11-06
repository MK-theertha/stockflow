import app from './app.js';
import { assertConfig, config } from './config.js';
import dbConnect from './lib/db.js';

try {
  assertConfig();
  await dbConnect();
  app.listen(config.port, () => console.warn(`API listening on http://localhost:${config.port}`));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
