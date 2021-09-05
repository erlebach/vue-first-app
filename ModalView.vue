<!-- ModalView.vue template -->
<template>
  <div class="modal">
    <div class="overlay"></div>
    <div class="modal-card">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal {
  background-color: rgb(211, 211, 211);
  opacity: 0.9;
  position: absolute;
  /* left: 100px; */
  /* right: 100px; */
  z-index: 99;
  padding: 30px;
  border: solid;
}
</style>
