# frock-proxy

A proxy plugin for `frock`, it makes requests on your behalf, and allows a very
light amount of rewriting to take place.

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
