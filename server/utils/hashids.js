const Hashids = require('hashids/cjs');
const hashids = new Hashids('your-very-secret-salt', 10);

exports.encodeId = (id) => hashids.encodeHex(id.toString());
exports.decodeId = (hash) => hashids.decodeHex(hash);