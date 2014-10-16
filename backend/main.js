/*jslint node: true, unparam: true, vars: true */

'use strict';

var config = require('figs');

var P = require('bluebird'),
    child_process = require('child_process'),
    crypto = require('crypto'),
    multiline = require('multiline'),
    express = require('express'),
    bodyParser = require('body-parser'),
    Archiver = require('archiver'),
    Tar = require('tar-stream');

var validate = require('./validate');

var app = express();

/**
 * type File = String
 * type Parent = Maybe String
 * type PostID = String
 * type Post = {
 *                 files = [String],
 *                 modules = [{name = String, version = Maybe String}]
 *             }
 * type FamilyTree = BinaryTree String
 */

app.use(function (req, res, next) {
    res.removeHeader("X-Powered-By");
    next();
});

/**
 * POST /execute :: Post -> Loading Stream -> Result
 */
app.post('/execute', bodyParser.json(), function (req, res) {
    req.accepts('application/json');

    var validated = validate.executeRequest(req.body);

    if (!validated.valid) {
        res.send({error: {type: 'bad_request', errors: validated.errors}});
        return;
    }

    var files_hash = crypto.createHash('sha256').update(JSON.stringify(req.body.files)).digest('hex');
    var modules_hash = crypto.createHash('sha256').update(req.body.modules.map(function (module) {
        return module.name + '-' + (module.version || '');
    }).sort().join(',')).digest('hex');

    console.error(files_hash, modules_hash);

    var Dockerfile;
    if (!req.body.modules.length) {
        Dockerfile = multiline.stripIndent(function () { return undefined; /*
            FROM haskell-online-ghc
            ADD execute.sh .
        */  });
    } else {
        Dockerfile = multiline.stripIndent(function () { return undefined; /*
            FROM haskell-online-ghc
            ADD execute.sh .
            RUN cabal update
        */  }) + '\nRUN cabal install ' + req.body.modules.map(function (module) {
            return module.version ? module.name + '-' + module.version : module.name;
        }).join(' ');
    }
    console.error(Dockerfile + '\n---------\n');

    var dockerfile_tar_stream = Tar.pack();

    dockerfile_tar_stream.entry({
        name: 'Dockerfile',
        mode: parseInt(644, 8)
    }, Dockerfile);

    dockerfile_tar_stream.entry({
        name: 'execute.sh',
        mode: parseInt(755, 8)
    }, multiline.stripIndent(function () { return undefined; /*
        #!/usr/bin/env sh

        cat > code.tar
        tar xfv code.tar > /dev/null 2>&1
        runghc Main.hs
    */  }));

    dockerfile_tar_stream.finalize();

    var execBuild = child_process.spawn('/usr/local/bin/docker', [
        '-H',
        config.docker_host,
        // 'ps',
        'build',
        '-t',
        'haskell-online-ghc:' + modules_hash,
        '-'
    ]);


    console.error('Building image', 'haskell-online-ghc:' + modules_hash);


    dockerfile_tar_stream.pipe(execBuild.stdin);

    execBuild.stdout.pipe(process.stderr);
    execBuild.stderr.pipe(process.stderr);

    P.promisify(execBuild.on, execBuild)('close').then(function () {
        var code_tar = Tar.pack();

        // pack each file into the tar
        req.body.files.forEach(function (file) {
            code_tar.entry({
                name: file.name,
                mode: parseInt(644, 8)
            }, file.code);
        });

        code_tar.finalize();

        var execRun = child_process.spawn('/usr/local/bin/docker', [
            '-H',
            config.docker_host,
            // 'ps',
            'run',
            '-i',
            'haskell-online-ghc:' + modules_hash,
            '/execute.sh'
        ]);

        console.error('---- EXECUTING CODE ----');
        code_tar.pipe(execRun.stdin);
        execRun.stdout.pipe(process.stderr);
        execRun.stderr.pipe(process.stderr);




    });

    // dockerfile_tar_stream.on('end', function () {
    //     console.error('HELLO WORLD ARE U DONE PIIPING');
    //     // execBuild.stdin.end();
    // });

    // execBuild.on('cl')

    // console.error('DO IT', 'docker build -t haskell-online-ghc:' + modules_hash + ' -');

    // var archive = Archiver.create('tar');

    // .append('hello world', {name: 'README.md'}).pipe(require('fs').createWriteStream('meow.tar'))

    // res.send(req.body);
});

/**
 * POST /create :: {post = Post, canonical = String, parent = Parent}
 *                   -> {id = PostID}
 */
app.post('/create', function (req, res) {
    res.send('hello world');
});

/**
 * POST /post/get :: {id = PostID}
 *                -> {files = [File], family_tree = FamilyTree}
 */
app.post('/get', function (req, res) {
    res.send('hello world');
});

var server = app.listen(config.listen_port, function () {
    app.emit('listening');
});

server.on('listening', function () {
    console.log('Server started on port', config.listen_port);
});

module.exports = server;