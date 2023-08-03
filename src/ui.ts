import boxen from 'boxen';

export enum State {
    Initializing,
    Tapping,
    Navigating,
    Closing,
    Closed
}

export class UI {
    input: string;
    state: State;

    constructor() {
        this.input = '';
        this.state = State.Initializing;
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

    async runTapping(): Promise<State> {
        console.clear();
        process.stdout.write(boxen(this.input));
        return new Promise<State>((resolve, reject) => {
            const listener = (data: Buffer) => {
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
                console.clear();
                process.stdout.write(boxen(this.input));
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