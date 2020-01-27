#!/usr/bin/env node

const main = require('./build/app.js').run

main().catch(err => {
	console.error(err)
})
