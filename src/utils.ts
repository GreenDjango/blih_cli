import chalk from 'chalk'
import fs from 'fs'
import { exec } from 'child_process'
import { homedir } from 'os'
import { Timeline } from './timeline_api'

const CONFIG_FOLDER = homedir() + '/.config/blih_cli'
const CONFIG_FILE = '.cli_data.json'
const CONFIG_PATH = `${CONFIG_FOLDER}/${CONFIG_FILE}`
const PACKAGE_PATH = `${__dirname}/../package.json`
let COLORS = { info: 'blue' }
export let SPINNER = 'dots'
export const IS_DEBUG = get_is_debug_build()
export const APP_VERSION = get_app_version()
export const WAIT_MSG = 'Process...'
export let VERBOSE = true

// prettier-ignore
export const spinner_names = new Set([
	'dots', 'dots2', 'dots3', 'dots4', 'dots5', 'dots6', 'dots7', 'dots8',
	'dots9', 'dots10', 'dots11', 'dots12', 'dots8Bit', 'line', 'line2',
	'pipe', 'simpleDots', 'simpleDotsScrolling', 'star', 'star2', 'flip',
	'hamburger', 'growVertical', 'growHorizontal', 'balloon', 'balloon2',
	'noise', 'bounce', 'boxBounce', 'boxBounce2', 'triangle', 'arc', 'circle',
	'squareCorners', 'circleQuarters', 'circleHalves', 'squish', 'toggle',
	'toggle2', 'toggle3', 'toggle4', 'toggle5', 'toggle6', 'toggle7',
	'toggle8', 'toggle9', 'toggle10', 'toggle11', 'toggle12', 'toggle13',
	'arrow', 'arrow2', 'arrow3', 'bouncingBar', 'bouncingBall', 'smiley',
	'monkey', 'hearts', 'clock', 'earth', 'material', 'moon', 'runner',
	'pong', 'shark', 'dqpb', 'weather', 'christmas', 'grenade', 'point',
	'layer', 'betaWave'
])

// prettier-ignore
export const colorsValue = new Set([
	'black', 'blackBright', 'blue', 'blueBright', 'cyan', 'cyanBright',
	'green', 'greenBright', 'grey', 'magenta', 'magentaBright', 'red',
	'redBright', 'white', 'whiteBright', 'yellow', 'yellowBright'
])

export class clor {
	// TODO: remove static getKeyValue = (key: string) => (obj: Record<string, any>) => obj[key]

	static info(text: any): string {
		return (chalk as any)[COLORS.info](text)
	}

	static getColorsKey(): string[] {
		return Object.keys(COLORS).map((key) => key)
	}
}

export class ConfigType {
	private _listen: Function | undefined
	private _email: string
	private _token: string
	private _spinner_name: string
	private _save_token: boolean
	private _auto_acl: boolean
	private _verbose: boolean
	private _check_update: boolean
	private _contact: string[]
	private _cloning_options: string[]
	private _colors: { info: string }
	public args: string[] | undefined
	public timelines: Timeline[]
	public repo: string[]

	constructor() {
		this._listen = undefined
		this._email = ''
		this._token = ''
		this._spinner_name = SPINNER
		this._save_token = false
		this._auto_acl = true
		this._verbose = true
		this._check_update = true
		this._contact = []
		this._cloning_options = ['--depth=1']
		this._colors = COLORS
		this.args = undefined
		this.timelines = []
		this.repo = []
	}

	to_json() {
		return {
			email: this.email,
			token: this.token,
			spinner_name: this.spinner_name,
			save_token: this.save_token,
			auto_acl: this.auto_acl,
			verbose: this.verbose,
			check_update: this.check_update,
			contact: this.contact,
			cloning_options: this.cloning_options,
			colors: this.colors,
		}
	}

	addListener(callback: Function) {
		this._listen = callback
	}

	removeListener() {
		this._listen = undefined
	}

	private _triggerListener() {
		if (this._listen) {
			this._listen(this.to_json())
		}
	}

