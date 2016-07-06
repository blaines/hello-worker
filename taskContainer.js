'use strict';

const Bluebird = require('bluebird');
const fs = require('fs');
const aws = require('aws-sdk');
const sqs = new aws.SQS();

const TaskContainer = class TaskContainer {

  constructor () {
    this.task_event = null;
    this.task_id = null;
    this.finalized = false;

    if (process.env.TASK_QUEUE_URL) {
      this.task_queue_url = process.env.TASK_QUEUE_URL;
    }
  }

  generateCallback() {
    let task = this;
    return function (error, result) {
      if (task.finalized) {
        // Do nothing.
      } else {
        task.finalized = true;
        if (error) {
          task.onFailure(error);
        } else {
          task.onSuccess(result);
        }
      }
    }
  }

  run (runtime) {
    let task = this;
    const promisifyOptions = {
      context: sqs
    };
    const sqs_params = {
      QueueUrl: this.task_queue_url,
      MaxNumberOfMessages: 1
    };
    const receiveMessage = Bluebird.promisify(sqs.receiveMessage, promisifyOptions);
    return receiveMessage(sqs_params)
    .then((receiveMessageResults) => {
      task.task_event = JSON.parse(receiveMessageResults.Messages[0].Body);
      task.task_id = receiveMessageResults.Messages[0].MessageId;
      task.receipt_handle = receiveMessageResults.Messages[0].ReceiptHandle;
      return runtime(task.task_event, task.generateCallback());
    }).then((something) => {
      // Default behavior if callback wasn't called.
      task.generateCallback()(null, "");
    }).catch((error) => {
      // Default behavior if error wasn't caught.
      console.log("AN ERROR OCCURED: ", error);
    });
  }

  onSuccess (result) {
    let task = this;
    let sqs_params = {
      QueueUrl: this.task_queue_url,
      ReceiptHandle: this.receipt_handle
    };
    const promisifyOptions = {
      context: sqs
    };
    const deleteMessage = Bluebird.promisify(sqs.deleteMessage, promisifyOptions);
    return deleteMessage(sqs_params)
    .then((deleteMessageResults) => {
      // Nothing more to do
      // Reserved for logging and analytics
      // console.log(deleteMessageResults);
    });
  }

  onFailure(error) {
    // Ideas:
    // Move message to error queue
    // Log
    console.log("Error: ", error);
  }
}

module.exports = TaskContainer;
