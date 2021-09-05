import { createApp, ref, watchEffect } from "vue";

export class IO_works {
  constructor() {}

  async asynchronousFunction(filenm) {
    //console.log("IO_works: enter asynchronousFunction");
    //console.log("IO_works: before await fetch");
    const response = await fetch(filenm); // Fields too large
    //console.log("IO_works: after await fetch");
    //console.log("IO_works: response inside asynchronous");
    //console.log(response);
    //console.log("IO_works: before await response.json");
    const data = await response.json();
    //console.log("IO_works: exit asynchronousFunction");
    return data;
  }

  async readFile(filenm) {
    //console.log("enter readFile");
    const result = await this.asynchronousFunction(filenm);
    //console.log("IO_works: data has been read, result: ");
    //console.log(result);
    //console.log("exit readFile (synchronous)");
    return result;
  }
}

// I should have a final clause to catch remaining exceptions.

var timeout = 1000000; // 1000000ms = 1000 seconds

var lib = function() {}; // Let's create an empty object

function setFoo() {
  lib.foo = "bar"; // set the variable foo within the object lib to equal bar
}

//------------------------------------------
// Example code: https://codepen.io/eanbowman/pen/jxqKjJ
// The code below runs asynchrously, so any Javascript code following
// ensureCondition will run immediately while waiting for a condition
// to be set. This is great for initializing a graph for example.
// This is the promise code, so this is the useful bit
//export function ensureConditionIsMet(timeout, condition) {

export function ensureConditionIsMet(timeout, fct_condition) {
  var start = Date.now();
  return new Promise(waitForCondition);

  // waitForCondition makes the decision whether the condition is met
  // or not met or the timeout has been exceeded which means
  // this promise will be rejected
  function waitForCondition(resolve, reject) {
    if (fct_condition()) {
        resolve(true);
    } else if (timeout && Date.now() - start >= timeout) {
      reject(new Error("timeout, condition not satisfied"));
    } else {
        setTimeout(waitForCondition.bind(this, resolve, reject), 50);
    }
  }
}
//------------------------------------------------------------
export function useFetch(getUrl) {
  const data = ref(null);
  const error = ref(null);
  const isPending = ref(true);

  // The entire function is reexecuted, even the lines where nothing changed
  watchEffect(() => {
    isPending.value = true;
    data.value = null;
    error.value = false;
    fetch(getUrl())
      .then((res) => res.json())
      .then((_data) => {
        data.value = _data;
        isPending.value = false;
      })
      .catch((err) => {
        error.value = err;
        isPending.value = false;
      });
  });

  return { data, error, isPending };
}
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
