import '@tensorflow/tfjs-node';
import tf from '@tensorflow/tfjs-core';
import use from '@tensorflow-models/universal-sentence-encoder';

const model = await use.load();

export class Embeder {
    model: use.UniversalSentenceEncoder;
    embeddings: {
        [sentence: string]: tf.Tensor1D; // 512
    } = {};

    constructor(model: use.UniversalSentenceEncoder) {
        this.model = model;
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
        return JSON.stringify(this.embeddings);
    }
}

const sentences = [
    "Hello.",
    "How are you?",
    "The dog is cute.",
    "WARNING: This is a warning.",
    "ERROR: This is an error.",
    "This is a normal sentence."
]

const embeder = await Embeder.new();

console.log(await embeder.findMostSimilars("Hello.", sentences));

// const embeddings = await model.embed(sentences);

// embeddings.print(false);

// for (let i = 0; i < sentences.length; i++) {
//     const scores: number[] = [];
//     for (let j = 0; j < sentences.length; j++) {
//         const sentenceI = tf.slice(embeddings as any, [i, 0], [1]);
//         const sentenceJ = tf.slice(embeddings as any, [j, 0], [1]);
//         const sentenceITranspose = false;
//         const sentenceJTransepose = true;
//         const score =
//             tf.matMul(
//                 sentenceI, sentenceJ, sentenceITranspose, sentenceJTransepose)
//                 .dataSync();
//         scores.push(score[0]);
//     }
//     console.log(scores);
// }       

