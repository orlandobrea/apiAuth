export const ldapServer = {
    host : process.env.ldapServerName || 'localhost',
    port : process.env.ldapServerPort || '1389',
    ou: process.env.ldapServerOU || 'ou=users,dc=example,dc=org'
};

export const authServer = {
    server : {
        host: process.env.authServer || 'localhost',
        port: process.env.authServerPort || 3000
    }
}

export const redisServer = {
    useRedis: true,
    server : {
        host: process.env.redisServer || 'localhost',
        port: process.env.redisServerPort || 6379 
    }
}
