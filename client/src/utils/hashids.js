import Hashids from 'hashids';

const hashids = new Hashids('your-very-secret-salt', 10);

export const encodeId = (id) => hashids.encodeHex(id.toString());
export const decodeId = (hash) => hashids.decodeHex(hash);