# Groot

Groot is a basic version control system that allows users to track changes in their files and manage project versions. It's inspired by popular version control systems like Git, but with a simplified set of commands.

## Features

- Initialize a new repository
- Stage files for commit
- Commit changes with a message
- View commit history
- Show details of a specific commit

## Installation

To use Groot, clone the repository and add the executable to your PATH.

```bash
git clone https://github.com/yourusername/groot.git
cd groot
```

## Usage

Groot provides several commands to manage your project versions. Below are the available commands and their usage:

### Initialize Repository

Initialize a new repository in the current directory.

```bash
groot init
```

### Add Files

Stage files to be committed.

```bash
groot add <file>
```

### Commit Changes

Commit the staged files with a message.

```bash
groot commit <message>
```

### View Commit History

Show the Commit History

```bash
groot log
```

### Show Commit Details

Show the details of specific commit.

```bash 
groot show <commitHash>
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

