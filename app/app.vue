<script setup lang="ts">
import { appName } from '~/constants'

useHead({
  title: appName,
})
</script>

<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
html,
body,
#__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
}

html.dark {
  color-scheme: dark;
}

/* 基础样式 */
:root {
  --primary-color: #4a6baf;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --card-bg-color: #fff;
  --dark-color: #031528a0;
  --border-radius: 8px;
  --box-shadow: 0px 1px 7px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
  --light-on: white;
  --export-btn: rgba(8, 93, 83, 0.856);
  --export-hover-bth: rgb(8, 93, 83);
  --stat-value: #031528a0;
  --form-input: #ddd;
  --td-border: #ddd;
  --page-font-color: #172738;
  --page-bg-color: #fdfdfdd2;
}

/* 暗黑模式 */
.dark:root {
  --primary-color: #5e72e4;
  --secondary-color: #adb5bd;
  --success-color: #2dce89;
  --danger-color: #f5365c;
  --warning-color: #f4b400;
  --info-color: #11cdef;
  --card-bg-color: #102333;
  --dark-color: #172738;
  --box-shadow: 1px 1px 7px 1px rgba(94, 86, 86, 0.1);
  --transition: all 0.3s ease;
  --light-on: #ffffff;
  --stat-value: #afaaaa;
  --form-input: #485965;
  --td-border: #485965;
  --page-font-color: #fff;
  --page-bg-color: #172738;
}

/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Roboto';
  line-height: 1.6;
  color: var(--page-font-color);
  background-color: var(--page-bg-color);
}

.stat-card {
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--box-shadow);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 1rem;
  color: var(--secondary-color);
  margin-bottom: 10px;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--stat-value);
}
</style>
