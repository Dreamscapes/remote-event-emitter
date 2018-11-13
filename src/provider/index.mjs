import { EventEmitter } from 'events'
import net from 'net'
import { Serialiser } from './serialiser'

/**
 * The event provider, or generator
 *
 * This class allows user code to send events to it and they will be delivered to the remote end via
 * Unix sockets or TCP streams. Use the Consumer class to effortlessly receive the data on the other
 * end.
 *
 * @extends    EventEmitter
 */
class Provider extends EventEmitter {
  /**
   * Outgoing writable stream where we send the data
   *
   * This is basically a JSON stringifier which sends the plaintext to the socket as
   * newline-separated strings per each event.
   * @type    {Serialiser}
   */
  #out = new Serialiser()

  /**
   * Construct a new instance
   *
   * @param     {Object}    options                 Constructor options
   * @param     {mixed}     options.destination     This goes directly to the net.connect() method.
   *                                                You can specify a string (Unix socket), a number
   *                                                (TCP stream) or an object for more complex
   *                                                setup. See Node.js docs for detailed info.
   */
  constructor({ destination = null } = {}) {
    super()

    // Initialise connection to the socket and pipe the serialiser output to the socket
    this.#out.pipe(net.connect(destination))
  }

  /**
   * Emit an event and send it to the connected socket
   *
   * @param     {String}    event     Event to be emitted
   * @param     {Array}     args      Any arguments passed to the emit function
   * @return    {boolean}
   */
  emit(event, ...args) {
    this.#out.write({ event, args })
    return super.emit(event, ...args)
  }

  /**
   * Close the connection to the socket
   *
   * Consecutive writes will result in error.
   *
   * @return    {this}
   */
  end() {
    this.#out.end()
    return this
  }
}

export {
  Provider,
}
