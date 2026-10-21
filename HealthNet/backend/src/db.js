const mongoose = require("mongoose");
const env = require("./config/env");

async function connectDatabase() {
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = connectDatabase;
