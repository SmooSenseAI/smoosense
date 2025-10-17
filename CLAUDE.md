# Claude Code Development Notes

This file contains development notes and reminders for Claude when working on this project.

## Project structure
There are 3 main folders of source code:
- `docs`: Docoumentation for both Claude and developers
- `landing`: The landing page.
- `smoosense-gui`: Frontend GUI
- `smoosense-py`: Python backend.

In the root folder and each sub-folder:
- `Makefile`: commands for builds and tests. They should implement the following targets:
    - `env`: install dependencies
    - `dev`: start the app for local development
    - `build`: build from source code
    - `test`: run all tests
- `CLAUDE.MD`: Memory file for Claude Code

### Build process
The `make build` command in root Makefile will do the following:

```mermaid
graph
    gui-src[gui/src] --> gui-dist[gui/dist]
    gui-dist --copy--> py-statics[py/smoosense/statics]
    py --> pip[pip artifacts: tar.gz + whl]
    py-statics --> pip
    gui-dist --copy--> node-statics[nodejs/src/statics]
    node-statics --> mac[Mac OS app: dmg]
    node --> mac
```
