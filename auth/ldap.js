const ldap = {
  server: {
    url: 'ldap://ldap.uncw.edu:389/',
    bindDN: process.env.LDAP_USER,
    bindCredentials: process.env.LDAP_PASS,
    searchBase: 'dc=uncw,dc=edu',
    searchFilter: '(&(sAMAccountName={{username}})(memberOf=CN=Library,OU=LIB,OU=AA,OU=Faculty-Staff,DC=uncw,DC=edu))',
  },
};

module.exports = ldap;
