<template>
  <div>
    <Toast />
    <Button :label="true ? 'SelectProduct' : null" @click="toggle" />
    <OverlayPanel ref="op">
      <h1>Hello!</h1>
    </OverlayPanel>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { useToast } from "primevue/usetoast";
import OverlayPanel from "primevue/overlaypanel";
import Button from "primevue/button";

export default {
  components: { OverlayPanel, Button },
  setup() {
    const toast = useToast();
    const op = ref();
    const opbutton = ref();


    let onKeydown = (event) => {
      if (event.key == "h") {
        op.value.toggle(event);
      }
    };

    window.addEventListener("keydown", onKeydown);
    () => window.removeEventListener("keydown", onKeydown);

    const myToggle = computed((event) => op.value.toggle(event));

    const toggle = (event) => {
      op.value.toggle(event);
    };

    return { op, toggle };
  },
};
</script>
