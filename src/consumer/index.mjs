import { Server } from 'net'
import { EventEmitter } from 'events'
import { EOL } from 'os'
import split from 'binary-split'
import { JSONParser } from './deserialisers'


/**
 * @typedef  {import("net").ListenOptions|Number|String}  Address   A port, a socket, or object
 *                                                                  containing information where to
 *                                                                  listen for connections
 * @see     https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_server_listen
 */

class Consumer extends EventEmitter {
  #server = new Server()

  constructor() {
    super()

    this.#server.on('error', err => this.emit('error', err))
  }

  /**
   * Start listening for incoming connections on a given socket/port
   *
   * @param     {Object}            options             Input options
   * @param     {Address}           options.address     Socket to listen on
   * @return    {Promise<void>}
   */
  async listen({ address }) {
    /** @type {Server} */
    const server = this.#server

    server.on('connection', socket => {
      const source = new EventEmitter()

      socket
        .once('error', err => source.emit('error', err))
        .once('close', (...args) => setImmediate(() => source.emit('close', ...args)))
        .pipe(split(EOL))
        .pipe(new JSONParser())
        .on('data', ({ event, args }) => source.emit(event, ...args))

      this.emit('connection', source)
    })

    server.listen(address)

    await new Promise(resolve =>
      server.once('listening', resolve))
  }

  async close() {
    await new Promise((resolve, reject) =>
      this.#server.close(err =>
        err ? reject(err) : resolve()))
  }
}

export {
  Consumer,
}
