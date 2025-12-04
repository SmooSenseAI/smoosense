You can install SmooSense to your laptop to keep your data private and secure.

# CLI Installation

First, install [uv](https://docs.astral.sh/uv/) (an extremely fast Python package manager):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
Restart terminal if you just installed `uv`. 

Install Smoosense CLI using `uv`:

```bash
uv tool install -U smoosense
```

## Usage

To run SmooSense, go to the folder containing your data files and simply run command:

```bash
sense # Open FolderBrowser for PWD
sense folder /path/to/folder # Open FolderBrowser with the given path as root folder.
sense table /path/to/file # Open Table for the given file

```

## Configure your data and/or authentication
Follow [Doc/Configuration](/docs/configuration/) to set up image/video urls and authentication.