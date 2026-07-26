import { ref } from 'vue'

const collapsed = ref(false)

export function useSidebar() {
  return { collapsed }
}
