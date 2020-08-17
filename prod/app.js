"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const blih_api_1 = require("./blih_api");
const ui_1 = require("./ui");
const utils_1 = require("./utils");
const git_menu_1 = require("./git_menu");
const repository_menu_1 = require("./repository_menu");
const key_menu_1 = require("./key_menu");
const timeline_menu_1 = require("./timeline_menu");
const options_menu_1 = require("./options_menu");
exports.run = async () => {
    process.title = 'blih cli';
    if (process.argv.length > 2)
        await parse_args(process.argv);
    const config = utils_1.open_config();
    if (!utils_1.IS_DEBUG && config.check_update)
        check_update(await utils_1.APP_VERSION);
    if (process.argv.length > 2)
        config.args = process.argv;
    if (config.verbose && !config.args) {
        console.log(chalk_1.default.red(`   ___  ___ __     _______   ____`));
        console.log(chalk_1.default.green(`  / _ )/ (_) /    / ___/ /  /  _/`));
        console.log(chalk_1.default.blueBright(` / _  / / / _ \\  / /__/ /___/ /`));
        console.log(chalk_1.default.yellow(`/____/_/_/_//_/  \\___/____/___/`) +
            chalk_1.default.grey.italic(`  ${await utils_1.APP_VERSION}\n`));
    }
    if (utils_1.IS_DEBUG)
        console.log(`DEBUG VERSION, skip: ${process.env.BLIH_CLI_CONFIG_SKIP}`);
    const api = await login(config);
    if (config.args)
        await fast_mode(api, config);
    process.stdin.on('keypress', async (str, key) => {
        if (key.ctrl && key.name === 'l') {
            console.clear();
        }
        //TODO if (key.name === 'escape')
    });
    let should_quit = false;
    const choices = [
        'Git clone',
        'Repositories management',
        'Keys management',
        'Timeline explorer',
        'Contacts list',
        'Options',
        'Exit',
    ];
    while (!should_quit) {
        const choice = await ui_1.ask_list(choices, "Let's do some works");
        switch (choice) {
            case choices[0]:
                await git_menu_1.git_menu(api, config);
                break;
            case choices[1]:
                await repository_menu_1.repo_menu(api, config);
                break;
            case choices[2]:
                await key_menu_1.key_menu(api);
                break;
            case choices[3]:
                await timeline_menu_1.timeline_menu(config);
                break;
            case choices[4]:
                await show_contact(config);
                break;
            case choices[5]:
                await options_menu_1.options_menu(config);
                break;
            case choices[6]:
            default:
                should_quit = true;
        }
    }
    await utils_1.write_config(config.to_json());
};
async function login(config) {
    let api;
    let error = false;
    const spinner = ora_1.default().start(chalk_1.default.green('Check Blih server...'));
    spinner.color = 'blue';
    try {
        let time = 0;
        if (!process.env.BLIH_CLI_CONFIG_SKIP)
            time = await blih_api_1.BlihApi.ping();
        spinner.succeed(chalk_1.default.green('Blih server up: ') + chalk_1.default.cyan(time + 'ms'));
    }
    catch (err) {
        spinner.stop();
        utils_1.print_message('Blih server down', '', 'fail');
        process.exit(2);
    }
    do {
        if (!config.email) {
            config.email = await ui_1.ask_email();
        }
        utils_1.print_message(`Login with: ${chalk_1.default.cyan(config.email)}`, '', 'message');
        if (!config.token) {
            config.token = blih_api_1.BlihApi.hashPassword(await ui_1.ask_password());
        }
        spinner.start(chalk_1.default.green('Try to login...'));
        try {
            api = new blih_api_1.BlihApi({ email: config.email, token: config.token });
            if (!process.env.BLIH_CLI_CONFIG_SKIP)
                config.repo = (await api.listRepositories()).map((value) => value.name);
            error = false;
            spinner.stop();
        }
        catch (err) {
            spinner.stop();
            utils_1.print_message('Fail to login', err, 'fail');
            if (err === 'Bad token')
                config.email = '';
            config.token = '';
            error = true;
        }
    } while (error || !api);
    if (config.verbose && !config.args) {
        utils_1.print_message(`Found ${chalk_1.default.cyan(config.repo.length)} repositories`, '', 'message');
    }
    return api;
}
async function show_contact(config) {
    let should_quit = false;
    while (!should_quit) {
        const choices = [...config.contact];
        choices.unshift('Add email');
        choices.unshift('↵ Back');
        const choice = await ui_1.ask_list(choices, 'Some friends (email is auto add)');
        switch (choice) {
            case choices[0]:
                should_quit = true;
                break;
            case choices[1]:
                const new_address = await ui_1.ask_email();
                if (!config.contact.some((value) => value === new_address)) {
                    config.contact.push(new_address);
                    config.contact = config.contact;
                }
                break;
            default:
                const valid = await ui_1.ask_question(`Remove ${choice} ?`);
                if (valid) {
                    config.contact = config.contact.filter((value) => value !== choice);
                }
        }
    }
}
async function fast_mode(api, config) {
    if (!config.args)
        return;
    if (config.args[2] === '-i') {
        return;
    }
    else if (config.args[2] === '-c') {
        await repository_menu_1.create_repo(api, config, config.args[3]);
    }
    else if (config.args[2] === '-a' || config.args[2].substr(0, 6) === '--acl=') {
        if (config.args[2] === '-a')
            await repository_menu_1.acl_menu(api, config, config.args[3]);
        else
            await repository_menu_1.acl_menu(api, config, config.args[2].substr(6));
    }
    else
        show_help();
}
async function parse_args(args) {
    if (args[2]) {
        if (args[2] === '-h' || args[2] === '-H' || args[2] === '--help') {
            await utils_1.sh_live('man blih_cli');
            process.exit(0);
        }
        if (args[2] === '-v' || args[2] === '-V' || args[2] === '--version') {
            console.log(await utils_1.APP_VERSION);
            process.exit(0);
        }
        if (args[2] === '-d' || args[2] === '-D' || args[2] === '--debug') {
            console.log(utils_1.IS_DEBUG ? 'true' : 'false');
            process.exit(0);
        }
        if (args[2] === '-u' || args[2] === '-U' || args[2] === '--update' || args[2] === '--UPDATE') {
            if (utils_1.IS_DEBUG)
                await utils_1.sh_live(`sudo sh ${__dirname}/../update.sh`);
            else
                console.log('Use: `sudo npm up blih_cli -g`');
            process.exit(0);
        }
        if (args[2] === '--uninstall') {
            if (utils_1.IS_DEBUG) {
                if (!(await ui_1.ask_question('Uninstall blih_cli ?')))
                    process.exit(0);
                await utils_1.sh_live(`sudo sh ${__dirname}/../uninstall.sh`);
            }
            else
                console.log('Use: `sudo npm un blih_cli -g`');
            process.exit(0);
        }
        if (!utils_1.IS_DEBUG)
            return;
        if (args[2] === '--snapshot') {
            await utils_1.sh_live(`sudo sh ${__dirname}/../update.sh snapshot`);
            process.exit(0);
        }
    }
}
function show_help() {
    ora_1.default().info(utils_1.clor.info('Invalid option\n  Usage blih_cli -[aci] [OPTION]...' + '\n  or use `man blih_cli`'));
}
function check_update(current) {
    if (os_1.default.type() === 'Linux' || os_1.default.type().match(/BSD$/)) {
        child_process_1.exec('npm v blih_cli@latest version --silent', (err, stdout, stderr) => {
            if (err || !stdout)
                return;
            if ('v' + stdout !== current) {
                // prettier-ignore
                child_process_1.exec(`notify-send "New update available" "Try 'sudo npm up blih_cli -g' to update" -i "${__dirname}/../logo.png" -a "blih cli" -t 10000`);
            }
        });
    }
}
