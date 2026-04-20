const bcrypt = require('bcryptjs');

const hash = async (plain) => {
  return await bcrypt.hash(plain, 10);
};

const compare = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

module.exports = { hash, compare };
