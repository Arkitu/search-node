import { DB, Element } from "./db.js";
import { Embeder } from "./embeder.js";

const MAX_RESULT_COUNT = 20;

export interface Result extends Element {
    score: number;
}

export async function rank(db: DB, embeder: Embeder, input: string, maxResultCount:number=MAX_RESULT_COUNT): Promise<Result[]> {
    const result: Result[] = [];
    result.push(...(await db.getElementByPartialPath(input)).map(x => ({...x, score: 1})));
    if (result.length >= maxResultCount) {
        return result.slice(0, maxResultCount);
    }

    return result.slice(0, maxResultCount);
}