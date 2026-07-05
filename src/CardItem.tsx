import { ArrowLeftRight, UsersRound } from 'lucide-react'
import GameCard from './GameCard'
import type { Card } from './types'

export default function CardItem({card,wanted=false,onClick,onWant,onExchange}:{card:Card;wanted?:boolean;onClick?:()=>void;onWant?:()=>void;onExchange?:(contact:string)=>void}){
 return <div className="game-card-item"><GameCard card={card} wanted={wanted} onClick={onClick} onWant={onWant}/><div className={`card-owners ${card.contacts.length?'has-owners':'empty'}`}><strong><UsersRound/>{card.contacts.length?`${card.contacts.length} contact${card.contacts.length>1?'s':''} possède${card.contacts.length>1?'nt':''} la carte`:'Aucun contact ne la possède'}</strong>{card.contacts.map(contact=><button key={contact} onClick={()=>onExchange?.(contact)} disabled={!onExchange}><i>{contact[0]}</i><span>{contact}</span>{onExchange?<ArrowLeftRight/>:null}</button>)}</div></div>
}
