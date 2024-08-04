import type { WishBannerKey } from '$lib/types/keys/WishBannerKey';
import type { WeaponKey } from '$lib/types/keys/WeaponKey';
import type { CharacterKey } from '$lib/types/keys/CharacterKey';
import type { BannerKey } from '$lib/types/keys/BannerKey';

export type IWishes = {
	[key in WishBannerKey]?: IWish[];
};

export type IWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: WeaponKey | CharacterKey;
	date: Date;
	pity: number;
	banner: BannerKey;
	rarity: number;
	order: number;
};
