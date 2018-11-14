import * as RemoteEventEmitter from '.'

describe('Module: remote-event-emitter', () => {
  it('exists', () => {
    expect(RemoteEventEmitter).to.have.all.keys([
      'Provider',
      'Consumer',
    ])
  })
})
