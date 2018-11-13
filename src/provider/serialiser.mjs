import os from 'os'
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
    try {
      // Delay the delivery until next loop because it might happen that some other, unrelated
      // error occurs down the stack (somewhere inside done(), basically) which would trigger the
      // catch block below and cause the done() callback to be called again, effectively masking
      // the real problem. ⚠️
      // We are using try/catch just to make sure we catch any serialisation issues.
      return void setImmediate(done, null, `${JSON.stringify(object)}${os.EOL}`)
    } catch (err) {
      return void done(err)
    }
  }
}

export {
  Serialiser,
}
