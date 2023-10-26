
import { url } from '../src'

import { runExample } from './run-example'

runExample(url, 'https://example.com/foo/bar?param=123#fragment')

runExample(url, '<not-a-valid-url>')
