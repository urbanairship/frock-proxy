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

  router.end = () => {}

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

      setHeadersFromObject(res, extend(headers, responseHeaders))

      res.statusCode = proxyRes.statusCode

      proxyRes.pipe(res)

      logger(
        'info',
        `${url} <- ${req.method}[${res.statusCode}] ${req.url}`,
        reqOpts
      )
    })

    setHeadersFromObject(handle, requestHeaders)

    req.pipe(handle)
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
