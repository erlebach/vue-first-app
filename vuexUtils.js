import * as u from "./utils.js";
import { ref, watch, computed } from "vue";
import { LoadTable } from "./loadTable.js";

const state = ref({ post: {} });

function setPost(post) {
  state.value.post = post;
}

setPost("gordon");
u.print("post", state);

function loadPost(id) {
  // const post = await fetchPost(id);
  const post = "Frances";
  setPost(post);
}

const getPost = computed(() => {
  // return a ref?
  // This might work in a class
  return state.value.post;
});

function getPost1() {
  return state.value.post;
}

export { loadPost, getPost, getPost1 };
