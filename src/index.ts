import { DB } from "./db.js";
import { promises as fs } from "fs";
import { UI } from "./ui.js";
import { Embeder } from "./embeder.js";

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

console.log("Loading embeder...");

const embeder = await Embeder.new();

console.log("Done")

const ui = new UI(db, embeder);
await ui.run();