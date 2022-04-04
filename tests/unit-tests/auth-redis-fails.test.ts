import 'jest';
import * as controller from '../../src/controller/ldap';
const sha1Hash = require('sha1'); // check: should we update this?
import { AndesCache } from '@andes/core';

const cacheResponse = 'notFound';

jest.mock('@andes/core', () => ({
  AndesCache: jest.fn().mockImplementation(() => ({
    get: (str) => Promise.reject(cacheResponse),
  })),
}));

describe('Auth - Redis - Not Cached', () => {
  it('Find user in Redis (not cached)', () => {
    const user = 'test';
    const pass = 'pass';
    const hashedPassword = sha1Hash(user + pass);
    const isReacheable = jest.fn((server) => Promise.resolve(false));
    return expect(controller.checkPassword(user, pass)).resolves.toBe(null);
  });
});
