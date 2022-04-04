import { ldapServer, redisServer } from '../config';
import { AndesCache } from '@andes/core';
const sha1Hash = require('sha1'); // check: should we update this?
const isReachable = require('is-reachable');
import * as ldapjs from 'ldapjs';

const AuthCache = redisServer.useRedis 
  ? new AndesCache({ adapter: 'redis', port: Number(redisServer.server.port), host: redisServer.server.host }) 
  : new AndesCache({ adapter: 'memory' })

// Función auxiliar
function sleep(ms: number) {
    return new Promise((resolve) => { setTimeout(() => resolve('timeout'), ms); });
}

function hashUserPassword(user: string, password: string) {
    return sha1Hash(user + password);
}

function getCachedDataForUser(user: string, password: string): Promise<any> {
    const hashed = hashUserPassword(user, password);
    return AuthCache.get(hashed);
}

function setCachedDataForUser(user: string, password: string, dto) {
    const ONE_DAY = 60 * 60 * 24;
    const hashed = hashUserPassword(user, password);
    return AuthCache.set(hashed, dto, ONE_DAY)
}

export async function checkPassword(user: string, password: string): Promise<any> {
    const server = `${ldapServer.host}:${ldapServer.port}`;
    const ldapPromise = new Promise((resolve, reject) => {
        isReachable(server).then(reachable => {
            if (!reachable) {
                return resolve('timeout');
            }
            // Conecta a LDAP
            const dn = 'uid=' + user + ',' + ldapServer.ou;
            const ldap = ldapjs.createClient({
                url: `ldap://${ldapServer.host}:${ldapServer.port}`,
                timeout: 4000,
                connectTimeout: 4000,
            });
            ldap.on('connectError', (err) => {
                return resolve('timeout');
            });
            ldap.on('error', (err) => {
                return resolve('timeout');
            });
            ldap.on('connect', () => {
                ldap.bind(dn, password, (err) => {
                    if (err) {
                        if (err.name === 'InvalidCredentialsError') {
                            return resolve('invalid');
                        } else {
                            return;
                        }
                    }
                    ldap.search(dn, {
                        scope: 'sub',
                        filter: '(uid=' + user + ')',
                        paged: false,
                        sizeLimit: 1
                    }, (err2, searchResult) => {
                        if (err2) {
                            return resolve('invalid');
                        }
                        searchResult.on('searchEntry', (entry) => {
                            const dto = {
                                nombre: entry.object?.givenName,
                                apellido: entry.object?.sn,
                                email: entry.object?.mail,
                                telefono: entry.object?.telephoneNumber,
                                du: entry.object?.uid
                            }
                            return resolve(dto);
                        });

                        searchResult.on('error', (err3) => {
                            return resolve('invalid');
                        });
                    });
                });
            });

        });

    });

    const response = await Promise.race([ldapPromise, sleep(3000)]);
    if (response === 'timeout') {
        return getCachedDataForUser(user, password)
            .then(payload => payload)
            .catch(() => null);
    } else if (response === 'invalid') {
        return null;
    } else {
        await setCachedDataForUser(user, password, response);
        return response;
    }
}

