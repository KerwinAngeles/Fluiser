<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { XIcon, CheckIcon } from '@/components/icons/AppIcons'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { VisionItem, Tone, VisionCategory } from '@/types'

const TONE_OPTS: Tone[] = ['sky','mint','amber','rose','lilac']
const CATEGORY_OPTS: { id: VisionCategory; labelEs: string; labelEn: string }[] = [
  { id: 'carrera',    labelEs: 'Carrera',    labelEn: 'Career'        },
  { id: 'salud',      labelEs: 'Salud',      labelEn: 'Health'        },
  { id: 'relaciones', labelEs: 'Relaciones', labelEn: 'Relationships' },
  { id: 'finanzas',   labelEs: 'Finanzas',   labelEn: 'Finance'       },
  { id: 'personal',   labelEs: 'Personal',   labelEn: 'Personal'      },
  { id: 'viajes',     labelEs: 'Viajes',     labelEn: 'Travel'        },
]
const EMOJI_SUGGESTIONS = ['🚀','🌊','💪','🏡','📚','✈️','🎯','🌱','💡','🎨','🏆','❤️','🌟','💎','🧘','🎵']

const props = defineProps<{ item: VisionItem | null; isNew?: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useFluiserStore()
const t = useT()

const cachedId = ref<string | null>(null)
const cachedIsNew = ref(false)
const title = ref('')
const description = ref('')
const emoji = ref('✨')
const category = ref<VisionCategory>('personal')
const tone = ref<Tone>('sky')

watch(() => props.item, (v) => {
  if (!v) return
  cachedId.value = v.id
  cachedIsNew.value = props.isNew ?? false
  title.value = v.title
  description.value = v.description ?? ''
  emoji.value = v.emoji
  category.value = v.category
  tone.value = v.tone
}, { immediate: true, flush: 'sync' })

const isValid = computed(() => title.value.trim().length > 0 && emoji.value.trim().length > 0)

function save() {
  if (!isValid.value || !cachedId.value) return
  store.upsertVisionItem({
    id: cachedId.value,
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    emoji: emoji.value.trim(),
    category: category.value,
    tone: tone.value,
    createdAt: props.item?.createdAt ?? store.utils.ymd(),
  })
  emit('saved')
  emit('close')
}

function deleteItem() {
  if (!cachedId.value) return
  if (window.confirm(t('¿Eliminar este item?', 'Delete this item?'))) {
    store.deleteVisionItem(cachedId.value)
    emit('close')
  }
}
</script>

<template>
  <BaseModal :open="!!item" width="min(480px, 92vw)" @close="emit('close')">
    <div v-if="cachedId" style="padding: 28px;">
      <div class="row" style="margin-bottom: 24px;">
        <h2 style="font-size: 18px;">{{ cachedIsNew ? t('Nuevo item', 'New item') : t('Editar item', 'Edit item') }}</h2>
        <button class="btn btn-ghost btn-sm" style="margin-left: auto;" @click="emit('close')">
          <XIcon :size="14" />
        </button>
      </div>

      <!-- Emoji -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Emoji', 'Emoji') }}</div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <input
            class="input"
            style="width: 72px; font-size: 28px; text-align: center; padding: 6px;"
            maxlength="4"
            v-model="emoji"
          />
          <div style="display: flex; gap: 6px; flex-wrap: wrap; flex: 1;">
            <button
              v-for="e in EMOJI_SUGGESTIONS" :key="e"
              style="font-size: 22px; width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border-default); background: var(--bg-elevated); cursor: pointer; transition: background 160ms;"
              :style="emoji === e ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)' } : {}"
              @click="emoji = e"
            >{{ e }}</button>
          </div>
        </div>
      </div>

      <!-- Title -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Título', 'Title') }}</div>
        <input class="input" :placeholder="t('Tu sueño…', 'Your dream…')" v-model="title" />
      </div>

      <!-- Description -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Descripción (opcional)', 'Description (optional)') }}</div>
        <textarea class="input" rows="2" :placeholder="t('¿Por qué es importante?', 'Why is this important?')" v-model="description" />
      </div>

      <!-- Category -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Categoría', 'Category') }}</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button
            v-for="c in CATEGORY_OPTS" :key="c.id"
            class="pill"
            :style="{
              cursor: 'pointer', padding: '5px 11px', fontWeight: 500,
              background: category === c.id ? 'var(--accent-soft)' : 'var(--border-subtle)',
              color: category === c.id ? 'var(--accent)' : 'var(--text-2)',
            }"
            @click="category = c.id"
          >{{ t(c.labelEs, c.labelEn) }}</button>
        </div>
      </div>

      <!-- Tone -->
      <div style="margin-bottom: 24px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Color', 'Color') }}</div>
        <div style="display: flex; gap: 8px;">
          <button
            v-for="t_ in TONE_OPTS" :key="t_"
            :style="{
              width: '28px', height: '28px', borderRadius: '50%',
              background: `var(--${t_})`,
              border: tone === t_ ? '2px solid var(--text-1)' : '2px solid transparent',
              outline: tone === t_ ? '2px solid var(--text-3)' : 'none',
              outlineOffset: '2px', transition: 'all 200ms',
            }"
            @click="tone = t_"
          />
        </div>
      </div>

      <div class="row" style="justify-content: space-between;">
        <button v-if="!cachedIsNew" class="btn btn-ghost" style="color: var(--rose);" @click="deleteItem">
          {{ t('Eliminar', 'Delete') }}
        </button>
        <span v-else />
        <div class="row">
          <button class="btn btn-ghost" @click="emit('close')">{{ t('Cancelar', 'Cancel') }}</button>
          <button class="btn btn-primary" :disabled="!isValid" @click="save">
            <CheckIcon :size="13" /> {{ t('Guardar', 'Save') }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
