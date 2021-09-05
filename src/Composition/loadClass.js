import * as u from "./utils.js";
import { IO_works } from "./IO_works.js";
import { ref, computed } from "vue";
import { convertCopaData } from "./graphSupport.js";

// Dictionary of load instances (not yet used)
const LoadTableDict = {};

// The data is stored in the class. Not a singleton
export class LoadTable {
  constructor(filePath) {
    this.filePath = filePath;
    this.io = new IO_works();
    this.isDataLoaded_ = ref(false);
    this.results = null;
    this.loadData();
    LoadTableDict[filePath] = this;
  }
  async loadData() {
    if (!this.isDataLoaded_.value) {
      const data = await this.io.readFile(this.filePath);
      this.results = convertCopaData(data);
      this.isDataLoaded_.value = true;
    }
  }
  isDataLoaded() {
    return this.isDataLoaded_; // return ref
  }
  //get data() {
  data() {
    //u.print("isDataLoaded_ in Class LoadTable", this.isDataLoaded_.value);
    //u.print("get data in Class LoadTable", this.results);
    return this.results; // [{nodes, edges}, cities]
  }
}
