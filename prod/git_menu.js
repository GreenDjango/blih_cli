"use strict";
/*
TODO:
import ora from 'ora'
import chalk from 'chalk'
import { homedir } from 'os'
import fs from 'fs'
import { BlihApi } from './blih_api'
import { ask_list, ask_question, ask_path, ask_input } from './ui'
import { WAIT_MSG, sh } from './utils'

const HOME_DIR = homedir()

export async function git_menu(api: BlihApi) {
    let should_quit = false

    while (!should_quit) {
        const choices = ['↵ Back', 'Git clone my repo', 'Other repo']
        const choice = await ask_list(choices, 'Repository')
        switch (choice) {
            case choices[1]:
                await add_key(api)
                break
            case choices[2]:
                await delete_key(api)
                break
            case choices[0]:
            default:
                should_quit = true
        }
    }
}

async function add_key(api: BlihApi) {
    const new_ssh = await ask_question('Create new ssh key ?')
    const spinner = ora()
    spinner.color = 'blue'

    try {
        let path = ''
        if (new_ssh) {
            let name = 'epitech_key'
            if (fs.existsSync(`${HOME_DIR}/.ssh/${name}.pub`)) {
                do {
                    name = await ask_input(`${name} already exist, new Key name ?`)
                } while (fs.existsSync(`${HOME_DIR}/.ssh/${name}.pub`))
            }
            if (!fs.existsSync(`${HOME_DIR}/.ssh`)) {
                fs.mkdirSync(`${HOME_DIR}/.ssh`)
            }
            spinner.start(chalk.green(WAIT_MSG))
            await sh(`ssh-keygen -f ${HOME_DIR}/.ssh/${name} -N ""`)
            await sh(`ssh-add ${HOME_DIR}/.ssh/${name}`)
            path = `${HOME_DIR}/.ssh/${name}.pub`
        } else {
            const input = await ask_path('Ssh key path:', '\\.pub$', `${HOME_DIR}/`)
            spinner.info(chalk.blue('Use `ssh-add ' + input + '` for enable the key'))
            path = input
            spinner.start(chalk.green(WAIT_MSG))
        }
        let key = fs.readFileSync(path, 'utf8')
        key = key.replace('\n', '')
        const res = await api.uploadKey(key)
        spinner.succeed(chalk.green(res))
    } catch (err) {
        spinner.fail(chalk.red(err))
    }
}

async function delete_key(api: BlihApi) {
    const spinner = ora().start(chalk.green(WAIT_MSG))
    spinner.color = 'blue'

    try {
        const key_list = await api.listKeys()
        spinner.stop()
        const choice = await ask_list(
            ['↵ Back', ...key_list.map(value => value.name + ' ...' + value.data.substr(-20))],
            'Select a key'
        )
        if (choice === '↵ Back' || !(await ask_question('Are you sure ?'))) return
        const key = choice.split(' ')[0]
        spinner.start(chalk.green(WAIT_MSG))
        const res = await api.deleteKey(key)
        spinner.succeed(chalk.green(res))
    } catch (err) {
        spinner.fail(chalk.red(err))
    }
}

async function show_key(api: BlihApi) {
    const spinner = ora().start(chalk.green(WAIT_MSG))
    spinner.color = 'blue'

    try {
        const key_list = await api.listKeys()
        spinner.stop()
        const idx = await ask_list(
            ['↵ Back', ...key_list.map(value => value.name + ' ...' + value.data.substr(-20))],
            undefined,
            true
        )
        if (idx === '0') return
        const key = key_list[+idx - 1]
        spinner.info(chalk.blue(`Name:		${key.name}` + `\n  Data:		${key.data}`))
    } catch (err) {
        spinner.fail(chalk.red(err))
    }
}
*/
