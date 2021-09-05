// Remove in production mode
// import devtools from "@vue/devtools";
// console.log(devtools);

// if (process.env.NODE_ENV === "development") {
//   devtools.connect(/* host, port */);
// }

/*
import devtools from "@vue/devtools";
console.log("process.env.NODE_ENV");
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  devtools.connect(host, port );  // (host, port)
  console.log("after devTools.connect");
}
*/

import { createApp } from "vue";

// Necessary for Dialogues
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';


//import { createStore } from "vuex";
import App from "./App.vue";
import store from "./store/index.js";
// https://www.primefaces.org/primevue/showcase/#/setup
import PrimeVue from "primevue/config"; // Why this line?

import "primevue/resources/primevue.min.css";
import "primevue/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

const app = createApp(App);
app.use(ConfirmationService);
app.use(ToastService);
app.use(PrimeVue);
app.use(store);
app.mount("#app");
