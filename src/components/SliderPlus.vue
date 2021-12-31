<template>
  <div>
    <Button icon="pi pi-plus" @click="increment" style="margin-right: 0.5rem" />
    <Button icon="pi pi-minus" @click="decrement" />

    <h5>Value: {{ value }}</h5>
    <Slider v-model="value" :step="step" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: 10,
      step: 3,
    };
  },
  methods: {
    increment() {
      if (this.value <= 100 - this.step) this.value = this.value + this.step;
      else this.value = 100;
    },
    decrement() {
      if (this.value - this.step >= 0) this.value = this.value - this.step;
      else this.value = 0;
    },
  },
};
</script>

<style scoped>
.p-slider-horizontal {
  width: 14rem;
}
</style>
