import { ArrowLeftRight, ExternalLink, Heart, Shield, Swords, X } from 'lucide-react'
import GameCard from './GameCard'
import type { Card, Rarity } from './types'

const rarityLabels:Record<Rarity,string>={L:'Légendaire',UR:'Ultra Rare',SR:'Super Rare',R:'Rare',PC:'Peu Commun',C:'Commun'}

export default function CardDetailModal({card,wanted,onClose,onWant,onExchange}:{card:Card;wanted:boolean;onClose:()=>void;onWant:()=>void;onExchange:(contact:string)=>void}){
 return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="card-detail-modal" role="dialog" aria-modal="true" aria-labelledby="card-detail-title">
  <button className="modal-x" onClick={onClose} aria-label="Fermer"><X/></button>
  <GameCard card={card}/><div className="card-detail-content"><div className="modal-title-line"><h2 id="card-detail-title">{card.title}</h2><span data-rarity={card.rarity}>{rarityLabels[card.rarity]}</span></div><p title={card.description}>{card.description}</p>
  <div className="modal-stats"><div><Swords/><b>{card.atk.toLocaleString('fr-FR')}</b><span>ATK</span></div><div><Shield/><b>{card.def.toLocaleString('fr-FR')}</b><span>DEF</span></div></div>
  <dl><div><dt>Exemplaires</dt><dd>{card.owned}</dd></div><div><dt>Catégorie</dt><dd>{card.category}</dd></div></dl>
  {card.contacts.length?<div className="modal-owners"><h3>Possédée par vos contacts</h3>{card.contacts.map(contact=><button key={contact} onClick={()=>onExchange(contact)}><i>{contact[0]}</i><span>{contact}</span><ArrowLeftRight size={16}/></button>)}</div>:null}
  <a href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(card.title)}`} target="_blank" rel="noreferrer">Voir l’article sur Wikipédia <ExternalLink size={14}/></a>
  <div className="card-detail-actions"><button onClick={onWant}><Heart size={17} fill={wanted?'currentColor':'none'}/>{wanted?'Retirer des souhaits':'Ajouter aux souhaits'}</button>{card.contacts.length?<button className="primary" onClick={()=>onExchange(card.contacts[0])}><ArrowLeftRight size={17}/>Proposer un échange</button>:null}</div>
  </div>
 </section></div>
}
