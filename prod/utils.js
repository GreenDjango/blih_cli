"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAfter = exports.sh_callback = exports.sh_live = exports.sh = exports.print_message = exports.write_config = exports.open_config = exports.ConfigType = exports.clor = exports.colorsValue = exports.spinner_names = exports.VERBOSE = exports.WAIT_MSG = exports.APP_VERSION = exports.IS_DEBUG = exports.SPINNER = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const os_1 = require("os");
const CONFIG_FOLDER = (0, os_1.homedir)() + '/.config/blih_cli';
const CONFIG_FILE = '.cli_data.json';
const CONFIG_PATH = `${CONFIG_FOLDER}/${CONFIG_FILE}`;
const PACKAGE_PATH = `${__dirname}/../package.json`;
let COLORS = { info: 'blue' };
exports.SPINNER = 'dots';
exports.IS_DEBUG = get_is_debug_build();
exports.APP_VERSION = get_app_version();
exports.WAIT_MSG = 'Process...';
exports.VERBOSE = true;
// prettier-ignore
exports.spinner_names = new Set([
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
]);
// prettier-ignore
exports.colorsValue = new Set([
    'black', 'blackBright', 'blue', 'blueBright', 'cyan', 'cyanBright',
    'green', 'greenBright', 'grey', 'magenta', 'magentaBright', 'red',
    'redBright', 'white', 'whiteBright', 'yellow', 'yellowBright'
]);
class clor {
    // TODO: remove static getKeyValue = (key: string) => (obj: Record<string, any>) => obj[key]
    static info(text) {
        return chalk_1.default[COLORS.info](text);
    }
    static getColorsKey() {
        return Object.keys(COLORS).map((key) => key);
    }
}
exports.clor = clor;
class ConfigType {
    constructor() {
        this._listen = null;
        this._email = '';
        this._token = '';
        this._spinner_name = exports.SPINNER;
        this._save_token = false;
        this._auto_acl = true;
        this._verbose = true;
        this._check_update = true;
        this._contact = [];
        this._cloning_options = ['--depth=1'];
        this._colors = COLORS;
        this.args = null;
        this.timelines = [];
        this.repo = [];
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
        };
    }
    addListener(callback) {
        this._listen = callback;
    }
    removeListener() {
        this._listen = null;
    }
    _triggerListener() {
        if (this._listen) {
            this._listen(this.to_json());
        }
    }
    get email() {
        return this._email;
    }
    set email(email) {
        this._email = email;
        this._triggerListener();
    }
    get token() {
        return this._token;
    }
    set token(token) {
        if (typeof token !== 'string')
            return;
        this._token = token;
        this._triggerListener();
    }
    get spinner_name() {
        return this._spinner_name;
    }
    set spinner_name(spinner_name) {
        if (typeof spinner_name !== 'string')
            return;
        if (!exports.spinner_names.has(spinner_name)) {
            print_message(`Config error: '${spinner_name}' is not a valid spinner_name`, '', 'fail');
            return;
        }
        exports.SPINNER = spinner_name;
        this._spinner_name = spinner_name;
        this._triggerListener();
    }
    get save_token() {
        return this._save_token;
    }
    set save_token(save_token) {
        if (typeof save_token !== 'boolean')
            return;
        this._save_token = save_token;
        this._triggerListener();
    }
    get auto_acl() {
        return this._auto_acl;
    }
    set auto_acl(auto_acl) {
        if (typeof auto_acl !== 'boolean')
            return;
        this._auto_acl = auto_acl;
        this._triggerListener();
    }
    get verbose() {
        return this._verbose;
    }
    set verbose(verbose) {
        if (typeof verbose !== 'boolean')
            return;
        exports.VERBOSE = verbose;
        this._verbose = verbose;
        this._triggerListener();
    }
    get check_update() {
        return this._check_update;
    }
    set check_update(check_update) {
        if (typeof check_update !== 'boolean')
            return;
        this._check_update = check_update;
        this._triggerListener();
    }
    get contact() {
        return this._contact;
    }
    set contact(contact) {
        if (typeof contact !== 'object')
            return;
        this._contact = contact;
        this._triggerListener();
    }
    get cloning_options() {
        return this._cloning_options;
    }
    set cloning_options(cloning_options) {
        if (typeof cloning_options !== 'object')
            return;
        this._cloning_options = cloning_options.filter((val) => {
            if (/[$`|><;]/.test(val)) {
                // prettier-ignore
                print_message('Config error: ' + JSON.stringify(val) + ' contains banned characters. eg: $`|><;', '', 'fail');
                return false;
            }
            if (!val)
                return false;
            return true;
        });
        this._triggerListener();
    }
    get colors() {
        return this._colors;
    }
    set colors(colors) {
        // TODO: parse & check if is valid color
        COLORS = colors;
        this._colors = colors;
        this._triggerListener();
    }
}
exports.ConfigType = ConfigType;
function open_config() {
    let config;
    try {
        if (fs_1.default.existsSync(CONFIG_PATH)) {
            const config_file = fs_1.default.readFileSync(CONFIG_PATH, 'utf8');
            config = JSON.parse(config_file);
        }
        else {
            config = {};
        }
    }
    catch (err) {
        print_message('Fail to open config file', err, 'error');
    }
    return parse_config(config);
}
exports.open_config = open_config;
function parse_config(config) {
    const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})');
    const new_config = new ConfigType();
    // TODO: move email & color parse in getter / setter
    if (config?.email && regex_email.test(config.email)) {
        new_config.email = config.email;
    }
    new_config.token = config?.token;
    new_config.spinner_name = config?.spinner_name;
    new_config.save_token = config?.save_token;
    new_config.auto_acl = config?.auto_acl;
    new_config.verbose = config?.verbose;
    new_config.check_update = config?.check_update;
    new_config.contact = config?.contact;
    new_config.cloning_options = config?.cloning_options;
    if (config?.colors) {
        clor.getColorsKey().forEach((key) => {
            if (exports.colorsValue.has(config.colors[key])) {
                true;
                new_config.colors[key] = config.colors[key];
            }
        });
    }
    new_config.addListener(write_config);
    return new_config;
}
async function write_config(config_info) {
    if (config_info && !config_info.save_token) {
        config_info.token = undefined;
    }
    try {
        if (!fs_1.default.existsSync(CONFIG_FOLDER)) {
            fs_1.default.mkdirSync(CONFIG_FOLDER, { recursive: true });
        }
        const config_json = JSON.stringify(config_info, undefined, 4);
        fs_1.default.writeFileSync(CONFIG_PATH, config_json, 'utf8');
    }
    catch (err) {
        print_message('Fail to save config file', err, 'error');
    }
}
exports.write_config = write_config;
function print_message(title, message, level) {
    if (level === 'error') {
        console.error(chalk_1.default.redBright.bold(title));
        throw new Error(chalk_1.default.redBright(message));
    }
    else if (level === 'fail') {
        if (message) {
            console.error(chalk_1.default.redBright.bold(title));
            console.error(chalk_1.default.redBright(message));
        }
        else {
            console.error(chalk_1.default.redBright.bold(title));
        }
    }
    else {
        if (message) {
            console.log(chalk_1.default.greenBright.bold(title));
            console.log(chalk_1.default.greenBright(message));
        }
        else {
            console.log(chalk_1.default.green(title));
        }
    }
}
exports.print_message = print_message;
async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            if (err)
                reject(err);
            else
                resolve({ stdout, stderr });
        });
    });
}
exports.sh = sh;
async function sh_live(cmd) {
    return new Promise(function (resolve, reject) {
        const child = (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            if (err)
                reject(err);
            else
                resolve({ stdout, stderr });
        });
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
    });
}
exports.sh_live = sh_live;
async function sh_callback(cmd, callback) {
    return new Promise(function (resolve, reject) {
        const child = (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            if (err)
                reject(err);
            else
                resolve({ stdout, stderr });
        });
        child.stdin?.on('data', (data) => {
            if (callback)
                callback('stdin', data);
        });
        child.stdout?.on('data', (data) => {
            if (callback)
                callback('stdout', data);
        });
        child.stderr?.on('data', (data) => {
            if (callback)
                callback('stderr', data);
        });
    });
}
exports.sh_callback = sh_callback;
function resolveAfter(x) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(x);
        }, x);
    });
}
exports.resolveAfter = resolveAfter;
async function get_app_version() {
    try {
        if (exports.IS_DEBUG) {
            const res = await sh(`cd ${__dirname}; git show --format="%H" --no-patch | git describe --tags`);
            return res.stdout.split('\n')[0] || 'v0.0.0';
        }
        else {
            const package_file = fs_1.default.readFileSync(PACKAGE_PATH, 'utf8');
            const package_obj = JSON.parse(package_file);
            return 'v' + package_obj?.version;
        }
    }
    catch (err) {
        return 'v0.0.0';
    }
}
function get_is_debug_build() {
    return fs_1.default.existsSync(`${__dirname}/../.npmignore`);
}
