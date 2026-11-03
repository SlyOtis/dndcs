import { writable } from 'svelte/store';

export const sidebarStore = writable<boolean>(false);
