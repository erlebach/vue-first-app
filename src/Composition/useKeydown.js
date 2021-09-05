import { onBeforeUnmount } from "vue";
import * as u from "../Composition/utils.js";

export const useKeydown = function(keyCombos) {
  let onKey = function(event) {
    let kc = keyCombos.find((kc) => kc.key == event.key);
    if (kc) {
      kc.fn(event);
    }
  };

  window.addEventListener("keydown", onKey);

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKey);
  });
};

//export default useKeydown;
