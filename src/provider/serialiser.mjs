import { Transform } from 'stream'

/**
 * Given a standard JS value, attempt to serialise it into JSON and send it out, with a newline at
 * the end
 *
 * The newline is important because that's what we will be using on the other side to separate
 * individual JSON strings from each other. Otherwise we would not know where one JSON ends and a
 * new one starts. ⚠️
 */
class Serialiser extends Transform {
  constructor(options = {}) {
    // Always operate in object mode since we are expecting a JS value, not a string or buffer
    super({ ...options, objectMode: true })
  }

  _transform(object, encoding, done) {
    let stringified

    try {
      stringified = JSON.stringify(object)
    } catch (err) {
      return void done(err)
    }

    return void done(null, `${stringified}\n`)
  }
}

export {
  Serialiser,
}
