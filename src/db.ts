import sqlite3 from "sqlite3";
const { Database } = sqlite3;

export interface Element {
    id: number;
    path: string;
}

export interface Embedding {
    id: number;
    sentence: string;
    embedding: number[];
}

export interface ElementEmbedding {
    elementId: number;
    embeddingId: number;
    weight: number;
}

export class DB extends Database {
    /**
     * Use `await DB.new()` instead.
     */
    private constructor(path: string = ':memory:') {
        super(path);
    }
    static async new(path?: string) {
        const db = new DB(path);
        
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS elements (
                id INTEGER PRIMARY KEY,
                path TEXT NOT NULL UNIQUE
            );
        `);
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS embeddings (
                id INTEGER PRIMARY KEY,
                sentence TEXT NOT NULL UNIQUE,
                embedding BLOB NOT NULL
            );
        `);
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS element_embeddings (
                elementId INTEGER NOT NULL,
                embeddingId INTEGER NOT NULL,
                weight REAL NOT NULL DEFAULT 1,
                FOREIGN KEY (elementId) REFERENCES elements (id),
                FOREIGN KEY (embeddingId) REFERENCES embeddings (id),
                PRIMARY KEY (elementId, embeddingId)
            );
        `);
        return db;
    }

    // Async wrappers
    async runAsync(sql: string, params: any[] = []) {
        return new Promise<void>((resolve, reject) => {
            this.run(sql, params, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
    }

    async getAsync<T = any>(sql: string, params: any[] = []) {
        return new Promise<T | undefined>((resolve, reject) => {
            this.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row as T | undefined);
                }
            });
        })
    }

    async allAsync<T = any>(sql: string, params: any[] = []) {
        return new Promise<T[]>((resolve, reject) => {
            this.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as T[]);
                }
            });
        })
    }

    async eachAsync<T = any>(sql: string, params: any[] = [], callback: (err: Error | null, row: T) => void) {
        return new Promise<void>((resolve, reject) => {
            this.each(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    callback(err, row as T);
                }
            }, (err, count) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
    }

    // Element
    async createElement(path: string) {
        await this.runAsync('INSERT INTO elements (path) VALUES (?)', [path]);
    }

    async getElement(id: number) {
        return await this.getAsync<Element>('SELECT * FROM elements WHERE id = ?', [id]);
    }

    async getElementByPath(path: string) {
        return await this.getAsync<Element>('SELECT * FROM elements WHERE path = ?', [path]);
    }

    async createElementIfNotExists(path: string) {
        const element = await this.getElementByPath(path);
        if (!element) {
            await this.createElement(path);
            return await this.getElementByPath(path);
        }
        return element;
    }

    async getElementIdByPath(path: string) {
        const element = await this.getElementByPath(path);
        return element?.id;
    }

    async getElements() {
        return await this.allAsync<Element>('SELECT * FROM elements');
    }

    async getElementByPartialPath(path: string) {
        return await this.allAsync<Element>('SELECT * FROM elements WHERE path LIKE ?', ['%' + path + '%']);
    }

    async getElementByPathStart(path: string) {
        return await this.allAsync<Element>('SELECT * FROM elements WHERE path LIKE ?', [path + '%']);
    }

    // Embedding
    async createEmbedding(sentence: string, embedding: number[]) {
        await this.runAsync('INSERT INTO embeddings (sentence, embedding) VALUES (?, ?)', [sentence, embedding]);
    }

    async getEmbedding(id: number) {
        return await this.getAsync<Embedding>('SELECT * FROM embeddings WHERE id = ?', [id]);
    }

    async getEmbeddingsBySentence(sentence: string) {
        return await this.allAsync<Embedding>('SELECT * FROM embeddings WHERE sentence = ?', [sentence]);
    }

    // ElementEmbedding

    async createElementEmbedding(elementId: number, embeddingId: number, weight: number) {
        await this.runAsync('INSERT INTO element_embeddings (elementId, embeddingId, weight) VALUES (?, ?, ?)', [elementId, embeddingId, weight]);
    }

    async getElementEmbedding(elementId: number, embeddingId: number) {
        return await this.getAsync<ElementEmbedding>('SELECT * FROM element_embeddings WHERE elementId = ? AND embeddingId = ?', [elementId, embeddingId]);
    }

    async getEmbeddingsAndWeightByElement(elementId: number) {
        const elementEmbeddings = await this.allAsync<ElementEmbedding>('SELECT * FROM element_embeddings WHERE elementId = ?', [elementId]);
        const embeddings = await Promise.all(elementEmbeddings.map(async (elementEmbedding) => {
            return [await this.getEmbedding(elementEmbedding.embeddingId), elementEmbedding.weight] as [Embedding, number];
        }));
        return embeddings;
    }

    async getEmbeddingsByElement(elementId: number) {
        const elementEmbeddings = await this.allAsync<ElementEmbedding>('SELECT * FROM element_embeddings WHERE elementId = ?', [elementId]);
        const embeddings = await Promise.all(elementEmbeddings.map(async (elementEmbedding) => {
            return await this.getEmbedding(elementEmbedding.embeddingId);
        }));
        return embeddings;
    }

    async getElementsAndWeightByEmbedding(embeddingId: number) {
        const elementEmbeddings = await this.allAsync<ElementEmbedding>('SELECT * FROM element_embeddings WHERE embeddingId = ?', [embeddingId]);
        const elements = await Promise.all(elementEmbeddings.map(async (elementEmbedding) => {
            return [await this.getElement(elementEmbedding.elementId), elementEmbedding.weight] as [Element, number];
        }));
        return elements;
    }

    async getElementsByEmbedding(embeddingId: number) {
        const elementEmbeddings = await this.allAsync<ElementEmbedding>('SELECT * FROM element_embeddings WHERE embeddingId = ?', [embeddingId]);
        const elements = await Promise.all(elementEmbeddings.map(async (elementEmbedding) => {
            return await this.getElement(elementEmbedding.elementId);
        }));
        return elements;
    }
}