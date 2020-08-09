"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sh_live = exports.sh = exports.print_message = exports.write_config = exports.open_config = exports.ConfigType = exports.clor = exports.colorsValue = exports.VERBOSE = exports.WAIT_MSG = exports.APP_VERSION = exports.IS_DEBUG = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const os_1 = require("os");
const CONFIG_FOLDER = os_1.homedir() + '/.config/blih_cli';
const CONFIG_FILE = '.cli_data.json';
const CONFIG_PATH = `${CONFIG_FOLDER}/${CONFIG_FILE}`;
const PACKAGE_PATH = `${__dirname}/../package.json`;
let COLORS = { info: 'blue' };
exports.IS_DEBUG = get_is_debug_build();
exports.APP_VERSION = get_app_version();
exports.WAIT_MSG = 'Process...';
exports.VERBOSE = true;
exports.colorsValue = new Set([
    'black',
    'blackBright',
    'blue',
    'blueBright',
    'cyan',
    'cyanBright',
    'green',
    'greenBright',
    'grey',
    'magenta',
    'magentaBright',
    'red',
    'redBright',
    'white',
    'whiteBright',
    'yellow',
    'yellowBright',
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
        this._save_token = false;
        this._auto_acl = true;
        this._verbose = true;
        this._contact = [];
        this._colors = COLORS;
        this.args = null;
        this.repo = [];
    }
    to_json() {
        return {
            email: this.email,
            token: this.token,
            save_token: this.save_token,
            auto_acl: this.auto_acl,
            verbose: this.verbose,
            contact: this.contact,
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
        this._token = token;
        this._triggerListener();
    }
    get save_token() {
        return this._save_token;
    }
    set save_token(save_token) {
        this._save_token = save_token;
        this._triggerListener();
    }
    get auto_acl() {
        return this._auto_acl;
    }
    set auto_acl(auto_acl) {
        this._auto_acl = auto_acl;
        this._triggerListener();
    }
    get verbose() {
        return this._verbose;
    }
    set verbose(verbose) {
        exports.VERBOSE = verbose;
        this._verbose = verbose;
        this._triggerListener();
    }
    get contact() {
        return this._contact;
    }
    set contact(contact) {
        this._contact = contact;
        this._triggerListener();
    }
    get colors() {
        return this._colors;
    }
    set colors(colors) {
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
    if (config.email && regex_email.test(config.email)) {
        new_config.email = config.email;
    }
    if (config.token) {
        new_config.token = config.token;
    }
    if (config.save_token) {
        new_config.save_token = true;
    }
    if (config.auto_acl === false) {
        new_config.auto_acl = false;
    }
    if (config.verbose === false) {
        new_config.verbose = false;
    }
    if (config.contact) {
        new_config.contact = config.contact;
    }
    if (config.colors) {
        clor.getColorsKey().forEach((key) => {
            if (exports.colorsValue.has(config.colors[key])) {
                ;
                new_config.colors[key] = config.colors[key];
            }
        });
    }
    new_config.addListener(write_config);
    return new_config;
}
function write_config(config_info) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
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
function sh(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            child_process_1.exec(cmd, (err, stdout, stderr) => {
                if (err)
                    reject(err);
                else
                    resolve({ stdout, stderr });
            });
        });
    });
}
exports.sh = sh;
function sh_live(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            var _a, _b;
            const child = child_process_1.exec(cmd, (err, stdout, stderr) => {
                if (err)
                    reject(err);
                else
                    resolve({ stdout, stderr });
            });
            //process.stdin?.on()
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
                process.stdout.write(data);
            });
            (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    });
}
exports.sh_live = sh_live;
function get_app_version() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (exports.IS_DEBUG) {
                const res = yield sh(`cd ${__dirname}; git show --format="%H" --no-patch | git describe --tags`);
                return res.stdout.split('\n')[0] || 'v0.0.0';
            }
            else {
                const package_file = fs_1.default.readFileSync(PACKAGE_PATH, 'utf8');
                const package_obj = JSON.parse(package_file);
                return 'v' + (package_obj === null || package_obj === void 0 ? void 0 : package_obj.version);
            }
        }
        catch (err) {
            return 'v0.0.0';
        }
    });
}
function get_is_debug_build() {
    return fs_1.default.existsSync(`${__dirname}/../.npmignore`);
}
