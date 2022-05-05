"use strict";
const database = require("better-sqlite3");

const logdb = new database("log.db");

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`);

let row = stmt.get();

if (row==undefined) {
    console.log("Log database appears to be empty. Creating log database.");
    const sqlInit = `
        CREATE TABLE accesslog ( 
        id INTEGER PRIMARY KEY, 
        remote_addr TEXT, 
        remote_user TEXT, 
        time NUMBER, 
        method TEXT, 
        url TEXT,
        protocol TEXT,
        http_version TEXT,
        secure TEXT,
        status TEXT, 
        referer_url TEXT,
        user_agent TEXT
    );
    `;
    logdb.exec(sqlInit);
    console.log("Your database has been initialized.");
}
else {
    console.log("Log database exists.");
}


module.exports = logdb;

