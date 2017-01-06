var liveReload = require('../')
var test = require('tape')
var http = require('http')
var serveStatic = require('serve-static')
var stacked = require('stacked')
var request = require('request')
var fs = require('fs')
var path = require('path')

var base = 'http://localhost:8000'

function run (file, ext) {
  ext = ext || '.html'
  var expected = fs.readFileSync(path.join(__dirname, file + '-expected' + ext), 'utf8')

  return function (t) {
    t.plan(1)
    var server = createServer(function () {
      request.get({
        uri: base + '/' + file + ext
      }, function (err, resp, data) {
        server.close()
        if (err) return t.fail(err)
        t.equal(data, expected, file + ' matches')
      })
    })
  }
}

test('inject script into body', run('body'))
test('inject with opt', run('opt'))
test('inject without any other tags', run('none'))
test('inject without any body tag', run('no-body'))
test('inject with https', run('https'))
test('inject with path', run('path'))
test('inject with local', run('local'))

function createServer (cb) {
  var app = stacked()

  var live = liveReload()
  app.use(function (req, res, next) {
    var opt = {}
    if (req.url === '/opt.html') {
      opt = { port: 3000, host: '12.0.0.0' }
    }
    if (req.url === '/https.html') {
      opt = { protocol: 'https' }
    }
    if (req.url === '/path.html') {
      opt = { path: '/test/livereload.js' }
    }
    if (req.url === '/local.html') {
      opt = { local: true, path: 'livereload.js' }
    }
    live.port = opt.port
    live.host = opt.host
    live.path = opt.path
    live.local = opt.local
    live(req, res, next)
  })

  app.use(serveStatic(__dirname))

  return http.createServer(app).listen(8000, cb)
}
