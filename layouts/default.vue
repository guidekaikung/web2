<template>
  <div>
    <q-layout view="hHh lpR lFf">
    <sidebar />
    <q-page-container>
      <div class="q-pa-md">
        <slot />
      </div>
       <!-- place QPageScroller at end of page -->
       <q-page-scroller position="bottom-right" :scroll-offset="150" :offset="[18, 18]">
            <q-btn fab icon="keyboard_arrow_up" color="accent" />
          </q-page-scroller>
      </q-page-container>
      <footerbar />
    </q-layout>
  </div>
</template>