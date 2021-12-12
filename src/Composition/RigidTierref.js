import { computed, ref } from "vue";

const tier = ref(null);

function setTier(post) {
  tier.value = post;
  // if (tier.value === post) {
  // console.log(`tier.value === post: ${post}`);
  // } else {
  // console.log(`tier.value !== post: ${post}`);
  // }
}

// The advantage of returning the value and not the reference
// is that it keeps the reference safe from direct modification
// by the caller
const getTier = computed(() => tier.value);

export { setTier, getTier };
