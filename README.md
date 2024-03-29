# Blih CLI

[![release][1]][2] [![npm][11]][12] [![workflow][3]][4] [![CodeFactor][9]][10] [![size][20]][21] [![issues][5]][6] [![license][7]][8]

Blih CLI (say blikli) is the Blih (Bocal Lightweight Interface for Humans) Js CLI (Command-Line Interface) for linux env.

![alt text](demo.gif 'Demo bonus')

## 💾 Install & Setup

⚠️ Install [node](https://nodejs.org/en/) & npm (use `apt install nodejs npm` for ubuntu
or `dnf install nodejs` for fedora)

#### 👶 Easy mode
1. `npm i blih_cli -g`

#### 👨‍💻 Expert mode
1. `git clone https://github.com/GreenDjango/blih_cli`
2. `sudo sh blih_cli/install.sh`
3. `rm -rf blih_cli/`

Enjoy with `blih_cli` or `bcli` !<br>Optional: add `alias my_name="blih_cli"` in .bashrc file

## 🔄 Update

#### With npm

`npm up blih_cli -g`

#### With expert mode install

Use `blih_cli -u` for up to next **stable** version

Use `blih_cli --snapshot` for up to the next **snapshot** version.
This version can crash. Use only if you want to test the new features

## 🦺 Help

Use `man blih_cli` for show help

## 💣 Uninstall

#### With npm

`npm un blih_cli -g`

#### With expert mode install

Use `blih_cli --uninstall` for uninstall blih_cli from

---

## 💻 Dev

![GitHub package.json version](https://img.shields.io/github/package-json/v/GreenDjango/blih_cli) ➡️ ![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/GreenDjango/blih_cli) ➡️ [![release][1]][2] ➡️ [![npm][11]][12]

```
git clone https://github.com/GreenDjango/blih_cli
cd blih_cli
npm i
npm run build:dev
npm run dev
```

#### Lint

```
npm run lint
npm run typescript:check
npm run prettier:diff
```

#### Build

```
npm run build:prod
```

[1]: https://img.shields.io/github/v/release/GreenDjango/blih_cli?maxAge=600
[2]: https://github.com/GreenDjango/blih_cli/releases 'GitHub release (latest by date)'
[3]: https://img.shields.io/github/actions/workflow/status/GreenDjango/blih_cli/node-ci.yml?maxAge=600
[4]: https://github.com/GreenDjango/blih_cli/actions 'GitHub Workflow Status'
[5]: https://img.shields.io/github/issues-closed/GreenDjango/blih_cli?maxAge=600
[6]: https://github.com/GreenDjango/blih_cli/issues 'GitHub closed issues'
[7]: https://img.shields.io/github/license/GreenDjango/blih_cli?maxAge=2592000
[8]: https://github.com/GreenDjango/blih_cli/blob/master/LICENSE 'GitHub license'
[9]: https://www.codefactor.io/repository/github/greendjango/blih_cli/badge
[10]: https://www.codefactor.io/repository/github/greendjango/blih_cli 'Repository code rating'
[11]: https://img.shields.io/npm/v/blih_cli?maxAge=600
[12]: https://www.npmjs.com/package/blih_cli 'npm version'
[20]: https://img.shields.io/github/repo-size/GreenDjango/blih_cli?maxAge=600
[21]: https://github.com/GreenDjango/blih_cli 'GitHub repo size'
