## Uptime checker 🔺🔻 🖥️🔍

Uptime checker is an app for monitoring your sites or APIs, checking their current state whether are UP 🔺 or DOWN 🔻 and notifying you via text messsage every time something happens, another feature you can enjoy is saving all the logs generated during the monitoring and recieve a compressed report of the last 24 hrs logs

This project was build for educational purposes, using  ![node](https://img.shields.io/static/v1?label=Node&message=v.16.13.0&color=green) to run this project just need to execute `node index.mjs`, no need to install dependencies because everything was build from scratch.

### Uptime checker CLI

| Command      | Description     
|--------------|-----------|
| `exit`        | Kill the cli and the rest of the application|
| `man`          | Shows help |
| `help`         | Alias of the "man" command |
| `stats`        | Get statistics on the underlying operating system and resourse utilization |
| `list users`   | Show a list of all the registered (undeleted) users in the system |
| `more user info` `--{userId}` | Show details of a specific user |
| `list checks` `--up` `--down`   | Show a list of all the active checks in the system, including their state. The "--up" and the "--down" flags are both optional |
| `more check info` `--{checkId}`| Show details of a specified check |
| `list logs`    | Show a list of all the log files available to be read (compressed) |
| `more log info` `--{filename}` | Show details of a specified log file |

Developent in progress! 👨‍💻 ⚙️ </>
