import { writable } from 'svelte/store';
import type { Campaign } from '../firestore.types';

// Current campaign
export const currentCampaign = writable<Campaign | null>(null);
export const currentCampaignId = writable<string | null>(null);

// All user campaigns
export const userCampaigns = writable<Campaign[]>([]);

// Campaign loading states
export const isLoadingCampaigns = writable(false);
export const campaignError = writable<string | null>(null);

// Campaign selection
export const selectedCampaignId = writable<string | null>(null);