import ScraperHandler from "./ScraperHandler.js";

export default class TaskQueueHandler {
    //A shared instance of itself for convinient access throughout the project. Why'd I even do this?...
    public static singelton: TaskQueueHandler;

    //Boolean status of the current queue.
    private resolving: boolean = false;
    //Queued requests sit here while waiting for others to process.
    private taskQueue = [];

    //Goes through the queue recursively until no requests remain to be processed. Will close browser when done.
    private async processQueue() {
        if (this.resolving)
            return;

        this.resolving = true;
        let queue = this.taskQueue;
        this.taskQueue = [];

        for (let task of queue)
            await task();

        this.resolving = false;
        if (this.taskQueue.length)
            await this.processQueue();

        await ScraperHandler.singelton.closeBrowser();
    }

    //Adds async function to promise queue.
    public addToQueue(task) {
        this.taskQueue.push(task);
        this.processQueue();
    }
}