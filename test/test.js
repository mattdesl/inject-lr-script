var inject = require('../')
var test = require('tape')
var http = require('http')
var ecstatic = require('ecstatic')
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
test('injects but does not look for HTML', run('no-header-check', '.txt'))

test('should not mutate non-html', function (t) {
  t.plan(1)
  var handler = ecstatic(__dirname)
  var server = http.createServer(function (req, res) {
    res = inject(res)
    handler(req, res)
  }).listen(8000, function () {
    request.get({
      uri: base + '/not-html.txt'
    }, function (err, resp, data) {
      server.close()
      if (err) return t.fail(err)
      t.equal(data, 'hello world!')
    })
  })
})

function createServer (cb) {
  var handler = ecstatic(__dirname)

  return http.createServer(function (req, res) {
    var opt = {}
    if (req.url === '/opt.html') {
      opt = { port: 3000, host: '12.0.0.0' }
    }
    if (req.url === '/https.html') {
      opt = { protocol: 'https' }
    }
    if (req.url === '/no-header-check.txt') {
      opt = { autoDetect: false }
    }
    return handler(req, inject(res, opt))
  }).listen(8000, cb)
}
