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
const https = require('https')
const {parse} = require('url')

module.exports = createProxyServer

function createProxyServer (frock, logger, options = {}) {
  const {
    url,
    strictSsl = true,
    requestHeaders = {},
    responseHeaders = {}
  } = options

  const parsedUrl = parse(url)
  const router = frock.router(proxyHandler)

  router.end = (ready = noop) => {
    logger.debug('ending')
    ready()
  }

  return router

  function proxyHandler (req, res) {
    const reqOpts = JSON.parse(JSON.stringify(parsedUrl))

    let request = http.request
    let handle

    reqOpts.path = req.url
    reqOpts.method = req.method
    reqOpts.headers = req.headers

    if (reqOpts.protocol && reqOpts.protocol.includes('https')) {
      request = https.request
      reqOpts.rejectUnauthorized = strictSsl
    }

    handle = request(reqOpts, proxyRes => {
      const headers = proxyRes.headers

      proxyRes.on('error', onError)

      setHeadersFromObject(res, Object.assign({}, headers, responseHeaders))
      res.statusCode = proxyRes.statusCode

      proxyRes.pipe(res)

      logger.debug(
        `${url} <- ${req.method}[${res.statusCode}] ${req.url}`,
        reqOpts
      )
    })

    handle.on('error', onError)

    setHeadersFromObject(handle, requestHeaders)

    req.pipe(handle)

    function onError (err) {
      logger.error('proxy error', err)

      res.statusCode = 500
      res.end(err.toString() || 'proxy error occurred')
    }
  }
}

createProxyServer.validate = validate

function validate ({url}) {
  if (!url) {
    return {
      url: 'Url is required.'
    }
  }
}

function setHeadersFromObject (reqRes, headersObj) {
  Object.keys(headersObj).forEach(header => {
    reqRes.setHeader(header, headersObj[header])
  })
}

function noop () {
  // nothing
}
