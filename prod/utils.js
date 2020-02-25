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
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const os_1 = require("os");
const CONFIG_FOLDER = os_1.homedir() + '/.config/blih_cli';
const CONFIG_FILE = '.cli_data.json';
const CONFIG_PATH = `${CONFIG_FOLDER}/${CONFIG_FILE}`;
exports.APP_VERSION = '0.1.0';
exports.WAIT_MSG = 'Process...';
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
    const new_config = {
        email: '',
        token: '',
        save_token: false,
        auto_acl: true,
        contact: [],
        repo: [],
    };
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
    if (config.contact) {
        new_config.contact = config.contact;
    }
    return new_config;
}
function write_config(config) {
    if (!config.save_token) {
        config.token = undefined;
    }
    config.repo = undefined;
    try {
        if (!fs_1.default.existsSync(CONFIG_FOLDER)) {
            fs_1.default.mkdirSync(CONFIG_FOLDER, { recursive: true });
        }
        const config_json = JSON.stringify(config, undefined, 4);
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
