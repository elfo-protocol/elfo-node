# Subrina Node CLI

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g subrina-node
$ subrina COMMAND
running command...
$ subrina (--version)
subrina-node/0.0.0 linux-x64 node-v16.14.0
$ subrina --help [COMMAND]
USAGE
  $ subrina COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`subrina config`](#subrina-config)
* [`subrina register`](#subrina-register)
* [`subrina monitor`](#subrina-monitor)

## `subrina config`

configure subrina node

```
USAGE
  $ subrina config

DESCRIPTION
  configure subrina node

EXAMPLES
  $ subrina config
```

## `subrina register`

register subrina node

```
USAGE
  $ subrina register [-f]

FLAGS
  -f, --force  force re-register

DESCRIPTION
  register subrina node

EXAMPLES
  $ subrina register

  $ subrina register --force
```

## `subrina monitor`

monitor subscription plans and trigger payments

```
USAGE
  $ subrina monitor [-l <value>] [-s <value>]

FLAGS
  -l, --list=<value>    a txt file with a list of subscription plan account public keys
  -s, --single=<value>  a subscription plan account public key

DESCRIPTION
  monitor a list of subscription plans and trigger payments

EXAMPLES
  $ subrina monitor --list ~/subscriptin-plans-to-monitor.txt

  $ subrina monitor --single BJwb4SgNxDL9se5ZzZJ58ub9Adcj2XNfRs8GgVXKybyu

  $ subrina monitor
```

<!-- commandsstop -->