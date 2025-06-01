import ScraperHandler from "./ScraperHandler.js";

/**
 * TaskQueueHandler class manages a queue of tasks for webscraper.
 */
export default class TaskQueueHandler {
  /**
   * A shared instance of itself for convinient access throughout the project.
   * @type {TaskQueueHandler}
   */
  public static singelton: TaskQueueHandler;

  /**
   * Boolean status indicating whether the current queue is being resolved.
   * @type {boolean}
   */
  private resolving: boolean = false;

  /**
   * Array containing queued tasks waiting for processing.
   * @type {Array<Function>}
   */
  private taskQueue = [];

  /**
   * Goes through the queue recursively until no requests remain to be processed. Closes the browser when done.
   * @private
   */
  private async processQueue() {
    if (this.resolving) {
      return;
    }

    this.resolving = true;
    let queue = this.taskQueue;
    this.taskQueue = [];

    for (let task of queue) {
      await task();
    }

    this.resolving = false;
    if (this.taskQueue.length) {
      await this.processQueue();
    } else {
      await ScraperHandler.singelton.closeBrowser();
    }
  }

  /**
   * Adds an asynchronous function to the promise queue.
   * @param {Function} task - The asynchronous function to be added to the queue.
   */
  public addToQueue(task) {
    this.taskQueue.push(task);
    this.processQueue();
  }
}
