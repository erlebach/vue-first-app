import store from "../store/index.js";
import * as u from "./utils.js";
import { IO_works } from "./IO_works.js";
import { ref } from "vue";
import { convertCopaData } from "./graphSupport.js";

const isDataLoaded_ = ref(false);
let results = null;

export async function loadData(filePath) {
  if (!isDataLoaded_.value) {
    const io = new IO_works();
    const data = await io.readFile(filePath);
    results = data;
    isDataLoaded_.value = true;
    store.commit("setIsDataLoaded", isDataLoaded_.value);
  }
}

export function isDataLoaded() {
  return ref(isDataLoaded_); // return ref
}

export function data() {
  return results;
}
