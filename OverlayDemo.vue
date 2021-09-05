<template>
  <div>
    <Toast />

    <Button
      type="button"
      icon="pi pi-search"
      :label="selectedProduct ? selectedProduct.name : 'Select a Product'"
      aria:haspopup="true"
      aria-controls="overlay_panel"
      @click="toggle"
      ref="opbutton"
    />

    <ModalView v-if="ifhelp">
      <h2>Hello World</h2>
    </ModalView>

    <!--
    <OverlayPanel
      ref="op"
      appendTo="body"
      dismissable="true"
      :showCloseIcon="true"
      id="overlay_panel"
      style="width: 450px"
      :breakpoints="{ '960px': '75vw' }"
    >
      <h3>Hello World!</h3>
      <DataTable
        :value="products"
        v-model:selection="selectedProduct"
        selectionMode="single"
        :paginator="true"
        :rows="5"
        @rowSelect="onProductSelect"
        responsiveLayout="scroll"
      >
        <Column field="name" header="Name" sortable style="width: 50%"></Column>
        <Column header="Image" style="width: 20%">
          <template #body="slotProps">
            <img
              src="https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png"
              :alt="slotProps.data.image"
              class="product-image"
            />
          </template>
        </Column>
        <Column field="price" header="Price" sortable style="width: 30%">
          <template #body="slotProps">
            {{ formatCurrency(slotProps.data.price) }}
          </template>
        </Column>
      </DataTable>
    </OverlayPanel>
	-->
  </div>
</template>

<script>
import { ref, onBeforeUnmount, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import ProductService from "./js/ProductService";
//import OverlayPanel from "primevue/overlaypanel";
import ModalView from "./ModalView.vue";
import Button from "primevue/button";
import * as u from "../Composition/utils.js";
import { useKeydown } from "../Composition/useKeydown.js";

export default {
  components: { ModalView, Button },
  setup() {
    onMounted(() => {
      productService.value
        .getProductsSmall()
        .then((data) => (products.value = data));
    });

    const toast = useToast();
    const ifhelp = ref(false);
    const op = ref();
    const opbutton = ref();
    const productService = ref(new ProductService());
    const products = ref();
    const selectedProduct = ref();

    //const fct1 = op.value.toggle;

    let onKeydown = (event) => {
      if (event.key == "h") {
        //op.value.toggle(event);
        console.log("h key pressed");
        ifhelp.value = true;
      }
    };

    window.addEventListener("keydown", onKeydown);

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", onKeydown);
    });

    /*
    useKeydown([
      {
        key: "Escape",
        fn: (event) => {
          console.log(`Pressed ESC key!`);
        },
      },
      {
        key: "h",
		packet: {op},
        fn: (event) => {
          //console.log("==> Inside fn: (event) => ");
          u.print("===> op", op);
          op.value.toggle(event);
          //fct1(event);
          //op.value.toggle(event);
          //console.log("==> exit op.value.toggle and fn: (event)");
        },
      },
    ]);
          //u.print("op.value.toggle: ", op.value.toggle);
          //console.log("after toggle");
   */

    /*
    const toggle = (event) => {
      console.log("inside toggle()"); // reached
      u.print("event", event);
      overlayref.value.toggle(event);
    };
    */

    //u.print("inside const toggle", op.value.toggle);
    // Works. But does not seem to work from within a function
    const toggle = (event) => {
      u.print("toggle, op: ", op.value);
      u.print("toggle, opbutton: ", opbutton.value);
      op.value.toggle(event);
    };

    const formatCurrency = (value) => {
      return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    };
    const onProductSelect = (event) => {
      op.value.hide();
      toast.add({
        severity: "info",
        summary: "Product Selected",
        detail: event.data.name,
        life: 3000,
      });
    };

    return {
      ifhelp,
      op,
      opbutton,
      productService,
      products,
      selectedProduct,
      toggle,
      formatCurrency,
      onProductSelect,
    };
  },
};
</script>

<style lang="scss" scoped>
button {
  min-width: 15rem;
}

.product-image {
  width: 50px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}
</style>
