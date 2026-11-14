const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongoServer = null;

/**
 * Connect to MongoDB with robust error handling and production enforcement.
 * In production (Render/Cloud), connects strictly to MongoDB Atlas via MONGO_URI.
 * In development, supports MONGO_URI, local MongoDB daemon, or dev in-memory fallback.
 */
const connectDB = async () => {
  // If already connected, do not re-connect
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  // Read MONGO_URI primary, support MONGODB_URI as secondary
  const configuredUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  // ── 1. Production Mode: MongoDB Atlas is strictly required ─────────────────
  if (isProduction) {
    if (!configuredUri) {
      const errMsg = 
        '\n========================================================================\n' +
        '❌ [DATABASE] FATAL: MONGO_URI is missing in production environment!\n' +
        '   A persistent MongoDB Atlas connection string is required for production.\n' +
        '   Please set MONGO_URI in your Render environment variables dashboard.\n' +
        '   Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority\n' +
        '========================================================================\n';
      console.error(errMsg);
      throw new Error('MONGO_URI environment variable is required in production.');
    }

    try {
      console.log('[DATABASE] 🔄 Connecting to MongoDB Atlas...');
      await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[DATABASE] ✅ Connected successfully to persistent MongoDB Atlas database: "${mongoose.connection.name}"`);
      return;
    } catch (atlasErr) {
      console.error('\n========================================================================');
      console.error('❌ [DATABASE] FAILED TO CONNECT TO MONGODB ATLAS:');
      console.error(`   Error: ${atlasErr.message}`);
      console.error('   Troubleshooting Checklist:');
      console.error('   1. Verify your IP Access List in MongoDB Atlas includes 0.0.0.0/0 (allow access from anywhere).');
      console.error('   2. Verify username and password in MONGO_URI (check for special characters requiring URL encoding).');
      console.error('   3. Ensure your database user has read/write privileges on the target database.');
      console.error('========================================================================\n');
      // DO NOT silently fall back to an in-memory database in production!
      throw atlasErr;
    }
  }

  // ── 2. Development Mode with configured URI ────────────────────────────────
  if (configuredUri) {
    try {
      console.log('[DATABASE] 🔄 Connecting to configured MongoDB...');
      await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DATABASE] ✅ Connected to MongoDB database: "${mongoose.connection.name}"`);
      return;
    } catch (err) {
      console.error(`[DATABASE] ❌ Configured MongoDB connection failed: ${err.message}`);
      throw err;
    }
  }

  // ── 3. Local Development daemon (mongodb://127.0.0.1:27017/smart_career_coach)
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/smart_career_coach';
  try {
    console.log(`[DATABASE] 🔄 Attempting connection to local MongoDB at ${defaultLocalUri}...`);
    await mongoose.connect(defaultLocalUri, { serverSelectionTimeoutMS: 1500 });
    console.log(`[DATABASE] ✅ Connected to local MongoDB daemon: ${defaultLocalUri}`);
    return;
  } catch (localErr) {
    console.warn(`[DATABASE] ℹ️ Local MongoDB daemon not running on port 27017.`);
  }

  // ── 4. Dev-only offline fallback (Local Windows/Dev only) ───────────────────
  try {
    console.warn('\n[DATABASE] ⚠️ Starting temporary in-memory database for local offline development.');
    console.warn('[DATABASE] ⚠️ Set MONGO_URI in .env to connect to your persistent MongoDB Atlas database.\n');
    const { MongoMemoryServer } = require('mongodb-memory-server');

    const serverOpts = {};
    if (process.platform === 'win32') {
      const localBin = path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-6.0.14.exe');
      if (fs.existsSync(localBin)) {
        serverOpts.binary = { systemBinary: localBin };
        process.env.MONGOMS_SYSTEM_BINARY = localBin;
      }
    }

    mongoServer = await MongoMemoryServer.create(serverOpts);
    const inMemoryUri = mongoServer.getUri();
    await mongoose.connect(inMemoryUri);
    console.log(`[DATABASE] ✅ Local In-Memory DB Online (URI: ${inMemoryUri})`);
  } catch (memErr) {
    console.error('[DATABASE] ❌ Failed to start local embedded database:', memErr.message);
    throw memErr;
  }
};

module.exports = connectDB;
