import { ldapServer } from '../config';
const isReachable = require('is-reachable');
import * as ldapjs from 'ldapjs';

// Función auxiliar
function sleep(ms) {
    return new Promise((resolve) => { setTimeout(() => resolve('timeout'), ms); });
}

export async function checkPassword(user, password): Promise<any> {
    const server = `${ldapServer.host}:${ldapServer.port}`;
    const ldapPromise = new Promise((resolve, reject) => {
        isReachable(server).then(reachable => {
            if (!reachable) {
                return resolve('timeout');
            }
            // Conecta a LDAP
            const dn = 'uid=' + user + ',' + ldapServer.ou;
            const ldap = ldapjs.createClient({
                url: `ldap://${ldapServer.host}`,
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
        return null
    } else if (response === 'invalid') {
        return null;
    } else {
        return response;
    }
}

