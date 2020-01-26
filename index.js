#!/usr/bin/env node

const main = require('./build/index.js').run

main().catch(err => {
	console.error(err)
})
