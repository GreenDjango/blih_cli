"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.key_menu = void 0;
const chalk_1 = __importDefault(require("chalk"));
const os_1 = require("os");
const fs_1 = __importDefault(require("fs"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
const HOME_DIR = (0, os_1.homedir)();
async function key_menu(api) {
    let should_quit = false;
    const choices = [
        '↵ Back',
        'Add key',
        'Delete key',
        'Show keys list',
        'Add Epitech to known hosts',
    ];
    while (!should_quit) {
        const choice = await (0, ui_1.ask_list)(choices, 'Manage your SSH keys');
        switch (choice) {
            case choices[1]:
                await add_key(api);
                break;
            case choices[2]:
                await delete_key(api);
                break;
            case choices[3]:
                await show_key(api);
                break;
            case choices[4]:
                await add_host();
                break;
            case choices[0]:
            default:
                should_quit = true;
        }
    }
}
exports.key_menu = key_menu;
async function add_key(api) {
    const new_ssh = await (0, ui_1.ask_question)('Create new ssh key ?');
    const spinner = (0, ui_1.spin)({ color: 'blue' });
    try {
        let path = '';
        if (new_ssh) {
            let name = 'epitech_key';
            if (fs_1.default.existsSync(`${HOME_DIR}/.ssh/${name}.pub`)) {
                do {
                    name = await (0, ui_1.ask_input)(`${name} already exist, new Key name ?`);
                } while (fs_1.default.existsSync(`${HOME_DIR}/.ssh/${name}.pub`));
            }
            if (!fs_1.default.existsSync(`${HOME_DIR}/.ssh`)) {
                fs_1.default.mkdirSync(`${HOME_DIR}/.ssh`);
            }
            spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
            await (0, utils_1.sh)(`ssh-keygen -f ${HOME_DIR}/.ssh/${name} -N ""`);
            await (0, utils_1.sh)(`ssh-add ${HOME_DIR}/.ssh/${name}`);
            path = `${HOME_DIR}/.ssh/${name}.pub`;
        }
        else {
            path = await (0, ui_1.ask_path)('Ssh key path:', '\\.pub$', `${HOME_DIR}/`);
            spinner.info(utils_1.clor.info('Use `ssh-add ' + path + '` for enable the key'));
            spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
        }
        let key = fs_1.default.readFileSync(path, 'utf8');
        key = key.replace('\n', '');
        const res = await api.uploadKey(key);
        spinner.succeed(chalk_1.default.green(res));
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
async function delete_key(api) {
    const spinner = (0, ui_1.spin)({ color: 'blue' }).start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        const key_list = await api.listKeys();
        spinner.stop();
        const choice = await (0, ui_1.ask_list)(['↵ Back', ...key_list.map((value) => value.name + ' ...' + value.data.substr(-20))], 'Select a key');
        if (choice === '↵ Back' || !(await (0, ui_1.ask_question)('Are you sure ?')))
            return;
        const key = choice.split(' ')[0];
        if (key === undefined)
            return;
        spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
        const res = await api.deleteKey(key);
        spinner.succeed(chalk_1.default.green(res));
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
async function show_key(api) {
    const spinner = (0, ui_1.spin)({ color: 'blue' }).start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        const key_list = await api.listKeys();
        spinner.stop();
        const idx = await (0, ui_1.ask_list)(['↵ Back', ...key_list.map((value) => value.name + ' ...' + value.data.substr(-20))], undefined, true);
        if (idx === '0')
            return;
        const key = key_list[+idx - 1];
        spinner.info(utils_1.clor.info(`Name:		${key?.name}` + `\n  Data:		${key?.data}`));
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
async function add_host() {
    const spinner = (0, ui_1.spin)({ color: 'blue' }).start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        await (0, utils_1.sh)('ssh -o StrictHostKeyChecking=no git@git.epitech.eu uptime; [ 128 = $? ]');
        spinner.succeed(chalk_1.default.green("'git.epitech.eu' add to known hosts"));
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
