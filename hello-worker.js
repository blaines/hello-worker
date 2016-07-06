'use strict';

const TaskContainer = require('./taskContainer');
const Task = new TaskContainer();

Task.run(function(message, callback){
  // Get task runtime data
  console.log("event id: ", Task.task_id);

  console.log("Hello World. Task Complete.");

  callback(null, message);

});
