#!/usr/bin/env node

import { run } from './app.js'

run().catch((err) => {
	console.error(err)
})
