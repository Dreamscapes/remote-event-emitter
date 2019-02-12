import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import * as chaiAsPromised from 'chai-as-promised'

// Make sure our tests always run in the 'test' environment
// eslint-disable-next-line no-process-env
process.env.NODE_ENV = 'test'

global.expect = chai.expect
global.sinon = sinon

chai.use(sinonChai)
chai.use(chaiAsPromised)
