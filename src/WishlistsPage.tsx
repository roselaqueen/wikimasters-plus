import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, Check, Clipboard, Copy, Download, Heart, Pencil, Plus, Search, Share2, Trash2, Upload, UsersRound, X } from 'lucide-react'
import { decodeWishlist, deleteWishlist, encodeWishlist, getWishlists, putWishlist } from './wishlistDb'
import { loadWishlistCard, searchCards } from './cardsApi'
import type { Card, Wishlist } from './types'
import type { TradeDraft } from './TradeComposer'
import GameCard from './GameCard'

const KPOP_OWNER='ae78c751-a14d-465c-bf58-6844175c8667'
const KPOP_IDS=['eefbc69b-55dc-40ad-9cc4-8bce91199c93','589bed2b-5705-4496-a1f5-2b35be1b2d83','a0700743-630b-432a-9b99-0ec93e77bde7']
const makeList=(ownerId:string,name:string,cardIds:string[]=[],id:string=crypto.randomUUID()):Wishlist=>({id,ownerId,name,cardIds,createdAt:Date.now(),updatedAt:Date.now()})

export default function WishlistsPage({ownerId,cards,onTrade}:{ownerId:string;cards:Card[];onTrade:(draft:TradeDraft)=>void}){
 const [lists,setLists]=useState<Wishlist[]>([])
 const [selectedId,setSelectedId]=useState('')
 const [query,setQuery]=useState('')
 const [searchResults,setSearchResults]=useState<Card[]>([])
 const [resolved,setResolved]=useState<Card[]>(cards)
 const [searching,setSearching]=useState(false)
 const [searchRarity,setSearchRarity]=useState<import('./types').Rarity|undefined>()
 const [share,setShare]=useState('')
 const [importValue,setImportValue]=useState('')
 const [notice,setNotice]=useState('')
 const [tab,setTab]=useState<'cards'|'share'|'contacts'>('cards')
 const initializedOwner=useRef('')
 const searchSequence=useRef(0)

 useEffect(()=>setResolved(prev=>[...new Map([...prev,...cards].map(card=>[card.id,card])).values()]),[cards])
 useEffect(()=>{if(initializedOwner.current===ownerId)return;initializedOwner.current=ownerId;getWishlists(ownerId).then(async found=>{
  const unique=[...new Map(found.map(list=>[list.name.trim().toLocaleLowerCase('fr'),list])).values()]
  if(ownerId===KPOP_OWNER&&!unique.some(list=>list.name==='Kpop')){const kpop=makeList(ownerId,'Kpop',KPOP_IDS,'kpop');await putWishlist(kpop);unique.unshift(kpop)}
  if(!unique.length){const first=makeList(ownerId,'Mes recherches',[],'default');await putWishlist(first);unique.push(first)}
  setLists(unique);setSelectedId(unique[0].id)
 })},[ownerId])

 const selected=lists.find(list=>list.id===selectedId)??lists[0]
 const selectedCards=useMemo(()=>selected?selected.cardIds.map(id=>resolved.find(card=>card.id===id)).filter((card):card is Card=>Boolean(card)):[],[selected,resolved])
 const suggestions=useMemo(()=>searchResults.filter(card=>!selected?.cardIds.includes(card.id)),[searchResults,selected])

 useEffect(()=>{const value=query.trim();const sequence=++searchSequence.current;if(value.length<2){setSearchResults([]);setSearching(false);return}setSearching(true);const timer=setTimeout(()=>searchCards(value,searchRarity).then(results=>{if(sequence===searchSequence.current)setSearchResults(results)}).catch(()=>{if(sequence===searchSequence.current)setSearchResults([])}).finally(()=>{if(sequence===searchSequence.current)setSearching(false)}),700);return()=>clearTimeout(timer)},[query,searchRarity])
 useEffect(()=>{if(!selected)return;const missing=selected.cardIds.filter(id=>!resolved.some(card=>card.id===id));if(!missing.length)return;Promise.all(missing.map(loadWishlistCard)).then(found=>setResolved(prev=>[...new Map([...prev,...found].map(card=>[card.id,card])).values()]))},[selected,resolved])

 const persist=async(next:Wishlist)=>{await putWishlist(next);setLists(prev=>prev.map(list=>list.id===next.id?next:list).sort((a,b)=>b.updatedAt-a.updatedAt));setSelectedId(next.id)}
 const addList=async()=>{const next=makeList(ownerId,`Nouvelle liste ${lists.length+1}`);await putWishlist(next);setLists(prev=>[next,...prev]);setSelectedId(next.id)}
 const rename=async()=>{if(!selected)return;const name=prompt('Nouveau nom de la liste',selected.name)?.trim();if(name)await persist({...selected,name:name.slice(0,80),updatedAt:Date.now()})}
 const removeList=async()=>{if(!selected||!confirm(`Supprimer « ${selected.name} » ?`))return;await deleteWishlist(ownerId,selected.id);const next=lists.filter(list=>list.id!==selected.id);setLists(next);setSelectedId(next[0]?.id??'')}
 const toggleCard=async(card:Card)=>{if(!selected)return;setResolved(prev=>[...new Map([...prev,card].map(item=>[item.id,item])).values()]);const cardIds=selected.cardIds.includes(card.id)?selected.cardIds.filter(id=>id!==card.id):[...selected.cardIds,card.id];await persist({...selected,cardIds,updatedAt:Date.now()})}
 const copy=async(value:string,message:string)=>{await navigator.clipboard.writeText(value);setNotice(message);setTimeout(()=>setNotice(''),1800)}
 const exportList=()=>{if(!selected)return;setShare(encodeWishlist(selected));setTab('share')}
 const importList=async()=>{try{const parsed=decodeWishlist(importValue);const next=makeList(ownerId,parsed.name,parsed.cardIds);await putWishlist(next);setLists(prev=>[next,...prev]);setSelectedId(next.id);setImportValue('');setNotice('Liste ajoutée à votre compte.')}catch(error){setNotice(error instanceof Error?error.message:'Import impossible.')}}
 const owners=useMemo(()=>{const result=new Map<string,string[]>();selectedCards.forEach(card=>card.contacts.forEach(name=>result.set(name,[...(result.get(name)??[]),card.title])));return [...result.entries()].sort((a,b)=>b[1].length-a[1].length)},[selectedCards])
 const missing=selectedCards.filter(card=>!card.contacts.length).map(card=>card.title)
 const contactText=selected?`Bonjour ! Je recherche les cartes de la liste « ${selected.name} » :\n\n${owners.map(([name,names])=>`${name} possède : ${names.join(', ')}`).join('\n')}${missing.length?`\n\nSans possesseur parmi mes contacts : ${missing.join(', ')}`:''}\n\nSi un échange vous intéresse, envoyez-moi un message !`:''

 return <div className="wishlists-page"><div className="wishlist-heading"><div><h1>Listes de souhaits</h1><p>Organisez vos recherches, partagez-les et trouvez qui contacter.</p></div><button className="primary small" onClick={addList}><Plus size={17}/>Nouvelle liste</button></div><div className="wishlist-layout"><aside className="wishlist-sidebar"><strong>MES LISTES</strong>{lists.map(list=><button key={list.id} className={list.id===selected?.id?'active':''} onClick={()=>setSelectedId(list.id)}><Heart size={16}/><span>{list.name}<small>{list.cardIds.length} carte{list.cardIds.length>1?'s':''}</small></span></button>)}</aside>{selected?<section className="wishlist-workspace"><header><div><h2>{selected.name}</h2><span>Enregistrée localement pour le compte <b>{ownerId.slice(0,8)}…</b></span></div><button onClick={rename} title="Renommer"><Pencil size={17}/></button><button onClick={removeList} title="Supprimer"><Trash2 size={17}/></button></header><nav className="wishlist-tabs"><button className={tab==='cards'?'active':''} onClick={()=>setTab('cards')}><Heart size={16}/>Cartes</button><button className={tab==='share'?'active':''} onClick={()=>setTab('share')}><Share2 size={16}/>Partager / importer</button><button className={tab==='contacts'?'active':''} onClick={()=>setTab('contacts')}><UsersRound size={16}/>Possesseurs <b>{owners.length}</b></button></nav>
 {tab==='cards'?<div className="wishlist-cards-tab"><div className="wishlist-search-tools"><label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans toutes les cartes…"/>{searching?<small>Recherche…</small>:null}</label><select aria-label="Filtrer la recherche par rareté" value={searchRarity??''} onChange={event=>setSearchRarity((event.target.value||undefined) as import('./types').Rarity|undefined)}><option value="">Toutes les raretés</option><option value="L">Légendaire</option><option value="UR">Ultra rare</option><option value="SR">Super rare</option><option value="R">Rare</option><option value="PC">Peu commun</option><option value="C">Commun</option></select></div>{query?<div className="wishlist-suggestions">{suggestions.slice(0,8).map(card=><button key={card.id} onClick={()=>{toggleCard(card);setQuery('')}}><img src={card.image}/><span>{card.title}<small>{card.rarity} · {card.category}</small></span><Plus size={17}/></button>)}{!searching&&!suggestions.length?<p>Aucune carte trouvée.</p>:null}</div>:null}<div className="wishlist-card-list">{selectedCards.map(card=><WishlistCard key={card.id} card={card} onRemove={()=>toggleCard(card)} onExchange={contact=>onTrade({contact,requestedCards:selectedCards.filter(item=>item.contacts.includes(contact))})}/>)}{selectedCards.length<selected.cardIds.length?<div className="wishlist-loading">Chargement des cartes…</div>:null}{!selected.cardIds.length?<div className="wishlist-empty"><Heart/><h3>Cette liste est vide</h3><p>Recherchez une carte ci-dessus pour l’ajouter.</p></div>:null}</div></div>:null}
 {tab==='share'?<div className="share-panel"><div className="share-block"><Share2/><div><h3>Partager cette liste</h3><p>La chaîne contient uniquement le nom de la liste et les identifiants des cartes.</p></div><button className="primary small" onClick={exportList}><Download size={16}/>Générer</button>{share?<div className="encoded"><textarea readOnly value={share}/><button onClick={()=>copy(share,'Chaîne copiée.')}><Copy size={17}/>Copier</button></div>:null}</div><div className="share-block"><Upload/><div><h3>Importer une chaîne</h3><p>Une nouvelle liste indépendante sera ajoutée à votre compte local.</p></div><div className="encoded"><textarea value={importValue} onChange={e=>setImportValue(e.target.value)} placeholder="Collez une chaîne commençant par WML1.…"/><button disabled={!importValue.trim()} onClick={importList}><Plus size={17}/>Ajouter la liste</button></div></div></div>:null}
 {tab==='contacts'?<div className="owners-panel"><div className="owners-summary"><UsersRound/><div><h3>{owners.length} contact{owners.length>1?'s':''} ont au moins une carte</h3><p>{selectedCards.length-missing.length} carte{selectedCards.length-missing.length>1?'s':''} trouvée{selectedCards.length-missing.length>1?'s':''} dans votre réseau.</p></div><button onClick={()=>copy(contactText,'Texte copié.')}><Clipboard size={17}/>Copier le texte</button></div><div className="owner-groups">{owners.map(([name,names])=><article key={name} onClick={()=>onTrade({contact:name,requestedCards:selectedCards.filter(item=>item.contacts.includes(name))})}><i>{name[0]}</i><div><h3>{name}</h3><p>{names.join(' · ')}</p></div><b>{names.length}</b><button>Préparer l’échange</button></article>)}</div><label>Texte prêt à envoyer<textarea value={contactText} readOnly/></label></div>:null}</section>:<div className="wishlist-no-list"><Heart/><h2>Créez votre première liste</h2><button onClick={addList}>Nouvelle liste</button></div>}</div>{notice?<div className="toast"><Check size={17}/>{notice}</div>:null}</div>
}

function WishlistCard({card,onRemove,onExchange}:{card:Card;onRemove:()=>void;onExchange:(contact:string)=>void}){
 return <article className="wishlist-game-card" data-rarity={card.rarity}><div className="wishlist-card-main"><GameCard card={card}/><button className="wishlist-remove" onClick={onRemove} aria-label={`Retirer ${card.title}`}><X size={17}/></button></div><div className="direct-owners"><strong>{card.contacts.length?`${card.contacts.length} possesseur${card.contacts.length>1?'s':''}`:'Aucun contact ne la possède'}</strong>{card.contacts.map(contact=><button key={contact} onClick={()=>onExchange(contact)}><span>{contact[0]}</span>{contact}<ArrowLeftRight size={14}/></button>)}</div></article>
}
