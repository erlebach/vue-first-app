import { computed, ref } from "vue";

const state = ref(null);

function setTable(post) {
  state.value = post;
//  console.log("setTable(post), post");
  //console.log(post);
  // nb edges keeps increasing. Nb nodes constant. Why?
}

// The advantage of returning the value and not the reference
// is that it keeps the reference safe from direct modification
// by the caller
const getTable = computed(() => state.value);

export { setTable, getTable };