	get email() {
		return this._email
	}
	set email(email: string) {
		this._email = email
		this._triggerListener()
	}
	get token() {
		return this._token
	}
	set token(token: string) {
		if (typeof token !== 'string') return
		this._token = token
		this._triggerListener()
	}
	get spinner_name() {
		return this._spinner_name
	}
	set spinner_name(spinner_name: string) {
		if (typeof spinner_name !== 'string') return
		if (!spinner_names.has(spinner_name)) {
			print_message(`Config error: '${spinner_name}' is not a valid spinner_name`, '', 'fail')
			return
		}
		SPINNER = spinner_name
		this._spinner_name = spinner_name
		this._triggerListener()
	}
	get save_token() {
		return this._save_token
	}
	set save_token(save_token: boolean) {
		if (typeof save_token !== 'boolean') return
		this._save_token = save_token
		this._triggerListener()
	}
	get auto_acl() {
		return this._auto_acl
	}
	set auto_acl(auto_acl: boolean) {
		if (typeof auto_acl !== 'boolean') return
		this._auto_acl = auto_acl
		this._triggerListener()
	}
	get verbose() {
		return this._verbose
	}
	set verbose(verbose: boolean) {
		if (typeof verbose !== 'boolean') return
		VERBOSE = verbose
		this._verbose = verbose
		this._triggerListener()
	}
	get check_update() {
		return this._check_update
	}
	set check_update(check_update: boolean) {
		if (typeof check_update !== 'boolean') return
		this._check_update = check_update
		this._triggerListener()
	}
	get contact() {
		return this._contact
	}
	set contact(contact: string[]) {
		if (typeof contact !== 'object') return
		this._contact = contact
		this._triggerListener()
	}
	get cloning_options() {
		return this._cloning_options
	}
	set cloning_options(cloning_options: string[]) {
		if (typeof cloning_options !== 'object') return
		this._cloning_options = cloning_options.filter((val) => {
			if (/[\$`|><;]/.test(val)) {
				// prettier-ignore
				print_message('Config error: ' + JSON.stringify(val) + ' contains banned characters. eg: $`|><;', '', 'fail')
				return false
			}
			if (!val) return false
			return true
		})
		this._triggerListener()
	}
	get colors() {
		return this._colors
	}
	set colors(colors) {
		// TODO: parse & check if is valid color
		COLORS = colors
		this._colors = colors
		this._triggerListener()
	}
}

export function open_config() {
	let config
	try {
		if (fs.existsSync(CONFIG_PATH)) {
			const config_file = fs.readFileSync(CONFIG_PATH, 'utf8')
			config = JSON.parse(config_file)
		} else {
			config = {}
		}
	} catch (err) {
		print_message('Fail to open config file', err, 'error')
	}
	return parse_config(config)
}

function parse_config(config: any) {
	const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})')
	const new_config = new ConfigType()

	// TODO: move email & color parse in getter / setter
	if (config?.email && regex_email.test(config.email)) {
		new_config.email = config.email
	}
	new_config.token = config?.token
	new_config.spinner_name = config?.spinner_name
	new_config.save_token = config?.save_token
	new_config.auto_acl = config?.auto_acl
	new_config.verbose = config?.verbose
	new_config.check_update = config?.check_update
	new_config.contact = config?.contact
	new_config.cloning_options = config?.cloning_options
	if (config?.colors) {
		clor.getColorsKey().forEach((key) => {
			if (colorsValue.has(config.colors[key])) {
				;(new_config.colors as any)[key] = config.colors[key]
			}
		})
	}
	new_config.addListener(write_config)

	return new_config
}

export async function write_config(config_info: any) {
	if (config_info && !config_info.save_token) {
		config_info.token = undefined
	}
	try {
		if (!fs.existsSync(CONFIG_FOLDER)) {
			fs.mkdirSync(CONFIG_FOLDER, { recursive: true })
		}
		const config_json = JSON.stringify(config_info, undefined, 4)
		fs.writeFileSync(CONFIG_PATH, config_json, 'utf8')
	} catch (err) {
		print_message('Fail to save config file', err, 'error')
	}
}

export function print_message(title: string, message: string, level: 'message' | 'fail' | 'error') {
	if (level === 'error') {
		console.error(chalk.redBright.bold(title))
		throw new Error(chalk.redBright(message))
	} else if (level === 'fail') {
		if (message) {
			console.error(chalk.redBright.bold(title))
			console.error(chalk.redBright(message))
		} else {
			console.error(chalk.redBright.bold(title))
		}
	} else {
		if (message) {
			console.log(chalk.greenBright.bold(title))
			console.log(chalk.greenBright(message))
		} else {
			console.log(chalk.green(title))
		}
	}
}

export async function sh(cmd: string): Promise<{ stdout: string; stderr: string }> {
	return new Promise(function (resolve, reject) {
		exec(cmd, (err, stdout, stderr) => {
			if (err) reject(err)
			else resolve({ stdout, stderr })
		})
	})
}

export async function sh_live(cmd: string): Promise<{ stdout: string; stderr: string }> {
	return new Promise(function (resolve, reject) {
		const child = exec(cmd, (err, stdout, stderr) => {
			if (err) reject(err)
			else resolve({ stdout, stderr })
		})
		child.stdout?.pipe(process.stdout)
		child.stderr?.pipe(process.stderr)
	})
}

export async function sh_callback(
	cmd: string,
	callback?: (std: 'stdin' | 'stdout' | 'stderr', data: string) => any
): Promise<{ stdout: string; stderr: string }> {
	return new Promise(function (resolve, reject) {
		const child = exec(cmd, (err, stdout, stderr) => {
			if (err) reject(err)
			else resolve({ stdout, stderr })
		})

		child.stdin?.on('data', (data) => {
			if (callback) callback('stdin', data)
		})
		child.stdout?.on('data', (data) => {
			if (callback) callback('stdout', data)
		})
		child.stderr?.on('data', (data) => {
			if (callback) callback('stderr', data)
		})
	})
}

export function resolveAfter(x: number) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(x)
		}, x)
	})
}

async function get_app_version() {
	try {
		if (IS_DEBUG) {
			const res = await sh(
				`cd ${__dirname}; git show --format="%H" --no-patch | git describe --tags`
			)
			return res.stdout.split('\n')[0] || 'v0.0.0'
		} else {
			const package_file = fs.readFileSync(PACKAGE_PATH, 'utf8')
			const package_obj = JSON.parse(package_file)
			return 'v' + package_obj?.version
		}
	} catch (err) {
		return 'v0.0.0'
	}
}

function get_is_debug_build() {
	return fs.existsSync(`${__dirname}/../.npmignore`)
}
