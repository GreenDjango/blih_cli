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
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const blih_api_1 = require("./blih_api");
const ui_1 = require("./ui");
const utils_1 = require("./utils");
const git_menu_1 = require("./git_menu");
const repository_menu_1 = require("./repository_menu");
const key_menu_1 = require("./key_menu");
exports.run = () => __awaiter(void 0, void 0, void 0, function* () {
    if (process.argv.length > 2)
        yield parse_args(process.argv);
    const config = utils_1.open_config();
    if (process.argv.length > 2)
        config.args = process.argv;
    if (config.verbose && !config.args) {
        console.log(chalk_1.default.red(`   ___  ___ __     _______   ____`));
        console.log(chalk_1.default.green(`  / _ )/ (_) /    / ___/ /  /  _/`));
        console.log(chalk_1.default.blueBright(` / _  / / / _ \\  / /__/ /___/ /`));
        console.log(chalk_1.default.yellow(`/____/_/_/_//_/  \\___/____/___/`) +
            chalk_1.default.grey.italic(`  ${yield utils_1.APP_VERSION}\n`));
    }
    const api = yield login(config);
    if (config.args)
        yield fast_mode(api, config);
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'l')
            console.clear();
    });
    let should_quit = false;
    while (!should_quit) {
        const choice = yield ui_1.ask_list(['Git clone', 'Repositories management', 'Key management', 'Contact', 'Option', 'Exit'], "Let's do some works");
        if (!config.verbose)
            ui_1.clear_line(true);
        switch (choice) {
            case 'Git clone':
                yield git_menu_1.git_menu(api, config);
                break;
            case 'Repositories management':
                yield repository_menu_1.repo_menu(api, config);
                break;
            case 'Key management':
                yield key_menu_1.key_menu(api);
                break;
            case 'Contact':
                yield show_contact(config);
                break;
            case 'Option':
                yield option_menu(config);
                break;
            case 'Exit':
            default:
                should_quit = true;
        }
    }
    yield utils_1.write_config(config.to_json());
});
function login(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let api = new blih_api_1.BlihApi({ email: '1', password: '1' });
        let error = false;
        const spinner = ora_1.default().start(chalk_1.default.green('Check Blih server...'));
        spinner.color = 'blue';
        try {
            const time = yield api.ping();
            spinner.succeed(chalk_1.default.green('Blih server up: ') + chalk_1.default.cyan(time + 'ms'));
        }
        catch (err) {
            spinner.stop();
            utils_1.print_message('Blih server down', '', 'fail');
            process.exit(2);
        }
        do {
            if (!config.email) {
                config.email = yield ui_1.ask_email();
            }
            utils_1.print_message(`Login with: ${chalk_1.default.cyan(config.email)}`, '', 'message');
            if (!config.token) {
                config.token = api.hashPassword(yield ui_1.ask_password());
            }
            spinner.start(chalk_1.default.green('Try to login...'));
            try {
                api = new blih_api_1.BlihApi({ email: config.email, token: config.token });
                config.repo = (yield api.listRepositories()).map(value => value.name);
                error = false;
                spinner.stop();
            }
            catch (err) {
                spinner.stop();
                utils_1.print_message('Fail to login', err, 'fail');
                config.email = '';
                config.token = '';
                error = true;
            }
        } while (error);
        if (config.verbose && !config.args) {
            utils_1.print_message(`Found ${chalk_1.default.cyan(config.repo.length)} repositories`, '', 'message');
        }
        return api;
    });
}
function show_contact(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        while (!should_quit) {
            const choices = [...config.contact];
            choices.unshift('Add email');
            choices.unshift('↵ Back');
            const choice = yield ui_1.ask_list(choices, 'Some friends (email is auto add)');
            switch (choice) {
                case choices[0]:
                    should_quit = true;
                    break;
                case choices[1]:
                    const new_address = yield ui_1.ask_email();
                    if (!config.contact.some(value => value === new_address)) {
                        config.contact.push(new_address);
                    }
                    break;
                default:
                    const valid = yield ui_1.ask_question(`Remove ${choice} ?`);
                    if (valid) {
                        config.contact = config.contact.filter(value => value !== choice);
                    }
            }
        }
    });
}
function option_menu(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        while (!should_quit) {
            const choices = [
                '↵ Back',
                `Remember password: ${config.save_token ? chalk_1.default.green.bold('✔') : chalk_1.default.red.bold('✗')}`,
                `Auto Ramassage-tek ACL: ${config.auto_acl ? chalk_1.default.green.bold('✔') : chalk_1.default.red.bold('✗')}`,
                `Mode verbose: ${config.verbose ? chalk_1.default.green.bold('✔') : chalk_1.default.red.bold('✗')}`,
                'Reset all contact',
            ];
            const choice = yield ui_1.ask_list(choices, 'You want options ?');
            switch (choice) {
                case choices[1]:
                    config.save_token = !config.save_token;
                    break;
                case choices[2]:
                    config.auto_acl = !config.auto_acl;
                    break;
                case choices[3]:
                    config.verbose = !config.verbose;
                    break;
                case choices[4]:
                    const valid = yield ui_1.ask_question(`Are you sure ?`);
                    if (valid)
                        config.contact = [];
                    break;
                case choices[0]:
                default:
                    should_quit = true;
            }
        }
    });
}
function fast_mode(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config.args)
            return;
        if (config.args[2] === '-i') {
            return;
        }
        else if (config.args[2] === '-c') {
            yield repository_menu_1.create_repo(api, config, config.args[3]);
        }
        else if (config.args[2] === '-a' || config.args[2].substr(0, 6) === '--acl=') {
            if (config.args[2] === '-a')
                yield repository_menu_1.change_acl(api, config, config.args[3]);
            else
                yield repository_menu_1.change_acl(api, config, config.args[2].substr(6));
        }
        else
            show_help();
    });
}
function parse_args(args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (args[2]) {
            if (args[2] === '-h' || args[2] === '-H' || args[2] === '--help') {
                yield utils_1.sh_live('man blih_cli');
                process.exit(0);
            }
            if (args[2] === '-v' || args[2] === '-V' || args[2] === '--version') {
                console.log(yield utils_1.APP_VERSION);
                process.exit(0);
            }
            if (args[2] === '-u' || args[2] === '-U' || args[2] === '--update' || args[2] === '--UPDATE') {
                yield utils_1.sh_live(`sudo sh ${__dirname}/../update.sh`);
                process.exit(0);
            }
            if (args[2] === '--snapshot') {
                yield utils_1.sh_live(`sudo sh ${__dirname}/../update.sh snapshot`);
                process.exit(0);
            }
            if (args[2] === '--uninstall') {
                if (!(yield ui_1.ask_question('Uninstall blih_cli ?')))
                    process.exit(0);
                yield utils_1.sh_live(`sudo sh ${__dirname}/../uninstall.sh`);
                process.exit(0);
            }
        }
    });
}
function show_help() {
    ora_1.default().info(chalk_1.default.blue('Invalid option\n  Usage blih_cli -[aci] [OPTION]...' + '\n  or use `man blih_cli`'));
}
