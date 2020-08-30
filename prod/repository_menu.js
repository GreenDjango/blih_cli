"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acl_menu = exports.create_repo = exports.repo_menu = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ui_1 = require("./ui");
const markdown_parser_1 = require("./markdown_parser");
const utils_1 = require("./utils");
const git_menu_1 = require("./git_menu");
async function repo_menu(api, config) {
    let should_quit = false;
    const choices = [
        '↵ Back',
        'Create repository',
        'Delete repository',
        'Change ACL',
        'Show repositories list',
        'Show repository preview',
    ];
    while (!should_quit) {
        const choice = await ui_1.ask_list(choices, 'Repository');
        switch (choice) {
            case choices[1]:
                await create_repo(api, config);
                break;
            case choices[2]:
                await delete_repo(api, config);
                break;
            case choices[3]:
                await acl_menu(api, config);
                break;
            case choices[4]:
                await show_repo_info(api, config);
                break;
            case choices[5]:
                await show_repo_preview(config);
                break;
            case choices[0]:
            default:
                should_quit = true;
        }
    }
}
exports.repo_menu = repo_menu;
async function create_repo(api, config, repo_name) {
    const input = repo_name || (await ui_1.ask_input('Repository name'));
    const spinner = ui_1.spin().start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        let res = await api.createRepository(input);
        config.repo.push(input);
        spinner.succeed(chalk_1.default.green(res));
        if (config.auto_acl) {
            spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
            res = await api.setACL(input, 'ramassage-tek', 'r');
            spinner.succeed(chalk_1.default.green(res + ' (ramassage-tek)'));
        }
        await acl_menu(api, config, input);
        if (await ui_1.ask_question(`Git clone ${input} ?`))
            await git_menu_1.clone_repo(input, config.email);
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
exports.create_repo = create_repo;
async function delete_repo(api, config) {
    const to_delete = await ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true);
    if (to_delete === '↵ Back')
        return;
    const valid = await ui_1.ask_question(`Delete ${to_delete} ?`);
    if (valid) {
        const spinner = ui_1.spin().start(chalk_1.default.green(utils_1.WAIT_MSG));
        try {
            const res = await api.deleteRepository(to_delete);
            config.repo = config.repo.filter((value) => value !== to_delete);
            spinner.succeed(chalk_1.default.green(res));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    }
}
async function acl_menu(api, config, repo_name) {
    const repo = repo_name || (await ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true));
    if (repo === '↵ Back')
        return;
    const spinner = ui_1.spin().start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        let acl_list = (await api.getACL(repo)).map((val) => to_ACL(val));
        spinner.stop();
        let acl = await change_acl(acl_list, config);
        while (acl) {
            spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
            const res = await api.setACL(repo, acl.name, acl.rights);
            acl_list = (await api.getACL(repo)).map((val) => to_ACL(val));
            spinner.succeed(chalk_1.default.green(res) + ` ${acl.name} ${acl.rights_str}`);
            acl = await change_acl(acl_list, config);
        }
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
exports.acl_menu = acl_menu;
async function change_acl(acl_list, config) {
    const ask = [
        { name: '↵ Back', value: undefined, short: '↵ Back' },
        { name: 'Add', value: 'ADD', short: 'Add' },
        ...acl_list.map((val) => {
            const to_show = `${val.name} ${val.rights_str}`;
            return { name: to_show, value: val, short: to_show };
        }),
    ];
    const acl = await ui_1.ask_list_index(ask, 'Give ACL');
    if (!acl)
        return undefined;
    if (typeof acl === 'string')
        return await ask_acl(config);
    const rights = (await ui_1.ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], acl.rights_bool, acl.name)).join('');
    return to_ACL({ name: acl.name, rights });
}
async function ask_acl(config) {
    const user = await ui_1.ask_autocomplete(['ramassage-tek', ...config.contact], 'Enter new email');
    const rights = (await ui_1.ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], [false, false, false], user)).join('');
    if (user !== 'ramassage-tek' && !config.contact.some((value) => value === user)) {
        config.contact.push(user);
        config.contact = config.contact;
    }
    return to_ACL({ name: user, rights });
}
function to_ACL(acl) {
    const new_r = {
        ...acl,
        rights_bool: [acl.rights.includes('r'), acl.rights.includes('w'), acl.rights.includes('a')],
        rights_str: chalk_1.default.bold('deleted'),
    };
    if (new_r.rights_bool[0] || new_r.rights_bool[1] || new_r.rights_bool[2]) {
        new_r.rights_str = new_r.rights_bool[0] ? chalk_1.default.bold('r') : '-';
        new_r.rights_str += new_r.rights_bool[1] ? chalk_1.default.bold('w') : '-';
        new_r.rights_str += new_r.rights_bool[2] ? chalk_1.default.bold('a') : '-';
    }
    return new_r;
}
async function show_repo_info(api, config) {
    const repo = await ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true);
    if (repo === '↵ Back')
        return;
    const spinner = ui_1.spin().start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        const repo_info = await api.repositoryInfo(repo);
        const creation_date = new Date(0);
        creation_date.setUTCSeconds(repo_info.creation_time);
        const repo_acl = (await api.getACL(repo)).map((value) => `${value.name} - ${to_ACL(value).rights_str}`);
        if (!repo_acl.length)
            repo_acl.push('no sharing');
        spinner.info(utils_1.clor.info(`Name:		${repo_info.name}` +
            `\n  Uuid:		${repo_info.uuid}` +
            `\n  Url:		${repo_info.url}` +
            `\n  Creation:	${creation_date.toLocaleString()}` +
            `\n  Public:	${repo_info.public}` +
            `\n  Share:	${repo_acl.join('\n		')}`));
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err));
    }
}
async function show_repo_preview(config) {
    const repo = await ui_1.ask_autocomplete(['↵ Back', ...config.repo], 'Select for see README.md', true);
    if (repo === '↵ Back')
        return;
    const spinner = ui_1.spin().start(chalk_1.default.green(utils_1.WAIT_MSG));
    try {
        // git_menu.tar > extract to stdout
        const remote = await utils_1.sh(`git archive --remote=git@git.epitech.eu:${config.email}/${repo} HEAD README.md | tar -xO`);
        const md_term = markdown_parser_1.md_parser(remote.stdout);
        spinner.stop();
        console.log(md_term + '\n');
    }
    catch (err) {
        if (/remote: fatal: pathspec 'README\.md' did not match any files/.test(err.message))
            spinner.fail(chalk_1.default.red("Error: 'README.md' file was not found on the repository"));
        else
            spinner.fail(chalk_1.default.red(err));
    }
}
