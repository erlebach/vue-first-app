import * as u from "./utils.js";
import { IO_works } from "./IO_works.js";
import { ref, computed } from "vue";
import { convertCopaData } from "./graphSupport.js";

// The data is stored in the class. Not a singleton
export class LoadTable {
  constructor(filePath, raw = false) {
    this.filePath = filePath;
    this.io = new IO_works();
    this.isDataLoaded_ = ref(false);
    this.results = null;
    if (raw === false) {
      this.loadData();
    } else {
      this.loadRawData();
    }
  }
  async loadData() {
    if (!this.isDataLoaded_.value) {
      const data = await this.io.readFile(this.filePath);
      this.results = convertCopaData(data);
      this.isDataLoaded_.value = true;
    }
  }
  async loadRawData() {
    if (!this.isDataLoaded_.value) {
      this.results = await this.io.readFile(this.filePath);
      this.isDataLoaded_.value = true;
    }
  }
  isDataLoaded() {
    return this.isDataLoaded_; // return ref
  }
  data() {
    //u.print("isDataLoaded_ in Class LoadTable", this.isDataLoaded_.value);
    //u.print("get data in Class LoadTable", this.results);
    return this.results; // [{nodes, edges}, cities] or rawData
  }
}
