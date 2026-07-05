export type Rarity = 'L' | 'UR' | 'SR' | 'R' | 'PC' | 'C'
export type Card = { id:string; title:string; description:string; image:string; rarity:Rarity; atk:number; def:number; owned:number; wanted:boolean; contacts:string[]; category:string }
export type Page = 'cards'|'collection'|'wishlists'|'packs'|'trades'|'market'|'profile'|'friends'|'messages'|'settings'
export type Settings = { theme:'light'|'dark'; density:'comfortable'|'compact'; cardStyle:'editorial'|'classic'; accent:string; banner:string; background:boolean }
export type Wishlist = { id:string; ownerId:string; name:string; cardIds:string[]; createdAt:number; updatedAt:number }
