import boxen from 'boxen';
import { rank, Result } from './ranking.js';
import { DB } from './db.js';
import { Embeder } from './embeder.js';
import chalk from 'chalk';
import path from 'path';

export enum State {
    Initializing,
    Tapping,
    Navigating,
    Closing,
    Closed
}

export class UI {
    input: string = '';
    state: State = State.Initializing;
    results: Result[] = [];
    db: DB;
    embeder: Embeder;

    constructor(db: DB, embeder: Embeder) {
        this.db = db;
        this.embeder = embeder;
    }

    async run() {
        while (this.state != State.Closed) {
            await this.runState(this.state);
        }
    }

    async runState(state: State) {
        switch (state) {
            case State.Initializing:
                this.state = await this.runInitializing();
                break;
            case State.Tapping:
                this.state = await this.runTapping();
                break;
            case State.Closing:
                this.state = await this.runClosing();
                break;
            case State.Closed:
                break;
        }
    }

    async runInitializing(): Promise<State> {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        console.clear();
        process.stdin.on('data', async (key) => {
            // Ctrl-C
            if (key.toString() === '\u0003') {
                await this.close();
            }
        });

        return State.Tapping;
    }

    async reloadResults() {
        this.results = await rank(this.db, this.embeder, this.input, process.stdout.getWindowSize()[1]);
    }

    async getDisplayText(): Promise<string> {
        let text = boxen(this.input, {
            float: 'center',
            width: process.stdout.getWindowSize()[0]
        });

        text += '\n';

        const maxResultCount = process.stdout.getWindowSize()[1] - text.split('\n').length + 1;

        const results = this.results.slice(0, maxResultCount)
        for (const [i, result] of results.entries()) {
            const path = result.path.split(this.input).join(chalk.bold(this.input))

            text += `${result.score.toFixed(2)} ${path}`;
            if (i != results.length - 1) {
                text += '\n';
            }
        }

        return text;
    }

    async refeshDisplay() {
        console.clear();
        process.stdout.write(await this.getDisplayText());
    }

    async runTapping(): Promise<State> {
        await this.reloadResults();
        await this.refeshDisplay();
        return new Promise<State>((resolve, reject) => {
            const listener = async (data: Buffer) => {
                const key = data.toString();
                // Enter
                if (key === '\r') {
                    process.stdin.removeListener('data', listener);
                    resolve(State.Navigating);
                }
                // Backspace
                else if (key === '\u007f') {
                    this.input = this.input.slice(0, -1);
                }
                // Normal character
                else {
                    this.input += key;
                }
                await this.reloadResults();
                await this.refeshDisplay();
            };
            process.stdin.on('data', listener);
        });
    }

    async runClosing(): Promise<State> {
        process.stdin.pause();
        process.stdin.setRawMode(false);
        process.stdin.removeAllListeners('data');
        console.clear();

        return State.Closed;
    }

    async close() {
        this.state = State.Closing;
        await this.run();
    }
}