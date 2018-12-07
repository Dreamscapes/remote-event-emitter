import { Server } from 'net'
import { EventEmitter } from 'events'
import { EOL } from 'os'
import split from 'binary-split'
import { JSONParser } from './deserialisers'

class Consumer extends EventEmitter {
  #server = new Server()

  constructor() {
    super()

    this.#server.on('error', err => this.emit('error', err))
  }

  async listen({ address }) {
    this.#server.on('connection', socket => {
      const source = new EventEmitter()

      socket
        .once('error', err => source.emit('error', err))
        .once('close', (...args) => setImmediate(() => source.emit('close', ...args)))
        .pipe(split(EOL))
        .pipe(new JSONParser())
        .on('data', ({ event, args }) => source.emit(event, ...args))

      this.emit('connection', source)
    })

    this.#server.listen(address)

    await new Promise(resolve =>
      this.#server.once('listening', resolve))
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
