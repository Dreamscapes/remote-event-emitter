import { Transform } from 'stream'

/**
 * Given a raw buffer, attempt to parse it as JSON
 */
class JSONParser extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true })
  }

  _transform(chunk, encoding, done) {
    let json

    try {
      json = JSON.parse(chunk.toString('utf8'))
    } catch (err) {
      return void done(err)
    }

    return void done(null, json)
  }
}

export {
  JSONParser,
}
