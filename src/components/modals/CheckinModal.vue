<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFluiserStore, ymd } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { SunIcon, MoonIcon } from '@/components/icons/AppIcons'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { MorningCheckin, EveningCheckin } from '@/types'

const props = defineProps<{ kind: 'morning' | 'evening' | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useFluiserStore()
const t = useT()

const energy = ref(7)
const intention = ref('')
const reflection = ref('')
const gratitude = ref('')

watch(() => props.kind, (kind) => {
  if (!kind) return
  const today = ymd()
  if (kind === 'morning') {
    const ex = store.data.checkins[`${today}|morning`] as MorningCheckin | undefined
    if (ex) { energy.value = ex.energy ?? 7; intention.value = ex.intention ?? '' }
    else { energy.value = 7; intention.value = '' }
  } else {
    const ex = store.data.checkins[`${today}|evening`] as EveningCheckin | undefined
    if (ex) { reflection.value = ex.reflection ?? ''; gratitude.value = ex.gratitude ?? '' }
    else { reflection.value = ''; gratitude.value = '' }
  }
})

function save() {
  const today = ymd()
  if (props.kind === 'morning') store.writeCheckin(today, 'morning', { energy: energy.value, intention: intention.value })
  else if (props.kind === 'evening') store.writeCheckin(today, 'evening', { reflection: reflection.value, gratitude: gratitude.value })
  emit('close')
}

const reflectionPlaceholder = t('Una línea honesta. No tiene que ser bonita.', "One honest line. It doesn't have to be pretty.")
const gratitudeLabel = t('Algo por lo que estás agradecido', "Something you're grateful for")
</script>

<template>
  <BaseModal :open="!!kind" @close="emit('close')">
    <div style="padding: 32px;">
      <div class="row" style="margin-bottom: 24px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft); color: var(--accent); display: grid; place-items: center;">
          <SunIcon v-if="kind === 'morning'" :size="18" />
          <MoonIcon v-else :size="18" />
        </div>
        <div>
          <h2 style="font-size: 18px;">{{ kind === 'morning' ? t('Empezar el día', 'Open the day') : t('Cerrar el día', 'Close the day') }}</h2>
          <div class="muted" style="font-size: 12.5px;">{{ t('Dos preguntas, treinta segundos.', 'Two questions, thirty seconds.') }}</div>
        </div>
      </div>

      <template v-if="kind === 'morning'">
        <div style="margin-bottom: 22px;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">{{ t('¿Cómo amaneces?', 'How do you wake?') }}</div>
          <div class="row" style="gap: 10px;">
            <input type="range" min="1" max="10" v-model.number="energy" style="flex: 1; accent-color: var(--accent);" />
            <span class="tnum" style="font-family: var(--font-display); font-weight: 600; font-size: 22px; color: var(--accent); width: 30px; text-align: right;">{{ energy }}</span>
          </div>
          <div class="muted" style="font-size: 12px; margin-top: 4px; display: flex; justify-content: space-between;">
            <span>{{ t('Agotado', 'Drained') }}</span><span>{{ t('Encendido', 'Lit up') }}</span>
          </div>
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">{{ t('Tu intención para hoy', 'Your intention for today') }}</div>
          <textarea class="input" rows="2" :placeholder="t('Una sola idea que quieras llevar contigo…', 'A single idea to carry with you…')" v-model="intention" />
        </div>
      </template>

      <template v-else-if="kind === 'evening'">
        <div style="margin-bottom: 22px;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">{{ t('¿Cómo terminó el día?', 'How did the day end?') }}</div>
          <textarea class="input" rows="3" :placeholder="reflectionPlaceholder" v-model="reflection" />
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">{{ gratitudeLabel }}</div>
          <textarea class="input" rows="2" :placeholder="t('Algo pequeño cuenta.', 'Something small counts.')" v-model="gratitude" />
        </div>
      </template>

      <div class="row" style="justify-content: flex-end; margin-top: 24px; gap: 8px;">
        <button class="btn btn-ghost" @click="emit('close')">{{ t('Cancelar', 'Cancel') }}</button>
        <button class="btn btn-primary" @click="save">{{ t('Guardar', 'Save') }}</button>
      </div>
    </div>
  </BaseModal>
</template>
