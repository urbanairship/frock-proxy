import http from 'http'
import https from 'https'
import {parse} from 'url'

import commuter from 'commuter'
import extend from 'xtend'

export default createProxyServer

function createProxyServer (frock, logger, options = {}) {
  const {
    url,
    strictSsl = true,
    requestHeaders = {},
    responseHeaders = {}
  } = options

  const parsedUrl = parse(url)
  const router = commuter(proxyHandler, options.baseUrl)

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

    if (reqOpts.protocol === 'https') {
      request = https.request
      reqOpts.rejectUnauthorized = strictSsl
    }

    handle = request(reqOpts, proxyRes => {
      const headers = proxyRes.headers

      proxyRes.on('error', onError)

      setHeadersFromObject(res, extend(headers, responseHeaders))
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
