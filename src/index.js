import http from 'http'
import {parse} from 'url'

import commuter from 'commuter'
import extend from 'xtend'

export default createProxyServer

function createProxyServer (frock, logger, options = {}) {
  const {
    url,
    requestHeaders = {},
    responseHeaders = {}
  } = options

  const parsedUrl = parse(url)
  const router = commuter(proxyHandler, options.baseUrl)

  router.end = () => {}
  router.validate = validate

  return router

  function proxyHandler (req, res) {
    const reqOpts = JSON.parse(JSON.stringify(parsedUrl))

    let handle

    reqOpts.path = req.url
    reqOpts.method = req.method
    reqOpts.headers = req.headers

    handle = http.request(reqOpts, proxyRes => {
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
