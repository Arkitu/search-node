import { DB, Element } from "./db.js";
import { Embeder } from "./embeder.js";

const MAX_RESULT_COUNT = 5;

export async function rank(db: DB, embeder: Embeder, input: string): Promise<Element[]> {
    const result: Element[] = [];
    result.push(...await db.getByPathStart(input));
    if (result.length >= MAX_RESULT_COUNT) {
        return result.slice(0, MAX_RESULT_COUNT);
    }

    return result.slice(0, MAX_RESULT_COUNT);
}