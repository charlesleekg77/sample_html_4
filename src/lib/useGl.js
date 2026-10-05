import { onMounted, nextTick } from 'vue'
import gl from '../webgl/gl'

/** Register the current page's [data-gl] elements once it has mounted. */
export function useGl() {
  onMounted(async () => {
    await nextTick()
    gl.refresh()
    // late pass for elements that lay out after fonts settle
    setTimeout(() => gl.refresh(), 120)
  })
}

export default useGl
