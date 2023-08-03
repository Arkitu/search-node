import { DB } from "./db.js";
import { promises as fs } from "fs";
import { UI } from "./ui.js";

const targetPath = process.argv[process.argv.length - 1];

console.log("Loading database...");

const db = await DB.new("cache.db");

console.log("Getting directory map...");

async function iterOverDir(path:string) {
    (await fs.readdir(path)).forEach(async (x) => {
        if ((await fs.stat(`${path}/${x}`)).isDirectory()) {
            await iterOverDir(`${path}/${x}`);
        } else {
            await db.createElementIfNotExists(`${path}/${x}`);
        }
    });
}

await iterOverDir(targetPath);

console.log("Done")

const ui = new UI();
await ui.run();