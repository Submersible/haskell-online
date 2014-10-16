/*jslint node: true, unparam: true */

'use strict';

var config = require('figs');

var P = require('bluebird'),
    request = P.promisifyAll(require('request')),
    multiline = require('multiline');

var mainHS = multiline.stripIndent(function () { return undefined; /*
    main :: IO ()
    main = putStrLn "Hello world!"
*/      });


var test = require('tap').test;

test('Testing API server', function (t) {
    config.listen_port = '/tmp/test-haskell-online-' + Math.random() + '.sock';

    var app = require('./main'),
        appStarted = P.promisify(app.on, app)('listening'),
        testChain;

    t.test('Start the server', function (t) {
        testChain = appStarted.then(function () {
            t.ok(true, 'Server is listening');
            t.end();
        });
    });

    t.test('Execute a bad request', function (t) {
        testChain = testChain.then(function () {
            return request.postAsync('unix://' + config.listen_port + '/execute', {
                json: true,
                body: {files: [{name: 'Main.hs', poop: 'hey'}]},
                url: '/execute'
            });
        }).spread(function (resp, body) {
            t.deepEqual(body.error.type, 'bad_request', 'Response is correct');
            t.equal(resp.headers['content-type'], 'application/json; charset=utf-8', 'Content type is correct');
            t.end();
        });
    });


    t.test('Execute a bad things', function (t) {
        testChain = testChain.then(function () {
            return request.postAsync('unix://' + config.listen_port + '/execute', {
                json: true,
                body: {
                    files: [
                        {name: '../Main.hs', code: 'hey'},
                        {name: 'Rawr', code: 'hey'}
                    ],
                    modules: [
                        {name: 'pew$$pew', version: null},
                        {name: 'DocTest', version: '1.2.3'},
                        {name: 'DocTest', version: 'hello'},
                    ]
                },
                url: '/execute'
            });
        }).spread(function (resp, body) {
            console.error(body.error.errors);
            t.deepEqual(body.error.errors[0].property, 'files[0].name', 'files[0].name was invalid');
            t.deepEqual(body.error.errors[1].property, 'files[1].name', 'files[1].name was invalid');
            t.deepEqual(body.error.errors[2].property, 'modules[0].name', 'modules[0].name was invalid');
            t.deepEqual(body.error.errors[3].property, 'modules[2].version', 'modules[2].version was invalid');
            t.deepEqual(body.error.errors.length, 4, 'There were 4 errors');
            t.end();
        });
    });

    t.test('can make a request', function (t) {
        testChain = testChain.then(function () {
            return request.postAsync('unix://' + config.listen_port + '/execute', {
                json: true,
                body: {files: [{name: 'Main.hs', code: mainHS}], modules: []},
                url: '/execute'
            });
        }).spread(function (resp, body) {
            t.deepEqual(body, {hello: 'world'}, 'Response is correct');
            t.equal(resp.headers['content-type'], 'application/json; charset=utf-8', 'Content type is correct');
            t.end();
        });
    });

    t.test('Stop the server', function (t) {
        testChain = testChain.then(function () {
            P.promisifyAll(app).closeAsync();
        }).then(function () {
            t.ok(true, 'Server stopped');
            t.end();
        });
    });
});