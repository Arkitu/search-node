import { DB } from "./db.js";
import { promises as fs, exists } from "fs";
import { UI } from "./ui.js";
import { Embeder } from "./embeder.js";
import { join } from "path";
import {globby} from 'globby';

const targetPath = process.argv[process.argv.length - 1];

console.log("Loading database...");

const db = await DB.new();

console.log("Getting directory map...");

const paths = await globby(targetPath, {

});

console.log(paths)

// async function iterOverDir(path:string) {
//     try {
//         await Promise.all(
//             (await fs.readdir(path)).map((x) =>
//                 new Promise((resolve, reject) => {
//                     const newPath = join(path, x);
//                     try {
//                         fs.stat(newPath).then((stat) => {
//                             if (stat.isDirectory()) {
//                                 iterOverDir(newPath).then(resolve).catch(reject);
//                             } else {
//                                 db.createElementIfNotExists(newPath).then(resolve).catch(reject);
//                             }
//                         }).catch(reject);
//                     } catch (e) {
//                         //@ts-ignore
//                         if (!['ENOENT', 'EACCES', 'EPERM', 'EBADF'].includes(e?.code)) {
//                             console.debug(newPath);
//                             throw e;
//                         }
//                     }
//                 })
//             )
//         );
//     } catch (e) {
//         //@ts-ignore
//         if (!['ENOENT', 'EACCES', 'EPERM', 'EBADF'].includes(e?.code)) {
//             console.debug(path);
//             throw e;
//         }
//     }
// }

//await iterOverDir(targetPath);

// console.log("Loading embeder...");

// const embeder = await Embeder.new();

// console.log("Done")

// const ui = new UI(db, embeder);
// await ui.run();