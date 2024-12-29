const mongoose = require("mongoose");

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tcgp-test"
  );
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map(async (collection) =>
      collection.deleteMany()
    )
  );
});
