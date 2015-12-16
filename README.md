# frock-proxy

A proxy plugin for `frock`.

[![Build Status](http://img.shields.io/travis/urbanairship/frock-proxy/master.svg?style=flat-square)](https://travis-ci.org/urbanairship/frock-proxy)
[![npm install](http://img.shields.io/npm/dm/frock-proxy.svg?style=flat-square)](https://www.npmjs.org/package/frock-proxy)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

It makes requests to other servers on your behalf, allowing you to bring data
from external services to your local environment.

## `frockfile` Example

In your working directory, create a `frockfile.json`:

```json
{
  "servers": [
    {
      "port": 8080,
      "routes": [
        {
          "path": "*",
          "methods": "any",
          "handler": "frock-proxy",
          "options": {
            "url": "http://localhost:8052"
          }
        }
      ]
    }
  ]
}
```

## License

Apache 2.0, see [LICENSE](./LICENSE) for details.
