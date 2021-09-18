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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* left: 100px; */
  /* right: 100px; */
  z-index: 99;
  padding: 30px;
  border: solid;
}
</style>
