import '@tensorflow/tfjs-node';
import tf from '@tensorflow/tfjs-core';
import use from '@tensorflow-models/universal-sentence-encoder';
import { promises as fs } from 'fs';

export class Embeder {
    model: use.UniversalSentenceEncoder;
    embeddings: {
        [sentence: string]: tf.Tensor1D; // 512
    };

    constructor(model: use.UniversalSentenceEncoder, embeddings: { [sentence: string]: tf.Tensor1D; } = {}) {
        this.model = model;
        this.embeddings = embeddings;
    }
    static async new() {
        const model = await use.load();
        return new Embeder(model);
    }

    async embed(sentences: string[]) {
        let newSentences: string[] = [];
        for (const sentence of sentences) {
            if (this.embeddings[sentence]) {
                continue;
            }
            newSentences.push(sentence);
        }
        const newEmbeddings = await this.model.embed(newSentences);
        for (let i = 0; i < newSentences.length; i++) {
            this.embeddings[newSentences[i]] = tf.squeeze(tf.slice2d(newEmbeddings, [i, 0], [1, 512]));
        }
        
        const embeddings = tf.stack(sentences.map(sentence => this.embeddings[sentence]));
        return embeddings as tf.Tensor2D;
    }

    get length() {
        return Object.keys(this.embeddings).length;
    }

    async similarity(sentence: string, otherSentences: string[] | string) {
        if (typeof otherSentences === 'string') {
            otherSentences = [otherSentences];
        }
        const embeddings = await this.embed([sentence, ...otherSentences]);
        
        return tf.matMul(
            tf.slice2d(embeddings, [0, 0], [1, 512]),
            tf.slice2d(embeddings, [1, 0], [otherSentences.length, 512]),
            false, true
        ) as tf.Tensor2D;
    }

    async findMostSimilars(sentence: string, sentences?: string[], n = Infinity) {
        if (!sentences) {
            sentences = Object.keys(this.embeddings);
        }

        const similarities = await this.similarity(sentence, sentences);

        const scores = await similarities.data();

        return sentences.map((sentence, i) => [sentence, scores[i]] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, n);
    }

    toJson() {
        return JSON.stringify(Object.entries(this.embeddings).map(([sentence, embedding]) => [sentence, Object.values(embedding.dataSync())]));
    }

    static async fromJson(json: string) {
        const objEmbeddings = JSON.parse(json) as [string, number[]][]; // [sentence, embedding]
        let embeddings: {
            [sentence: string]: tf.Tensor1D;
        } = {};
        for (const [sentence, embedding] of objEmbeddings) {
            embeddings[sentence] = tf.tensor1d(embedding);
        }
        const model = await use.load();
        return new Embeder(model, embeddings);
    }

    async saveToFile(path: string) {
        await fs.writeFile(path, this.toJson());
    }

    static async loadFromFile(path: string) {
        return await Embeder.fromJson(await fs.readFile(path, 'utf-8'))
    }
}

export const sampleSentences = [
    "Hello.",
    "How are you?",
    "The dog is cute.",
    "WARNING: This is a warning.",
    "ERROR: This is an error.",
    "This is a normal sentence."
]