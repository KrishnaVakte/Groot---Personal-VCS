#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

class Groot {
    constructor(repoPath = '.') {
        this.repoPath = path.join(repoPath, '.groot');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, "HEAD");
        this.indexPath = path.join(this.repoPath, "index");
        this.init();
    }

    async init() {
        await fs.mkdir(this.objectsPath, { recursive: true });
        try {
            await fs.writeFile(this.headPath, '', { flag: 'wx' });  //wx: open for writing, fails if file already exists
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' });
        } catch (error) {
            console.log('Already Initialized the .groot folder.');
        }
    }

    hashObject(content) {
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
    }

    async add(fileToBeAdded) {
        const fileData = await fs.readFile(fileToBeAdded, { encoding: "utf-8" });
        const fileHash = this.hashObject(fileData);
        console.log(fileHash);
        const newFileHashObjectPath = path.join(this.objectsPath, fileHash);
        await fs.writeFile(newFileHashObjectPath, fileData);
        await this.updateStagingArea(fileToBeAdded, fileHash);

        console.log(`Added ${fileToBeAdded}`);
    }

    async updateStagingArea(filePath, fileHash) {
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
        index.push({ path: filePath, hash: fileHash });
        await fs.writeFile(this.indexPath, JSON.stringify(index));
    }

    async commit(message) {
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
        const parentCommit = await this.getCurrentHead();

        const commitData = {
            timeStamp: new Date().toISOString(),
            message,
            files: index,
            parent: parentCommit
        }

        const commitHash = this.hashObject(JSON.stringify(commitData));
        const commitPath = path.join(this.objectsPath, commitHash);
        await fs.writeFile(commitPath, JSON.stringify(commitData));
        await fs.writeFile(this.headPath, commitHash);
        await fs.writeFile(this.indexPath, JSON.stringify([]));
        console.log(`Commit successfully created: ${commitHash}`);
    }

    async getCurrentHead() {
        try {
            return await fs.readFile(this.headPath, { encoding: "utf-8" });
        } catch (error) {
            return null;
        }
    }

    async log() {
        let currentCommitHash = await this.getCurrentHead();
        while (currentCommitHash) {
            const commitData = JSON.parse(await this.getCommitData(currentCommitHash));
            console.log(`----------------------------------------------\n`);
            console.log(`Commit: ${currentCommitHash}\nDate: ${commitData.timeStamp}\n\n${commitData.message}\n\n`);

            currentCommitHash = commitData.parent;
        }
    }

    async showCommitDiff(commitHash) {
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if (!commitData) {
            console.log("Commit not found.");
            return;
        }
        console.log("Changes in the last commit are: ");

        for (const file of commitData.files) {
            console.log(`----------------------------------------------\n`);
            console.log(`File: ${file.path}`);
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            if (commitData.parent) {
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const parentFileContent = await this.getParentFileContent(parentCommitData, file.path);
                if (parentFileContent !== undefined) {
                    console.log(`\nDiff: `);
                    const diff = diffLines(parentFileContent, fileContent);

                    console.log(diff);

                    diff.forEach(part => {
                        if (part.added) {
                            process.stdout.write(chalk.green("++" + part.value));
                        } else if (part.removed) {
                            process.stdout.write(chalk.red("--" + part.value));
                        } else {
                            process.stdout.write(chalk.grey(part.value));
                        }
                    })
                    console.log("\n"); //new line
                } else {
                    console.log("New file in this commit");
                }
            } else {
                console.log("First commit");
            }
        }
    }

    async getParentFileContent(parentCommitData, filePath) {
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if (parentFile) {
            return await this.getFileContent(parentFile.hash);
        }
    }

    async getCommitData(commitHash) {
        const commitPath = path.join(this.objectsPath, commitHash);
        try {
            return await fs.readFile(commitPath, { encoding: 'utf-8' });
        } catch (error) {
            console.log("Failed to read the commit data : ", error);
            return null;
        }
    }

    async getFileContent(fileHash) {
        const fileObjectPath = path.join(this.objectsPath, fileHash);
        return await fs.readFile(fileObjectPath, { encoding: 'utf-8' });
    }



}

// (async () => {
//     const groot = new Groot();
//     // await groot.add('sample.txt');
//     // await groot.commit('second Commit');
//     // await groot.log();

//     await groot.showCommitDiff('1f817865865d1d0c7195260256383fc978de6757');
// })();

program.command('init').action(async () => {
    const groot = new Groot();
});

program.command('add <file>').action(async (file) => {
    const groot = new Groot();
    await groot.add(file);
});

program.command('commit <message>').action(async (message) => {
    const groot = new Groot();
    await groot.commit(message);
});

program.command('log').action(async () => {
    const groot = new Groot();
    await groot.log();
});

program.command('show <commitHash>').action(async (commitHash) => {
    const groot = new Groot();
    await groot.showCommitDiff(commitHash);
});


// console.log(process.argv);
program.parse(process.argv);