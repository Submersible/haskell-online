var tar = require('tar-stream'),
    spawn = require('child_process').spawn

var pack = tar.pack();

pack.entry({name: 'hello.txt'}, 'Hello world!')
pack.finalize();

var cat = spawn('cat');

cat.on('close', function () {
    console.log('This is never fired.');
});

pack.pipe(cat.stdin);
cat.stdout.pipe(process.stdout);

