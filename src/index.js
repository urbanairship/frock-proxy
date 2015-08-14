import http from 'http'
import {parse} from 'url'

import commuter from 'commuter'

export default createProxyServer

function createProxyServer (frock, logger, options = {}) {
  const {contentType, url, defaultHeaders = {}} = options
  const parsedUrl = parse(url)
  const router = commuter(proxyHandler, options.baseUrl)

  router.end = () => {}

  return router

  function proxyHandler (req, res) {
    const reqOpts = JSON.parse(JSON.stringify(parsedUrl))

    let handle

    reqOpts.path = req.url
    reqOpts.method = req.method
    reqOpts.headers = req.headers

    handle = http.request(reqOpts, proxyRes => {
      const headers = proxyRes.headers

      Object.keys(headers).forEach(header => {
        res.setHeader(header, headers[header])
      })

      res.statusCode = proxyRes.statusCode

      proxyRes.pipe(res)
    })

    req.pipe(handle)

    logger('info', `${req.method} ${req.url}`, reqOpts)
  }
}
