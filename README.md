# Blih CLI

[![release][1]][2] [![workflow][3]][4] ![size][20] [![issues][5]][6] [![license][7]][8]

Blih CLI (say blikli) is the Blih (Bocal Lightweight Interface for Humans) Js CLI (Command-Line Interface) for linux env.

![alt text](demo.gif 'Demo bonus')

## Install & Setup

1. Install node https://nodejs.org/en/ (use `sudo apt-get node` for ubuntu or `sudo dnf install node` for fedora)
2. `git clone https://github.com/GreenDjango/blih_cli`
3. `sudo sh blih_cli/install.sh`
4. `rm -rf blih_cli/`
5. Enjoy with `blih_cli` !
6. Optional: add `alias my_name="blih_cli"` in .bashrc file

## Update

Use `blih_cli -u` for up to next **stable** version

Use `blih_cli --snapshot` for up to the next **snapshot** version.
This version can crash. Use only if you want to test the new features

## Help

Use `man blih_cli` for show help

## Uninstall

Use `blih_cli --uninstall` for uninstall blih_cli from

---

## Dev

```
git clone https://github.com/GreenDjango/blih_cli
cd blih_cli
npm i
npm run build
./build/index.js
```

#### Lint

```
npm run lint
```

#### Build

```
npm run build
```

#### Production

```
npm run prod
```

[1]: https://img.shields.io/github/v/release/GreenDjango/blih_cli?maxAge=600
[2]: http://commonmark.org 'GitHub release (latest by date)'
[3]: https://img.shields.io/github/workflow/status/GreenDjango/blih_cli/Node.js%20CI?maxAge=600
[4]: http://commonmark.org 'GitHub Workflow Status'
[5]: https://img.shields.io/github/issues-closed/GreenDjango/blih_cli?maxAge=600
[6]: http://commonmark.org 'GitHub closed issues'
[7]: https://img.shields.io/github/license/GreenDjango/blih_cli?maxAge=2592000
[8]: http://commonmark.org 'GitHub license'
[20]: https://img.shields.io/github/repo-size/GreenDjango/blih_cli?maxAge=600  'GitHub repo size'
