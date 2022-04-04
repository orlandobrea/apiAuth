import 'jest';
import * as controller from '../../src/controller/ldap';
const sha1Hash = require('sha1'); // check: should we update this?
import { AndesCache } from '@andes/core';

const cacheResponse = {
  nombre: 'userName',
  apellido: 'userLastName',
  email: 'user@mail.com',
  telefono: '123456',
  du: 'user1',
};

const getFn = jest.fn().mockReturnValue(Promise.resolve(cacheResponse));

jest.mock('@andes/core', () => ({
  AndesCache: jest.fn().mockImplementation(() => ({
    get: (str) => getFn(str),
  })),
}));

describe('Auth - Redis - Cached', () => {
  it('Find user in Redis (cached)', () => {
    const user = 'test';
    const pass = 'pass';
    const hashedPassword = sha1Hash(user + pass);
    const isReacheable = jest.fn((server) => Promise.resolve(false));
    return controller.checkPassword('test', 'pass').then((res) => {
      expect(res).toBe(cacheResponse);
      expect(getFn).toHaveBeenCalledWith(hashedPassword);
    });
  });
});
