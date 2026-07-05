import { Heart, Shield, Swords, Star } from 'lucide-react'
import type { Card } from './types'

export default function GameCard({card,wanted=false,onClick,onWant,compact=false}:{card:Card;wanted?:boolean;onClick?:()=>void;onWant?:()=>void;compact?:boolean}){
 return <article className={`game-card rarity-${card.rarity.toLowerCase()} ${compact?'compact':''}`} onClick={onClick} onKeyDown={event=>{if(onClick&&(event.key==='Enter'||event.key===' '))onClick()}} tabIndex={onClick?0:undefined}>
  <img className="game-frame" src={`${import.meta.env.BASE_URL}card-frames/${frameName[card.rarity]}.png`} alt=""/>
  <div className="game-art"><img src={card.image} alt={card.title} loading="lazy"/><span>{card.rarity}</span>{onWant?<button className={wanted?'wanted':''} onClick={event=>{event.stopPropagation();onWant()}} aria-label={wanted?'Retirer des souhaits':'Ajouter aux souhaits'}><Heart size={15} fill={wanted?'currentColor':'none'}/></button>:<Star size={17}/>}</div>
  <div className="game-copy"><h3>{card.title}</h3><p>{card.description}</p><div className="game-stats"><b><Swords/> {card.atk.toLocaleString('fr-FR')}</b><b><Shield/> {card.def.toLocaleString('fr-FR')}</b></div></div>
 </article>
}

const frameName={L:'legendary',UR:'ultra_rare',SR:'super_rare',R:'rare',PC:'uncommon',C:'common'} as const
