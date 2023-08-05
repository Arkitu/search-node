import { DB } from "./db.js";
import { promises as fs, exists } from "fs";
import { UI } from "./ui.js";
import { Embeder } from "./embeder.js";
import { join } from "path";

const targetPath = process.argv[process.argv.length - 1];

console.log("Loading database...");

const db = await DB.new();

console.log("Getting directory map...");

async function iterOverDir(path:string) {
    try {
        (await fs.readdir(path)).forEach(async (x) => {
            const newPath = join(path, x);
            try {
                if ((await fs.stat(newPath)).isDirectory()) {
                    await iterOverDir(newPath);
                } else {
                    await db.createElementIfNotExists(newPath);
                }
            } catch (e) {
                //@ts-ignore
                if (e?.code !== 'ENOENT' && e?.code !== 'EACCES', e?.code !== 'EPERM') {
                    //@ts-ignore
                    console.debug((e as Error).code);
                    throw e;
                }
            }
        });
    } catch (e) {
        //@ts-ignore
        if (e?.code !== 'ENOENT' && e?.code !== 'EACCES' && e?.code !== 'EPERM') {
            throw e;
        }
    }
}

await iterOverDir(targetPath);

console.log("Loading embeder...");

const embeder = await Embeder.new();

console.log("Done")

const ui = new UI(db, embeder);
await ui.run();