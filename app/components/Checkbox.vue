<script lang="ts" setup>
const emit = defineEmits(['change'])
function handleCheckBoxChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('change', target.checked)
}
</script>

<template>
  <div class="checkbox-wrapper-30 inline-block">
    <span class="checkbox">
      <input
        type="checkbox"
        @change="handleCheckBoxChange"
      >
      <svg>
        <use xlink:href="#checkbox-30" class="checkbox" />
      </svg>
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
      <symbol id="checkbox-30" viewBox="0 0 22 22">
        <path
          fill="none" stroke="currentColor"
          d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"
        />
      </symbol>
    </svg>
  </div>
</template>

<style>
.checkbox-wrapper-30 .checkbox {
  --bg: #fff;
  --brdr: #d1d6ee;
  --brdr-actv: #212952;
  --brdr-hovr: #bbc1e1;
  --dur: calc((var(--size, 2) / 2) * 1s);
  display: inline-block;
  width: calc(var(--size, 1) * 16px);
  position: relative;
}

.checkbox-wrapper-30 .checkbox:after {
  content: '';
  width: 100%;
  padding-top: 100%;
  display: block;
}

.checkbox-wrapper-30 .checkbox > * {
  position: absolute;
}

.checkbox-wrapper-30 .checkbox input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  background-color: var(--bg);
  border-radius: calc(var(--size, 1) * 4px);
  border: calc(var(--newBrdr, var(--size, 1)) * 0.5px) solid;
  color: var(--newBrdrClr, var(--brdr));
  outline: none;
  margin: 0;
  padding: 0;
  transition: all calc(var(--dur) / 3) linear;
}

.checkbox-wrapper-30 .checkbox input:hover,
.checkbox-wrapper-30 .checkbox input:checked {
  --newBrdr: calc(var(--size, 1) * 2);
}

.checkbox-wrapper-30 .checkbox input:hover {
  --newBrdrClr: var(--brdr-hovr);
}

.checkbox-wrapper-30 .checkbox input:checked {
  --newBrdrClr: var(--brdr-actv);
  transition-delay: calc(var(--dur) / 1.3);
}

.checkbox-wrapper-30 .checkbox input:checked + svg {
  --dashArray: 16 93;
  --dashOffset: 109;
}

.checkbox-wrapper-30 .checkbox svg {
  fill: none;
  left: 0;
  pointer-events: none;
  stroke: var(--stroke, var(--border-active));
  stroke-dasharray: var(--dashArray, 93);
  stroke-dashoffset: var(--dashOffset, 94);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2px;
  top: 0;
  transition:
    stroke-dasharray var(--dur),
    stroke-dashoffset var(--dur);
}

.checkbox-wrapper-30 .checkbox svg,
.checkbox-wrapper-30 .checkbox input {
  display: block;
  height: 100%;
  width: 100%;
}
</style>
