
const argv = require("minimist")(process.argv.slice(2));

if (argv.help) {
    console.log("server.js [options]");
    console.log("   --port      Set the port number for the server to listen on. Must be an integer");
    console.log("             between 1 and 65535.");
    console.log();
    console.log("   --debug     If set to `true`, creates endpoints /app/log/accesss/ which returns");
    console.log("             a JSON access log  from the database and /app/error which throws");
    console.log('             an error with the message "Error test successful." Defaults to');
    console.log("                         `false`.");
    console.log();
    console.log("   --log       If set to false, no log files are written. Defaults to true.");
    console.log("                         Logs are always written to database.");
    console.log();
    console.log("   --help      Return this message and exit.");
    process.exit();

}

const port = argv.port || 5555;

const express = require("express");

const app = express();

const logdb = require("./database.js");

const coin = require("./coin.js");

const morgan = require("morgan");

const fs = require("fs");


app.use(express.urlencoded({ extended: true}));
app.use(express.json());



const server = app.listen(port, () => { 
    console.log('App listening on port %PORT%'.replace('%PORT%', port));
});

if (argv.log) {
    const accesslog = fs.createWriteStream('./access.log', {flags: 'a'});
    app.use(morgan("tiny", {stream: accesslog}));
}
else {
    app.use(morgan("tiny"));
}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        secure: req.secure,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']


    }
    const stmt = logdb.prepare('INSERT INTO accesslog (remote_addr, remote_user, time, method, url, protocol, http_version, secure, status, referer_url, user_agent) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    stmt.run(logdata.remoteaddr, String(logdata.remoteuser), logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, String(logdata.secure), logdata.status, logdata.referer, logdata.useragent);
    next();
});



if (argv.debug == true) {
    app.get('/app/log/access', (req, res) => {
        try {
            const stmt = logdb.prepare('SELECT * FROM accesslog').all();
            res.status(200).json(stmt);
        } catch {
            console.error(e);
        }
    });

    app.get('/app/error', (req, res) => {
        throw new Error("Error test successful");
    }) 
}



app.get('/app/', (req, res) => {
    res.statusCode = 200;
    res.statusMessage = 'OK';
    res.writeHead(res.statusCode, { 'Content-Type': 'text/plain'});
    res.end(res.statusCode + ' ' + res.statusMessage);
});

app.get('/app/flip/', (req, res) => {
    res.json({"flip": coin.coinFlip()});
});

app.get('/app/flips/:number', (req, res) => {
    var array = coin.coinFlips(req.params.number);
    res.json({"raw": array, "summary": coin.countFlips(array)});
});

app.get('/app/flip/call/heads', (req, res) => {
    res.json(coin.flipACoin("heads"));
})

app.get('/app/flip/call/tails', (req, res) => {
    res.json(coin.flipACoin("tails"));
})

app.use(function(req, res) {
    res.status(404).send('404 NOT FOUND');
});