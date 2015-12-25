/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock-proxy/blob/master/LICENSE
 */
try {
  require('babel-polyfill')
} catch (e) {
  // babel polyfill throws if it's ever included in any other module
}

const http = require('http')
const url = require('url')

const test = require('tape')
const proxyquire = require('proxyquire')
const through = require('through')
const commuter = require('commuter')
const portfinder = require('portfinder')
const enableDestroy = require('server-destroy')

const https = {}

const frock = {
  router: commuter
}
const log = {
  debug: () => {},
  error: () => {}
}

const lib = proxyquire(
  '../lib',
  {
    'https': https,
    '@noCallThru': true
  }
)

let ports

test(`setup ${__filename}`, t => {
  t.plan(1)

  portfinder.getPorts(2, (err, found) => {
    if (err) {
      t.fail('got error searching for available ports')
    }

    ports = found
    t.pass('set it up')
  })
})

test('can proxy request', t => {
  t.plan(4)

  const endpointUrl = `http://localhost:${ports[0]}/`
  const proxyUrl = `http://localhost:${ports[1]}`
  const handler = lib(frock, log, {url: endpointUrl})
  const server = http.createServer(onProxiedRequest)
  const proxy = http.createServer(handler)
  const expectedContent = 'yah'

  server.listen(ports[0])
  proxy.listen(ports[1])

  enableDestroy(server)
  enableDestroy(proxy)

  const request = http.request(url.parse(proxyUrl), response => {
    response.on('data', buf => {
      t.equal(buf.toString(), expectedContent)
    })
    response.on('end', () => {
      t.pass('request ended')

      server.destroy(() => {
        proxy.destroy(() => t.pass('cleaned up servers'))
      })
    })
  })

  request.end()

  function onProxiedRequest (req, res) {
    t.pass('received proxied request')

    res.statusCode = 200
    res.end(expectedContent)
  }
})

test('proxies headers to/from request', t => {
  t.plan(4)

  const endpointUrl = `http://localhost:${ports[0]}/`
  const proxyUrl = `http://localhost:${ports[1]}`
  const requestOpts = Object.assign(
    url.parse(proxyUrl),
    {
      method: 'POST',
      headers: {'X-Whatever': 'whatever'}
    }
  )
  const handler = lib(frock, log, {url: endpointUrl})
  const server = http.createServer(onProxiedRequest)
  const proxy = http.createServer(handler)

  server.listen(ports[0])
  proxy.listen(ports[1])

  enableDestroy(server)
  enableDestroy(proxy)

  const request = http.request(requestOpts, response => {
    t.equal(response.headers['x-got-it'], 'yep')

    response.on('data', () => {})
    response.on('end', () => {
      t.pass('request ended')

      server.destroy(() => {
        proxy.destroy(() => t.pass('cleaned up servers'))
      })
    })
  })

  request.end()

  function onProxiedRequest (req, res) {
    t.equal(req.headers['x-whatever'], 'whatever')

    res.setHeader('X-Got-It', 'yep')
    res.statusCode = 204
    res.end()
  }
})

test('proxies data to/from request', t => {
  t.plan(4)

  const endpointUrl = `http://localhost:${ports[0]}/`
  const proxyUrl = `http://localhost:${ports[1]}`
  const requestOpts = Object.assign(
    url.parse(proxyUrl), {method: 'POST'}
  )
  const handler = lib(frock, log, {url: endpointUrl})
  const server = http.createServer(onProxiedRequest)
  const proxy = http.createServer(handler)
  const expectedPOST = 'postdata'
  const expectedResponse = 'responsedata'

  server.listen(ports[0])
  proxy.listen(ports[1])

  enableDestroy(server)
  enableDestroy(proxy)

  const request = http.request(requestOpts, response => {
    response.on('data', buf => t.equal(buf.toString(), expectedResponse))
    response.on('end', () => {
      t.pass('request ended')

      server.destroy(() => {
        proxy.destroy(() => t.pass('cleaned up servers'))
      })
    })
  })

  request.write(expectedPOST)
  request.end(expectedPOST)

  function onProxiedRequest (req, res) {
    req.on('data', buf => t.equal(buf.toString(), expectedPOST))

    res.statusCode = 204
    res.end(expectedResponse)
  }
})

test('setting protocol to https uses https request', t => {
  t.plan(1)

  https.request = mockRequest

  const endpointUrl = 'https://whatever.biz'
  const handler = lib(frock, log, {url: endpointUrl})
  const fakeRequest = through()

  fakeRequest.url = url.parse('http://yes.no')

  handler(fakeRequest, through())

  function mockRequest (opts, ready) {
    t.pass('instantiated')
    process.nextTick(() => ready(through()))

    return through()
  }
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  t.pass('tore it down')
})
